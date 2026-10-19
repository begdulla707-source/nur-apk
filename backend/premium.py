"""Advanced admin features for Nur oqiw orayi (independent of Telegram bot)."""
import csv
import io
import re
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from flask import jsonify, make_response, request

TZ = ZoneInfo("Asia/Tashkent")
PHONE_RE = re.compile(r"^[0-9+() .\-]{0,32}$")

def register_premium(app, db, admin_only, require_int, require_text, request_json, bad):
    def as_date(value, name):
        if not value:
            return None
        try:
            return date.fromisoformat(str(value))
        except (ValueError, TypeError):
            raise ValueError(name + ": YYYY-MM-DD format kiritilishi kerak")

    def as_datetime(value, name):
        if value is None or value == "":
            return None
        try:
            d = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            return d if d.tzinfo else d.replace(tzinfo=TZ)
        except (ValueError, TypeError):
            raise ValueError(name + ": sana/vaqt noto‘g‘ri")

    def optional_phone(value):
        if value in (None, ""):
            return None
        if not isinstance(value, str) or not PHONE_RE.fullmatch(value.strip()):
            raise ValueError("Telefon raqami noto‘g‘ri")
        return value.strip()

    def require_string(value, label, limit=1000):
        return require_text(value, label, limit)

    def choose_bool(value, label):
        if not isinstance(value, bool):
            raise ValueError(label + " true yoki false bo‘lishi kerak")
        return value

    def int_query(key):
        value = request.args.get(key)
        return require_int(value, key) if value else None

    def audit_event(event, typ=None, obj_id=None, desc=""):
        with db() as conn:
            conn.execute("""INSERT INTO app_audit(event_type,entity_type,entity_id,description)
                VALUES(%s,%s,%s,%s)""", (event, typ, obj_id, desc[:220]))

    @app.after_request
    def audit_admin_writes(response):
        # Event journal records successful admin mutations, not passwords or private form contents.
        path = request.path
        if path.startswith("/api/admin/") and request.method in ("POST","PATCH","DELETE"):
            if 200 <= response.status_code < 300 and path != "/api/admin/login":
                try:
                    audit_event(request.method, "api", None, path[:180])
                except Exception:
                    app.logger.warning("Audit append failed for %s", path)
        return response

    @app.get("/api/notices")
    def public_notices():
        group_id = int_query("group_id")
        with db() as conn:
            rows = conn.execute("""SELECT id,title,body,group_id,pinned,publish_at,expires_at,created_at
                FROM app_notices WHERE NOT archived
                AND publish_at <= now() AND (expires_at IS NULL OR expires_at > now())
                AND (group_id IS NULL OR group_id = %s)
                ORDER BY pinned DESC,publish_at DESC,id DESC LIMIT 30""", (group_id,)).fetchall()
        return jsonify({"notices": rows})

    @app.get("/api/admin/v2/dashboard")
    @admin_only
    def v2_dashboard():
        with db() as conn:
            stats = conn.execute("""SELECT
              (SELECT count(*)::int FROM app_subjects) AS subjects,
              (SELECT count(*)::int FROM app_groups WHERE NOT archived) AS groups,
              (SELECT count(*)::int FROM app_students WHERE NOT archived) AS students,
              (SELECT count(*)::int FROM app_sessions WHERE NOT archived) AS sessions,
              (SELECT count(*)::int FROM app_marks m JOIN app_sessions se ON se.id=m.session_id WHERE NOT se.archived) AS marks,
              (SELECT count(*)::int FROM app_marks m JOIN app_sessions se ON se.id=m.session_id WHERE m.absent AND NOT se.archived) AS dq,
              (SELECT ROUND(AVG(m.score) FILTER(WHERE NOT m.absent),1)::float8 FROM app_marks m JOIN app_sessions se ON se.id=m.session_id WHERE NOT se.archived) AS avg_score,
              (SELECT count(*)::int FROM app_notices WHERE NOT archived AND publish_at <= now()) AS notices""").fetchone()
            groups = conn.execute("""SELECT g.id,g.title,s.title AS subject,
                count(DISTINCT st.id)::int AS students,
                count(DISTINCT se.id)::int AS sessions,
                ROUND(AVG(m.score) FILTER(WHERE NOT m.absent),1)::float8 AS average,
                count(m.id) FILTER(WHERE m.absent)::int AS absences
                FROM app_groups g
                JOIN app_subjects s ON s.id=g.subject_id
                LEFT JOIN app_students st ON st.group_id=g.id AND NOT st.archived
                LEFT JOIN app_sessions se ON se.group_id=g.id AND NOT se.archived
                LEFT JOIN app_marks m ON m.session_id=se.id AND m.student_id=st.id
                WHERE NOT g.archived
                GROUP BY g.id,s.title ORDER BY s.title,g.title""").fetchall()
            recent = conn.execute("""SELECT a.id,a.event_type,a.description,a.created_at
                FROM app_audit a ORDER BY a.id DESC LIMIT 12""").fetchall()
        return jsonify({"stats":stats,"groups":groups,"recent":recent,"timezone":"Asia/Tashkent"})

    @app.get("/api/admin/v2/students")
    @admin_only
    def v2_students():
        group_id = int_query("group_id")
        query = (request.args.get("q") or "").strip()[:80]
        archived = request.args.get("archived") == "true"
        with db() as conn:
            rows = conn.execute("""SELECT st.id,st.group_id,st.full_name,
                st.phone,st.notes,st.enrolled_at,st.archived,g.title AS group_title,
                sub.title AS subject_title
                FROM app_students st
                JOIN app_groups g ON g.id=st.group_id
                JOIN app_subjects sub ON sub.id=g.subject_id
                WHERE st.archived=%s AND (%s::bigint IS NULL OR st.group_id=%s)
                AND st.full_name ILIKE %s
                ORDER BY st.full_name,st.id LIMIT 500""",
                (archived,group_id,group_id,"%"+query+"%")).fetchall()
        return jsonify({"students":rows})

    @app.post("/api/admin/v2/students")
    @admin_only
    def v2_create_student():
        data=request_json()
        group_id=require_int(data.get("group_id"),"group_id")
        name=require_string(data.get("full_name"),"Ism familiya",120)
        phone=optional_phone(data.get("phone"))
        notes=data.get("notes") or ""
        if not isinstance(notes,str) or len(notes)>2000:
            raise ValueError("Izoh 2000 belgidan oshmasligi kerak")
        enrolled_at=as_date(data.get("enrolled_at"),"Qabul sanasi") or datetime.now(TZ).date()
        with db() as conn:
            g=conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone()
            if not g:return bad("Guruh topilmadi",404)
            st=conn.execute("""INSERT INTO app_students(group_id,full_name,phone,notes,enrolled_at)
                VALUES(%s,%s,%s,%s,%s) RETURNING id""",
                (group_id,name,phone,notes,enrolled_at)).fetchone()
        return jsonify({"ok":True,"id":st["id"]}),201

    @app.patch("/api/admin/v2/students/<int:student_id>")
    @admin_only
    def v2_edit_student(student_id):
        data = request_json()
        with db() as conn:
            old=conn.execute("""SELECT id,full_name,group_id,phone,notes FROM app_students
                WHERE id=%s AND NOT archived""",(student_id,)).fetchone()
            if not old:
                return bad("O‘quvchi topilmadi",404)
            full_name = require_string(data["full_name"],"Ism familiya",120) if "full_name" in data else old["full_name"]
            group_id = require_int(data["group_id"],"group_id") if "group_id" in data else old["group_id"]
            phone = optional_phone(data["phone"]) if "phone" in data else old["phone"]
            notes = (data.get("notes") or "").strip() if "notes" in data else old["notes"]
            if not isinstance(notes,str) or len(notes)>2000:
                raise ValueError("Izoh 2000 belgidan oshmasligi kerak")
            exists=conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone()
            if not exists:return bad("Guruh topilmadi",404)
            conn.execute("""UPDATE app_students SET full_name=%s,group_id=%s,phone=%s,notes=%s WHERE id=%s""",
                (full_name,group_id,phone,notes,student_id))
        return jsonify({"ok":True,"id":student_id})

    @app.post("/api/admin/v2/students/import")
    @admin_only
    def v2_bulk_students():
        data=request_json()
        group_id=require_int(data.get("group_id"),"group_id")
        students=data.get("students")
        if not isinstance(students,list) or not 1 <= len(students) <= 100:
            raise ValueError("Bir martada 1–100 ta o‘quvchi yuklang")
        cleaned=[]
        for st in students:
            if not isinstance(st,dict):raise ValueError("O‘quvchi formati noto‘g‘ri")
            name=require_string(st.get("full_name"),"Ism familiya",120)
            phone=optional_phone(st.get("phone"))
            cleaned.append((name,phone))
        imported=0;skipped=0
        with db() as conn:
            with conn.transaction():
                group=conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone()
                if not group:return bad("Guruh topilmadi",404)
                for name,phone in cleaned:
                    current=conn.execute("""SELECT id FROM app_students WHERE group_id=%s
                        AND lower(full_name)=lower(%s) AND NOT archived LIMIT 1""",(group_id,name)).fetchone()
                    if current:skipped+=1;continue
                    conn.execute("INSERT INTO app_students(group_id,full_name,phone) VALUES(%s,%s,%s)",(group_id,name,phone))
                    imported+=1
        return jsonify({"ok":True,"imported":imported,"skipped":skipped})

    @app.get("/api/admin/v2/gradebook/<int:session_id>")
    @admin_only
    def v2_gradebook(session_id):
        with db() as conn:
            session=conn.execute("""SELECT se.id,se.title,se.held_on,se.group_id,g.title AS group_title
                FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
                WHERE se.id=%s AND NOT se.archived""",(session_id,)).fetchone()
            if not session:return bad("Mashg‘ulot topilmadi",404)
            students=conn.execute("""SELECT st.id,st.full_name,m.score::float8 AS score,
                m.absent,m.id IS NOT NULL AS graded FROM app_students st
                LEFT JOIN app_marks m ON m.student_id=st.id AND m.session_id=%s
                WHERE st.group_id=%s AND NOT st.archived ORDER BY st.full_name""",
                (session_id,session["group_id"])).fetchall()
        return jsonify({"session":session,"students":students,
            "missing":sum(1 for st in students if not st["graded"])})

    @app.patch("/api/admin/v2/sessions/<int:session_id>")
    @admin_only
    def v2_session_update(session_id):
        data=request_json()
        with db() as conn:
            old=conn.execute("SELECT title,held_on FROM app_sessions WHERE id=%s AND NOT archived",(session_id,)).fetchone()
            if not old:return bad("Mashg‘ulot topilmadi",404)
            title=require_string(data.get("title"),"Mashg‘ulot nomi",120) if "title" in data else old["title"]
            held_on=as_date(data.get("held_on"),"Sana") if "held_on" in data else old["held_on"]
            if held_on > datetime.now(TZ).date()+timedelta(days=1):
                raise ValueError("Kelajakdagi testga natija kiritib bo‘lmaydi")
            conn.execute("UPDATE app_sessions SET title=%s,held_on=%s WHERE id=%s",(title,held_on,session_id))
        return jsonify({"ok":True})

    @app.post("/api/admin/v2/sessions/<int:session_id>/duplicate")
    @admin_only
    def v2_duplicate_session(session_id):
        data=request_json()
        when=as_date(data.get("held_on"),"Sana") or datetime.now(TZ).date()
        with db() as conn:
            old=conn.execute("SELECT group_id,title FROM app_sessions WHERE id=%s AND NOT archived",(session_id,)).fetchone()
            if not old:return bad("Mashg‘ulot topilmadi",404)
            title=require_string(data.get("title") or old["title"],"Nomi",120)
            row=conn.execute("INSERT INTO app_sessions(group_id,title,held_on) VALUES(%s,%s,%s) RETURNING id",
                (old["group_id"],title,when)).fetchone()
        return jsonify({"ok":True,"id":row["id"]}),201

    ALLOWED_TYPES={
        "groups":("app_groups","id","title"),
        "students":("app_students","id","full_name"),
        "sessions":("app_sessions","id","title"),
        "notices":("app_notices","id","title")
    }
    @app.get("/api/admin/v2/archive")
    @admin_only
    def v2_archive():
        name=request.args.get("type","students")
        if name not in ALLOWED_TYPES:return bad("Arxiv turi noto‘g‘ri")
        table,pk,title=ALLOWED_TYPES[name]
        with db() as conn:
            # Identifiers are sourced solely from the fixed ALLOWED_TYPES whitelist.
            rows=conn.execute(f"SELECT {pk} AS id,{title} AS title FROM {table} WHERE archived ORDER BY id DESC LIMIT 200").fetchall()
        return jsonify({"type":name,"items":rows})

    @app.post("/api/admin/v2/archive/<name>/<int:row_id>/restore")
    @admin_only
    def v2_restore(name,row_id):
        if name not in ALLOWED_TYPES:return bad("Arxiv turi noto‘g‘ri")
        table=ALLOWED_TYPES[name][0]
        with db() as conn:
            row=conn.execute(f"UPDATE {table} SET archived=FALSE WHERE id=%s AND archived RETURNING id",(row_id,)).fetchone()
        return jsonify({"ok":bool(row)}),200 if row else 404

    @app.get("/api/admin/v2/analytics")
    @admin_only
    def v2_analytics():
        group_id=int_query("group_id")
        date_from=as_date(request.args.get("from"),"Boshlanish sanasi")
        date_to=as_date(request.args.get("to"),"Tugash sanasi")
        if date_from and date_to and date_from>date_to:
            raise ValueError("Boshlanish sanasi tugash sanasidan oldin bo‘lsin")
        where="""WHERE NOT se.archived AND NOT g.archived
          AND (%s::bigint IS NULL OR g.id=%s)
          AND (%s::date IS NULL OR se.held_on >= %s)
          AND (%s::date IS NULL OR se.held_on <= %s)"""
        params=(group_id,group_id,date_from,date_from,date_to,date_to)
        with db() as conn:
            summary=conn.execute("""SELECT
                 count(DISTINCT se.id)::int AS sessions,
                 count(m.id) FILTER (WHERE NOT m.absent)::int AS grades,
                 count(m.id) FILTER (WHERE m.absent)::int AS absences,
                 ROUND(AVG(m.score) FILTER (WHERE NOT m.absent),1)::float8 AS average,
                 count(m.id) FILTER(WHERE NOT m.absent AND m.score >= 80)::int AS high,
                 count(m.id) FILTER(WHERE NOT m.absent AND m.score < 50)::int AS low
                 FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
                 LEFT JOIN app_marks m ON m.session_id=se.id """+where,params).fetchone()
            trend=conn.execute("""SELECT se.held_on,
                 ROUND(AVG(m.score) FILTER (WHERE NOT m.absent),1)::float8 AS average,
                 count(m.id) FILTER (WHERE m.absent)::int AS absences,
                 count(m.id)::int AS marks
                 FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
                 LEFT JOIN app_marks m ON m.session_id=se.id """+where+"""
                 GROUP BY se.held_on ORDER BY se.held_on DESC LIMIT 60""",params).fetchall()
            groups=conn.execute("""SELECT g.id,g.title,sub.title AS subject,
                ROUND(AVG(m.score) FILTER (WHERE NOT m.absent),1)::float8 AS average,
                count(m.id) FILTER(WHERE m.absent)::int AS dq
                FROM app_groups g JOIN app_subjects sub ON sub.id=g.subject_id
                JOIN app_sessions se ON se.group_id=g.id
                LEFT JOIN app_marks m ON m.session_id=se.id """+where+"""
                GROUP BY g.id,sub.title ORDER BY average DESC NULLS LAST""",params).fetchall()
        return jsonify({"summary":summary,"trend":list(reversed(trend)),"groups":groups})

    @app.get("/api/admin/v2/alerts")
    @admin_only
    def v2_alerts():
        with db() as conn:
            students=conn.execute("""SELECT st.id,st.full_name,g.title AS group_title,
                ROUND(AVG(m.score) FILTER(WHERE NOT m.absent),1)::float8 AS average,
                count(m.id) FILTER (WHERE m.absent)::int AS absences,
                count(m.id) FILTER (WHERE NOT m.absent)::int AS scores
                FROM app_students st JOIN app_groups g ON g.id=st.group_id
                LEFT JOIN app_marks m ON m.student_id=st.id AND EXISTS (
                    SELECT 1 FROM app_sessions se WHERE se.id=m.session_id AND NOT se.archived AND se.group_id=st.group_id)
                WHERE NOT st.archived AND NOT g.archived
                GROUP BY st.id,g.id
                HAVING (AVG(m.score) FILTER(WHERE NOT m.absent) < 60)
                    OR (count(m.id) FILTER (WHERE m.absent) >= 2)
                ORDER BY absences DESC,average NULLS LAST LIMIT 100""").fetchall()
            missing=conn.execute("""SELECT se.id,se.title,g.title AS group_title,se.held_on,
                count(st.id)::int AS total_students,
                count(m.id)::int AS marked,
                (count(st.id)-count(m.id))::int AS missing
                FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
                JOIN app_students st ON st.group_id=g.id AND NOT st.archived
                LEFT JOIN app_marks m ON m.session_id=se.id AND m.student_id=st.id
                WHERE NOT se.archived AND NOT g.archived
                GROUP BY se.id,g.title
                HAVING count(st.id)>count(m.id)
                ORDER BY se.held_on DESC LIMIT 30""").fetchall()
        return jsonify({"at_risk":students,"ungraded_sessions":missing})

    @app.get("/api/admin/v2/audit")
    @admin_only
    def v2_audit():
        limit=min(require_int(request.args.get("limit") or 80,"limit"),200)
        with db() as conn:
            rows=conn.execute("""SELECT id,event_type,entity_type,entity_id,description,created_at
                FROM app_audit ORDER BY id DESC LIMIT %s""",(limit,)).fetchall()
        return jsonify({"events":rows})

    @app.get("/api/admin/v2/notices")
    @admin_only
    def v2_all_notices():
        with db() as conn:
            rows=conn.execute("""SELECT n.id,n.title,n.body,n.group_id,g.title AS group_title,
                n.pinned,n.archived,n.publish_at,n.expires_at,n.created_at
                FROM app_notices n LEFT JOIN app_groups g ON g.id=n.group_id
                ORDER BY n.id DESC LIMIT 200""").fetchall()
        return jsonify({"notices":rows})

    @app.post("/api/admin/v2/notices")
    @admin_only
    def v2_new_notice():
        data=request_json()
        title=require_string(data.get("title"),"Sarlavha",120)
        body=require_string(data.get("body"),"Xabar",1000)
        group_id=require_int(data["group_id"],"group_id") if data.get("group_id") else None
        pinned=choose_bool(data.get("pinned",False),"pinned")
        publish_at=as_datetime(data.get("publish_at"),"Chop etish vaqti") or datetime.now(TZ)
        expires_at=as_datetime(data.get("expires_at"),"Tugash vaqti")
        if expires_at and expires_at<=publish_at:raise ValueError("E’lon tugashi chop etish vaqtidan keyin bo‘lsin")
        with db() as conn:
            if group_id:
                if not conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone():
                    return bad("Guruh topilmadi",404)
            row=conn.execute("""INSERT INTO app_notices(title,body,group_id,pinned,publish_at,expires_at)
                VALUES(%s,%s,%s,%s,%s,%s) RETURNING id""",
                (title,body,group_id,pinned,publish_at,expires_at)).fetchone()
        return jsonify({"ok":True,"id":row["id"]}),201

    @app.patch("/api/admin/v2/notices/<int:notice_id>")
    @admin_only
    def v2_edit_notice(notice_id):
        data=request_json()
        with db() as conn:
            old=conn.execute("""SELECT title,body,group_id,pinned,publish_at,expires_at
                FROM app_notices WHERE id=%s""",(notice_id,)).fetchone()
            if not old:return bad("E’lon topilmadi",404)
            title=require_string(data["title"],"Sarlavha",120) if "title" in data else old["title"]
            body=require_string(data["body"],"Xabar",1000) if "body" in data else old["body"]
            group_id=require_int(data["group_id"],"group_id") if data.get("group_id") else None if "group_id" in data else old["group_id"]
            pinned=choose_bool(data["pinned"],"pinned") if "pinned" in data else old["pinned"]
            publish_at=as_datetime(data["publish_at"],"Chop etish vaqti") if "publish_at" in data else old["publish_at"]
            expires_at=as_datetime(data["expires_at"],"Tugash vaqti") if "expires_at" in data else old["expires_at"]
            if expires_at and expires_at<=publish_at:raise ValueError("Tugash vaqti noto‘g‘ri")
            if group_id and not conn.execute("SELECT id FROM app_groups WHERE id=%s AND NOT archived",(group_id,)).fetchone():
                return bad("Guruh topilmadi",404)
            conn.execute("""UPDATE app_notices SET title=%s,body=%s,group_id=%s,pinned=%s,publish_at=%s,expires_at=%s
                WHERE id=%s""",(title,body,group_id,pinned,publish_at,expires_at,notice_id))
        return jsonify({"ok":True})

    def csv_safe(x):
        if x is None:return ""
        value=str(x)
        if value.startswith(("=","+","-","@","\t","\r")):return "'"+value
        return value

    @app.get("/api/admin/v2/export")
    @admin_only
    def v2_export():
        kind=request.args.get("kind","students")
        group_id=int_query("group_id")
        with db() as conn:
            if kind=="students":
                heads=["ID","Fan","Guruh","Ism familiya","Telefon","Izoh","Qabul sanasi"]
                rows=conn.execute("""SELECT st.id,sub.title,g.title,st.full_name,st.phone,st.notes,st.enrolled_at
                    FROM app_students st JOIN app_groups g ON g.id=st.group_id
                    JOIN app_subjects sub ON sub.id=g.subject_id
                    WHERE NOT st.archived AND (%s::bigint IS NULL OR g.id=%s)
                    ORDER BY sub.title,g.title,st.full_name""",(group_id,group_id)).fetchall()
            elif kind=="results" or kind=="attendance":
                heads=["Fan","Guruh","Sana","Mashg‘ulot","O‘quvchi","Ball","DQ"]
                rows=conn.execute("""SELECT sub.title,g.title,se.held_on,se.title,st.full_name,m.score,m.absent
                    FROM app_marks m JOIN app_sessions se ON se.id=m.session_id
                    JOIN app_groups g ON g.id=se.group_id JOIN app_subjects sub ON sub.id=g.subject_id
                    JOIN app_students st ON st.id=m.student_id
                    WHERE NOT se.archived AND (%s::bigint IS NULL OR g.id=%s)
                    ORDER BY se.held_on DESC,g.title,st.full_name""",(group_id,group_id)).fetchall()
            elif kind=="sessions":
                heads=["ID","Fan","Guruh","Mashg‘ulot","Sana"]
                rows=conn.execute("""SELECT se.id,sub.title,g.title,se.title,se.held_on
                    FROM app_sessions se JOIN app_groups g ON g.id=se.group_id
                    JOIN app_subjects sub ON sub.id=g.subject_id
                    WHERE NOT se.archived AND (%s::bigint IS NULL OR g.id=%s)
                    ORDER BY se.held_on DESC""",(group_id,group_id)).fetchall()
            elif kind=="ranking":
                heads=["O‘quvchi","Fan","Guruh","O‘rtacha ball","Topshiriqlar","DQ"]
                rows=conn.execute("""SELECT st.full_name,sub.title,g.title,
                    ROUND(AVG(m.score) FILTER(WHERE NOT m.absent),1),
                    count(m.id) FILTER (WHERE NOT m.absent),
                    count(m.id) FILTER (WHERE m.absent)
                    FROM app_students st JOIN app_groups g ON g.id=st.group_id
                    JOIN app_subjects sub ON sub.id=g.subject_id
                    LEFT JOIN app_marks m ON m.student_id=st.id AND EXISTS (
                        SELECT 1 FROM app_sessions se WHERE se.id=m.session_id AND NOT se.archived AND se.group_id=st.group_id)
                    WHERE NOT st.archived AND (%s::bigint IS NULL OR g.id=%s)
                    GROUP BY st.id,g.id,sub.title ORDER BY avg(m.score) DESC NULLS LAST""",(group_id,group_id)).fetchall()
            else:
                return bad("Hisobot turi noto‘g‘ri")
        output=io.StringIO()
        writer=csv.writer(output,lineterminator="\r\n")
        writer.writerow(heads)
        for row in rows:writer.writerow([csv_safe(v) for v in row.values()])
        resp=make_response("\ufeff"+output.getvalue())
        resp.mimetype="text/csv"
        resp.headers["Content-Type"]="text/csv; charset=utf-8"
        resp.headers["Content-Disposition"]=f'attachment; filename="nur-apk-{kind}-{date.today().isoformat()}.csv"'
        return resp
