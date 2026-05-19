import psycopg2
from psycopg2.extras import Json, RealDictCursor

from config import DATABASE_URL


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def init_tables():
    sql = """
    CREATE TABLE IF NOT EXISTS budget_exercises (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL UNIQUE,
        label TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'Inactif'
    );

    CREATE TABLE IF NOT EXISTS budget_types (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_fr TEXT NOT NULL,
        name_ar TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'Actif'
    );

    CREATE TABLE IF NOT EXISTS annual_budgets (
        id SERIAL PRIMARY KEY,
        exercise_id INTEGER NOT NULL REFERENCES budget_exercises(id) ON DELETE CASCADE,
        visa_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'Brouillon',
        observation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (exercise_id)
    );

    CREATE TABLE IF NOT EXISTS annual_budget_lines (
        id SERIAL PRIMARY KEY,
        annual_budget_id INTEGER NOT NULL REFERENCES annual_budgets(id) ON DELETE CASCADE,
        budget_type_id INTEGER NOT NULL,
        amount NUMERIC(18, 2) NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        username VARCHAR(100),
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(100),
        version INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS commandes (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) NOT NULL UNIQUE,
        exercice_id INTEGER,
        budget_label_id INTEGER,
        statut VARCHAR(50) DEFAULT 'Brouillon',
        attributed_amount_ht NUMERIC(18, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devis (
        id SERIAL PRIMARY KEY,
        bc_id INTEGER NOT NULL,
        supplier_id INTEGER NOT NULL,
        reference VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        amount_ht NUMERIC(18, 2) NOT NULL,
        amount_ttc NUMERIC(18, 2) NOT NULL,
        tva_amount NUMERIC(18, 2) DEFAULT 0,
        tva_rate NUMERIC(5, 2) DEFAULT 20,
        document_path TEXT,
        status VARCHAR(50) DEFAULT 'Reçu',
        observation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS engagements (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) NOT NULL UNIQUE,
        exercice_id INTEGER NOT NULL,
        libelle_id INTEGER NOT NULL,
        bc_id INTEGER,
        amount NUMERIC(18, 2) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Brouillon',
        observation TEXT,
        is_partial BOOLEAN DEFAULT FALSE,
        parent_id INTEGER,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS executions (
        id SERIAL PRIMARY KEY,
        bc_id INTEGER NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(50) DEFAULT 'Partielle',
        quantite NUMERIC(18, 2) DEFAULT 0,
        observation TEXT,
        status VARCHAR(50) DEFAULT 'En cours',
        advancement_pct NUMERIC(5, 2) DEFAULT 0,
        date_prevue DATE,
        reserved_amount NUMERIC(18, 2) DEFAULT 0,
        service_fait BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receptions (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER NOT NULL,
        reception_type VARCHAR(50) DEFAULT 'Provisoire',
        quantite NUMERIC(18, 2) DEFAULT 0,
        conformite VARCHAR(50) DEFAULT 'Conforme',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS penalites (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER NOT NULL,
        amount NUMERIC(18, 2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) DEFAULT 'Appliquée',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ordonnances (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) NOT NULL UNIQUE,
        bc_id INTEGER NOT NULL,
        engagement_id INTEGER,
        amount_ht NUMERIC(18, 2) NOT NULL,
        amount_ttc NUMERIC(18, 2) NOT NULL,
        tva_amount NUMERIC(18, 2) DEFAULT 0,
        net_amount NUMERIC(18, 2) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Brouillon',
        observation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS paiements (
        id SERIAL PRIMARY KEY,
        reference VARCHAR(100) NOT NULL UNIQUE,
        ordonnance_id INTEGER NOT NULL,
        fournisseur_id INTEGER NOT NULL,
        amount NUMERIC(18, 2) NOT NULL,
        date DATE NOT NULL,
        mode_paiement VARCHAR(50),
        status VARCHAR(50) DEFAULT 'En attente',
        observation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rejets_paiements (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS virements (
        id SERIAL PRIMARY KEY,
        source_allocation_id INTEGER NOT NULL,
        target_allocation_id INTEGER NOT NULL,
        amount NUMERIC(18, 2) NOT NULL,
        date DATE NOT NULL,
        justification TEXT,
        status VARCHAR(50) DEFAULT 'Brouillon',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fournisseurs (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        beneficiary_type_id INTEGER,
        status VARCHAR(20) DEFAULT 'Actif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        profile_id VARCHAR(50) DEFAULT 'budget',
        status VARCHAR(20) DEFAULT 'Actif',
        password_hash VARCHAR(255),
        permissions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    seed_types = """
    INSERT INTO budget_types (code, name_fr, name_ar, status) VALUES
        ('FCT', 'Fonctionnement', 'التسيير', 'Actif'),
        ('INV', 'Investissement', 'الاستثمار', 'Actif')
    ON CONFLICT (code) DO NOTHING;
    """
    with get_conn() as conn:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(sql)
            cur.execute(seed_types)


def fetch_all(query, params=None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            return cur.fetchall()


def fetch_one(query, params=None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            return cur.fetchone()


def execute(query, params=None):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
        conn.commit()


def update_annual_budget_lines(budget_id, visa_date, status, observation, lines):
    """Replace header + lines in one transaction."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE annual_budgets
                SET visa_date = %s, status = %s, observation = %s
                WHERE id = %s
                """,
                (visa_date, status, observation, budget_id),
            )
            cur.execute(
                "DELETE FROM annual_budget_lines WHERE annual_budget_id = %s",
                (budget_id,),
            )
            for line in lines:
                tid = int(line.get("budget_type_id") or line.get("type_id") or 0)
                amount = float(line.get("amount") or 0)
                cur.execute(
                    """
                    INSERT INTO annual_budget_lines (annual_budget_id, budget_type_id, amount)
                    VALUES (%s, %s, %s)
                    """,
                    (budget_id, tid, amount),
                )
        conn.commit()
