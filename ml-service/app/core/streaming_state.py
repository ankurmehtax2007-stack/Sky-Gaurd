import threading
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import numpy as np
import pandas as pd

CLUSTER_BASELINES = {
    'NCR': {'temp_mean': 28.5, 'temp_std': 5.5, 'hum_mean': 55.0, 'hum_std': 18.0, 'press_mean': 1008.0, 'press_std': 6.0},
    'Konkan_Deccan': {'temp_mean': 27.5, 'temp_std': 4.5, 'hum_mean': 70.0, 'hum_std': 15.0, 'press_mean': 1010.0, 'press_std': 5.0},
    'Tamil_Nadu_Coast': {'temp_mean': 30.5, 'temp_std': 3.5, 'hum_mean': 75.0, 'hum_std': 12.0, 'press_mean': 1012.0, 'press_std': 4.0},
    'West_Bengal': {'temp_mean': 29.0, 'temp_std': 4.5, 'hum_mean': 78.0, 'hum_std': 14.0, 'press_mean': 1009.0, 'press_std': 5.0},
}
DEFAULT_BASELINE = {'temp_mean': 28.5, 'temp_std': 5.5, 'hum_mean': 55.0, 'hum_std': 18.0, 'press_mean': 1008.0, 'press_std': 6.0}

def calculate_dewpoint_magnus(temp_c: float, humidity_pct: float) -> float:
    a, b = 17.27, 237.7
    rh_safe = max(0.1, min(100.0, float(humidity_pct))) / 100.0
    t_safe = max(-50.0, min(60.0, float(temp_c)))
    gamma = (a * t_safe) / (b + t_safe + 1e-9) + np.log(rh_safe)
    denom = a - gamma
    if abs(denom) < 1e-5:
        denom = 1e-5 if denom >= 0 else -1e-5
    return float((b * gamma) / denom)

class StationRecord:
    def __init__(self, timestamp: datetime, temp: float, hum: float, press: float,
                 t_missing: bool = False, h_missing: bool = False, p_missing: bool = False):
        self.timestamp = timestamp
        self.temp = float(temp)
        self.hum = float(hum)
        self.press = float(press)
        self.t_missing = t_missing
        self.h_missing = h_missing
        self.p_missing = p_missing

class StreamingStateBuffer:
    """
    Thread-safe in-memory stateful buffer for online real-time stream processing.
    Maintains:
      - Per-station rolling history (deque of recent records for lag & rolling statistics)
      - Per-cluster spatial state (latest readings per station in each cluster)
      - Missing data flags before imputation
    """
    def __init__(self, max_history_per_station: int = 120):
        self.max_history = max_history_per_station
        self._lock = threading.RLock()
        # station_id -> deque of StationRecord
        self.station_history: Dict[str, deque] = {}
        # cluster -> dict[station_id, StationRecord]
        self.cluster_state: Dict[str, Dict[str, StationRecord]] = {}
        # station_id -> metadata (cluster, lat, lon, name, city)
        self.station_meta: Dict[str, Dict[str, Any]] = {}

    def clear(self):
        with self._lock:
            self.station_history.clear()
            self.cluster_state.clear()
            self.station_meta.clear()

    def ingest_record(self, raw_record: Dict[str, Any]) -> Tuple[Dict[str, Any], bool]:
        """
        Validates, records missing flags, imputes if necessary, updates live buffers,
        and computes the complete online 75-feature vector dictionary for model inference.
        Returns: (feature_dict, is_missing_data_flag)
        """
        with self._lock:
            station_id = str(raw_record.get('station_id') or raw_record.get('stationId') or 'DEMO-001').strip()
            station_name = str(raw_record.get('station_name') or raw_record.get('name') or 'AWS Node')
            city = str(raw_record.get('city') or 'New Delhi')
            cluster = str(raw_record.get('cluster') or 'NCR').strip()
            if not cluster:
                cluster = 'NCR'

            lat = float(raw_record.get('latitude') if raw_record.get('latitude') is not None else 28.6139)
            lon = float(raw_record.get('longitude') if raw_record.get('longitude') is not None else 77.2090)

            # Store station metadata
            self.station_meta[station_id] = {
                'station_id': station_id,
                'station_name': station_name,
                'city': city,
                'cluster': cluster,
                'latitude': lat,
                'longitude': lon
            }

            # Parse timestamp safely
            raw_ts = raw_record.get('timestamp')
            if raw_ts is None:
                ts = datetime.utcnow()
            elif isinstance(raw_ts, datetime):
                ts = raw_ts
            elif isinstance(raw_ts, pd.Timestamp):
                ts = raw_ts.to_pydatetime()
            else:
                try:
                    ts = pd.to_datetime(raw_ts).to_pydatetime()
                except Exception:
                    ts = datetime.utcnow()

            # Detect missing / null / NaN values BEFORE imputation
            raw_t = raw_record.get('temperature_c', raw_record.get('temperature'))
            raw_h = raw_record.get('humidity_pct', raw_record.get('humidity'))
            raw_p = raw_record.get('pressure_hpa', raw_record.get('pressure'))

            t_missing = (raw_t is None) or (isinstance(raw_t, (float, int)) and (np.isnan(raw_t) or np.isinf(raw_t)))
            h_missing = (raw_h is None) or (isinstance(raw_h, (float, int)) and (np.isnan(raw_h) or np.isinf(raw_h)))
            p_missing = (raw_p is None) or (isinstance(raw_p, (float, int)) and (np.isnan(raw_p) or np.isinf(raw_p)))

            is_missing = bool(t_missing or h_missing or p_missing)

            # Get station history deque
            if station_id not in self.station_history:
                self.station_history[station_id] = deque(maxlen=self.max_history)
            hist = self.station_history[station_id]

            baseline = CLUSTER_BASELINES.get(cluster, DEFAULT_BASELINE)

            # Imputation with fallback priority: last known valid value -> cluster baseline -> absolute default
            if t_missing:
                t_val = hist[-1].temp if len(hist) > 0 else baseline['temp_mean']
            else:
                try:
                    t_val = float(raw_t)
                except Exception:
                    t_val = baseline['temp_mean']
                    t_missing = True

            if h_missing:
                h_val = hist[-1].hum if len(hist) > 0 else baseline['hum_mean']
            else:
                try:
                    h_val = float(raw_h)
                except Exception:
                    h_val = baseline['hum_mean']
                    h_missing = True

            if p_missing:
                p_val = hist[-1].press if len(hist) > 0 else baseline['press_mean']
            else:
                try:
                    p_val = float(raw_p)
                except Exception:
                    p_val = baseline['press_mean']
                    p_missing = True

            # Create record and append to history buffer
            rec = StationRecord(ts, t_val, h_val, p_val, t_missing, h_missing, p_missing)
            hist.append(rec)

            # Update cluster spatial state
            if cluster not in self.cluster_state:
                self.cluster_state[cluster] = {}
            self.cluster_state[cluster][station_id] = rec

            # --- FEATURE ENGINEERING ONLINE ---
            feat: Dict[str, Any] = {}

            # Metadata and identifiers
            feat['station_id'] = station_id
            feat['station_name'] = station_name
            feat['city'] = city
            feat['cluster'] = cluster
            feat['timestamp'] = ts.isoformat() if hasattr(ts, 'isoformat') else str(ts)
            feat['latitude'] = lat
            feat['longitude'] = lon

            # Raw/Imputed sensor measurements
            feat['temperature_c'] = t_val
            feat['humidity_pct'] = h_val
            feat['pressure_hpa'] = p_val
            feat['is_missing_data'] = is_missing

            # 1. Cyclical time features
            hour = ts.hour
            month = ts.month
            day = ts.day
            dayofweek = ts.weekday() if hasattr(ts, 'weekday') else 0

            feat['day'] = day
            feat['dayofweek'] = dayofweek
            feat['hour_sin'] = float(np.sin(2 * np.pi * hour / 24.0))
            feat['hour_cos'] = float(np.cos(2 * np.pi * hour / 24.0))
            feat['month_sin'] = float(np.sin(2 * np.pi * month / 12.0))
            feat['month_cos'] = float(np.cos(2 * np.pi * month / 12.0))

            # 2. Spatial Cluster Statistics
            cluster_stations = self.cluster_state.get(cluster, {})
            # If multiple stations in cluster, compute dynamic mean & std
            if len(cluster_stations) > 1:
                t_spatial_vals = [s.temp for s in cluster_stations.values()]
                h_spatial_vals = [s.hum for s in cluster_stations.values()]
                p_spatial_vals = [s.press for s in cluster_stations.values()]

                c_t_mean = float(np.mean(t_spatial_vals))
                c_t_std = float(np.std(t_spatial_vals))
                if c_t_std < 1e-4:
                    c_t_std = baseline['temp_std']

                c_h_mean = float(np.mean(h_spatial_vals))
                c_h_std = float(np.std(h_spatial_vals))
                if c_h_std < 1e-4:
                    c_h_std = baseline['hum_std']

                c_p_mean = float(np.mean(p_spatial_vals))
                c_p_std = float(np.std(p_spatial_vals))
                if c_p_std < 1e-4:
                    c_p_std = baseline['press_std']
            else:
                c_t_mean = baseline['temp_mean']
                c_t_std = baseline['temp_std']
                c_h_mean = baseline['hum_mean']
                c_h_std = baseline['hum_std']
                c_p_mean = baseline['press_mean']
                c_p_std = baseline['press_std']

            feat['cluster_temp_mean'] = c_t_mean
            feat['cluster_temp_std'] = c_t_std
            feat['cluster_press_mean'] = c_p_mean
            feat['cluster_press_std'] = c_p_std
            feat['cluster_hum_mean'] = c_h_mean
            feat['cluster_hum_std'] = c_h_std

            # Spatial differences and z-scores
            spat_t_diff = t_val - c_t_mean
            spat_t_z = spat_t_diff / (c_t_std + 1e-9)

            spat_p_diff = p_val - c_p_mean
            spat_p_z = spat_p_diff / (c_p_std + 1e-9)

            spat_h_diff = h_val - c_h_mean
            spat_h_z = spat_h_diff / (c_h_std + 1e-9)

            feat['spatial_temp_diff'] = spat_t_diff
            feat['spatial_temp_zscore'] = spat_t_z
            feat['spatial_press_diff'] = spat_p_diff
            feat['spatial_press_zscore'] = spat_p_z
            feat['spatial_hum_diff'] = spat_h_diff
            feat['spatial_hum_zscore'] = spat_h_z

            neighbor_dev = abs(spat_t_diff) / (abs(c_t_mean) + 1e-5)
            feat['neighbor_dev_score'] = neighbor_dev
            feat['station_neighbor_consistency'] = 1.0 / (1.0 + neighbor_dev)
            feat['cluster_anomaly_pct'] = 1.0 if abs(spat_t_z) > 2.5 else 0.0

            # 3. Psychrometric and cross-sensor ratios
            feat['temp_press_ratio'] = t_val / (p_val + 1e-5)
            feat['temp_hum_ratio'] = t_val / (h_val + 1e-5)
            feat['hum_press_ratio'] = h_val / (p_val + 1e-5)

            dewpoint = calculate_dewpoint_magnus(t_val, h_val)
            feat['dewpoint_c'] = dewpoint
            feat['dewpoint_depression_c'] = t_val - dewpoint
            t_bounded = max(-50.0, min(60.0, t_val))
            feat['vapor_pressure_ratio'] = float(h_val * np.exp(17.27 * t_bounded / (237.7 + t_bounded)) / 100.0)

            # 4. Temporal Station-Level Lag, Delta, and Rolling Features
            hist_list = list(hist)
            n_hist = len(hist_list)

            # Temperature features
            t_series = [r.temp for r in hist_list]
            t_lag1 = hist_list[-2].temp if n_hist >= 2 else t_val
            t_lag24 = hist_list[-25].temp if n_hist >= 25 else hist_list[0].temp

            feat['temperature_c_lag1'] = t_lag1
            feat['temperature_c_lag24'] = t_lag24
            feat['temperature_c_diff_lag1'] = t_val - t_lag1
            feat['temperature_c_diff_lag24'] = t_val - t_lag24
            feat['temperature_c_rate_1h'] = abs(t_val - t_lag1)

            t_roll6 = t_series[-6:]
            feat['temperature_c_roll6_med'] = float(np.median(t_roll6))
            feat['temperature_c_roll6_mean'] = float(np.mean(t_roll6))
            feat['temperature_c_roll6_var'] = float(np.var(t_roll6)) if len(t_roll6) > 1 else 0.0

            # Frozen count (consecutive identical values backwards)
            t_frozen = 1
            for i in range(len(t_series) - 2, -1, -1):
                if abs(t_series[i] - t_val) < 1e-4:
                    t_frozen += 1
                else:
                    break
            feat['temperature_c_frozen_count'] = t_frozen

            t_roll24 = t_series[-24:]
            t_r24_mean = float(np.mean(t_roll24)) if len(t_roll24) >= 4 else c_t_mean
            t_r24_std = float(np.std(t_roll24)) if len(t_roll24) >= 4 else c_t_std
            if t_r24_std < 1e-4:
                t_r24_std = 1.0
            feat['temperature_c_roll24_mean'] = t_r24_mean
            feat['temperature_c_roll24_std'] = t_r24_std
            feat['temperature_c_roll24_diff'] = t_val - t_r24_mean
            feat['temperature_c_roll24_zscore'] = abs(t_val - t_r24_mean) / (t_r24_std + 1e-9)

            # Humidity features
            h_series = [r.hum for r in hist_list]
            h_lag1 = hist_list[-2].hum if n_hist >= 2 else h_val
            h_lag24 = hist_list[-25].hum if n_hist >= 25 else hist_list[0].hum

            feat['humidity_pct_lag1'] = h_lag1
            feat['humidity_pct_lag24'] = h_lag24
            feat['humidity_pct_diff_lag1'] = h_val - h_lag1
            feat['humidity_pct_diff_lag24'] = h_val - h_lag24
            feat['humidity_pct_rate_1h'] = abs(h_val - h_lag1)

            h_roll6 = h_series[-6:]
            feat['humidity_pct_roll6_med'] = float(np.median(h_roll6))
            feat['humidity_pct_roll6_mean'] = float(np.mean(h_roll6))
            feat['humidity_pct_roll6_var'] = float(np.var(h_roll6)) if len(h_roll6) > 1 else 0.0

            h_frozen = 1
            for i in range(len(h_series) - 2, -1, -1):
                if abs(h_series[i] - h_val) < 1e-4:
                    h_frozen += 1
                else:
                    break
            feat['humidity_pct_frozen_count'] = h_frozen

            h_roll24 = h_series[-24:]
            h_r24_mean = float(np.mean(h_roll24)) if len(h_roll24) >= 4 else c_h_mean
            h_r24_std = float(np.std(h_roll24)) if len(h_roll24) >= 4 else c_h_std
            if h_r24_std < 1e-4:
                h_r24_std = 1.0
            feat['humidity_pct_roll24_mean'] = h_r24_mean
            feat['humidity_pct_roll24_std'] = h_r24_std
            feat['humidity_pct_roll24_diff'] = h_val - h_r24_mean
            feat['humidity_pct_roll24_zscore'] = abs(h_val - h_r24_mean) / (h_r24_std + 1e-9)

            # Pressure features
            p_series = [r.press for r in hist_list]
            p_lag1 = hist_list[-2].press if n_hist >= 2 else p_val
            p_lag24 = hist_list[-25].press if n_hist >= 25 else hist_list[0].press

            feat['pressure_hpa_lag1'] = p_lag1
            feat['pressure_hpa_lag24'] = p_lag24
            feat['pressure_hpa_diff_lag1'] = p_val - p_lag1
            feat['pressure_hpa_diff_lag24'] = p_val - p_lag24
            feat['pressure_hpa_rate_1h'] = abs(p_val - p_lag1)

            p_roll6 = p_series[-6:]
            feat['pressure_hpa_roll6_med'] = float(np.median(p_roll6))
            feat['pressure_hpa_roll6_mean'] = float(np.mean(p_roll6))
            feat['pressure_hpa_roll6_var'] = float(np.var(p_roll6)) if len(p_roll6) > 1 else 0.0

            p_frozen = 1
            for i in range(len(p_series) - 2, -1, -1):
                if abs(p_series[i] - p_val) < 1e-4:
                    p_frozen += 1
                else:
                    break
            feat['pressure_hpa_frozen_count'] = p_frozen

            p_roll24 = p_series[-24:]
            p_r24_mean = float(np.mean(p_roll24)) if len(p_roll24) >= 4 else c_p_mean
            p_r24_std = float(np.std(p_roll24)) if len(p_roll24) >= 4 else c_p_std
            if p_r24_std < 1e-4:
                p_r24_std = 1.0
            feat['pressure_hpa_roll24_mean'] = p_r24_mean
            feat['pressure_hpa_roll24_std'] = p_r24_std
            feat['pressure_hpa_roll24_diff'] = p_val - p_r24_mean
            feat['pressure_hpa_roll24_zscore'] = abs(p_val - p_r24_mean) / (p_r24_std + 1e-9)

            # 5. Cluster One-Hot Encodings
            all_clusters = ['Konkan_Deccan', 'NCR', 'Tamil_Nadu_Coast', 'West_Bengal']
            for c_name in all_clusters:
                feat[f'cluster_{c_name}'] = 1.0 if cluster == c_name else 0.0

            return feat, is_missing

# Global singleton streaming state
_global_streaming_buffer = StreamingStateBuffer()

def get_streaming_buffer() -> StreamingStateBuffer:
    return _global_streaming_buffer
