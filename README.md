# CASM Dashboard — version intégrée (17 modules UI + PostgreSQL)

## Structure

- `frontend/` — React + Vite (17 modules fonctionnels + tableau de bord)
- `backend/` — Flask + PostgreSQL

## Démarrage

### 1. Base de données

Créer la base `casm_db` et configurer `backend/.env` :

```
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/casm_db
```

Les tables sont créées au démarrage du backend (`init_tables()`).

### 2. Backend (port 5000)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 3. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Le proxy Vite redirige `/api` vers `http://127.0.0.1:5000`.

## API

| Zone | Endpoints |
|------|-----------|
| **Module 1** (exercices & budget) | `GET/POST/PUT/DELETE /api/exercises`, `/api/budget-types`, `/api/annual-budgets` |
| **Modules 2–17** (données JSON) | `GET/PUT /api/collections/{nom}` |
| **Tableau de bord** | `GET /api/dashboard/summary` |

Les collections PostgreSQL (`app_collections`) remplacent `localStorage`. Votre collègue peut remplacer progressivement chaque collection par des tables relationnelles dédiées.

### Collections utilisées

`familles`, `categories`, `natures`, `libelles`, `vatRates`, `budgetAllocations`, `fournisseurs`, `commandes`, `devis`, `engagements`, `ordonnances`, `paiements`, etc. (voir `frontend/src/services/dataStore.js` → `COLLECTION_KEYS`).
