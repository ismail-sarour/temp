from flask import Blueprint, request, jsonify, current_app
import os
import json
import urllib.request
import urllib.error
from db import fetch_all, fetch_one

ai_chat_bp = Blueprint('ai_chat', __name__)

def get_database_context(page):
    """
    Fetch relevant database entries depending on the active page context 
    to provide the LLM with real, live application data.
    """
    context_lines = []
    
    # 1. Fetch general statistics that are useful across all pages
    try:
        supplier_count = fetch_one("SELECT count(*) FROM fournisseurs")
        devis_count = fetch_one("SELECT count(*) FROM devis")
        eng_count = fetch_one("SELECT count(*) FROM engagements")
        budget_count = fetch_one("SELECT count(*) FROM annual_budgets")
        
        context_lines.append("=== STATISTIQUES CASM ===")
        context_lines.append(f"- Fournisseurs enregistrés: {supplier_count['count'] if supplier_count else 0}")
        context_lines.append(f"- Devis reçus: {devis_count['count'] if devis_count else 0}")
        context_lines.append(f"- Engagements budgétaires: {eng_count['count'] if eng_count else 0}")
        context_lines.append(f"- Budgets annuels: {budget_count['count'] if budget_count else 0}")
    except Exception as e:
        context_lines.append(f"Statistiques CASM non disponibles: {str(e)}")

    # 2. Module/page-specific data retrieval
    if page == "Fournisseurs":
        try:
            suppliers = fetch_all("SELECT company_name, email, phone, status FROM fournisseurs ORDER BY id DESC LIMIT 15")
            if suppliers:
                context_lines.append("\n=== FOURNISSEURS ACTIFS (15 derniers) ===")
                for s in suppliers:
                    context_lines.append(f"- {s['company_name']} | Email: {s['email'] or 'N/A'} | Tél: {s['phone'] or 'N/A'} | Statut: {s['status']}")
            else:
                context_lines.append("\nAucun fournisseur trouvé dans la base de données.")
        except Exception as e:
            context_lines.append(f"\nErreur lors du chargement des fournisseurs: {str(e)}")
            
    elif page in ["Exercices & Budget", "Suivi Budgétaire", "Affectation Budgétaire", "Nomenclature Budgétaire"]:
        try:
            exercises = fetch_all("SELECT year, label, status FROM budget_exercises ORDER BY year DESC")
            if exercises:
                context_lines.append("\n=== EXERCICES BUDGETAIRES ===")
                for ex in exercises:
                    context_lines.append(f"- {ex['year']} ({ex['label']}) - Statut: {ex['status']}")
            
            budgets = fetch_all("""
                SELECT be.year, bt.code, bt.name_fr, abl.amount
                FROM annual_budget_lines abl
                JOIN annual_budgets ab ON abl.annual_budget_id = ab.id
                JOIN budget_exercises be ON ab.exercise_id = be.id
                JOIN budget_types bt ON abl.budget_type_id = bt.id
                ORDER BY be.year DESC LIMIT 15
            """)
            if budgets:
                context_lines.append("\n=== ALLOCATIONS DES BUDGETS ANNUELS (15 derniers) ===")
                for b in budgets:
                    context_lines.append(f"- Année: {b['year']} | Type: {b['code']} ({b['name_fr']}) | Alloué: {b['amount']:,} MAD")
        except Exception as e:
            context_lines.append(f"\nErreur lors du chargement des budgets: {str(e)}")
            
    elif page == "Devis & Attributions":
        try:
            devis = fetch_all("""
                SELECT d.reference, d.date::text, d.amount_ht, d.amount_ttc, d.status, f.company_name as supplier
                FROM devis d
                LEFT JOIN fournisseurs f ON d.supplier_id = f.id
                ORDER BY d.id DESC LIMIT 15
            """)
            if devis:
                context_lines.append("\n=== DEVIS ET OFFRES RECENTS ===")
                for d in devis:
                    context_lines.append(f"- Réf: {d['reference']} | Fournisseur: {d['supplier']} | Date: {d['date']} | HT: {d['amount_ht']:,} MAD | TTC: {d['amount_ttc']:,} MAD | Statut: {d['status']}")
            else:
                context_lines.append("\nAucun devis en base de données.")
        except Exception as e:
            context_lines.append(f"\nErreur devis: {str(e)}")
            
    elif page == "Engagements Budgétaires":
        try:
            engagements = fetch_all("""
                SELECT e.reference, e.amount, e.date::text, e.status, be.year
                FROM engagements e
                LEFT JOIN budget_exercises be ON e.exercice_id = be.id
                ORDER BY e.id DESC LIMIT 15
            """)
            if engagements:
                context_lines.append("\n=== ENGAGEMENTS BUDGETAIRES RECENTS ===")
                for e in engagements:
                    context_lines.append(f"- Réf: {e['reference']} | Montant: {e['amount']:,} MAD | Date: {e['date']} | Exercice: {e['year']} | Statut: {e['status']}")
            else:
                context_lines.append("\nAucun engagement trouvé.")
        except Exception as e:
            context_lines.append(f"\nErreur engagements: {str(e)}")
            
    elif page == "Audit & Traçabilité":
        try:
            logs = fetch_all("""
                SELECT timestamp::text, action, entity_type, entity_id, username, details
                FROM audit_logs
                ORDER BY timestamp DESC LIMIT 15
            """)
            if logs:
                context_lines.append("\n=== HISTORIQUE D'AUDIT ET TRACABILITE (15 derniers) ===")
                for l in logs:
                    det = json.dumps(l['details']) if l['details'] else ""
                    context_lines.append(f"- [{l['timestamp']}] {l['username']} - Action: {l['action']} | Entité: {l['entity_type']} (ID: {l['entity_id']}) | {det[:120]}")
            else:
                context_lines.append("\nAucun log d'audit enregistré.")
        except Exception as e:
            context_lines.append(f"\nErreur audit: {str(e)}")

    elif page == "Notifications":
        try:
            notifs = fetch_all("SELECT title, message, type, date::text, read FROM notifications ORDER BY date DESC LIMIT 10")
            if notifs:
                context_lines.append("\n=== ALERTES ET NOTIFICATIONS RECENTS ===")
                for n in notifs:
                    context_lines.append(f"- [{n['date']}] {n['title']}: {n['message']} (Type: {n['type']} | Lu: {n['read']})")
        except Exception as e:
            context_lines.append(f"\nErreur notifications: {str(e)}")

    return "\n".join(context_lines)

@ai_chat_bp.route('/ai-chat', methods=['POST'])
def ai_chat():
    data = request.get_json() or {}
    user_message = data.get('message')
    context = data.get('context', {})
    history = data.get('history', []) # list of {"text": "...", "sender": "user"/"ai"}
    page = context.get('page', 'Tableau de bord')

    if not user_message:
        return jsonify({'error': 'Veuillez saisir un message.'}), 400

    current_app.logger.info(f"Received AI Chat query for page: {page}")

    # Fetch real platform context data from DB
    db_context = get_database_context(page)

    # Professional Administrative System Prompt
    system_prompt = (
        "You are an enterprise AI assistant specialized in Moroccan public budget management, "
        "procurement workflows, supplier analysis, audit monitoring, compliance analysis, and financial reporting. "
        "You must remain professional, avoid hallucinations, explain anomalies clearly, provide concise "
        "operational insights, and behave like an ERP/administrative copilot.\n\n"
        "You have access to the following real-time database context from the application. "
        "Use this data to answer the user's questions whenever applicable, referencing specific suppliers, "
        "budgets, devis, or logs if they are relevant:\n"
        f"--- CONTEXTE DE LA PLATEFORME (Page actuelle: {page}) ---\n"
        f"{db_context}\n"
        "--------------------------------------------------\n\n"
        "Instructions importantes:\n"
        "1. Répondez en français de manière professionnelle, claire et administrative.\n"
        "2. Si l'utilisateur pose une question sur un fournisseur, un budget, ou un log, "
        "et que les données correspondantes figurent dans le contexte ci-dessus, utilisez ces données réelles "
        "pour formuler une réponse précise.\n"
        "3. Si l'utilisateur fait référence à des anomalies budgétaires ou des dépassements, vérifiez dans le "
        "contexte s'il y a des montants alloués ou des indicateurs suspects.\n"
        "4. Si la clé d'API Groq est absente ou ne fonctionne pas, utilisez le contexte ci-dessus pour simuler une "
        "réponse professionnelle et indiquez de manière constructive les informations disponibles."
    )

    # Structure messages for LLM request
    messages = [{"role": "system", "content": system_prompt}]
    
    # Append conversation history
    for msg in history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})
        
    # Append current user prompt
    messages.append({"role": "user", "content": user_message})

    # Groq API Configuration
    api_key = os.getenv("GROQ_API_KEY")
    # Also support flask app config fallback
    if not api_key:
        api_key = current_app.config.get('GROQ_API_KEY')

    # If no Groq API Key is configured, generate an intelligent mockup response using the database data
    if not api_key:
        fallback_msg = (
            f"[Mode Démo CASM] La clé GROQ_API_KEY n'est pas configurée dans les variables d'environnement backend.\n\n"
            f"Voici ce que l'assistant IA détecte dans le module '{page}' :\n"
            f"{db_context if len(db_context.strip()) > 50 else 'Aucune donnée pertinente trouvée pour ce module.'}\n\n"
            f"Pour activer l'intelligence Groq réelle (llama-3.3-70b-versatile), veuillez configurer GROQ_API_KEY dans votre fichier `.env`."
        )
        return jsonify({'response': fallback_msg})

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.5,
        "max_tokens": 1024
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        # Timeout at 20 seconds to prevent blocking Flask thread
        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            ai_response = res_data["choices"][0]["message"]["content"]
            return jsonify({'response': ai_response})
            
    except urllib.error.HTTPError as he:
        error_body = he.read().decode("utf-8")
        current_app.logger.error(f"Groq API Error {he.code}: {error_body}")
        # Extract messages from errors nicely
        try:
            err_json = json.loads(error_body)
            err_msg = err_json.get('error', {}).get('message', error_body)
        except Exception:
            err_msg = error_body
            
        fallback_msg = (
            f"[Erreur Groq API {he.code}] {err_msg}\n\n"
            f"Données de contexte de la plateforme ({page}) :\n"
            f"{db_context}"
        )
        return jsonify({'response': fallback_msg})
        
    except Exception as e:
        current_app.logger.error(f"Connection to Groq API failed: {str(e)}")
        fallback_msg = (
            f"[Erreur Connexion IA] Impossible de contacter le service Groq ({str(e)}).\n\n"
            f"Données du module '{page}' récupérées :\n"
            f"{db_context}"
        )
        return jsonify({'response': fallback_msg})
