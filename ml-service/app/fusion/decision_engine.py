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
    anomaly_threshold = float(c.get('anomaly_threshold', 0.45))
    known_class_threshold = float(c.get('known_class_threshold', 0.40))
    novelty_threshold = float(c.get('novelty_threshold', 0.65))
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
    f_count = max(
        _safe_int(ctx.get('temperature_c_frozen_count'), 1),
        _safe_int(ctx.get('humidity_pct_frozen_count'), 1),
        _safe_int(ctx.get('pressure_hpa_frozen_count'), 1)
    )
    spat_z = max(
        abs(_safe_float(ctx.get('spatial_temp_zscore'))),
        abs(_safe_float(ctx.get('spatial_press_zscore'))),
        abs(_safe_float(ctx.get('spatial_hum_zscore')))
    )
    t_rate = abs(_safe_float(ctx.get('temperature_c_rate_1h')))
    h_rate = abs(_safe_float(ctx.get('humidity_pct_rate_1h')))
    p_rate = abs(_safe_float(ctx.get('pressure_hpa_rate_1h')))
    press_val = _safe_float(ctx.get('pressure_hpa'), 1013.25)
    temp_val = _safe_float(ctx.get('temperature_c'), 25.0)
    hum_val = _safe_float(ctx.get('humidity_pct'), 50.0)

    is_frozen = f_count >= 4
    is_spatial = spat_z >= 3.0
    is_press_jump = press_val < 980.0 or press_val > 1050.0 or p_rate >= 3.5
    is_drift = (t_rate >= 3.5 and temp_val > 32.0)
    is_temp_spike = temp_val > 46.0 or temp_val < -5.0 or t_rate >= 7.0
    is_hum_spike = hum_val >= 98.0 or h_rate >= 25.0
    is_multi_conflict = (temp_val >= 42.0 and hum_val >= 85.0)

    # 1. Known anomaly detected with confident XGBoost classification
    if top_anom_conf >= known_class_threshold and (fused >= anomaly_threshold or top_anom_conf >= 0.50 or normal_prob < 0.50):
        # Disambiguate spatial vs pure spike if needed
        if is_spatial and predicted_class in ['temperature_spike', 'normal', 'known_anomaly'] and not is_temp_spike:
            predicted_class = 'spatial_inconsistency'

        return {
            'decision': 'known_anomaly',
            'root_cause': predicted_class,
            'confidence': round(top_anom_conf, 4)
        }

    # 2. Anomaly triggered via evidence fusion or physical/temporal signatures
    if fused >= anomaly_threshold or is_frozen or is_spatial or is_press_jump or is_drift or is_temp_spike or is_hum_spike or is_multi_conflict:
        assigned_cause = predicted_class if (predicted_class not in ['normal', 'known_anomaly', 'novel_anomaly'] and top_anom_conf >= 0.30) else None

        if not assigned_cause:
            if is_frozen:
                assigned_cause = 'freeze'
            elif is_press_jump:
                assigned_cause = 'pressure_jump'
            elif is_temp_spike:
                assigned_cause = 'temperature_spike'
            elif is_hum_spike:
                assigned_cause = 'humidity_spike'
            elif is_multi_conflict:
                assigned_cause = 'multivariate_inconsistency'
            elif is_spatial:
                assigned_cause = 'spatial_inconsistency'
            elif is_drift:
                assigned_cause = 'drift'
            elif iforest >= novelty_threshold or top_anom_conf < 0.20:
                assigned_cause = 'novel_anomaly'
            else:
                assigned_cause = predicted_class if predicted_class != 'normal' else 'novel_anomaly'

        assigned_conf = max(top_anom_conf, 0.90 if assigned_cause in [
            'freeze', 'pressure_jump', 'drift', 'offset', 'spatial_inconsistency',
            'multivariate_inconsistency', 'temperature_spike', 'humidity_spike', 'missing_data'
        ] else 0.75)

        return {
            'decision': 'known_anomaly' if assigned_cause != 'novel_anomaly' else 'novel_anomaly',
            'root_cause': assigned_cause,
            'confidence': round(float(assigned_conf), 4)
        }

    # 3. Novelty detection without confident known classification
    if iforest >= novelty_threshold and fused >= anomaly_threshold:
        return {
            'decision': 'novel_anomaly',
            'root_cause': 'novel_anomaly',
            'confidence': round(float(max(iforest, 1.0 - normal_prob)), 4)
        }

    # 4. Nominal operation
    return {
        'decision': 'normal',
        'root_cause': 'normal',
        'confidence': round(float(max(normal_prob, 1.0 - fused)), 4)
    }
