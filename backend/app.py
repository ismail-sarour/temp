"""
API locale pour le frontend Vite (proxy /api -> http://127.0.0.1:5000).
"""
from flask import Flask
from flask_cors import CORS

from db import init_tables
from routes.budget_api import bp as budget_bp
from routes.audit_api import audit_bp
from routes.notifications_api import notifications_bp
from routes.documents_api import documents_bp
from routes.entities_api import entities_bp
from routes.ai_chat_api import ai_chat_bp


def create_app():
    init_tables()
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(budget_bp, url_prefix="/api")
    app.register_blueprint(audit_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
    app.register_blueprint(documents_bp, url_prefix="/api")
    app.register_blueprint(entities_bp, url_prefix="/api")
    app.register_blueprint(ai_chat_bp, url_prefix="/api")
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
