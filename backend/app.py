"""Nur Oqiw Orayi independent API. Never import the Telegram bot."""
import base64
import datetime as dt
import functools
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
from flask import Flask, jsonify, request
from psycopg import connect
from psycopg.rows import dict_row

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 128 * 1024
logging.basicConfig(level=logging.INFO)
ALLOWED_ORIGINS = set(os.environ.get("ALLOWED_ORIGINS", "https://nur-apk.vercel.app").split(","))
TOKEN_HASH = os.environ.get("ADMIN_TOKEN_SHA256", "")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
_login_failures = {}

def db():
    return connect(os.environ["DATABASE_URL"], row_factory=dict_row, connect_timeout=10)

def bad(message, status=400):
    return jsonify({"error": message}), status

def require_int(v, name):
    try:
        n = int(v)
    except (TypeError, ValueError):
        raise ValueError(name + " noto‘g‘ri")
    if n <= 0:
        raise ValueError(name + " noto‘g‘ri")
    return n

def require_text(v, name, maxlen=120):
    if not isinstance(v, str) or not v.strip() or len(v.strip()) > maxlen:
        raise ValueError(name + " kiritilishi kerak (1-" + str(maxlen) + " belgi)")
    return v.strip()

def request_json():
    obj = request.get_json(silent=True)
    if not isinstance(obj, dict):
        raise ValueError("JSON ma’lumot yuboring")
    return obj

def session_token():
    data = {"role": "admin", "exp": int(time.time()) + 12 * 3600, "nonce": secrets.token_hex(8)}
    raw = base64.urlsafe_b64encode(json.dumps(data, separators=(",", ":")).encode()).decode().rstrip("=")
    sig = hmac.new(SESSION_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
    return raw + "." + sig

def valid_session(token):
    if not SESSION_SECRET or not token or "." not in token:
        return False
    raw, sig = token.rsplit(".", 1)
    expected = hmac.new(SESSION_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return False
    try:
        obj = json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
        return obj.get("role") == "admin" and int(obj.get("exp", 0)) > int(time.time())
    except (ValueError, TypeError):
        return False

def admin_only(fn):
    @functools.wraps(fn)
    def inner(*a, **kw):
        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer ") or not valid_session(authorization[7:]):
            return bad("Administrator avtorizatsiyasi talab qilinadi", 401)
        return fn(*a, **kw)
    return inner

@app.after_request
def cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

@app.before_request
def preflight():
    if request.method == "OPTIONS":
        return ("", 204)

@app.errorhandler(ValueError)
def handle_value(exc):
    return bad(str(exc))

@app.errorhandler(Exception)
def handle_error(exc):
    logging.exception("Unexpected API error: %s", type(exc).__name__)
    return bad("Server xatosi. Keyinroq qayta urinib ko‘ring", 500)

@app.get("/api/health")
def health():
    with db() as conn:
        conn.execute("SELECT 1")
    return jsonify({"ok": True, "project": "nur-apk"})

@app.get("/api/bootstrap")
def bootstrap():
    with db() as conn:
        subjects = conn.execute("SELECT id, code, title FROM app_subjects ORDER BY id").fetchall()
        groups = conn.execute("""SELECT g.id, g.subject_id, g.code, g.title,
          count(s.id)::int AS student_count
          FROM app_groups g LEFT JOIN app_students s ON s.group_id=g.id AND NOT s.archived
          WHERE NOT g.archived GROUP BY g.id ORDER BY g.subject_id,g.id""").fetchall()
        notices = conn.execute("""SELECT id,title,body,created_at FROM app_notices
          WHERE NOT archived AND group_id IS NULL AND publish_at<=now()
          AND (expires_at IS NULL OR expires_at>now())
          ORDER BY pinned DESC,publish_at DESC LIMIT 20""").fetchall()
    return jsonify({"subjects": subjects, "groups": groups, "notices": notices,
                    "total_students": sum(g["student_count"] for g in groups)})

@app.get("/api/students")
def students():
    group_id = require_int(request.args.get("group_id"), "group_id")
    with db() as conn:
        rows = conn.execute("""SELECT id,group_id,full_name FROM app_students
        WHERE group_id=%s AND NOT archived ORDER BY full_name,id""", (group_id,)).fetchall()
    return jsonify({"students": rows})

@app.get("/api/ranking")
def ranking():
    group_id = request.args.get("group_id")
    subject_id = request.args.get("subject_id")
    params = []
    where = ["NOT s.archived", "NOT g.archived"]
    if group_id:
        where.append("g.id=%s")
        params.append(require_int(group_id, "group_id"))
    if subject_id:
        where.append("g.subject_id=%s")
        params.append(require_int(subject_id, "subject_id"))
    sql = """SELECT s.id AS student_id,s.full_name,g.id AS group_id,g.title AS group_title,
     g.subject_id, ROUND(AVG(m.score) FILTER (WHERE NOT m.absent),1)::float8 AS average,
     COUNT(m.id) FILTER (WHERE NOT m.absent)::int AS tests,
     COUNT(m.id) FILTER (WHERE m.absent)::int AS absences
     FROM app_students s JOIN app_groups g ON g.id=s.group_id
     LEFT JOIN app_marks m ON m.student_id=s.id AND EXISTS (
        SELECT 1 FROM app_sessions ms WHERE ms.id=m.session_id AND ms.group_id=s.group_id AND NOT ms.archived)
     WHERE """ + " AND ".join(where) + """
     GROUP BY s.id,g.id ORDER BY average DESC NULLS LAST, tests DESC,s.full_name LIMIT 500"""
    with db() as conn:
        rows = conn.execute(sql, params).fetchall()
    for i, row in enumerate(rows, 1):
        row["rank"] = i if row["tests"] else None
    return jsonify({"ranking": rows})

@app.get("/api/results")
def results():
    group_id = request.args.get("group_id")
    params = []
    where = ["NOT se.archived", "NOT g.archived"]
    if group_id:
        where.append("g.id=%s")
        params.append(require_int(group_id, "group_id"))
    with db() as conn:
        rows = conn.execute("""SELECT m.id,m.student_id,s.full_name,g.id AS group_id,g.title AS group_title,
            se.id AS session_id,se.title AS session_title,se.held_on,
            m.absent,m.score::float8 AS score
            FROM app_marks m JOIN app_students s ON s.id=m.student_id
            JOIN app_sessions se ON se.id=m.session_id JOIN app_groups g ON g.id=se.group_id
            WHERE """ + " AND ".join(where) + """
            ORDER BY se.held_on DESC,se.id DESC,s.full_name LIMIT 500""", params).fetchall()
    return jsonify({"results": rows})

@app.post("/api/admin/login")
def admin_login():
    source = (request.remote_addr or "unknown").strip()
    now = time.time()
    recent = [v for v in _login_failures.get(source, []) if now - v < 900]
    _login_failures[source] = recent
    if len(recent) >= 8:
        return bad("Ko‘p urinish. 15 daqiqadan keyin qayting", 429)
    value = request_json().get("token", "")
    if not isinstance(value, str) or not TOKEN_HASH or not SESSION_SECRET:
        return bad("Admin tizimi sozlanmagan", 503)
    candidate = hashlib.sha256(value.encode()).hexdigest()
    if not hmac.compare_digest(TOKEN_HASH, candidate):
        recent.append(now)
        return bad("Admin tokeni noto‘g‘ri", 401)
    _login_failures.pop(source, None)
    return jsonify({"session": session_token(), "expires_in": 43200, "admin": "Жанзаков Б"})

@app.get("/api/admin/overview")
@admin_only
def overview():
    with db() as conn:
        sessions = conn.execute("""SELECT se.id,se.title,se.held_on,se.group_id,g.title AS group_title,
            (SELECT count(*)::int FROM app_marks m WHERE m.session_id=se.id) AS marked_count
            FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
            WHERE NOT se.archived ORDER BY se.held_on DESC,se.id DESC LIMIT 200""").fetchall()
        counts = conn.execute("""SELECT (SELECT count(*) FROM app_students WHERE NOT archived)::int AS students,
            (SELECT count(*) FROM app_groups WHERE NOT archived)::int AS groups,
            (SELECT count(*) FROM app_sessions WHERE NOT archived)::int AS sessions""").fetchone()
    return jsonify({"sessions": sessions, "counts": counts})

@app.post("/api/admin/groups")
@admin_only
def add_group():
    data = request_json()
    subject_id = require_int(data.get("subject_id"), "subject_id")
    code = require_text(data.get("code"), "Guruh kodi", 16).upper()
    title = require_text(data.get("title") or (code + " guruhi"), "Nomi", 80)
    with db() as conn:
        row = conn.execute("""INSERT INTO app_groups(subject_id,code,title) VALUES(%s,%s,%s)
          ON CONFLICT(subject_id,code) DO UPDATE SET archived=FALSE,title=EXCLUDED.title
          RETURNING id""", (subject_id, code, title)).fetchone()
    return jsonify({"ok": True, "id": row["id"]}), 201

@app.patch("/api/admin/groups/<int:group_id>")
@admin_only
def edit_group(group_id):
    data = request_json()
    title = require_text(data.get("title"), "Guruh nomi", 80)
    with db() as conn:
        row = conn.execute("UPDATE app_groups SET title=%s WHERE id=%s AND NOT archived RETURNING id", (title, group_id)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

@app.delete("/api/admin/groups/<int:group_id>")
@admin_only
def archive_group(group_id):
    with db() as conn:
        row = conn.execute("UPDATE app_groups SET archived=TRUE WHERE id=%s RETURNING id", (group_id,)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

@app.post("/api/admin/students")
@admin_only
def add_student():
    data = request_json()
    name = require_text(data.get("full_name"), "Ism va familiya", 120)
    group_id = require_int(data.get("group_id"), "group_id")
    with db() as conn:
        row = conn.execute("""INSERT INTO app_students(group_id,full_name)
        SELECT id,%s FROM app_groups WHERE id=%s AND NOT archived RETURNING id""", (name, group_id)).fetchone()
    if not row:
        return bad("Guruh topilmadi", 404)
    return jsonify({"ok": True, "id": row["id"]}), 201

@app.patch("/api/admin/students/<int:student_id>")
@admin_only
def edit_student(student_id):
    name = require_text(request_json().get("full_name"), "Ism va familiya", 120)
    with db() as conn:
        row = conn.execute("UPDATE app_students SET full_name=%s WHERE id=%s AND NOT archived RETURNING id", (name, student_id)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

@app.delete("/api/admin/students/<int:student_id>")
@admin_only
def archive_student(student_id):
    with db() as conn:
        row = conn.execute("UPDATE app_students SET archived=TRUE WHERE id=%s RETURNING id", (student_id,)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

@app.post("/api/admin/sessions")
@admin_only
def add_session():
    data = request_json()
    group_id = require_int(data.get("group_id"), "group_id")
    title = require_text(data.get("title"), "Mashg‘ulot nomi", 120)
    date = dt.date.fromisoformat(require_text(data.get("held_on"), "Sana", 10))
    if date > dt.date.today() + dt.timedelta(days=1):
        raise ValueError("Kelajakdagi sana uchun natija kirita olmaysiz")
    with db() as conn:
        row = conn.execute("""INSERT INTO app_sessions(group_id,title,held_on)
           SELECT id,%s,%s FROM app_groups WHERE id=%s AND NOT archived RETURNING id""",
           (title, date, group_id)).fetchone()
    if not row:
        return bad("Guruh topilmadi", 404)
    return jsonify({"ok": True, "id": row["id"]}), 201

@app.delete("/api/admin/sessions/<int:session_id>")
@admin_only
def archive_session(session_id):
    with db() as conn:
        row = conn.execute("UPDATE app_sessions SET archived=TRUE WHERE id=%s RETURNING id", (session_id,)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

@app.post("/api/admin/marks")
@admin_only
def save_marks():
    data = request_json()
    session_id = require_int(data.get("session_id"), "session_id")
    marks = data.get("marks")
    if not isinstance(marks, list) or not 1 <= len(marks) <= 200:
        raise ValueError("1-200 ta natija kiritilishi kerak")
    with db() as conn:
        with conn.transaction():
            session = conn.execute("SELECT id,group_id FROM app_sessions WHERE id=%s AND NOT archived", (session_id,)).fetchone()
            if not session:
                return bad("Mashg‘ulot topilmadi", 404)
            seen = set()
            for mark in marks:
                if not isinstance(mark, dict):
                    raise ValueError("Natija formati noto‘g‘ri")
                student_id = require_int(mark.get("student_id"), "student_id")
                if student_id in seen:
                    raise ValueError("Takroriy o‘quvchi")
                seen.add(student_id)
                absent = mark.get("absent") is True
                score = None
                if not absent:
                    try:
                        score = float(mark.get("score"))
                    except (ValueError, TypeError):
                        raise ValueError("Ball 0-100 oralig‘ida bo‘lishi kerak")
                    if not 0 <= score <= 100:
                        raise ValueError("Ball 0-100 oralig‘ida bo‘lishi kerak")
                student = conn.execute("""SELECT id FROM app_students WHERE id=%s
                    AND group_id=%s AND NOT archived""", (student_id, session["group_id"])).fetchone()
                if not student:
                    raise ValueError("O‘quvchi boshqa guruhda yoki topilmadi")
                conn.execute("""INSERT INTO app_marks(session_id,student_id,score,absent)
                    VALUES(%s,%s,%s,%s)
                    ON CONFLICT(session_id,student_id) DO UPDATE SET score=EXCLUDED.score,
                        absent=EXCLUDED.absent,updated_at=now()""",
                    (session_id, student_id, score, absent))
    return jsonify({"ok": True, "saved": len(marks)})

@app.post("/api/admin/notices")
@admin_only
def add_notice():
    data = request_json()
    title = require_text(data.get("title"), "Sarlavha", 120)
    body = require_text(data.get("body"), "Xabar", 1000)
    with db() as conn:
        row = conn.execute("INSERT INTO app_notices(title,body) VALUES(%s,%s) RETURNING id", (title, body)).fetchone()
    return jsonify({"ok": True, "id": row["id"]}), 201

@app.delete("/api/admin/notices/<int:notice_id>")
@admin_only
def archive_notice(notice_id):
    with db() as conn:
        row = conn.execute("UPDATE app_notices SET archived=TRUE WHERE id=%s RETURNING id", (notice_id,)).fetchone()
    return jsonify({"ok": bool(row)}), 200 if row else 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "10000")))

# Routes for the independent premium mobile administrator.
from backend.premium import register_premium
register_premium(app, db, admin_only, require_int, require_text, request_json, bad)
