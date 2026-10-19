"""Published score rankings, top 15 and admin-only student performance.

No phone numbers, admin notes or authentication material are exposed via public
endpoints. This project is separate from the Telegram bot.
"""
from datetime import date
from flask import jsonify, request

def register_ranking(app, db, admin_only, require_int, request_json, bad):
    def get_settings(conn):
        return conn.execute("""SELECT is_published,period_start,period_end,top_limit,updated_at
                               FROM app_ranking_settings WHERE singleton=TRUE""").fetchone()

    def parse_id(name):
        raw=request.args.get(name)
        return require_int(raw,name) if raw else None

    def calculate(conn, settings, *, group_id=None, subject_id=None, limit=500):
        filters=["NOT s.archived","NOT g.archived"]
        values=[
            settings["period_start"], settings["period_start"],
            settings["period_end"], settings["period_end"],
        ]
        if group_id is not None:
            filters.append("g.id=%s")
            values.append(group_id)
        if subject_id is not None:
            filters.append("g.subject_id=%s")
            values.append(subject_id)
        query="""SELECT s.id AS student_id,s.full_name,g.id AS group_id,
            g.title AS group_title,g.subject_id,
            ROUND(AVG(m.score) FILTER (WHERE NOT m.absent),1)::float8 AS average,
            COUNT(m.id) FILTER (WHERE NOT m.absent)::int AS tests,
            COUNT(m.id) FILTER (WHERE m.absent)::int AS absences
            FROM app_students s
            JOIN app_groups g ON g.id=s.group_id
            LEFT JOIN app_marks m ON m.student_id=s.id AND EXISTS (
                SELECT 1 FROM app_sessions se
                WHERE se.id=m.session_id AND se.group_id=g.id AND NOT se.archived
                  AND (%s::date IS NULL OR se.held_on >= %s::date)
                  AND (%s::date IS NULL OR se.held_on <= %s::date)
            )
            WHERE """ + " AND ".join(filters) + """
            GROUP BY s.id,g.id
            ORDER BY average DESC NULLS LAST,tests DESC,s.full_name,s.id
            LIMIT %s"""
        values.append(limit)
        rows=conn.execute(query,values).fetchall()
        ranked=0
        for row in rows:
            if row["tests"]:
                ranked+=1
                row["rank"]=ranked
            else:
                row["rank"]=None
        return rows

    def settings_for_client(settings, *, admin=False):
        info={"published":settings["is_published"],
              "period_start":settings["period_start"],
              "period_end":settings["period_end"],
              "top_limit":settings["top_limit"]}
        if admin:info["updated_at"]=settings["updated_at"]
        return info

    @app.get("/api/ranking")
    def public_ranking():
        group_id=parse_id("group_id")
        subject_id=parse_id("subject_id")
        with db() as conn:
            config=get_settings(conn)
            if not config["is_published"]:
                return jsonify({"ranking":[],"settings":settings_for_client(config)})
            ranking=calculate(conn,config,group_id=group_id,subject_id=subject_id)
        return jsonify({"ranking":ranking,"settings":settings_for_client(config)})

    @app.get("/api/top15")
    def top15():
        group_id=parse_id("group_id")
        subject_id=parse_id("subject_id")
        with db() as conn:
            config=get_settings(conn)
            if not config["is_published"]:
                return jsonify({"ranking":[],"settings":settings_for_client(config)})
            # Query the full ranking first to keep global ranks consistent.
            ranking=calculate(conn,config,group_id=group_id,subject_id=subject_id)
            rows=[x for x in ranking if x["rank"] is not None][:config["top_limit"]]
        return jsonify({"ranking":rows,"settings":settings_for_client(config)})

    @app.get("/api/students/<int:student_id>/profile")
    def public_profile(student_id):
        with db() as conn:
            config=get_settings(conn)
            if not config["is_published"]:
                return bad("Reyting hozircha e’lon qilinmagan",403)
            top=calculate(conn,config)
            selected=next((x for x in top if x["student_id"]==student_id
                          and x["rank"] is not None and x["rank"]<=config["top_limit"]),None)
            if selected is None:
                return bad("Top o‘quvchi profili topilmadi",404)
            records=conn.execute("""SELECT se.held_on,se.title AS session_title,
                     m.absent,m.score::float8 AS score
                     FROM app_marks m JOIN app_sessions se ON se.id=m.session_id
                     WHERE m.student_id=%s AND se.group_id=%s AND NOT se.archived
                       AND (%s::date IS NULL OR se.held_on >= %s::date)
                       AND (%s::date IS NULL OR se.held_on <= %s::date)
                     ORDER BY se.held_on DESC,se.id DESC LIMIT 80""",
                    (student_id,selected["group_id"],config["period_start"],config["period_start"],
                     config["period_end"],config["period_end"])).fetchall()
        return jsonify({"student":selected,"results":records,
                        "settings":settings_for_client(config)})

    @app.get("/api/admin/ranking/settings")
    @admin_only
    def admin_ranking_settings():
        with db() as conn:
            info=get_settings(conn)
            rows=calculate(conn,info)
        return jsonify({"settings":settings_for_client(info,admin=True),
                        "top15":[x for x in rows if x["rank"] is not None][:info["top_limit"]]})

    @app.patch("/api/admin/ranking/settings")
    @admin_only
    def admin_update_ranking_settings():
        data=request_json()
        with db() as conn:
            old=get_settings(conn)
            if "is_published" in data and not isinstance(data["is_published"],bool):
                return bad("Reytingni e’lon qilish qiymati noto‘g‘ri")
            published=data.get("is_published",old["is_published"])
            def as_date(v,name):
                if v in (None,""):return None
                if not isinstance(v,str):raise ValueError(name+" sana ko‘rinishida bo‘lishi kerak")
                try:return date.fromisoformat(v)
                except ValueError:raise ValueError(name+" sanasi noto‘g‘ri")
            start=as_date(data["period_start"],"Boshlanish") if "period_start" in data else old["period_start"]
            end=as_date(data["period_end"],"Tugash") if "period_end" in data else old["period_end"]
            if start and end and start>end:
                return bad("Boshlanish sanasi tugash sanasidan oldin bo‘lishi kerak")
            top_limit=old["top_limit"]
            if "top_limit" in data:
                top_limit=require_int(data["top_limit"],"top_limit")
                if top_limit>50:return bad("Top chegarasi 1–50 oralig‘ida")
            info=conn.execute("""UPDATE app_ranking_settings SET is_published=%s,
                period_start=%s,period_end=%s,top_limit=%s,updated_at=now()
                WHERE singleton=TRUE RETURNING is_published,period_start,period_end,
                top_limit,updated_at""",(published,start,end,top_limit)).fetchone()
        return jsonify({"ok":True,"settings":settings_for_client(info,admin=True)})

    @app.get("/api/admin/students/<int:student_id>/performance")
    @admin_only
    def admin_student_performance(student_id):
        with db() as conn:
            profile=conn.execute("""SELECT s.id,s.full_name,s.group_id,s.phone,s.notes,
                s.enrolled_at,g.title AS group_title,sub.title AS subject_title
                FROM app_students s JOIN app_groups g ON g.id=s.group_id
                JOIN app_subjects sub ON sub.id=g.subject_id
                WHERE s.id=%s AND NOT s.archived""",(student_id,)).fetchone()
            if not profile:return bad("O‘quvchi topilmadi",404)
            results=conn.execute("""SELECT se.held_on,se.title AS session_title,
                g.title AS group_title,m.absent,m.score::float8 AS score
                FROM app_marks m JOIN app_sessions se ON se.id=m.session_id
                JOIN app_groups g ON g.id=se.group_id
                WHERE m.student_id=%s AND NOT se.archived
                ORDER BY se.held_on DESC,se.id DESC LIMIT 200""",(student_id,)).fetchall()
        scores=[r["score"] for r in results if not r["absent"] and r["score"] is not None]
        return jsonify({"student":profile,"results":results,
            "summary":{"assessments":len(scores),"average":round(sum(scores)/len(scores),1) if scores else None,
                       "dq":sum(1 for r in results if r["absent"])}})
