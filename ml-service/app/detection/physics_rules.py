import numpy as np
import pandas as pd

def bin_physics_score(scores):
    """
    Convert a continuous physics anomaly score into simple levels for reporting if needed.
    """
    arr = np.asarray(scores, dtype=float)
    binned = np.select(
        [
            arr < 0.15,
            arr < 0.40,
            arr < 0.65,
            arr < 0.85
        ],
        [
            0.00,
            0.25,
            0.50,
            0.75
        ],
        default=1.00
    )
    return binned

def evaluate_physics(df: pd.DataFrame, cfg: dict = None) -> pd.DataFrame:
    """
    Evaluates continuous physical consistency evidence without hard reject gates.
    Combines:
      1. Range anomaly (operating & climatological bounds)
      2. Rate-of-change anomaly (hourly rate limits)
      3. Psychrometric / Dewpoint depression bounds
      4. Cross-sensor thermodynamic coupling
    """
    c = cfg or {}

    # 1. Extract sensor values
    temperature = pd.to_numeric(df["temperature_c"], errors="coerce").fillna(25.0)
    humidity = pd.to_numeric(df["humidity_pct"], errors="coerce").fillna(50.0)
    pressure = pd.to_numeric(df["pressure_hpa"], errors="coerce").fillna(1013.25)

    # 2. Operating limits (from config with sensible meteorological defaults)
    temp_max = float(c.get("temp_max_c", 48.0))
    temp_min = float(c.get("temp_min_c", -10.0))

    humidity_max = float(c.get("humidity_max_pct", 100.0))
    humidity_min = float(c.get("humidity_min_pct", 0.0))

    pressure_max = float(c.get("pressure_max_hpa", 1050.0))
    pressure_min = float(c.get("pressure_min_hpa", 950.0))

    def range_anomaly(value, minimum, maximum, margin=3.0):
        below = np.maximum(minimum - value, 0.0) / margin
        above = np.maximum(value - maximum, 0.0) / margin
        return np.clip(below + above, 0.0, 1.0)

    # 3. Range Anomaly
    temperature_range = range_anomaly(temperature, temp_min, temp_max, margin=3.0)
    humidity_range = range_anomaly(humidity, humidity_min, humidity_max, margin=2.0)
    pressure_range = range_anomaly(pressure, pressure_min, pressure_max, margin=15.0)

    range_score = np.maximum.reduce([temperature_range, humidity_range, pressure_range])

    # 4. Rate-of-Change Anomaly
    max_t_rate = float(c.get("temp_max_rate_c_per_hr", 7.0))
    max_h_rate = float(c.get("humidity_max_rate_pct_per_hr", 25.0))
    max_p_rate = float(c.get("pressure_max_rate_hpa_per_hr", 4.0))

    t_rate = pd.to_numeric(df["temperature_c_rate_1h"] if "temperature_c_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).abs()
    h_rate = pd.to_numeric(df["humidity_pct_rate_1h"] if "humidity_pct_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).abs()
    p_rate = pd.to_numeric(df["pressure_hpa_rate_1h"] if "pressure_hpa_rate_1h" in df.columns else 0.0, errors="coerce").fillna(0.0).abs()

    temperature_rate = np.clip(t_rate / (max_t_rate + 1e-9), 0.0, 1.0)
    humidity_rate = np.clip(h_rate / (max_h_rate + 1e-9), 0.0, 1.0)
    pressure_rate = np.clip(p_rate / (max_p_rate + 1e-9), 0.0, 1.0)

    rate_score = np.maximum.reduce([temperature_rate, humidity_rate, pressure_rate])

    # 5. Dew-point Depression Anomaly
    if "dewpoint_depression_c" in df.columns:
        dewpoint_depression = pd.to_numeric(df["dewpoint_depression_c"], errors="coerce").fillna(10.0)
    else:
        dewpoint_depression = temperature - (humidity * 0.2)

    max_depression = float(c.get("max_dewpoint_depression_c", 40.0))
    min_depression = float(c.get("min_dewpoint_depression_c", -0.5))

    dewpoint_low = np.maximum(min_depression - dewpoint_depression, 0.0) / 2.0
    dewpoint_high = np.maximum(dewpoint_depression - max_depression, 0.0) / 10.0
    dewpoint_score = np.clip(dewpoint_low + dewpoint_high, 0.0, 1.0)

    # 6. Cross-Sensor Thermodynamic Consistency
    # Extreme temperature combined with saturated humidity is physically implausible in most climates
    high_temp_excess = np.maximum(temperature - 42.0, 0.0) / 6.0
    high_hum_excess = np.maximum(humidity - 88.0, 0.0) / 12.0
    cross_score = np.clip(high_temp_excess * 0.6 + high_hum_excess * 0.6, 0.0, 1.0)

    # 7. Combined Continuous Physics Score
    w_range = float(c.get("weight_range", 0.35))
    w_rate = float(c.get("weight_rate", 0.30))
    w_dew = float(c.get("weight_dewpoint", 0.20))
    w_cross = float(c.get("weight_cross_sensor", 0.15))

    combined = (
        w_range * range_score +
        w_rate * rate_score +
        w_dew * dewpoint_score +
        w_cross * cross_score
    )
    # Give weight to max single violation
    combined = np.maximum(combined, 0.85 * np.maximum.reduce([range_score, rate_score, dewpoint_score, cross_score]))
    continuous_score = np.clip(np.nan_to_num(combined, nan=0.0), 0.0, 1.0)

    result = pd.DataFrame(index=df.index)
    result["physics_range_score"] = np.round(range_score, 4)
    result["physics_rate_score"] = np.round(rate_score, 4)
    result["physics_dewpoint_score"] = np.round(dewpoint_score, 4)
    result["physics_cross_score"] = np.round(cross_score, 4)
    result["physics_evidence_score"] = np.round(continuous_score, 4)

    return result