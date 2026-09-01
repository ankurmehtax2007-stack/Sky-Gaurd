import numpy as np

def fuse_evidence(iforest_novelty, temporal_evidence, spatial_evidence, physics_evidence, xgb_anomaly_prob, weights=None):
    """
    Combines five evidence sources with configurable weights and non-linear fusion:
      1. Isolation Forest continuous novelty evidence
      2. Temporal statistical & persistence evidence
      3. Spatial cluster consistency evidence
      4. Physics & thermodynamic consistency evidence
      5. XGBoost multi-class classifier evidence
    """
    w = weights or {}
    total = sum(w.values()) if w else 1.0
    if total <= 0:
        total = 1.0
    w_norm = {k: v / total for k, v in w.items()}

    w_iso = w_norm.get('w_iforest', 0.20)
    w_temp = w_norm.get('w_temporal', 0.20)
    w_spat = w_norm.get('w_spatial', 0.20)
    w_phys = w_norm.get('w_physics', 0.20)
    w_xgb = w_norm.get('w_xgboost', 0.20)

    iso = np.asarray(iforest_novelty, dtype=float)
    temp = np.asarray(temporal_evidence, dtype=float)
    spat = np.asarray(spatial_evidence, dtype=float)
    phys = np.asarray(physics_evidence, dtype=float)
    xgb = np.asarray(xgb_anomaly_prob, dtype=float)

    weighted = (
        w_xgb * xgb +
        w_phys * phys +
        w_iso * iso +
        w_temp * temp +
        w_spat * spat
    )

    # When all active indicators show low probability, keep score nominal
    nominal_mask = (xgb < 0.25) & (phys < 0.25) & (temp < 0.25) & (spat < 0.25)

    # Boost when ML model, physical constraint, temporal pattern, or spatial outlier triggers
    max_evidence = np.maximum.reduce([xgb, phys, temp, spat, iso])
    anom_boost = np.maximum(weighted, 0.80 * max_evidence)
    fused = np.where(nominal_mask, weighted * 0.70, anom_boost)
    return np.clip(np.nan_to_num(fused, nan=0.0), 0.0, 1.0)
