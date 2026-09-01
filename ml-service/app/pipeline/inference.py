import numpy as np
import pandas as pd
from typing import List, Dict, Any, Union

from ..core.streaming_state import get_streaming_buffer
from ..preprocessing.feature_engineering import to_model_matrix
from ..detection.isolation_forest import score as if_score
from ..detection.xgboost import predict as xgb_predict
from ..detection.physics_rules import evaluate_physics
from ..detection.class_evidence import evaluate_class_evidence, ANOMALY_CLASSES, ALL_CLASSES
from ..fusion.decision_engine import make_decision
from ..health.severity import calculate_severity
from ..health.sensor_health import calculate_sensor_health
from ..explainability.shap_explainer import explain
from ..explainability.llm_report import generate_ai_report
from .maintenance import recommend_maintenance

def sanitize_record(r: Dict[str, Any]) -> Dict[str, Any]:
    out = {}
    for k, v in r.items():
        if isinstance(v, (np.floating, float)):
            out[k] = 0.0 if (np.isnan(v) or np.isinf(v)) else float(v)
        elif isinstance(v, (np.integer, int)):
            out[k] = int(v)
        elif isinstance(v, (np.bool_, bool)):
            out[k] = bool(v)
        elif isinstance(v, np.ndarray):
            out[k] = v.tolist()
        elif isinstance(v, pd.Timestamp):
            out[k] = v.isoformat()
        elif isinstance(v, dict):
            out[k] = sanitize_record(v)
        elif isinstance(v, list):
            out[k] = [sanitize_record(x) if isinstance(x, dict) else (float(x) if isinstance(x, (np.floating, float)) else x) for x in v]
        else:
            out[k] = v
    return out

def run_pipeline(records: Union[List[Dict[str, Any]], Dict[str, Any]], iso_model, xgb_model, metadata: dict, generate_llm=None) -> List[Dict[str, Any]]:
    """
    Real-time, class-aware streaming ML diagnostics pipeline.
    Processes incoming raw telemetry records independently while maintaining online history & cluster state.
    Calculates complete class-specific evidence vectors for all 9 anomaly classes.
    """
    if isinstance(records, dict):
        records = [records]

    if not records:
        return []

    features = metadata.get('feature_cols', [])
    classes = metadata.get('classes', [])
    if not classes:
        classes = ALL_CLASSES

    physics_cfg = metadata.get('physics_config', {})
    fusion_cfg = metadata.get('fusion_config', {})
    decision_cfg = metadata.get('decision_config', {})
    severity_cfg = metadata.get('severity_config', {})
    health_cfg = metadata.get('health_config', {})

    streaming_buffer = get_streaming_buffer()
    results = []

    for raw_rec in records:
        # Check if record contains previous history_records (used in bootstrap/test scenarios)
        hist_records = raw_rec.get('history_records')
        station_id = str(raw_rec.get('station_id') or raw_rec.get('stationId') or 'DEMO-001')
        if hist_records and isinstance(hist_records, list) and station_id not in streaming_buffer.station_history:
            for h in hist_records:
                if isinstance(h, dict):
                    h_copy = {**raw_rec, **h}
                    h_copy.pop('history_records', None)
                    streaming_buffer.ingest_record(h_copy)

        # 1. Ingest the current raw telemetry record into stateful buffer
        feat_dict, is_missing = streaming_buffer.ingest_record(raw_rec)

        # 2. Construct exact 75-feature matrix
        X = to_model_matrix([feat_dict], features)

        # 3. Isolation Forest continuous novelty evidence
        iso_score = if_score(iso_model, X)
        iso_val = float(iso_score[0])

        # 4. XGBoost 10-class prediction
        probs = xgb_predict(xgb_model, X)
        prob_row = probs[0]
        xgb_anom_prob = float(1.0 - prob_row[0])

        # 10-Class probabilities map
        class_probs = {}
        for idx, cname in enumerate(classes):
            class_probs[cname] = round(float(prob_row[idx]), 4) if idx < len(prob_row) else 0.0

        # 5. Physics Consistency Engine
        phys_df = evaluate_physics(pd.DataFrame([feat_dict]), physics_cfg)
        phys_score = float(phys_df["physics_evidence_score"].iloc[0])

        # 6. Class-Specific Evidence Engine for all 9 anomaly classes
        stn_history = list(streaming_buffer.station_history.get(station_id, []))
        cluster_name = str(feat_dict.get('cluster', 'NCR')).strip()
        cluster_stations = streaming_buffer.cluster_state.get(cluster_name, {})

        class_evidence, class_fused_scores, global_evidence, why_statements = evaluate_class_evidence(
            feat_dict=feat_dict,
            history_records=stn_history,
            cluster_stations=cluster_stations,
            current_station_id=station_id,
            xgb_probs=class_probs,
            iforest_novelty=iso_val,
            fusion_weights=fusion_cfg
        )

        fused_score = global_evidence['fused_anomaly_score']
        temporal_score = global_evidence['temporal']
        spatial_score = global_evidence['spatial']

        # 7. Class-Aware Decision Engine
        # Determine top supported anomaly class from class_fused_scores
        top_anom_class = max(class_fused_scores, key=class_fused_scores.get)
        top_fused_score = class_fused_scores[top_anom_class]
        top_xgb_conf = class_probs.get(top_anom_class, 0.0)

        # Triage between normal, known anomaly, and novel anomaly
        anom_threshold = float(decision_cfg.get('anomaly_threshold', 0.40))
        known_threshold = float(decision_cfg.get('known_class_threshold', 0.35))
        novelty_threshold = float(decision_cfg.get('novelty_threshold', 0.65))

        if is_missing:
            decision = {
                'decision': 'known_anomaly',
                'root_cause': 'missing_data',
                'confidence': 0.98
            }
        elif top_fused_score >= anom_threshold or (1.0 - class_probs.get('normal', 0.5)) >= 0.45:
            # Anomaly is confirmed
            if top_fused_score >= known_threshold and (top_xgb_conf >= 0.20 or class_evidence[top_anom_class]['temporal'] >= 0.70 or class_evidence[top_anom_class]['physics'] >= 0.70 or class_evidence[top_anom_class]['spatial'] >= 0.70):
                decision = {
                    'decision': 'known_anomaly',
                    'root_cause': top_anom_class,
                    'confidence': round(float(max(top_xgb_conf, top_fused_score)), 4)
                }
            elif iso_val >= novelty_threshold or top_xgb_conf < 0.15:
                decision = {
                    'decision': 'novel_anomaly',
                    'root_cause': 'novel_anomaly',
                    'confidence': round(float(max(iso_val, top_fused_score)), 4)
                }
            else:
                decision = {
                    'decision': 'known_anomaly',
                    'root_cause': top_anom_class,
                    'confidence': round(float(top_fused_score), 4)
                }
        elif iso_val >= novelty_threshold:
            decision = {
                'decision': 'novel_anomaly',
                'root_cause': 'novel_anomaly',
                'confidence': round(float(iso_val), 4)
            }
        else:
            decision = {
                'decision': 'normal',
                'root_cause': 'normal',
                'confidence': round(float(max(class_probs.get('normal', 0.95), 1.0 - top_fused_score)), 4)
            }

        # 8. Operational Severity Scorer
        f_count = max(
            int(feat_dict.get('temperature_c_frozen_count', 1)),
            int(feat_dict.get('humidity_pct_frozen_count', 1)),
            int(feat_dict.get('pressure_hpa_frozen_count', 1))
        )
        sev = calculate_severity(
            decision['decision'], fused_score, decision['confidence'],
            f_count, phys_score, decision['root_cause'], severity_cfg
        )

        # 9. Sensor Health Scorer (0-100)
        n_dev = float(feat_dict.get('neighbor_dev_score', 0.0))
        health = calculate_sensor_health(
            decision['decision'], sev['severity'], decision['root_cause'],
            phys_score, n_dev, missing=is_missing, config=health_cfg
        )

        # 10. SHAP Explanation & Signed Feature Attributions
        target_idx = classes.index(decision['root_cause']) if decision['root_cause'] in classes else 0
        shap_factors = explain(xgb_model, X, features, target_class_id=target_idx, target_class_name=decision['root_cause'])

        # 11. Maintenance Recommendation Catalog
        maint = recommend_maintenance(decision['root_cause'], sev['severity'])

        # 12. Optional LLM Report Generation
        rec_gen = raw_rec.get('generate_report', raw_rec.get('generate_llm', generate_llm))
        is_anom = (decision['decision'] != 'normal') or (decision['root_cause'] != 'normal')

        llm_report = ''
        llm_source = 'none'

        if is_anom:
            if rec_gen is False:
                llm_report = ''
                llm_source = 'suppressed'
            else:
                ai_rep = generate_ai_report(
                    {**feat_dict, **phys_df.iloc[0].to_dict(), **decision, **sev, 'health_score': health['health_score']},
                    generate_report=True,
                    only_on_anomaly=True
                )
                llm_report = ai_rep.get('llm_report', '')
                llm_source = ai_rep.get('llm_source', 'mistral')
        else:
            llm_report = ''
            llm_source = 'none'

        # Structured Response conforming to Specification Section 20
        response_record = {
            "station_id": feat_dict['station_id'],
            "station_name": feat_dict['station_name'],
            "city": feat_dict['city'],
            "cluster": feat_dict['cluster'],
            "latitude": feat_dict['latitude'],
            "longitude": feat_dict['longitude'],
            "timestamp": feat_dict['timestamp'],

            # Raw Telemetry
            "telemetry": {
                "temperature_c": round(float(feat_dict['temperature_c']), 2),
                "humidity_pct": round(float(feat_dict['humidity_pct']), 1),
                "pressure_hpa": round(float(feat_dict['pressure_hpa']), 1)
            },

            # ML Diagnostic Prediction
            "prediction": {
                "is_anomaly": decision['decision'] != 'normal',
                "decision": decision['decision'],
                "root_cause": decision['root_cause'],
                "confidence": round(float(decision['confidence']), 4)
            },

            # 10-Class Probabilities Vector
            "class_probabilities": class_probs,

            # 9 Anomaly Classes Evidence Breakdown
            "class_evidence": class_evidence,
            "class_fused_scores": class_fused_scores,

            # Global Multi-Source Evidence Scores
            "global_evidence": global_evidence,
            "scores": {
                "fused_anomaly_score": round(float(fused_score), 4),
                "iforest_novelty": round(float(iso_val), 4),
                "temporal": round(float(temporal_score), 4),
                "spatial": round(float(spatial_score), 4),
                "physics": round(float(phys_score), 4),
                "xgboost_anomaly": round(float(xgb_anom_prob), 4)
            },

            # Operational Severity
            "severity": {
                "level": sev['severity'],
                "score": round(float(sev['severity_score']), 4)
            },

            # Sensor Health 0-100 Score
            "sensor_health": {
                "score": health['health_score'],
                "status": health['status'],
                "deductions": health['deductions']
            },

            # Evidence breakdown alias
            "evidence": {
                "isolation_forest": round(float(iso_val), 4),
                "xgboost": round(float(xgb_anom_prob), 4),
                "temporal": round(float(temporal_score), 4),
                "spatial": round(float(spatial_score), 4),
                "physics": round(float(phys_score), 4)
            },

            # SHAP Explanation & Diagnostic Statements
            "explanation": {
                "top_features": shap_factors,
                "evidence_summary": why_statements,
                "shap_factors": shap_factors
            },

            # Actionable Maintenance
            "maintenance": maint,

            # LLM Diagnostic Advisory
            "llm": {
                "provider": llm_source,
                "report": llm_report
            },

            # Backwards compatibility flat fields
            "decision": decision['decision'],
            "root_cause": decision['root_cause'],
            "confidence": round(float(decision['confidence']), 4),
            "severity": sev['severity'],
            "severity_score": round(float(sev['severity_score']), 4),
            "fused_anomaly_score": round(float(fused_score), 4),
            "iforest_ml_score": round(float(iso_val), 4),
            "xgb_anomaly_evidence": round(float(xgb_anom_prob), 4),
            "temporal_evidence": round(float(temporal_score), 4),
            "spatial_evidence": round(float(spatial_score), 4),
            "physics_evidence_score": round(float(phys_score), 4),
            "health_score": health['health_score'],
            "health_status": health['status'],
            "shap_factors": shap_factors,
            "llm_report": llm_report,
            "llm_source": llm_source,
            **feat_dict,
            **phys_df.iloc[0].to_dict()
        }

        results.append(sanitize_record(response_record))

    return results
