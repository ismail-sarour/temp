from flask import Blueprint, request, jsonify
from db import fetch_all, fetch_one, execute

audit_bp = Blueprint("audit_api", __name__)

@audit_bp.route("/audit-logs", methods=["GET"])
def get_audit_logs():
    """Get all audit logs with optional filtering."""
    try:
        entity_type = request.args.get("entity_type")
        entity_id = request.args.get("entity_id")
        action = request.args.get("action")
        
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []
        
        if entity_type:
            query += " AND entity_type = %s"
            params.append(entity_type)
        if entity_id:
            query += " AND entity_id = %s"
            params.append(entity_id)
        if action:
            query += " AND action = %s"
            params.append(action)
            
        query += " ORDER BY timestamp DESC"
        
        logs = fetch_all(query, params)
        return jsonify(logs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@audit_bp.route("/audit-logs", methods=["POST"])
def create_audit_log():
    """Create a new audit log entry."""
    try:
        data = request.get_json()
        query = """
        INSERT INTO audit_logs (action, entity_type, entity_id, user, details, ip_address, user_agent)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("action"),
            data.get("entity_type"),
            data.get("entity_id"),
            data.get("user"),
            data.get("details"),
            data.get("ip_address", "N/A"),
            data.get("user_agent", "N/A")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
