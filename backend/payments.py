"""Independent Nur Oqiw Orayi payment requests and administrator manual verification.

No payment gateway is impersonated. "confirmed" can only be recorded by an
authorized administrator after verifying the transaction externally. Automatic
Paynet integration requires official merchant credentials and a signed callback.
"""
import datetime as dt
import hashlib
import secrets
import time
from collections import defaultdict, deque
from zoneinfo import ZoneInfo

from flask import jsonify, request
from psycopg.errors import UniqueViolation

TZ = ZoneInfo("Asia/Tashkent")
QR_PAYEE = "IBIRAYM NURJANOV"  # Name printed on the image provided by the app owner.

def register_payments(app, db, admin_only, request_json, require_int, bad):
    windows = defaultdict(deque)

    def clean_string(value, field, low, high):
        if not isinstance(value, str):
            raise ValueError(field + ": matn kiritish kerak")
        value = value.strip()
        if not low <= len(value) <= high:
            raise ValueError(field + ": " + str(low) + "–" + str(high) + " ta belgi")
        return value

    def month_date(value):
        value = clean_string(value, "Davr", 7, 7)
        try:
            month = dt.date.fromisoformat(value + "-01")
        except ValueError:
            raise ValueError("Davr YYYY-MM ko‘rinishida bo‘lishi kerak")
        today = dt.datetime.now(TZ).date()
        first = dt.date(today.year, today.month, 1)
        # Prevent wildly old/future billing periods and accidental duplicates.
        if (month.year - first.year) * 12 + month.month - first.month not in range(-12, 13):
            raise ValueError("To‘lov davri so‘nggi 12 oy oralig‘ida yoki keyingi 12 oyda bo‘lishi kerak")
        return month

    def receipt_lookup(conn, secret):
        secret = clean_string(secret, "To‘lov maxfiy raqami", 32, 32)
        if any(c not in "0123456789abcdef" for c in secret.lower()):
            raise ValueError("To‘lov raqami noto‘g‘ri")
        digest = hashlib.sha256(secret.encode("ascii")).hexdigest()
        return conn.execute("""SELECT r.id,r.order_code,r.group_id,r.period_month,r.amount_uzs,
             r.status,r.created_at,r.submitted_at,r.confirmed_at,
             g.title AS group_title
             FROM app_payment_requests r JOIN app_groups g ON g.id=r.group_id
             WHERE r.receipt_hash=%s""", (digest,)).fetchone()

    def config(conn):
        settings = conn.execute("""SELECT enabled,payee_name,payee_verified,qr_enabled,
                                   updated_at FROM app_payment_settings WHERE singleton=TRUE""").fetchone()
        return settings

    def is_active(settings):
        return bool(settings["enabled"] and settings["payee_verified"] and
                    settings["qr_enabled"] and
                    (settings["payee_name"] or "").strip().upper() == QR_PAYEE)

    @app.get("/api/payments/config")
    def public_payment_config():
        with db() as conn:
            settings = config(conn)
            groups = conn.execute("""SELECT g.id AS group_id,g.title AS group_title,
                s.title AS subject_title,t.amount_uzs
                FROM app_payment_tariffs t JOIN app_groups g ON g.id=t.group_id
                JOIN app_subjects s ON s.id=g.subject_id
                WHERE t.active AND NOT g.archived ORDER BY s.id,g.id""").fetchall()
        ready = is_active(settings)
        return jsonify({
            "ready": ready,
            "mode": "paynet_qr_manual_review",
            "automatic_confirmation": False,
            "payee_name": QR_PAYEE if ready else None,
            "groups": groups,
            "message": ("QR orqali to‘lovdan keyin administratorning mustaqil tekshiruvi talab qilinadi."
                         if ready else
                         "To‘lov hali faol emas: administrator oluvchini tasdiqlashi va tarif belgilashi kerak.")
        })

    @app.post("/api/payments/orders")
    def create_order():
        data = request_json()
        payer = clean_string(data.get("payer_name"), "Ism familiya", 3, 120)
        role = data.get("payer_type")
        if role not in ("student", "parent"):
            return bad("O‘quvchi yoki ota-ona tanlansin")
        group_id = require_int(data.get("group_id"), "Guruh")
        period = month_date(data.get("period"))
        addr = (request.remote_addr or "unknown")[:90]
        now = time.monotonic()
        q = windows[addr]
        while q and now - q[0] > 3600:
            q.popleft()
        if len(q) >= 8:
            return bad("Buyurtmalar soni cheklangan. Keyinroq urinib ko‘ring", 429)
        # Generate unguessable lookup token, stored as a hash, never echoed to admin.
        token = secrets.token_hex(16)
        code = "NUR-" + secrets.token_hex(6).upper()
        digest = hashlib.sha256(token.encode("ascii")).hexdigest()
        with db() as conn:
            settings = config(conn)
            if not is_active(settings):
                return bad("Paynet to‘lovlari hali faollashtirilmagan", 409)
            tariff = conn.execute("""SELECT t.amount_uzs,g.title AS group_title
                FROM app_payment_tariffs t JOIN app_groups g ON g.id=t.group_id
                WHERE t.group_id=%s AND t.active AND NOT g.archived""", (group_id,)).fetchone()
            if not tariff:
                return bad("Bu guruh uchun narx belgilanmagan", 409)
            order = conn.execute("""INSERT INTO app_payment_requests
                (order_code,receipt_hash,payer_name,payer_type,group_id,period_month,amount_uzs)
                VALUES(%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (code,digest,payer,role,group_id,period,tariff["amount_uzs"])).fetchone()
        q.append(now)
        return jsonify({"ok":True,"order_id":order["id"],"order_code":code,
            "receipt_token":token,"group_title":tariff["group_title"],
            "amount_uzs":tariff["amount_uzs"],"period":str(period)[:7],
            "payee_name":QR_PAYEE,"status":"created",
            "manual_review":True}),201

    @app.get("/api/payments/status")
    def payment_status():
        token = request.args.get("receipt_token")
        with db() as conn:
            row = receipt_lookup(conn,token)
            if not row:
                return bad("To‘lov so‘rovi topilmadi",404)
        return jsonify({"order_code":row["order_code"],"group_title":row["group_title"],
            "period":str(row["period_month"])[:7],"amount_uzs":row["amount_uzs"],
            "status":row["status"],"created_at":row["created_at"],
            "submitted_at":row["submitted_at"],"confirmed_at":row["confirmed_at"],
            "automatic_confirmation":False})

    @app.post("/api/payments/claim")
    def submit_claim():
        data = request_json()
        token = data.get("receipt_token")
        transaction = clean_string(data.get("payment_reference"), "Paynet operatsiya raqami", 5, 120)
        note = data.get("note") or ""
        if not isinstance(note,str) or len(note)>300:
            return bad("Izoh 300 ta belgidan oshmasligi kerak")
        with db() as conn:
            with conn.transaction():
                row = receipt_lookup(conn,token)
                if not row:
                    return bad("To‘lov so‘rovi topilmadi",404)
                if row["status"] != "created":
                    return bad("Bu so‘rov allaqachon yuborilgan yoki ko‘rib chiqilgan",409)
                try:
                    # A nested transaction (savepoint) protects the session when
                    # a duplicate bank reference hits the unique constraint.
                    with conn.transaction():
                        updated = conn.execute("""UPDATE app_payment_requests
                            SET claim_reference=%s,claim_note=%s,status='submitted',
                            submitted_at=now(),updated_at=now()
                            WHERE id=%s AND status='created' RETURNING id""",
                            (transaction,note.strip(),row["id"])).fetchone()
                except UniqueViolation:
                    return bad("Bu operatsiya raqami boshqa to‘lovda kiritilgan",409)
                if not updated:
                    return bad("To‘lov holati yangilangan. Qayta tekshiring",409)
        return jsonify({"ok":True,"status":"submitted",
            "message":"Ariza adminga yuborildi. To‘lov faqat real Paynet yozuvi tekshirilgach tasdiqlanadi."})

    @app.get("/api/admin/payments/overview")
    @admin_only
    def admin_payment_overview():
        with db() as conn:
            settings = config(conn)
            tariffs = conn.execute("""SELECT t.group_id,g.title AS group_title,
                s.title AS subject_title,t.amount_uzs,t.active
                FROM app_payment_tariffs t JOIN app_groups g ON g.id=t.group_id
                JOIN app_subjects s ON s.id=g.subject_id
                ORDER BY s.id,g.id""").fetchall()
            counts = conn.execute("""SELECT status,count(*)::int AS count,
                coalesce(sum(amount_uzs),0)::bigint AS total_amount
                FROM app_payment_requests GROUP BY status""").fetchall()
        return jsonify({"settings":dict(settings),"tariffs":tariffs,
                        "counts":counts,"expected_qr_payee":QR_PAYEE,
                        "automatic_provider_connected":False,
                        "warning":"Only confirm transfers after checking Paynet records independently."})

    @app.patch("/api/admin/payments/settings")
    @admin_only
    def admin_payment_settings():
        data = request_json()
        with db() as conn:
            old = config(conn)
            enabled = data.get("enabled",old["enabled"])
            payee_verified = data.get("payee_verified",old["payee_verified"])
            qr_enabled = data.get("qr_enabled",old["qr_enabled"])
            if not all(isinstance(v,bool) for v in (enabled,payee_verified,qr_enabled)):
                return bad("Faollashtirish qiymatlari true yoki false bo‘lishi kerak")
            name = data.get("payee_name",old["payee_name"]) or ""
            if not isinstance(name,str) or len(name)>100:
                return bad("Oluvchi ismi noto‘g‘ri")
            name = name.strip()
            if enabled and (not payee_verified or not qr_enabled or name.upper()!=QR_PAYEE):
                return bad("Rasmdagi Paynet oluvchisini tekshiring va QR egasini tasdiqlang",409)
            row = conn.execute("""UPDATE app_payment_settings
                SET enabled=%s,payee_name=%s,payee_verified=%s,qr_enabled=%s,updated_at=now()
                WHERE singleton=TRUE
                RETURNING enabled,payee_name,payee_verified,qr_enabled,updated_at""",
                (enabled,name,payee_verified,qr_enabled)).fetchone()
        return jsonify({"ok":True,"settings":dict(row)})

    @app.put("/api/admin/payments/tariffs/<int:group_id>")
    @admin_only
    def admin_payment_tariff(group_id):
        data = request_json()
        amount = require_int(data.get("amount_uzs"),"Narx")
        if not 1000 <= amount <= 100000000:
            return bad("Narx 1 000 dan 100 000 000 so‘mgacha bo‘lishi kerak")
        active = data.get("active",True)
        if not isinstance(active,bool):
            return bad("active noto‘g‘ri")
        with db() as conn:
            group = conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone()
            if not group:
                return bad("Guruh topilmadi",404)
            conn.execute("""INSERT INTO app_payment_tariffs(group_id,amount_uzs,active)
                VALUES(%s,%s,%s) ON CONFLICT(group_id) DO UPDATE
                SET amount_uzs=EXCLUDED.amount_uzs,active=EXCLUDED.active,updated_at=now()""",
                (group_id,amount,active))
        return jsonify({"ok":True,"group_id":group_id,"amount_uzs":amount,"active":active})

    @app.get("/api/admin/payments/orders")
    @admin_only
    def admin_payment_orders():
        status = request.args.get("status","all")
        if status not in ("all","created","submitted","confirmed","rejected"):
            return bad("Status noto‘g‘ri")
        where = "WHERE r.status=%s" if status != "all" else ""
        args = (status,) if status != "all" else ()
        with db() as conn:
            rows = conn.execute("""SELECT r.id,r.order_code,r.payer_name,r.payer_type,
                r.period_month,r.amount_uzs,r.status,r.claim_reference,r.claim_note,
                r.verified_transaction,r.admin_note,r.created_at,r.submitted_at,
                r.confirmed_at,g.title AS group_title,s.title AS subject_title
                FROM app_payment_requests r JOIN app_groups g ON g.id=r.group_id
                JOIN app_subjects s ON s.id=g.subject_id """ + where +
                """ ORDER BY r.created_at DESC LIMIT 300""",args).fetchall()
        return jsonify({"orders":rows})

    @app.patch("/api/admin/payments/orders/<int:order_id>")
    @admin_only
    def admin_payment_review(order_id):
        data = request_json()
        new_status = data.get("status")
        if new_status not in ("confirmed","rejected"):
            return bad("Faqat tasdiqlash yoki rad etish mumkin")
        comment = data.get("admin_note") or ""
        if not isinstance(comment,str) or len(comment)>500:
            return bad("Admin izohi 500 belgidan oshmasligi kerak")
        verified_transaction = None
        if new_status == "confirmed":
            if data.get("verified_externally") is not True:
                return bad("Avval haqiqiy Paynet tranzaksiyasini tashqaridan tekshiring",409)
            verified_transaction = clean_string(
                data.get("verified_transaction"),"Tasdiqlangan operatsiya raqami",5,120)
        with db() as conn:
            with conn.transaction():
                existing = conn.execute("""SELECT id,status,claim_reference FROM app_payment_requests
                    WHERE id=%s FOR UPDATE""",(order_id,)).fetchone()
                if not existing:
                    return bad("To‘lov topilmadi",404)
                if existing["status"]!="submitted":
                    return bad("Faqat tekshiruvga yuborilgan to‘lovni yakunlash mumkin",409)
                if new_status == "confirmed" and existing["claim_reference"] != verified_transaction:
                    return bad("Tasdiqlangan raqam yuborilgan Paynet operatsiya raqamiga mos kelishi kerak",409)
                row = conn.execute("""UPDATE app_payment_requests
                    SET status=%s,admin_note=%s,verified_transaction=%s,
                    confirmed_at=CASE WHEN %s='confirmed' THEN now() ELSE NULL END,
                    updated_at=now() WHERE id=%s AND status='submitted' RETURNING id""",
                    (new_status,comment.strip(),verified_transaction,new_status,order_id)).fetchone()
                if not row:
                    return bad("To‘lov boshqa admin tomonidan yangilangan",409)
        return jsonify({"ok":True,"status":new_status,"order_id":order_id,
            "verification":"manual_admin_external_check"})
