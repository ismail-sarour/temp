"""
API locale pour le frontend Vite (proxy /api -> http://127.0.0.1:5000).
"""
from flask import Flask
from flask_cors import CORS

from db import init_tables
from routes.budget_api import bp as budget_bp
from routes.collections_api import bp as collections_bp


def create_app():
    init_tables()
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(budget_bp, url_prefix="/api")
    app.register_blueprint(collections_bp, url_prefix="/api")
    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
