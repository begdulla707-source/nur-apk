"""Public contact form + private admin inbox. Not integrated with the Telegram bot."""
import time
from collections import defaultdict, deque
from flask import jsonify, request

def register_contact(app, db, admin_only, request_json, bad):
    windows = defaultdict(deque)
    VALID_SUBJECTS = {"mat","fiz","rus","eng","other"}
    def user_text(obj,key,limit):
        value=obj.get(key,"")
        if not isinstance(value,str):
            raise ValueError(key+": matn kiritilishi kerak")
        value=value.strip()
        if not 1<=len(value)<=limit:
            raise ValueError(key+": 1–"+str(limit)+" belgi kiritilishi kerak")
        return value
    @app.post("/api/contact")
    def contact():
        obj=request_json()
        name=user_text(obj,"full_name",120)
        message=user_text(obj,"message",2000)
        if len(message)<5:
            return bad("Xabar kamida 5 ta belgidan iborat bo‘lsin")
        role=obj.get("sender_type")
        if role not in ("student","parent"):
            return bad("O‘quvchi yoki ota-ona turini tanlang")
        subject=obj.get("subject_code") or None
        if subject and subject not in VALID_SUBJECTS:
            return bad("Fan noto‘g‘ri tanlangan")
        if role=="student" and not subject:
            return bad("Qaysi fandan o‘qiyotganingizni tanlang")
        # Lightweight defense in depth; production needs a managed network-level limit.
        addr=(request.remote_addr or "unknown")[:80]
        now=time.monotonic()
        q=windows[addr]
        while q and now-q[0]>3600:q.popleft()
        if len(q)>=5:
            return bad("Xabarlar soni cheklangan. Keyinroq urinib ko‘ring",429)
        with db() as conn:
            row=conn.execute("""INSERT INTO app_contact_messages
                (full_name,sender_type,subject_code,message)
                VALUES(%s,%s,%s,%s) RETURNING id""",
                (name,role,subject,message)).fetchone()
        q.append(now)
        return jsonify({"ok":True,"message":"Xabaringiz administratorga yuborildi","reference":row["id"]}),201

    @app.get("/api/admin/inbox")
    @admin_only
    def inbox():
        status=request.args.get("status","active")
        if status not in ("active","archived","unread"):
            return bad("Xabar holati noto‘g‘ri")
        where={"active":"NOT archived","archived":"archived","unread":"NOT archived AND NOT is_read"}[status]
        with db() as conn:
            rows=conn.execute("""SELECT id,full_name,sender_type,subject_code,
                message,created_at,is_read,read_at FROM app_contact_messages
                WHERE """+where+""" ORDER BY created_at DESC LIMIT 200""").fetchall()
            unread=conn.execute("SELECT count(*)::int AS n FROM app_contact_messages WHERE NOT archived AND NOT is_read").fetchone()["n"]
        return jsonify({"messages":rows,"unread":unread})

    @app.patch("/api/admin/inbox/<int:message_id>")
    @admin_only
    def update_message(message_id):
        obj=request_json()
        sets=[]
        values=[]
        if "is_read" in obj:
            if not isinstance(obj["is_read"],bool):return bad("is_read noto‘g‘ri")
            sets.extend(["is_read=%s","read_at="+("now()" if obj["is_read"] else "NULL")])
            values.append(obj["is_read"])
        if "archived" in obj:
            if not isinstance(obj["archived"],bool):return bad("archived noto‘g‘ri")
            sets.append("archived=%s")
            values.append(obj["archived"])
        if not sets:return bad("Yangilanadigan maydon tanlanmagan")
        with db() as conn:
            row=conn.execute("UPDATE app_contact_messages SET "+",".join(sets)+" WHERE id=%s RETURNING id",values+[message_id]).fetchone()
        return jsonify({"ok":bool(row)}),200 if row else 404
