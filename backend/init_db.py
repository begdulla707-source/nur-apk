"""Idempotent schema initializer for a clean Nur APK database."""
from pathlib import Path
import os
from psycopg import connect

def initialize():
    if not os.environ.get("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL is required")
    statements = [v.strip() for v in Path(__file__).with_name("schema.sql").read_text().split(";") if v.strip()]
    with connect(os.environ["DATABASE_URL"]) as conn:
        for statement in statements:
            conn.execute(statement)
    print("Nur APK schema ready")

if __name__ == "__main__":
    initialize()
