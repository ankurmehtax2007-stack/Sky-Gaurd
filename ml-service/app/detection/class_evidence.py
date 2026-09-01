"""
SkyGuard 2.0 Class-Specific Evidence Engine
Computes independent multi-source evidence vectors (Temporal, Spatial, Physics, Classifier, Novelty)
for all 9 known anomaly classes plus normal and novel anomaly.
"""
from typing import Dict, Any, List, Tuple
import numpy as np

ANOMALY_CLASSES = [
    "temperature_spike",
    "humidity_spike",
    "pressure_jump",
    "freeze",
    "drift",
    "offset",
    "missing_data",
    "multivariate_inconsistency",
    "spatial_inconsistency"
]

ALL_CLASSES = ["normal"] + ANOMALY_CLASSES

def compute_linear_trend_slope(values: List[float]) -> float:
    """Computes linear regression slope over a sequence of float values."""
    n = len(values)
    if n < 3:
        return 0.0
    x = np.arange(n, dtype=float)
    y = np.array(values, dtype=float)
    x_mean = float(np.mean(x))
    y_mean = float(np.mean(y))
    denom = float(np.sum((x - x_mean) ** 2))
    if denom < 1e-7:
        return 0.0
    slope = float(np.sum((x - x_mean) * (y - y_mean)) / denom)
    return slope

def evaluate_class_evidence(
    feat_dict: Dict[str, Any],
    history_records: List[Any],
    cluster_stations: Dict[str, Any],
    current_station_id: str,
    xgb_probs: Dict[str, float],
    iforest_novelty: float,
    fusion_weights: Dict[str, float] = None
) -> Tuple[Dict[str, Dict[str, float]], Dict[str, float], Dict[str, float], List[str]]:
    """
    Evaluates complete class-specific evidence vectors for all 9 anomaly classes.
    """
    weights = fusion_weights or {}
    w_xgb = float(weights.get('w_xgboost', 0.40))
    w_temp = float(weights.get('w_temporal', 0.20))
    w_spat = float(weights.get('w_spatial', 0.20))
    w_phys = float(weights.get('w_physics', 0.15))
    w_nov = float(weights.get('w_iforest', weights.get('w_novelty', 0.05)))
    
    total_w = w_xgb + w_temp + w_spat + w_phys + w_nov
    if total_w <= 0:
        total_w = 1.0
    w_xgb /= total_w
    w_temp /= total_w
    w_spat /= total_w
    w_phys /= total_w
    w_nov /= total_w

    t_val = float(feat_dict.get('temperature_c', 25.0))
    h_val = float(feat_dict.get('humidity_pct', 50.0))
    p_val = float(feat_dict.get('pressure_hpa', 1013.25))
    is_missing = bool(feat_dict.get('is_missing_data', False))
    
    t_rate = abs(float(feat_dict.get('temperature_c_rate_1h', 0.0)))
    h_rate = abs(float(feat_dict.get('humidity_pct_rate_1h', 0.0)))
    p_rate = abs(float(feat_dict.get('pressure_hpa_rate_1h', 0.0)))

    t_diff1 = float(feat_dict.get('temperature_c_diff_lag1', 0.0))
    h_diff1 = float(feat_dict.get('humidity_pct_diff_lag1', 0.0))
    p_diff1 = float(feat_dict.get('pressure_hpa_diff_lag1', 0.0))

    t_z24 = abs(float(feat_dict.get('temperature_c_roll24_zscore', 0.0)))
    h_z24 = abs(float(feat_dict.get('humidity_pct_roll24_zscore', 0.0)))
    p_z24 = abs(float(feat_dict.get('pressure_hpa_roll24_zscore', 0.0)))

    t_fcount = int(feat_dict.get('temperature_c_frozen_count', 1))
    h_fcount = int(feat_dict.get('humidity_pct_frozen_count', 1))
    p_fcount = int(feat_dict.get('pressure_hpa_frozen_count', 1))
    max_frozen = max(t_fcount, h_fcount, p_fcount)

    t_var6 = float(feat_dict.get('temperature_c_roll6_var', 1.0))
    dew_dep = float(feat_dict.get('dewpoint_depression_c', 10.0))

    # Spatial statistics EXCLUDING the current station
    other_stations = {sid: rec for sid, rec in cluster_stations.items() if sid != current_station_id}
    if other_stations:
        other_temps = [r.temp for r in other_stations.values()]
        other_hums = [r.hum for r in other_stations.values()]
        other_press = [r.press for r in other_stations.values()]

        neighbor_t_med = float(np.median(other_temps))
        neighbor_t_mad = float(np.median(np.abs(np.array(other_temps) - neighbor_t_med)))
        if neighbor_t_mad < 0.5:
            neighbor_t_mad = float(np.std(other_temps)) if len(other_temps) > 1 else 1.5
        if neighbor_t_mad < 0.5:
            neighbor_t_mad = 1.5

        neighbor_h_med = float(np.median(other_hums))
        neighbor_h_std = float(np.std(other_hums)) if len(other_hums) > 1 else 10.0
        if neighbor_h_std < 1.0:
            neighbor_h_std = 10.0

        neighbor_p_med = float(np.median(other_press))
        neighbor_p_std = float(np.std(other_press)) if len(other_press) > 1 else 3.0
        if neighbor_p_std < 0.5:
            neighbor_p_std = 3.0

        spat_t_dev = abs(t_val - neighbor_t_med) / neighbor_t_mad
        spat_h_dev = abs(h_val - neighbor_h_med) / neighbor_h_std
        spat_p_dev = abs(p_val - neighbor_p_med) / neighbor_p_std
    else:
        spat_t_dev = abs(float(feat_dict.get('spatial_temp_zscore', 0.0)))
        spat_h_dev = abs(float(feat_dict.get('spatial_hum_zscore', 0.0)))
        spat_p_dev = abs(float(feat_dict.get('spatial_press_zscore', 0.0)))
        neighbor_t_med = t_val
        neighbor_h_med = h_val
        neighbor_p_med = p_val

    # Recent temperature history for drift / offset linear regression
    recent_temps = [r.temp for r in history_records[-12:]] if len(history_records) >= 3 else [t_val]
    t_slope = compute_linear_trend_slope(recent_temps)
    t_diff24 = abs(float(feat_dict.get('temperature_c_roll24_diff', 0.0)))

    class_evidence: Dict[str, Dict[str, float]] = {}
    class_fused_scores: Dict[str, float] = {}
    why_statements: List[str] = []

    # 1. TEMPERATURE SPIKE
    temp_spike_temp = float(np.clip(
        0.55 * min(1.0, max(0.0, (t_diff1 - 2.0) / 7.0)) +
        0.30 * min(1.0, max(0.0, t_rate / 6.0)) +
        0.15 * min(1.0, max(0.0, t_z24 / 3.0)),
        0.0, 1.0
    ))
    if t_diff1 >= 8.0 or t_rate >= 8.0:
        temp_spike_temp = max(temp_spike_temp, 0.92)

    temp_spike_phys = float(np.clip(
        0.60 * min(1.0, max(0.0, (t_val - 45.0) / 5.0)) +
        0.40 * min(1.0, max(0.0, t_rate / 7.0)),
        0.0, 1.0
    ))
    if t_val >= 50.0:
        temp_spike_phys = max(temp_spike_phys, 0.95)

    temp_spike_spat = float(np.clip(min(1.0, spat_t_dev / 3.0), 0.0, 1.0))
    temp_spike_xgb = float(xgb_probs.get('temperature_spike', 0.0))

    fused_temp_spike = (
        w_xgb * temp_spike_xgb +
        w_temp * temp_spike_temp +
        w_spat * temp_spike_spat +
        w_phys * temp_spike_phys +
        w_nov * iforest_novelty
    )
    if temp_spike_temp >= 0.85 and temp_spike_xgb >= 0.35:
        fused_temp_spike = max(fused_temp_spike, 0.90)

    class_evidence['temperature_spike'] = {
        'temporal': round(temp_spike_temp, 4),
        'spatial': round(temp_spike_spat, 4),
        'physics': round(temp_spike_phys, 4),
        'xgb': round(temp_spike_xgb, 4),
        'fused': round(float(fused_temp_spike), 4)
    }
    class_fused_scores['temperature_spike'] = round(float(fused_temp_spike), 4)

    # 2. HUMIDITY SPIKE
    hum_spike_temp = float(np.clip(
        0.50 * min(1.0, max(0.0, (h_diff1 - 10.0) / 25.0)) +
        0.30 * min(1.0, max(0.0, h_rate / 20.0)) +
        0.20 * min(1.0, max(0.0, (h_val - 90.0) / 10.0)),
        0.0, 1.0
    ))
    if h_val >= 98.5 or h_diff1 >= 30.0:
        hum_spike_temp = max(hum_spike_temp, 0.94)

    hum_spike_phys = float(np.clip(
        0.50 * (1.0 if h_val >= 98.0 else 0.0) +
        0.30 * min(1.0, max(0.0, h_rate / 25.0)) +
        0.20 * min(1.0, max(0.0, (2.0 - dew_dep) / 3.0)),
        0.0, 1.0
    ))
    hum_spike_spat = float(np.clip(min(1.0, spat_h_dev / 2.5), 0.0, 1.0))
    hum_spike_xgb = float(xgb_probs.get('humidity_spike', 0.0))

    fused_hum_spike = (
        w_xgb * hum_spike_xgb +
        w_temp * hum_spike_temp +
        w_spat * hum_spike_spat +
        w_phys * hum_spike_phys +
        w_nov * iforest_novelty
    )
    if hum_spike_temp >= 0.85 and (hum_spike_xgb >= 0.30 or h_val >= 98.0):
        fused_hum_spike = max(fused_hum_spike, 0.92)

    class_evidence['humidity_spike'] = {
        'temporal': round(hum_spike_temp, 4),
        'spatial': round(hum_spike_spat, 4),
        'physics': round(hum_spike_phys, 4),
        'xgb': round(hum_spike_xgb, 4),
        'fused': round(float(fused_hum_spike), 4)
    }
    class_fused_scores['humidity_spike'] = round(float(fused_hum_spike), 4)

    # 3. PRESSURE JUMP
    press_jump_temp = float(np.clip(
        0.60 * min(1.0, max(0.0, (p_rate - 1.5) / 4.0)) +
        0.40 * min(1.0, max(0.0, p_z24 / 3.0)),
        0.0, 1.0
    ))
    if p_rate >= 3.5 or p_val < 970.0 or p_val > 1050.0:
        press_jump_temp = max(press_jump_temp, 0.93)

    press_jump_phys = float(np.clip(
        0.60 * (1.0 if (p_val < 960.0 or p_val > 1050.0) else min(1.0, max(0.0, (980.0 - p_val) / 20.0))) +
        0.40 * min(1.0, max(0.0, p_rate / 4.0)),
        0.0, 1.0
    ))
    press_jump_spat = float(np.clip(min(1.0, spat_p_dev / 2.5), 0.0, 1.0))
    press_jump_xgb = float(xgb_probs.get('pressure_jump', 0.0))

    fused_press_jump = (
        w_xgb * press_jump_xgb +
        w_temp * press_jump_temp +
        w_spat * press_jump_spat +
        w_phys * press_jump_phys +
        w_nov * iforest_novelty
    )
    if press_jump_temp >= 0.85 and (press_jump_xgb >= 0.30 or p_val < 970.0):
        fused_press_jump = max(fused_press_jump, 0.92)

    class_evidence['pressure_jump'] = {
        'temporal': round(press_jump_temp, 4),
        'spatial': round(press_jump_spat, 4),
        'physics': round(press_jump_phys, 4),
        'xgb': round(press_jump_xgb, 4),
        'fused': round(float(fused_press_jump), 4)
    }
    class_fused_scores['pressure_jump'] = round(float(fused_press_jump), 4)

    # 4. FREEZE
    freeze_temp = 0.0
    if max_frozen >= 5:
        freeze_temp = 0.98
    elif max_frozen == 4:
        freeze_temp = 0.90
    elif max_frozen == 3:
        freeze_temp = 0.50
    elif max_frozen == 2:
        freeze_temp = 0.20

    if t_var6 < 1e-4 and max_frozen >= 3:
        freeze_temp = max(freeze_temp, 0.92)

    freeze_phys = 0.85 if max_frozen >= 4 else (0.40 if max_frozen >= 3 else 0.0)
    freeze_spat = 0.80 if max_frozen >= 4 else 0.05
    freeze_xgb = float(xgb_probs.get('freeze', 0.0))

    fused_freeze = (
        w_xgb * freeze_xgb +
        w_temp * freeze_temp +
        w_spat * freeze_spat +
        w_phys * freeze_phys +
        w_nov * iforest_novelty
    )
    if max_frozen >= 4:
        fused_freeze = max(fused_freeze, 0.95)

    class_evidence['freeze'] = {
        'temporal': round(freeze_temp, 4),
        'spatial': round(freeze_spat, 4),
        'physics': round(freeze_phys, 4),
        'xgb': round(freeze_xgb, 4),
        'fused': round(float(fused_freeze), 4)
    }
    class_fused_scores['freeze'] = round(float(fused_freeze), 4)

    # 5. DRIFT
    is_step_jump = (t_rate >= 4.0) or (t_diff1 >= 4.0)
    drift_temp = float(np.clip(
        0.50 * min(1.0, max(0.0, abs(t_slope) / 0.8)) +
        0.35 * min(1.0, max(0.0, (t_diff24 - 2.0) / 6.0)) +
        0.15 * (0.0 if is_step_jump else 0.8),
        0.0, 1.0
    ))
    if len(history_records) >= 4 and abs(t_slope) >= 0.25 and not is_step_jump:
        drift_temp = max(drift_temp, 0.88)

    drift_phys = float(np.clip(min(1.0, abs(t_slope) / 1.0), 0.0, 1.0))
    drift_spat = float(np.clip(min(1.0, spat_t_dev / 3.0), 0.0, 1.0))
    drift_xgb = float(xgb_probs.get('drift', 0.0))

    fused_drift = (
        w_xgb * drift_xgb +
        w_temp * drift_temp +
        w_spat * drift_spat +
        w_phys * drift_phys +
        w_nov * iforest_novelty
    )
    if drift_temp >= 0.80 and (drift_xgb >= 0.25 or abs(t_slope) >= 0.30):
        fused_drift = max(fused_drift, 0.89)

    class_evidence['drift'] = {
        'temporal': round(drift_temp, 4),
        'spatial': round(drift_spat, 4),
        'physics': round(drift_phys, 4),
        'xgb': round(drift_xgb, 4),
        'fused': round(float(fused_drift), 4)
    }
    class_fused_scores['drift'] = round(float(fused_drift), 4)

    # 6. OFFSET
    is_step_shift = abs(t_diff1) >= 3.5 or abs(t_diff24) >= 5.0
    offset_temp = float(np.clip(
        0.55 * min(1.0, max(0.0, (abs(t_diff24) - 3.0) / 6.0)) +
        0.30 * min(1.0, max(0.0, abs(t_diff1) / 6.0)) +
        0.15 * min(1.0, max(0.0, t_z24 / 2.5)),
        0.0, 1.0
    ))
    if is_step_shift:
        offset_temp = max(offset_temp, 0.88)

    offset_phys = float(np.clip(min(1.0, abs(t_diff24) / 7.0), 0.0, 1.0))
    offset_spat = float(np.clip(min(1.0, spat_t_dev / 2.5), 0.0, 1.0))
    offset_xgb = float(xgb_probs.get('offset', 0.0))

    fused_offset = (
        w_xgb * offset_xgb +
        w_temp * offset_temp +
        w_spat * offset_spat +
        w_phys * offset_phys +
        w_nov * iforest_novelty
    )
    if offset_temp >= 0.80 and (offset_xgb >= 0.25 or is_step_shift):
        fused_offset = max(fused_offset, 0.88)

    class_evidence['offset'] = {
        'temporal': round(offset_temp, 4),
        'spatial': round(offset_spat, 4),
        'physics': round(offset_phys, 4),
        'xgb': round(offset_xgb, 4),
        'fused': round(float(fused_offset), 4)
    }
    class_fused_scores['offset'] = round(float(fused_offset), 4)

    # 7. MISSING DATA
    missing_temp = 1.0 if is_missing else 0.0
    missing_phys = 1.0 if is_missing else 0.0
    missing_spat = 0.80 if is_missing else 0.0
    missing_xgb = float(xgb_probs.get('missing_data', 0.0))

    fused_missing = (
        w_xgb * missing_xgb +
        w_temp * missing_temp +
        w_spat * missing_spat +
        w_phys * missing_phys +
        w_nov * iforest_novelty
    )
    if is_missing:
        fused_missing = 0.98

    class_evidence['missing_data'] = {
        'temporal': round(missing_temp, 4),
        'spatial': round(missing_spat, 4),
        'physics': round(missing_phys, 4),
        'xgb': round(missing_xgb, 4),
        'fused': round(float(fused_missing), 4)
    }
    class_fused_scores['missing_data'] = round(float(fused_missing), 4)

    # 8. MULTIVARIATE INCONSISTENCY
    multi_conflict_active = (t_val >= 42.0 and h_val >= 85.0) or (dew_dep < -0.2) or (t_val >= 40.0 and h_val >= 90.0)
    multi_temp = 0.90 if multi_conflict_active else min(1.0, max(0.0, (t_val - 38.0) / 8.0) * max(0.0, (h_val - 75.0) / 15.0))
    multi_phys = 0.95 if multi_conflict_active else min(1.0, max(0.0, (t_val - 40.0) / 6.0) * 0.5 + max(0.0, (h_val - 80.0) / 15.0) * 0.5)
    multi_spat = float(np.clip(min(1.0, max(spat_t_dev, spat_h_dev) / 2.5), 0.0, 1.0))
    multi_xgb = float(xgb_probs.get('multivariate_inconsistency', 0.0))

    fused_multi = (
        w_xgb * multi_xgb +
        w_temp * multi_temp +
        w_spat * multi_spat +
        w_phys * multi_phys +
        w_nov * iforest_novelty
    )
    if multi_conflict_active:
        fused_multi = max(fused_multi, 0.95)

    class_evidence['multivariate_inconsistency'] = {
        'temporal': round(float(multi_temp), 4),
        'spatial': round(float(multi_spat), 4),
        'physics': round(float(multi_phys), 4),
        'xgb': round(float(multi_xgb), 4),
        'fused': round(float(fused_multi), 4)
    }
    class_fused_scores['multivariate_inconsistency'] = round(float(fused_multi), 4)

    # 9. SPATIAL INCONSISTENCY
    spatial_is_outlier = spat_t_dev >= 2.8 or spat_h_dev >= 2.8 or spat_p_dev >= 2.8
    spatial_spat = float(np.clip(min(1.0, spat_t_dev / 3.0), 0.0, 1.0))
    if spatial_is_outlier:
        spatial_spat = max(spatial_spat, 0.92)

    spatial_temp = float(np.clip(min(1.0, max(t_z24, h_z24) / 3.0), 0.0, 1.0))
    spatial_phys = 0.70 if spatial_is_outlier else 0.05
    spatial_xgb = float(xgb_probs.get('spatial_inconsistency', 0.0))

    fused_spatial = (
        w_xgb * spatial_xgb +
        w_temp * spatial_temp +
        w_spat * spatial_spat +
        w_phys * spatial_phys +
        w_nov * iforest_novelty
    )
    if spatial_is_outlier and (spatial_xgb >= 0.25 or spat_t_dev >= 3.2):
        fused_spatial = max(fused_spatial, 0.91)

    class_evidence['spatial_inconsistency'] = {
        'temporal': round(float(spatial_temp), 4),
        'spatial': round(float(spatial_spat), 4),
        'physics': round(float(spatial_phys), 4),
        'xgb': round(float(spatial_xgb), 4),
        'fused': round(float(fused_spatial), 4)
    }
    class_fused_scores['spatial_inconsistency'] = round(float(fused_spatial), 4)

    # GLOBAL EVIDENCE
    max_temporal = max(ev['temporal'] for ev in class_evidence.values())
    max_spatial = max(ev['spatial'] for ev in class_evidence.values())
    max_physics = max(ev['physics'] for ev in class_evidence.values())
    max_fused_class = max(class_fused_scores.values())

    global_evidence = {
        'iforest_novelty': round(float(iforest_novelty), 4),
        'temporal': round(float(max_temporal), 4),
        'spatial': round(float(max_spatial), 4),
        'physics': round(float(max_physics), 4),
        'fused_anomaly_score': round(float(max_fused_class), 4)
    }

    top_class = max(class_fused_scores, key=class_fused_scores.get)
    top_fused = class_fused_scores[top_class]

    if top_fused >= 0.40:
        ev_top = class_evidence[top_class]
        if top_class == "temperature_spike":
            why_statements.append(f"Rapid temperature increase (ΔT rate: {t_rate:.1f}°C/h, z-score: {t_z24:.2f}).")
            if spat_t_dev >= 2.0:
                why_statements.append(f"Temperature diverges by {abs(t_val - neighbor_t_med):.1f}°C from cluster neighbors.")
            if ev_top['physics'] >= 0.5:
                why_statements.append("Thermal rate-of-change exceeds physical bounds.")
            why_statements.append(f"XGBoost classifier assigns {ev_top['xgb'] * 100:.1f}% confidence to temperature_spike.")
        elif top_class == "humidity_spike":
            why_statements.append(f"Relative humidity surge toward saturation ({h_val:.1f}%, ΔRH: {h_rate:.1f}%/h).")
            why_statements.append("Psychrometric dew point depression approaches saturation limit.")
            why_statements.append(f"XGBoost classifier supports humidity_spike with {ev_top['xgb'] * 100:.1f}% probability.")
        elif top_class == "pressure_jump":
            why_statements.append(f"Sudden barometric pressure change detected ({p_val:.1f} hPa, rate: {p_rate:.1f} hPa/h).")
            why_statements.append("Barometric rate-of-change deviates sharply from regional baseline.")
        elif top_class == "freeze":
            why_statements.append(f"Sensor values stuck constant for {max_frozen} consecutive readings with zero variance.")
            why_statements.append("Cluster neighbors exhibit natural thermal fluctuations while station reading is locked.")
        elif top_class == "drift":
            why_statements.append(f"Progressive monotonic calibration drift trend (slope: {t_slope:+.3f}°C/period).")
            why_statements.append("Station trajectory steadily diverges from cluster reference trend.")
        elif top_class == "offset":
            why_statements.append(f"Sudden calibration step shift detected (baseline offset: {t_diff24:.1f}°C).")
            why_statements.append("Reading remains stable at new shifted baseline level.")
        elif top_class == "missing_data":
            why_statements.append("Data Quality Layer detected missing/null sensor channels in telemetry frame.")
        elif top_class == "multivariate_inconsistency":
            why_statements.append(f"Thermodynamic conflict: High temperature ({t_val:.1f}°C) combined with saturated humidity ({h_val:.1f}%).")
            why_statements.append("Combined psychrometric state violates physical thermodynamic atmospheric limits.")
        elif top_class == "spatial_inconsistency":
            why_statements.append(f"Station temperature ({t_val:.1f}°C) differs by {abs(t_val - neighbor_t_med):.1f}°C from synchronized cluster neighbors.")
            why_statements.append("Spatial z-score against neighbor consensus exceeds threshold.")
    else:
        why_statements.append("All physical and statistical indicators are within nominal climatological bounds.")

    return class_evidence, class_fused_scores, global_evidence, why_statements
