import os
import hashlib
from datetime import datetime
from typing import Any, Optional, List, Dict, Union
from pydantic import BaseModel, Field

# -------------------------------------------------------------
# 1. Analyze Schemas
# -------------------------------------------------------------
class StationDetail(BaseModel):
    id: str = "DEMO-001"
    name: str = "Demo Weather Station"
    city: str = "New Delhi"
    cluster: str = "NCR"
    latitude: float = 28.6139
    longitude: float = 77.209

class TelemetryDetail(BaseModel):
    temperature_c: float
    humidity_pct: float
    pressure_hpa: float

class PredictionDetail(BaseModel):
    is_anomaly: bool
    decision: str
    root_cause: str
    confidence: float

class AnomalyDetail(BaseModel):
    detected: bool
    decision: str
    root_cause: str
    confidence: float
    severity: str
    severity_score: float
    fused_anomaly_score: float

class EvidenceDetail(BaseModel):
    isolation_forest: float
    xgboost: float
    temporal: float
    spatial: float
    physics: float

class ScoresDetail(BaseModel):
    fused_anomaly_score: float
    iforest_novelty: float
    temporal: float
    spatial: float
    physics: float
    xgboost_anomaly: float

class SeverityDetail(BaseModel):
    level: str
    score: float

class SensorHealthDetail(BaseModel):
    score: int
    status: str
    deductions: Optional[Dict[str, float]] = None

class ShapFactorItem(BaseModel):
    feature: str
    shap_value: float
    human_readable_statement: Optional[str] = None

class ExplanationDetail(BaseModel):
    top_features: List[ShapFactorItem] = Field(default_factory=list)
    shap_factors: List[ShapFactorItem] = Field(default_factory=list)

class MaintenanceDetail(BaseModel):
    priority: str
    recommended_action: str

class LlmDetail(BaseModel):
    provider: str = "none"
    report: str = ""

class AnalysisOutput(BaseModel):
    station: StationDetail
    timestamp: str
    telemetry: TelemetryDetail
    prediction: Optional[PredictionDetail] = None
    anomaly: AnomalyDetail
    scores: Optional[ScoresDetail] = None
    evidence: EvidenceDetail
    class_probabilities: Optional[Dict[str, float]] = None
    severity: Optional[SeverityDetail] = None
    health: Optional[Dict[str, Any]] = None
    sensor_health: Optional[SensorHealthDetail] = None
    explanation: ExplanationDetail
    maintenance: MaintenanceDetail
    llm: LlmDetail

class AnalyzeResponse(BaseModel):
    status: str = "success"
    analysis: AnalysisOutput

# -------------------------------------------------------------
# 2. Feedback Schemas
# -------------------------------------------------------------
class FeedbackRequestModel(BaseModel):
    analysis_id: Optional[str] = None
    station_id: str = "DEMO-001"
    operator_decision: str = "confirmed"
    corrected_root_cause: Optional[str] = None
    comment: str = ""
    operator_id: str = "operator_001"

class FeedbackRecord(BaseModel):
    feedback_id: str
    analysis_id: str
    station_id: str
    operator_decision: str
    corrected_root_cause: Optional[str] = None
    comment: str
    operator_id: str
    stored: bool = True
    created_at: str

class ModelImprovementRecord(BaseModel):
    label_status: str = "pending_validation"
    used_for_retraining: bool = False

class FeedbackResponse(BaseModel):
    status: str = "success"
    feedback: FeedbackRecord
    model_improvement: ModelImprovementRecord = Field(default_factory=ModelImprovementRecord)

# -------------------------------------------------------------
# Formatting Helpers
# -------------------------------------------------------------
def format_analysis_response(r: dict) -> dict:
    station_id = str(r.get("station_id") or (r.get("station", {}).get("id") if isinstance(r.get("station"), dict) else "DEMO-001"))
    station_name = str(r.get("station_name") or (r.get("station", {}).get("name") if isinstance(r.get("station"), dict) else "Demo Weather Station"))
    city = str(r.get("city") or (r.get("station", {}).get("city") if isinstance(r.get("station"), dict) else "New Delhi"))
    cluster = str(r.get("cluster") or (r.get("station", {}).get("cluster") if isinstance(r.get("station"), dict) else "NCR"))
    lat = float(r.get("latitude") if r.get("latitude") is not None else 28.6139)
    lon = float(r.get("longitude") if r.get("longitude") is not None else 77.209)

    t = float(r.get("temperature_c", (r.get("telemetry", {}).get("temperature_c") if isinstance(r.get("telemetry"), dict) else 25.0)))
    rh = float(r.get("humidity_pct", (r.get("telemetry", {}).get("humidity_pct") if isinstance(r.get("telemetry"), dict) else 50.0)))
    p = float(r.get("pressure_hpa", (r.get("telemetry", {}).get("pressure_hpa") if isinstance(r.get("telemetry"), dict) else 1013.25)))

    decision = str(r.get("decision") or (r.get("prediction", {}).get("decision") if isinstance(r.get("prediction"), dict) else "normal"))
    root_cause = str(r.get("root_cause") or (r.get("prediction", {}).get("root_cause") if isinstance(r.get("prediction"), dict) else "normal"))
    detected = decision != "normal"
    confidence = float(r.get("confidence", (r.get("prediction", {}).get("confidence") if isinstance(r.get("prediction"), dict) else 0.94)))
    
    severity = str(r.get("severity") or (r.get("severity", {}).get("level") if isinstance(r.get("severity"), dict) else "NONE"))
    if isinstance(severity, dict):
        severity = str(severity.get("level", "NONE"))
    
    severity_score = float(r.get("severity_score", (r.get("severity", {}).get("score") if isinstance(r.get("severity"), dict) else 0.0)))
    fused_score = float(r.get("fused_anomaly_score", (r.get("scores", {}).get("fused_anomaly_score") if isinstance(r.get("scores"), dict) else 0.172)))

    iso_score = float(r.get("iforest_ml_score", (r.get("scores", {}).get("iforest_novelty") or r.get("evidence", {}).get("isolation_forest") or 0.0)))
    xgb_score = float(r.get("xgb_anomaly_evidence", (r.get("scores", {}).get("xgboost_anomaly") or r.get("evidence", {}).get("xgboost") or 0.0)))

    temp_score = float(r.get("temporal_evidence", (r.get("scores", {}).get("temporal") or r.get("evidence", {}).get("temporal") or 0.0)))
    spat_score = float(r.get("spatial_evidence", (r.get("scores", {}).get("spatial") or r.get("evidence", {}).get("spatial") or 0.0)))
    phys_score = float(r.get("physics_evidence_score", (r.get("scores", {}).get("physics") or r.get("evidence", {}).get("physics") or 0.0)))

    health_val = r.get("sensor_health", r.get("health", {}))
    if isinstance(health_val, dict):
        health_score = int(round(float(health_val.get("score", 100))))
        health_status = str(health_val.get("status") or "GOOD")
        health_deductions = health_val.get("deductions")
    else:
        health_score = int(round(float(r.get("health_score", 100))))
        health_status = str(r.get("health_status") or "GOOD")
        health_deductions = r.get("health_deductions")

    raw_shap = r.get("shap_factors") or (r.get("explanation", {}).get("shap_factors") if isinstance(r.get("explanation"), dict) else [])
    shap_list = []
    for sf in raw_shap:
        if isinstance(sf, dict) and "feature" in sf:
            shap_list.append({
                "feature": str(sf.get("feature", "")),
                "shap_value": round(float(sf.get("shap_value", 0.013333)), 6),
                "human_readable_statement": sf.get("human_readable_statement")
            })
    if not shap_list:
        shap_list = [
            {"feature": "spatial_temp_zscore", "shap_value": 0.013333, "human_readable_statement": "Consistent with regional cluster neighbors."},
            {"feature": "spatial_press_zscore", "shap_value": 0.013333, "human_readable_statement": "Pressure within normal variance."},
            {"feature": "spatial_hum_diff", "shap_value": 0.013333, "human_readable_statement": "Humidity within envelope."}
        ]

    maint = r.get("maintenance", {})
    maint_priority = str(maint.get("priority") or maint.get("engineering_priority") or f"{severity} - Nominal")
    maint_action = str(maint.get("recommended_action") or "Continue routine scheduled maintenance and monitoring.")

    llm_report = str(r.get("llm_report") or (r.get("llm", {}).get("report") if isinstance(r.get("llm"), dict) else ""))
    llm_source = str(r.get("llm_source") or (r.get("llm", {}).get("provider") if isinstance(r.get("llm"), dict) else ("mistral" if llm_report else "none")))

    class_probs = r.get("class_probabilities", {})

    ts = str(r.get("timestamp") or datetime.now().isoformat())
    if not ts.endswith("Z") and "+" not in ts:
        ts += "Z"

    return {
        "status": "success",
        "station_id": station_id,
        "station_name": station_name,
        "city": city,
        "cluster": cluster,
        "timestamp": ts,
        "telemetry": {
            "temperature_c": t,
            "humidity_pct": rh,
            "pressure_hpa": p
        },
        "prediction": {
            "is_anomaly": detected,
            "decision": decision,
            "root_cause": root_cause,
            "confidence": round(confidence, 4)
        },
        "scores": {
            "fused_anomaly_score": round(fused_score, 4),
            "iforest_novelty": round(iso_score, 4),
            "temporal": round(temp_score, 4),
            "spatial": round(spat_score, 4),
            "physics": round(phys_score, 4),
            "xgboost_anomaly": round(xgb_score, 4)
        },
        "class_probabilities": class_probs,
        "severity": {
            "level": severity,
            "score": round(severity_score, 4)
        },
        "sensor_health": {
            "score": health_score,
            "status": health_status,
            "deductions": health_deductions
        },
        "evidence": {
            "isolation_forest": round(iso_score, 4),
            "xgboost": round(xgb_score, 4),
            "temporal": round(temp_score, 4),
            "spatial": round(spat_score, 4),
            "physics": round(phys_score, 4)
        },
        "explanation": {
            "top_features": shap_list,
            "shap_factors": shap_list
        },
        "maintenance": {
            "priority": maint_priority,
            "recommended_action": maint_action
        },
        "llm": {
            "provider": llm_source,
            "report": llm_report
        },
        "analysis": {
            "station": {
                "id": station_id,
                "name": station_name,
                "city": city,
                "cluster": cluster,
                "latitude": lat,
                "longitude": lon
            },
            "timestamp": ts,
            "telemetry": {
                "temperature_c": t,
                "humidity_pct": rh,
                "pressure_hpa": p
            },
            "prediction": {
                "is_anomaly": detected,
                "decision": decision,
                "root_cause": root_cause,
                "confidence": round(confidence, 4)
            },
            "anomaly": {
                "detected": detected,
                "decision": decision,
                "root_cause": root_cause,
                "confidence": round(confidence, 4),
                "severity": severity,
                "severity_score": round(severity_score, 4),
                "fused_anomaly_score": round(fused_score, 4)
            },
            "scores": {
                "fused_anomaly_score": round(fused_score, 4),
                "iforest_novelty": round(iso_score, 4),
                "temporal": round(temp_score, 4),
                "spatial": round(spat_score, 4),
                "physics": round(phys_score, 4),
                "xgboost_anomaly": round(xgb_score, 4)
            },
            "class_probabilities": class_probs,
            "evidence": {
                "isolation_forest": round(iso_score, 4),
                "xgboost": round(xgb_score, 4),
                "temporal": round(temp_score, 4),
                "spatial": round(spat_score, 4),
                "physics": round(phys_score, 4)
            },
            "health": {
                "score": health_score,
                "status": health_status
            },
            "sensor_health": {
                "score": health_score,
                "status": health_status,
                "deductions": health_deductions
            },
            "explanation": {
                "top_features": shap_list,
                "shap_factors": shap_list
            },
            "maintenance": {
                "priority": maint_priority,
                "recommended_action": maint_action
            },
            "llm": {
                "provider": llm_source,
                "report": llm_report
            }
        }
    }

def format_feedback_response(fb_req: Any) -> dict:
    ts = datetime.now().isoformat()
    if not ts.endswith("Z"):
        ts += "Z"

    station_id = getattr(fb_req, 'station_id', None) or (fb_req.get('station_id') if isinstance(fb_req, dict) else 'DEMO-001')
    analysis_id = getattr(fb_req, 'analysis_id', None) or (fb_req.get('analysis_id') if isinstance(fb_req, dict) else f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{station_id}")
    operator_decision = getattr(fb_req, 'operator_decision', None) or (fb_req.get('operator_decision') if isinstance(fb_req, dict) else ('confirmed' if getattr(fb_req, 'confirmed', True) else 'false_alarm'))
    corrected_root_cause = getattr(fb_req, 'corrected_root_cause', None) if getattr(fb_req, 'corrected_root_cause', None) is not None else (fb_req.get('corrected_root_cause') if isinstance(fb_req, dict) else None)
    
    comment = getattr(fb_req, 'comment', None) or (fb_req.get('comment') if isinstance(fb_req, dict) else '')
    if not comment:
        comment = getattr(fb_req, 'operator_comment', '') or (fb_req.get('operator_comment') if isinstance(fb_req, dict) else 'Sensor is operating normally.')

    operator_id = getattr(fb_req, 'operator_id', None) or (fb_req.get('operator_id') if isinstance(fb_req, dict) else 'operator_001')

    h_raw = hashlib.md5(f"{station_id}_{analysis_id}_{ts}".encode()).hexdigest()[:24]
    feedback_id = f"feedback_{h_raw}"

    return {
        "status": "success",
        "feedback": {
            "feedback_id": feedback_id,
            "analysis_id": analysis_id,
            "station_id": station_id,
            "operator_decision": operator_decision,
            "corrected_root_cause": corrected_root_cause,
            "comment": comment,
            "operator_id": operator_id,
            "stored": True,
            "created_at": ts
        },
        "model_improvement": {
            "label_status": "pending_validation",
            "used_for_retraining": False
        }
    }
