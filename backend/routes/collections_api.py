"""Generic JSON collections stored in PostgreSQL (modules 2–17 + shared data)."""
from flask import Blueprint, jsonify, request

from db import fetch_one, upsert_collection

bp = Blueprint("collections_api", __name__)

# Keys managed by dedicated REST APIs (module 1) — not stored in app_collections
RESERVED = frozenset({"exercices", "budgetTypes", "annualBudgets"})


@bp.route("/collections", methods=["GET"])
def list_collection_names():
    from db import fetch_all

    rows = fetch_all("SELECT name FROM app_collections ORDER BY name")
    return jsonify([r["name"] for r in rows])


@bp.route("/collections/<name>", methods=["GET"])
def get_collection(name):
    if name in RESERVED:
        return jsonify({"detail": "Collection réservée — utiliser l'API dédiée."}), 400
    row = fetch_one(
        "SELECT data FROM app_collections WHERE name = %s",
        (name,),
    )
    if not row:
        return jsonify([])
    return jsonify(row["data"] if row["data"] is not None else [])


@bp.route("/collections/<name>", methods=["PUT"])
def put_collection(name):
    if name in RESERVED:
        return jsonify({"detail": "Collection réservée — utiliser l'API dédiée."}), 400
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"detail": "Corps JSON requis."}), 400
    if not isinstance(data, list):
        return jsonify({"detail": "La collection doit être un tableau JSON."}), 400
    upsert_collection(name, data)
    return jsonify(data)
