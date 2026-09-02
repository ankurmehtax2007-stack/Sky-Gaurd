import numpy as np

DEFAULT_CLASSES = [
    "normal", "temperature_spike", "humidity_spike", "pressure_jump",
    "freeze", "drift", "offset", "missing_data",
    "multivariate_inconsistency", "spatial_inconsistency"
]

def _safe_float(val, default=0.0):
    if val is None:
        return default
    try:
        if isinstance(val, (int, float)):
            return float(val) if not np.isnan(val) else default
        return float(val)
    except Exception:
        return default

def _safe_int(val, default=1):
    if val is None:
        return default
    try:
        if isinstance(val, (int, float)):
            return int(val) if not np.isnan(val) else default
        return int(val)
    except Exception:
        return default

def make_decision(fused, probs, classes=None, config=None, iforest=0.0, context=None):
    """
    Triages incoming telemetry into:
      - 'normal'
      - 'known_anomaly' (with root_cause matching one of the 9 physical failure modes)
      - 'novel_anomaly' (when evidence is anomalous but does not match any known signature)
    """
    c = config or {}
    anomaly_threshold = float(c.get('anomaly_threshold', 0.40))
    known_class_threshold = float(c.get('known_class_threshold', 0.35))
    novelty_threshold = float(c.get('novelty_threshold', 0.85))
    class_names = list(classes) if classes else DEFAULT_CLASSES

    probs = np.asarray(probs, dtype=float).ravel()
    normal_prob = float(probs[0]) if len(probs) > 0 else 0.5
    anom_probs = probs[1:] if len(probs) > 1 else np.array([0.0])

    if len(anom_probs) > 0:
        top_anom_idx = int(np.argmax(anom_probs) + 1)
        top_anom_conf = float(anom_probs[top_anom_idx - 1])
    else:
        top_anom_idx = 0
        top_anom_conf = 0.0

    predicted_class = class_names[top_anom_idx] if top_anom_idx < len(class_names) else f"class_{top_anom_idx}"
    ctx = context or {}

    # Check if data quality layer flagged missing data
    is_missing = bool(ctx.get('is_missing_data') or ctx.get('missing_data'))
    if is_missing:
        return {
            'decision': 'known_anomaly',
            'root_cause': 'missing_data',
            'confidence': 0.98
        }

    # Extract contextual signals for fallback resolution
    t_frozen = _safe_int(ctx.get('temperature_c_frozen_count'), 1)
    h_frozen = _safe_int(ctx.get('humidity_pct_frozen_count'), 1)
    p_frozen = _safe_int(ctx.get('pressure_hpa_frozen_count'), 1)
    max_frozen = max(t_frozen, h_frozen, p_frozen)

    t_var6 = _safe_float(ctx.get('temperature_c_roll6_var'), 1.0)
    h_var6 = _safe_float(ctx.get('humidity_pct_roll6_var'), 1.0)
    p_var6 = _safe_float(ctx.get('pressure_hpa_roll6_var'), 1.0)

    spat_z = max(
        abs(_safe_float(ctx.get('spatial_temp_zscore'))),
        abs(_safe_float(ctx.get('spatial_press_zscore'))),
        abs(_safe_float(ctx.get('spatial_hum_zscore')))
    )
    t_rate = abs(_safe_float(ctx.get('temperature_c_rate_1h')))
    h_rate = abs(_safe_float(ctx.get('humidity_pct_rate_1h')))
    p_rate = abs(_safe_float(ctx.get('pressure_hpa_rate_1h')))

    t_diff1 = _safe_float(ctx.get('temperature_c_diff_lag1'))
    h_diff1 = _safe_float(ctx.get('humidity_pct_diff_lag1'))
    p_diff1 = _safe_float(ctx.get('pressure_hpa_diff_lag1'))

    t_diff24 = abs(_safe_float(ctx.get('temperature_c_roll24_diff')))
    h_diff24 = abs(_safe_float(ctx.get('humidity_pct_roll24_diff')))
    p_diff24 = abs(_safe_float(ctx.get('pressure_hpa_roll24_diff')))

    press_val = _safe_float(ctx.get('pressure_hpa'), 1013.25)
    temp_val = _safe_float(ctx.get('temperature_c'), 25.0)
    hum_val = _safe_float(ctx.get('humidity_pct'), 50.0)

    # Physical signature triggers
    is_multi_conflict = (temp_val >= 42.0 and hum_val >= 85.0) or (temp_val >= 40.0 and hum_val >= 90.0)
    is_temp_spike = (abs(t_diff1) >= 6.0 or t_rate >= 6.0 or temp_val >= 46.0 or temp_val <= -5.0) and not is_multi_conflict
    is_hum_spike = (hum_val >= 96.0 or abs(h_diff1) >= 20.0 or h_rate >= 20.0) and not is_multi_conflict
    is_press_jump = (abs(p_diff1) >= 5.0 or p_rate >= 3.0 or press_val < 975.0 or press_val > 1045.0 or (p_diff24 >= 10.0 and spat_z >= 2.0))
    is_offset = (
        ((3.5 <= abs(t_diff1) <= 12.0 or 4.0 <= t_diff24 <= 12.0) and temp_val < 45.0) or
        ((12.0 <= abs(h_diff1) <= 30.0 or 14.0 <= h_diff24 <= 30.0) and hum_val < 96.0) or
        ((6.0 <= abs(p_diff1) <= 20.0 or 7.0 <= p_diff24 <= 20.0) and 975.0 <= press_val <= 1045.0)
    ) and not (is_temp_spike or is_hum_spike or is_press_jump or is_multi_conflict)
    is_frozen = (
        (t_frozen >= 5 and t_var6 < 1e-4) or
        (h_frozen >= 5 and h_var6 < 1e-4) or
        (p_frozen >= 10 and p_var6 < 1e-4 and (t_frozen >= 4 or h_frozen >= 4)) or
        (max(t_frozen, h_frozen) >= 6)
    ) and not (is_temp_spike or is_hum_spike or is_press_jump or is_multi_conflict or is_offset)
    is_spatial = spat_z >= 3.0 and not (is_temp_spike or is_hum_spike or is_press_jump)
    is_drift = (t_rate >= 2.0 and t_diff24 >= 3.5 and abs(t_diff1) < 3.5)

    has_physical_anomaly = (
        is_temp_spike or is_hum_spike or is_press_jump or is_offset or
        is_frozen or is_multi_conflict or is_spatial or is_drift
    )

    # 1. Known anomaly detected with confident classifier prediction
    if top_anom_conf >= known_class_threshold and (fused >= anomaly_threshold or top_anom_conf >= 0.45 or normal_prob < 0.50):
        target_root = predicted_class
        if is_spatial and predicted_class in ['temperature_spike', 'normal', 'known_anomaly'] and not is_temp_spike:
            target_root = 'spatial_inconsistency'
        elif is_temp_spike:
            target_root = 'temperature_spike'
        elif is_hum_spike:
            target_root = 'humidity_spike'
        elif is_press_jump:
            target_root = 'pressure_jump'
        elif is_offset and predicted_class in ['normal', 'freeze', 'drift']:
            target_root = 'offset'
        elif is_frozen and predicted_class in ['normal', 'drift']:
            target_root = 'freeze'

        return {
            'decision': 'known_anomaly',
            'root_cause': target_root,
            'confidence': round(float(max(top_anom_conf, fused, 0.90)), 4)
        }

    # 2. Anomaly triggered via evidence fusion or physical signatures
    if fused >= anomaly_threshold or has_physical_anomaly:
        assigned_cause = None

        if is_multi_conflict:
            assigned_cause = 'multivariate_inconsistency'
        elif is_temp_spike:
            assigned_cause = 'temperature_spike'
        elif is_hum_spike:
            assigned_cause = 'humidity_spike'
        elif is_press_jump:
            assigned_cause = 'pressure_jump'
        elif is_offset:
            assigned_cause = 'offset'
        elif is_frozen:
            assigned_cause = 'freeze'
        elif is_spatial:
            assigned_cause = 'spatial_inconsistency'
        elif is_drift:
            assigned_cause = 'drift'
        elif predicted_class not in ['normal', 'known_anomaly', 'novel_anomaly'] and top_anom_conf >= 0.20:
            assigned_cause = predicted_class
        elif iforest >= novelty_threshold and not has_physical_anomaly:
            assigned_cause = 'novel_anomaly'
        else:
            assigned_cause = predicted_class if predicted_class != 'normal' else 'temperature_spike'

        assigned_conf = max(top_anom_conf, fused, 0.92 if assigned_cause in [
            'freeze', 'pressure_jump', 'drift', 'offset', 'spatial_inconsistency',
            'multivariate_inconsistency', 'temperature_spike', 'humidity_spike', 'missing_data'
        ] else 0.75)

        return {
            'decision': 'known_anomaly' if assigned_cause != 'novel_anomaly' else 'novel_anomaly',
            'root_cause': assigned_cause,
            'confidence': round(float(assigned_conf), 4)
        }

    # 3. Novelty detection without any known physical or classifier signatures
    if iforest >= novelty_threshold and fused >= 0.60:
        return {
            'decision': 'novel_anomaly',
            'root_cause': 'novel_anomaly',
            'confidence': round(float(iforest), 4)
        }

    # 4. Nominal operation
    return {
        'decision': 'normal',
        'root_cause': 'normal',
        'confidence': round(float(max(normal_prob, 1.0 - fused)), 4)
    }

