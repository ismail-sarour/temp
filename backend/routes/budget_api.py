from flask import Blueprint, jsonify, request

from db import execute, fetch_all, fetch_one, update_annual_budget_lines

bp = Blueprint("budget_api", __name__)

# ─── Mapping FR <-> DB ────────────────────────────────────────────────────────

EX_STATUS_TO_DB = {
    "Actif":    "active",
    "Inactif":  "inactive",
    "Clôturé":  "closed",
}
EX_STATUS_FROM_DB = {v: k for k, v in EX_STATUS_TO_DB.items()}

BUD_STATUS_TO_DB = {
    "Brouillon": "draft",
    "Validé":    "validated",
    "Clôturé":   "closed",
}
BUD_STATUS_FROM_DB = {v: k for k, v in BUD_STATUS_TO_DB.items()}

_EX_STATUSES  = tuple(EX_STATUS_TO_DB.keys())
_BUD_STATUSES = tuple(BUD_STATUS_TO_DB.keys())


def _ex_status_to_db(s):
    return EX_STATUS_TO_DB.get(s, "inactive")

def _ex_status_from_db(s):
    return EX_STATUS_FROM_DB.get(s, s)

def _bud_status_to_db(s):
    return BUD_STATUS_TO_DB.get(s, "draft")

def _bud_status_from_db(s):
    return BUD_STATUS_FROM_DB.get(s, s)


# ─── Serializers ─────────────────────────────────────────────────────────────

def _exercise_to_ui(row):
    d = dict(row)
    d["_id"] = d.pop("id")
    d["status"] = _ex_status_from_db(d["status"])
    return d


def _budget_type_to_ui(row):
    d = dict(row)
    d["_id"] = d.pop("id")
    # budget_types.status est VARCHAR, pas d'enum → pas de mapping nécessaire
    return d


def _annual_budget_payload(budget_id):
    row = fetch_one(
        """
        SELECT id, exercise_id, visa_date::text, status, observation
        FROM annual_budgets WHERE id = %s
        """,
        (budget_id,),
    )
    if not row:
        return None
    lines = fetch_all(
        """
        SELECT budget_type_id AS type_id, amount::float AS amount
        FROM annual_budget_lines
        WHERE annual_budget_id = %s
        ORDER BY id
        """,
        (budget_id,),
    )
    total = sum(float(x["amount"] or 0) for x in lines)
    return {
        "_id":         row["id"],
        "exercice_id": row["exercise_id"],
        "visa_date":   row["visa_date"],
        "status":      _bud_status_from_db(row["status"]),
        "observation": row["observation"] or "",
        "lines":       [dict(x) for x in lines],
        "total_amount": total,
    }


def _deactivate_other_active(exercise_id):
    execute(
        """
        UPDATE budget_exercises SET status = 'inactive'
        WHERE id <> %s AND status = 'active'
        """,
        (exercise_id,),
    )


# ─── Exercices ───────────────────────────────────────────────────────────────

@bp.route("/exercises", methods=["GET"])
def list_exercises():
    rows = fetch_all(
        """
        SELECT id, year, label, start_date::text, end_date::text, status
        FROM budget_exercises
        ORDER BY year DESC
        """
    )
    return jsonify([_exercise_to_ui(r) for r in rows])


@bp.route("/exercises", methods=["POST"])
def create_exercise():
    data = request.get_json(silent=True) or {}
    year       = data.get("year")
    label      = (data.get("label") or "").strip()
    start_date = data.get("start_date") or None
    end_date   = data.get("end_date") or None
    status_fr  = data.get("status") or "Inactif"
    if status_fr not in _EX_STATUSES:
        status_fr = "Inactif"

    if year is None or not label:
        return jsonify({"detail": "year et label sont requis."}), 400
    try:
        y = int(year)
    except (TypeError, ValueError):
        return jsonify({"detail": "year doit être un entier."}), 400

    status_db = _ex_status_to_db(status_fr)

    try:
        execute(
            """
            INSERT INTO budget_exercises (year, label, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (y, label, start_date, end_date, status_db),
        )
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            return jsonify({"detail": "Cette année d'exercice existe déjà."}), 400
        return jsonify({"detail": str(e)}), 400

    row = fetch_one(
        "SELECT id, year, label, start_date::text, end_date::text, status FROM budget_exercises WHERE year = %s",
        (y,),
    )
    if status_db == "active" and row:
        _deactivate_other_active(row["id"])
        execute(
            "UPDATE budget_exercises SET status = 'active' WHERE id = %s",
            (row["id"],),
        )
        row = fetch_one(
            "SELECT id, year, label, start_date::text, end_date::text, status FROM budget_exercises WHERE id = %s",
            (row["id"],),
        )
    return jsonify(_exercise_to_ui(row)), 201


@bp.route("/exercises/<int:exercise_id>", methods=["PUT"])
def update_exercise(exercise_id):
    data       = request.get_json(silent=True) or {}
    label      = (data.get("label") or "").strip()
    start_date = data.get("start_date")
    end_date   = data.get("end_date")
    status_fr  = data.get("status")
    year       = data.get("year")

    row = fetch_one("SELECT id, year FROM budget_exercises WHERE id = %s", (exercise_id,))
    if not row:
        return jsonify({"detail": "Exercice introuvable."}), 404
    if not label:
        return jsonify({"detail": "label est requis."}), 400

    y = row["year"]
    if year is not None:
        try:
            y = int(year)
        except (TypeError, ValueError):
            return jsonify({"detail": "year invalide."}), 400
        other = fetch_one(
            "SELECT id FROM budget_exercises WHERE year = %s AND id <> %s",
            (y, exercise_id),
        )
        if other:
            return jsonify({"detail": "Cette année est déjà utilisée par un autre exercice."}), 400

    if status_fr is not None and status_fr not in _EX_STATUSES:
        return jsonify({"detail": "Statut invalide."}), 400

    status_db = _ex_status_to_db(status_fr) if status_fr else None

    if status_db == "active":
        _deactivate_other_active(exercise_id)

    execute(
        """
        UPDATE budget_exercises
        SET year = %s, label = %s, start_date = %s, end_date = %s,
            status = COALESCE(%s, status)
        WHERE id = %s
        """,
        (y, label, start_date, end_date, status_db, exercise_id),
    )

    row = fetch_one(
        "SELECT id, year, label, start_date::text, end_date::text, status FROM budget_exercises WHERE id = %s",
        (exercise_id,),
    )
    return jsonify(_exercise_to_ui(row))


@bp.route("/exercises/<int:exercise_id>", methods=["DELETE"])
def delete_exercise(exercise_id):
    ex = fetch_one("SELECT id FROM budget_exercises WHERE id = %s", (exercise_id,))
    if not ex:
        return jsonify({"detail": "Exercice introuvable."}), 404
    execute("DELETE FROM budget_exercises WHERE id = %s", (exercise_id,))
    return "", 204


# ─── Types de budget ─────────────────────────────────────────────────────────

@bp.route("/budget-types", methods=["GET"])
def list_budget_types():
    rows = fetch_all(
        "SELECT id, code, name_fr, name_ar, status FROM budget_types ORDER BY code"
    )
    return jsonify([_budget_type_to_ui(r) for r in rows])


@bp.route("/budget-types", methods=["POST"])
def create_budget_type():
    data    = request.get_json(silent=True) or {}
    code    = (data.get("code") or "").strip().upper()
    name_fr = (data.get("name_fr") or "").strip()
    name_ar = (data.get("name_ar") or "").strip() or None
    status  = data.get("status") or "Actif"
    if status not in ("Actif", "Inactif"):
        status = "Actif"
    if not code or not name_fr:
        return jsonify({"detail": "code et name_fr sont requis."}), 400
    try:
        execute(
            "INSERT INTO budget_types (code, name_fr, name_ar, status) VALUES (%s, %s, %s, %s)",
            (code, name_fr, name_ar, status),
        )
    except Exception as e:
        if "unique" in str(e).lower():
            return jsonify({"detail": "Ce code existe déjà."}), 400
        return jsonify({"detail": str(e)}), 400
    row = fetch_one(
        "SELECT id, code, name_fr, name_ar, status FROM budget_types WHERE code = %s",
        (code,),
    )
    return jsonify(_budget_type_to_ui(row)), 201


@bp.route("/budget-types/<int:type_id>", methods=["PUT"])
def update_budget_type(type_id):
    data    = request.get_json(silent=True) or {}
    code    = (data.get("code") or "").strip().upper()
    name_fr = (data.get("name_fr") or "").strip()
    name_ar = (data.get("name_ar") or "").strip() or None
    status  = data.get("status")
    if not code or not name_fr:
        return jsonify({"detail": "code et name_fr sont requis."}), 400
    if status is not None and status not in ("Actif", "Inactif"):
        return jsonify({"detail": "Statut invalide."}), 400

    other = fetch_one(
        "SELECT id FROM budget_types WHERE code = %s AND id <> %s",
        (code, type_id),
    )
    if other:
        return jsonify({"detail": "Ce code est déjà utilisé."}), 400

    execute(
        """
        UPDATE budget_types
        SET code = %s, name_fr = %s, name_ar = %s, status = COALESCE(%s, status)
        WHERE id = %s
        """,
        (code, name_fr, name_ar, status, type_id),
    )
    row = fetch_one(
        "SELECT id, code, name_fr, name_ar, status FROM budget_types WHERE id = %s",
        (type_id,),
    )
    if not row:
        return jsonify({"detail": "Type introuvable."}), 404
    return jsonify(_budget_type_to_ui(row))


@bp.route("/budget-types/<int:type_id>", methods=["DELETE"])
def delete_budget_type(type_id):
    row = fetch_one("SELECT id FROM budget_types WHERE id = %s", (type_id,))
    if not row:
        return jsonify({"detail": "Type introuvable."}), 404
    execute("DELETE FROM budget_types WHERE id = %s", (type_id,))
    return "", 204


# ─── Budgets annuels ─────────────────────────────────────────────────────────

@bp.route("/annual-budgets", methods=["GET"])
def list_annual_budgets():
    rows = fetch_all(
        """
        SELECT id, exercise_id, visa_date::text, status, observation
        FROM annual_budgets
        ORDER BY id DESC
        """
    )
    return jsonify([_annual_budget_payload(r["id"]) for r in rows])


@bp.route("/annual-budgets", methods=["POST"])
def create_annual_budget():
    data        = request.get_json(silent=True) or {}
    exercise_id = data.get("exercise_id")
    visa_date   = data.get("visa_date")
    status_fr   = data.get("status") or "Brouillon"
    observation = data.get("observation") or ""
    lines       = data.get("lines") or []

    if not exercise_id or not visa_date:
        return jsonify({"detail": "exercise_id et visa_date sont requis."}), 400

    ex = fetch_one("SELECT id FROM budget_exercises WHERE id = %s", (int(exercise_id),))
    if not ex:
        return jsonify({"detail": "Exercice introuvable."}), 400

    existing = fetch_one(
        "SELECT id FROM annual_budgets WHERE exercise_id = %s", (int(exercise_id),)
    )
    if existing:
        return jsonify({"detail": "Un budget existe déjà pour cet exercice."}), 400

    status_db = _bud_status_to_db(status_fr)

    execute(
        """
        INSERT INTO annual_budgets (exercise_id, visa_date, status, observation)
        VALUES (%s, %s, %s, %s)
        """,
        (int(exercise_id), visa_date, status_db, observation),
    )
    row = fetch_one(
        "SELECT id FROM annual_budgets WHERE exercise_id = %s ORDER BY id DESC LIMIT 1",
        (int(exercise_id),),
    )
    budget_id = row["id"]

    for line in lines:
        tid    = int(line.get("budget_type_id") or line.get("type_id") or 0)
        amount = float(line.get("amount") or 0)
        execute(
            """
            INSERT INTO annual_budget_lines (annual_budget_id, budget_type_id, amount)
            VALUES (%s, %s, %s)
            """,
            (budget_id, tid, amount),
        )

    return jsonify(_annual_budget_payload(budget_id)), 201


@bp.route("/annual-budgets/<int:budget_id>", methods=["PUT"])
def update_annual_budget(budget_id):
    data        = request.get_json(silent=True) or {}
    visa_date   = data.get("visa_date")
    status_fr   = data.get("status") or "Brouillon"
    observation = data.get("observation") or ""
    lines       = data.get("lines") or []

    row = fetch_one("SELECT id, status FROM annual_budgets WHERE id = %s", (budget_id,))
    if not row:
        return jsonify({"detail": "Budget introuvable."}), 404
    if row["status"] == "validated":
        return jsonify({"detail": "Un budget validé ne peut pas être modifié."}), 400
    if not visa_date:
        return jsonify({"detail": "visa_date est requis."}), 400

    status_db = _bud_status_to_db(status_fr)
    update_annual_budget_lines(budget_id, visa_date, status_db, observation, lines)
    return jsonify(_annual_budget_payload(budget_id))


@bp.route("/annual-budgets/<int:budget_id>", methods=["DELETE"])
def delete_annual_budget(budget_id):
    row = fetch_one("SELECT id, status FROM annual_budgets WHERE id = %s", (budget_id,))
    if not row:
        return jsonify({"detail": "Budget introuvable."}), 404
    if row["status"] == "validated":
        return jsonify({"detail": "Un budget validé ne peut pas être supprimé."}), 400
    execute("DELETE FROM annual_budgets WHERE id = %s", (budget_id,))
    return "", 204


# ─── Dashboard ───────────────────────────────────────────────────────────────

@bp.route("/dashboard/summary", methods=["GET"])
def dashboard_summary():
    rows = fetch_all(
        """
        SELECT
            e.year AS year,
            e.label AS label,
            COALESCE(SUM(l.amount), 0)::float AS total_amount,
            0::float AS total_consumed,
            COALESCE(SUM(l.amount), 0)::float AS total_remaining,
            CASE
                WHEN COALESCE(MAX(CASE WHEN ab.status = 'validated' THEN 1 ELSE 0 END), 0) = 1
                THEN 'validated'
                ELSE 'draft'
            END AS status
        FROM budget_exercises e
        LEFT JOIN annual_budgets ab ON ab.exercise_id = e.id
        LEFT JOIN annual_budget_lines l ON l.annual_budget_id = ab.id
        GROUP BY e.id, e.year, e.label
        ORDER BY e.year DESC
        """
    )
    return jsonify([
        {
            "year":            r["year"],
            "label":           r["label"],
            "total_amount":    r["total_amount"],
            "total_consumed":  r["total_consumed"],
            "total_remaining": r["total_remaining"],
            "status":          _bud_status_from_db(r["status"]),
        }
        for r in rows
    ])