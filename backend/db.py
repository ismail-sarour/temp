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

    CREATE TABLE IF NOT EXISTS app_collections (
        name VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL DEFAULT '[]'::jsonb,
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


def upsert_collection(name, data):
    """Persist a JSON array collection (modules 2–17)."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_collections (name, data)
                VALUES (%s, %s)
                ON CONFLICT (name) DO UPDATE
                SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
                """,
                (name, Json(data)),
            )
        conn.commit()
