from flask import Blueprint, request, jsonify
from db import fetch_all, fetch_one, execute

notifications_bp = Blueprint("notifications_api", __name__)

@notifications_bp.route("/notifications", methods=["GET"])
def get_notifications():
    """Get all notifications with optional filtering."""
    try:
        unread_only = request.args.get("unread_only", "false").lower() == "true"
        
        query = "SELECT * FROM notifications"
        if unread_only:
            query += " WHERE read = FALSE"
        query += " ORDER BY date DESC"
        
        notifications = fetch_all(query)
        return jsonify(notifications)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notifications_bp.route("/notifications", methods=["POST"])
def create_notification():
    """Create a new notification."""
    try:
        data = request.get_json()
        query = """
        INSERT INTO notifications (title, message, type)
        VALUES (%s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("title"),
            data.get("message"),
            data.get("type", "info")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notifications_bp.route("/notifications/<int:id>/read", methods=["PUT"])
def mark_notification_read(id):
    """Mark a notification as read."""
    try:
        query = "UPDATE notifications SET read = TRUE WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notifications_bp.route("/notifications/mark-all-read", methods=["PUT"])
def mark_all_notifications_read():
    """Mark all notifications as read."""
    try:
        query = "UPDATE notifications SET read = TRUE RETURNING *"
        results = fetch_all(query)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
