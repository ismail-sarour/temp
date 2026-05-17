from flask import Blueprint, request, jsonify
from db import fetch_all, fetch_one, execute

entities_bp = Blueprint("entities_api", __name__)

# Commandes (BC)
@entities_bp.route("/commandes", methods=["GET"])
def get_commandes():
    try:
        query = "SELECT * FROM commandes ORDER BY created_at DESC"
        commandes = fetch_all(query)
        return jsonify(commandes)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/commandes", methods=["POST"])
def create_commande():
    try:
        data = request.get_json()
        query = """
        INSERT INTO commandes (reference, exercice_id, budget_label_id, statut, attributed_amount_ht)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("exercice_id"),
            data.get("budget_label_id"),
            data.get("statut", "Brouillon"),
            data.get("attributed_amount_ht", 0)
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/commandes/<int:id>", methods=["PUT"])
def update_commande(id):
    try:
        data = request.get_json()
        query = """
        UPDATE commandes
        SET reference = %s, exercice_id = %s, budget_label_id = %s, statut = %s,
            attributed_amount_ht = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("exercice_id"),
            data.get("budget_label_id"),
            data.get("statut"),
            data.get("attributed_amount_ht"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/commandes/<int:id>", methods=["DELETE"])
def delete_commande(id):
    try:
        query = "DELETE FROM commandes WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Devis
@entities_bp.route("/devis", methods=["GET"])
def get_devis():
    try:
        query = "SELECT * FROM devis ORDER BY created_at DESC"
        devis = fetch_all(query)
        return jsonify(devis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/devis", methods=["POST"])
def create_devis():
    try:
        data = request.get_json()
        query = """
        INSERT INTO devis (bc_id, supplier_id, reference, date, amount_ht, amount_ttc, tva_amount, tva_rate, document_path, status, observation)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("bc_id"),
            data.get("supplier_id"),
            data.get("reference"),
            data.get("date"),
            data.get("amount_ht"),
            data.get("amount_ttc"),
            data.get("tva_amount", 0),
            data.get("tva_rate", 20),
            data.get("document_path"),
            data.get("status", "Reçu"),
            data.get("observation")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/devis/<int:id>", methods=["PUT"])
def update_devis(id):
    try:
        data = request.get_json()
        query = """
        UPDATE devis
        SET bc_id = %s, supplier_id = %s, reference = %s, date = %s, amount_ht = %s,
            amount_ttc = %s, tva_amount = %s, tva_rate = %s, document_path = %s,
            status = %s, observation = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("bc_id"),
            data.get("supplier_id"),
            data.get("reference"),
            data.get("date"),
            data.get("amount_ht"),
            data.get("amount_ttc"),
            data.get("tva_amount"),
            data.get("tva_rate"),
            data.get("document_path"),
            data.get("status"),
            data.get("observation"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/devis/<int:id>", methods=["DELETE"])
def delete_devis(id):
    try:
        query = "DELETE FROM devis WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Engagements
@entities_bp.route("/engagements", methods=["GET"])
def get_engagements():
    try:
        query = "SELECT * FROM engagements ORDER BY created_at DESC"
        engagements = fetch_all(query)
        return jsonify(engagements)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/engagements", methods=["POST"])
def create_engagement():
    try:
        data = request.get_json()
        query = """
        INSERT INTO engagements (reference, exercice_id, libelle_id, bc_id, amount, date, status, observation, is_partial, parent_id, created_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("exercice_id"),
            data.get("libelle_id"),
            data.get("bc_id"),
            data.get("amount"),
            data.get("date"),
            data.get("status", "Brouillon"),
            data.get("observation"),
            data.get("is_partial", False),
            data.get("parent_id"),
            data.get("created_by")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/engagements/<int:id>", methods=["PUT"])
def update_engagement(id):
    try:
        data = request.get_json()
        query = """
        UPDATE engagements
        SET reference = %s, exercice_id = %s, libelle_id = %s, bc_id = %s, amount = %s,
            date = %s, status = %s, observation = %s, is_partial = %s, parent_id = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("exercice_id"),
            data.get("libelle_id"),
            data.get("bc_id"),
            data.get("amount"),
            data.get("date"),
            data.get("status"),
            data.get("observation"),
            data.get("is_partial"),
            data.get("parent_id"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/engagements/<int:id>", methods=["DELETE"])
def delete_engagement(id):
    try:
        query = "DELETE FROM engagements WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Executions
@entities_bp.route("/executions", methods=["GET"])
def get_executions():
    try:
        query = "SELECT * FROM executions ORDER BY created_at DESC"
        executions = fetch_all(query)
        return jsonify(executions)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/executions", methods=["POST"])
def create_execution():
    try:
        data = request.get_json()
        query = """
        INSERT INTO executions (bc_id, date, type, quantite, observation, status, advancement_pct, date_prevue, reserved_amount, service_fait)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("bc_id"),
            data.get("date"),
            data.get("type", "Partielle"),
            data.get("quantite", 0),
            data.get("observation"),
            data.get("status", "En cours"),
            data.get("advancement_pct", 0),
            data.get("date_prevue"),
            data.get("reserved_amount", 0),
            data.get("service_fait", False)
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/executions/<int:id>", methods=["PUT"])
def update_execution(id):
    try:
        data = request.get_json()
        query = """
        UPDATE executions
        SET bc_id = %s, date = %s, type = %s, quantite = %s, observation = %s,
            status = %s, advancement_pct = %s, date_prevue = %s, reserved_amount = %s,
            service_fait = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("bc_id"),
            data.get("date"),
            data.get("type"),
            data.get("quantite"),
            data.get("observation"),
            data.get("status"),
            data.get("advancement_pct"),
            data.get("date_prevue"),
            data.get("reserved_amount"),
            data.get("service_fait"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/executions/<int:id>", methods=["DELETE"])
def delete_execution(id):
    try:
        query = "DELETE FROM executions WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Ordonnances
@entities_bp.route("/ordonnances", methods=["GET"])
def get_ordonnances():
    try:
        query = "SELECT * FROM ordonnances ORDER BY created_at DESC"
        ordonnances = fetch_all(query)
        return jsonify(ordonnances)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/ordonnances", methods=["POST"])
def create_ordonnance():
    try:
        data = request.get_json()
        query = """
        INSERT INTO ordonnances (reference, bc_id, engagement_id, amount_ht, amount_ttc, tva_amount, net_amount, date, status, observation)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("bc_id"),
            data.get("engagement_id"),
            data.get("amount_ht"),
            data.get("amount_ttc"),
            data.get("tva_amount", 0),
            data.get("net_amount"),
            data.get("date"),
            data.get("status", "Brouillon"),
            data.get("observation")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/ordonnances/<int:id>", methods=["PUT"])
def update_ordonnance(id):
    try:
        data = request.get_json()
        query = """
        UPDATE ordonnances
        SET reference = %s, bc_id = %s, engagement_id = %s, amount_ht = %s, amount_ttc = %s,
            tva_amount = %s, net_amount = %s, date = %s, status = %s, observation = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("bc_id"),
            data.get("engagement_id"),
            data.get("amount_ht"),
            data.get("amount_ttc"),
            data.get("tva_amount"),
            data.get("net_amount"),
            data.get("date"),
            data.get("status"),
            data.get("observation"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/ordonnances/<int:id>", methods=["DELETE"])
def delete_ordonnance(id):
    try:
        query = "DELETE FROM ordonnances WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Paiements
@entities_bp.route("/paiements", methods=["GET"])
def get_paiements():
    try:
        query = "SELECT * FROM paiements ORDER BY created_at DESC"
        paiements = fetch_all(query)
        return jsonify(paiements)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/paiements", methods=["POST"])
def create_paiement():
    try:
        data = request.get_json()
        query = """
        INSERT INTO paiements (reference, ordonnance_id, fournisseur_id, amount, date, mode_paiement, status, observation)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("ordonnance_id"),
            data.get("fournisseur_id"),
            data.get("amount"),
            data.get("date"),
            data.get("mode_paiement"),
            data.get("status", "En attente"),
            data.get("observation")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/paiements/<int:id>", methods=["PUT"])
def update_paiement(id):
    try:
        data = request.get_json()
        query = """
        UPDATE paiements
        SET reference = %s, ordonnance_id = %s, fournisseur_id = %s, amount = %s,
            date = %s, mode_paiement = %s, status = %s, observation = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("reference"),
            data.get("ordonnance_id"),
            data.get("fournisseur_id"),
            data.get("amount"),
            data.get("date"),
            data.get("mode_paiement"),
            data.get("status"),
            data.get("observation"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/paiements/<int:id>", methods=["DELETE"])
def delete_paiement(id):
    try:
        query = "DELETE FROM paiements WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Virements
@entities_bp.route("/virements", methods=["GET"])
def get_virements():
    try:
        query = "SELECT * FROM virements ORDER BY created_at DESC"
        virements = fetch_all(query)
        return jsonify(virements)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/virements", methods=["POST"])
def create_virement():
    try:
        data = request.get_json()
        query = """
        INSERT INTO virements (source_allocation_id, target_allocation_id, amount, date, justification, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("source_allocation_id"),
            data.get("target_allocation_id"),
            data.get("amount"),
            data.get("date"),
            data.get("justification"),
            data.get("status", "Brouillon")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/virements/<int:id>", methods=["PUT"])
def update_virement(id):
    try:
        data = request.get_json()
        query = """
        UPDATE virements
        SET source_allocation_id = %s, target_allocation_id = %s, amount = %s,
            date = %s, justification = %s, status = %s
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("source_allocation_id"),
            data.get("target_allocation_id"),
            data.get("amount"),
            data.get("date"),
            data.get("justification"),
            data.get("status"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/virements/<int:id>", methods=["DELETE"])
def delete_virement(id):
    try:
        query = "DELETE FROM virements WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Fournisseurs
@entities_bp.route("/fournisseurs", methods=["GET"])
def get_fournisseurs():
    try:
        query = "SELECT * FROM fournisseurs ORDER BY created_at DESC"
        fournisseurs = fetch_all(query)
        return jsonify(fournisseurs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/fournisseurs", methods=["POST"])
def create_fournisseur():
    try:
        data = request.get_json()
        query = """
        INSERT INTO fournisseurs (company_name, contact_person, email, phone, address, beneficiary_type_id, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING *
        """
        params = (
            data.get("company_name"),
            data.get("contact_person"),
            data.get("email"),
            data.get("phone"),
            data.get("address"),
            data.get("beneficiary_type_id"),
            data.get("status", "Actif")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/fournisseurs/<int:id>", methods=["PUT"])
def update_fournisseur(id):
    try:
        data = request.get_json()
        query = """
        UPDATE fournisseurs
        SET company_name = %s, contact_person = %s, email = %s, phone = %s,
            address = %s, beneficiary_type_id = %s, status = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING *
        """
        params = (
            data.get("company_name"),
            data.get("contact_person"),
            data.get("email"),
            data.get("phone"),
            data.get("address"),
            data.get("beneficiary_type_id"),
            data.get("status"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/fournisseurs/<int:id>", methods=["DELETE"])
def delete_fournisseur(id):
    try:
        query = "DELETE FROM fournisseurs WHERE id = %s RETURNING *"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Users
@entities_bp.route("/users", methods=["GET"])
def get_users():
    try:
        query = "SELECT id, username, email, full_name, profile_id, status, permissions, created_at, updated_at FROM users ORDER BY created_at DESC"
        users = fetch_all(query)
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/users", methods=["POST"])
def create_user():
    try:
        data = request.get_json()
        query = """
        INSERT INTO users (username, email, full_name, profile_id, status, password_hash, permissions)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id, username, email, full_name, profile_id, status, permissions, created_at, updated_at
        """
        params = (
            data.get("username"),
            data.get("email"),
            data.get("full_name"),
            data.get("profile_id", "budget"),
            data.get("status", "Actif"),
            data.get("password_hash"),
            data.get("permissions")
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/users/<int:id>", methods=["PUT"])
def update_user(id):
    try:
        data = request.get_json()
        query = """
        UPDATE users
        SET username = %s, email = %s, full_name = %s, profile_id = %s, status = %s,
            password_hash = %s, permissions = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        RETURNING id, username, email, full_name, profile_id, status, permissions, created_at, updated_at
        """
        params = (
            data.get("username"),
            data.get("email"),
            data.get("full_name"),
            data.get("profile_id"),
            data.get("status"),
            data.get("password_hash"),
            data.get("permissions"),
            id
        )
        result = fetch_one(query, params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@entities_bp.route("/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    try:
        query = "DELETE FROM users WHERE id = %s RETURNING id, username, email, full_name"
        result = fetch_one(query, (id,))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
