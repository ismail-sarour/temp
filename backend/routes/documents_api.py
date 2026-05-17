from flask import Blueprint, request, jsonify
from db import fetch_all, fetch_one, execute

documents_bp = Blueprint("documents_api", __name__)

@documents_bp.route("/documents", methods=["GET"])
def get_documents():
    """Get all documents with optional filtering by entity."""
    try:
        entity_type = request.args.get("entity_type")
        entity_id = request.args.get("entity_id")
        
        query = "SELECT * FROM documents WHERE 1=1"
        params = []
        
        if entity_type:
            query += " AND entity_type = %s"
            params.append(entity_type)
        if entity_id:
            query += " AND entity_id = %s"
            params.append(entity_id)
            
        query += " ORDER BY uploaded_at DESC"
        
        documents = fetch_all(query, params)
        return jsonify(documents)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@documents_bp.route("/documents", methods=["POST"])
def create_document():
    """Create a new document entry."""
    try:
        data = request.get_json()
        query = """
        INSERT INTO documents (entity_type, entity_id, file_name, file_path, file_size, mime_type, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("entity_type"),
            data.get("entity_id"),
            data.get("file_name"),
            data.get("file_path"),
            data.get("file_size"),
            data.get("mime_type"),
            data.get("uploaded_by")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@documents_bp.route("/documents/<int:id>", methods=["DELETE"])
def delete_document(id):
    """Delete a document."""
    try:
        query = "DELETE FROM documents WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
