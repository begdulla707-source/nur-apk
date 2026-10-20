"""Private student/parent contact + authenticated admin replies + notification feed.

No Telegram bot access. Anonymous senders receive a one-time 256-bit ticket.
The server persists only SHA256(ticket); replies are only disclosed to holders.
Published announcements are public, private replies are not.
"""
import hashlib
import secrets
import time
from collections import defaultdict, deque

from flask import jsonify, request


def register_contact(app, db, admin_only, request_json, bad):
    windows = defaultdict(deque)
    VALID_SUBJECTS = {"mat", "fiz", "rus", "eng", "other"}

    def user_text(obj, key, limit):
        value = obj.get(key, "")
        if not isinstance(value, str):
            raise ValueError(key + ": matn kiritilishi kerak")
        value = value.strip()
        if not 1 <= len(value) <= limit:
            raise ValueError(key + ": 1–" + str(limit) + " belgi kiritilishi kerak")
        return value

    def token_hash(token):
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @app.post("/api/contact")
    def contact():
        obj = request_json()
        name = user_text(obj, "full_name", 120)
        message = user_text(obj, "message", 2000)
        if len(message) < 5:
            return bad("Xabar kamida 5 ta belgidan iborat bo‘lsin")
        role = obj.get("sender_type")
        if role not in ("student", "parent"):
            return bad("O‘quvchi yoki ota-ona turini tanlang")
        subject = obj.get("subject_code") or None
        if subject and subject not in VALID_SUBJECTS:
            return bad("Fan noto‘g‘ri tanlangan")
        if role == "student" and not subject:
            return bad("Qaysi fandan o‘qiyotganingizni tanlang")
        # Production should additionally use gateway/rate-limit middleware.
        addr = (request.remote_addr or "unknown")[:80]
        now = time.monotonic()
        q = windows[addr]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= 5:
            return bad("Xabarlar soni cheklangan. Keyinroq urinib ko‘ring", 429)

        # 32 cryptographically random bytes; only hash is persisted in Postgres.
        ticket = secrets.token_urlsafe(32)
        with db() as conn:
            row = conn.execute("""INSERT INTO app_contact_messages
                (full_name,sender_type,subject_code,message,reply_token_hash)
                VALUES(%s,%s,%s,%s,%s) RETURNING id""",
                (name, role, subject, message, token_hash(ticket))).fetchone()
        q.append(now)
        return jsonify({
            "ok": True, "message": "Xabaringiz administratorga yuborildi",
            "reference": row["id"], "reply_ticket": ticket,
            "ticket_notice": "Javobni olish uchun shu telefon ilovasining ma’lumotlarini saqlang"
        }), 201

    @app.post("/api/notifications/sync")
    def public_notifications():
        """User-controlled polling: public notices plus their own reply tickets."""
        payload = request_json()
        tickets = payload.get("tickets", [])
        if not isinstance(tickets, list) or len(tickets) > 30:
            return bad("Xabar identifikatorlari noto‘g‘ri")
        digests = []
        for item in tickets:
            # token_urlsafe(32) is normally 43 URL-safe characters.
            if not isinstance(item, str) or not (32 <= len(item) <= 80):
                return bad("Xabar identifikatori noto‘g‘ri")
            if not all(c.isascii() and (c.isalnum() or c in "-_") for c in item):
                return bad("Xabar identifikatori noto‘g‘ri")
            digests.append(token_hash(item))
        with db() as conn:
            notices = conn.execute("""SELECT id,title,body,created_at
                FROM app_notices
                WHERE NOT archived AND group_id IS NULL AND publish_at <= now()
                AND (expires_at IS NULL OR expires_at > now())
                ORDER BY created_at DESC, id DESC LIMIT 30""").fetchall()
            replies = []
            if digests:
                replies = conn.execute("""SELECT
                    r.id, r.message_id AS reference, r.body, r.created_at
                    FROM app_contact_replies r
                    JOIN app_contact_messages m ON m.id=r.message_id
                    WHERE m.reply_token_hash = ANY(%s)
                    ORDER BY r.created_at DESC, r.id DESC LIMIT 100""",
                    (digests,)).fetchall()
        return jsonify({"notices": notices, "replies": replies, "private": True})

    @app.get("/api/admin/inbox")
    @admin_only
    def inbox():
        status = request.args.get("status", "active")
        if status not in ("active", "archived", "unread"):
            return bad("Xabar holati noto‘g‘ri")
        where = {
            "active": "NOT archived",
            "archived": "archived",
            "unread": "NOT archived AND NOT is_read"
        }[status]
        with db() as conn:
            rows = conn.execute("""SELECT id,full_name,sender_type,subject_code,
                message,created_at,is_read,read_at, archived,
                reply_token_hash IS NOT NULL AS can_reply
                FROM app_contact_messages
                WHERE """ + where + """ ORDER BY created_at DESC, id DESC LIMIT 200""").fetchall()
            unread = conn.execute("""SELECT count(*)::int AS n FROM app_contact_messages
                WHERE NOT archived AND NOT is_read""").fetchone()["n"]
            ids = [item["id"] for item in rows]
            replies = []
            if ids:
                replies = conn.execute("""SELECT id,message_id,body,created_at
                    FROM app_contact_replies WHERE message_id = ANY(%s)
                    ORDER BY created_at, id LIMIT 500""", (ids,)).fetchall()
        by_message = defaultdict(list)
        for reply in replies:
            by_message[reply["message_id"]].append(reply)
        for row in rows:
            row["replies"] = by_message.get(row["id"], [])
        return jsonify({"messages": rows, "unread": unread})

    @app.post("/api/admin/inbox/<int:message_id>/reply")
    @admin_only
    def reply_to_message(message_id):
        body = user_text(request_json(), "message", 1500)
        with db() as conn:
            # A legacy message without a reply token cannot securely deliver
            # replies to the original anonymous sender, so do not pretend it can.
            recipient = conn.execute("""SELECT id, reply_token_hash FROM app_contact_messages
                WHERE id=%s AND NOT archived FOR UPDATE""", (message_id,)).fetchone()
            if not recipient:
                return bad("Xabar topilmadi yoki arxivlangan", 404)
            if not recipient["reply_token_hash"]:
                return bad("Eski xabar uchun javob manzili yo‘q. User yangidan yozishi kerak.", 409)
            reply = conn.execute("""INSERT INTO app_contact_replies(message_id,body)
                VALUES(%s,%s) RETURNING id, message_id, body, created_at""",
                (message_id, body)).fetchone()
            conn.execute("""UPDATE app_contact_messages SET
                is_read=TRUE, read_at=COALESCE(read_at,now())
                WHERE id=%s""", (message_id,))
        return jsonify({"ok": True, "reply": reply}), 201

    @app.patch("/api/admin/inbox/<int:message_id>")
    @admin_only
    def update_message(message_id):
        obj = request_json()
        sets = []
        values = []
        if "is_read" in obj:
            if not isinstance(obj["is_read"], bool):
                return bad("is_read noto‘g‘ri")
            sets.extend(["is_read=%s", "read_at=" + ("now()" if obj["is_read"] else "NULL")])
            values.append(obj["is_read"])
        if "archived" in obj:
            if not isinstance(obj["archived"], bool):
                return bad("archived noto‘g‘ri")
            sets.append("archived=%s")
            values.append(obj["archived"])
        if not sets:
            return bad("Yangilanadigan maydon tanlanmagan")
        with db() as conn:
            row = conn.execute("UPDATE app_contact_messages SET " + ",".join(sets) +
                               " WHERE id=%s RETURNING id", values + [message_id]).fetchone()
        return jsonify({"ok": bool(row)}), 200 if row else 404
