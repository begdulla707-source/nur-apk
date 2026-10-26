"""Integration coverage for math results, dense rank, DQ, monthly payments, imports."""
import hashlib
import datetime as dt
from zoneinfo import ZoneInfo
import io
import os
import unittest

os.environ.setdefault("DATABASE_URL","postgresql://test:test@localhost:5432/nurapk_test")
os.environ["ADMIN_TOKEN_SHA256"]=hashlib.sha256(b"ci-test-admin-secret").hexdigest()
os.environ["SESSION_SECRET"]="ci-only-session-hmac-key-with-adequate-length"
os.environ["ALLOWED_ORIGINS"]="https://appassets.androidplatform.net,https://oqiw.vercel.app"

from backend.app import app, db


class MathPortalTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client=app.test_client()
        login=cls.client.post("/api/admin/login",json={"token":"ci-test-admin-secret"})
        assert login.status_code==200, login.json
        cls.auth={"Authorization":"Bearer "+login.json["session"]}

    def test_dense_rank_dq_and_manual_monthly_payment(self):
        self.assertEqual(self.client.post("/api/admin/math/commit",json={}).status_code,401)
        payload={"date":"2026-10-07","title":"Algebra 32",
                 "question_count":32,"entries":[
            {"name":"Samira Test","correct":30,"grade":3},
            {"name":"Amira Test","correct":30,"grade":4},
            {"name":"Bahrom Test","correct":26,"grade":6},
            {"name":"Dilshod Test","status":"dq","grade":5}]}
        r=self.client.post("/api/admin/math/commit",json=payload,headers=self.auth)
        self.assertEqual(r.status_code,201,r.json)
        published=dt.datetime.now(ZoneInfo("Asia/Tashkent")).date().isoformat()
        overview=self.client.get("/api/math/overview?date="+published+"&month="+published[:7]).json
        self.assertEqual(overview["tests"][0]["questions"],32)
        by_name={x["full_name"]:x for x in overview["students"]}
        self.assertEqual(by_name["Samira Test"]["rank"],1)
        self.assertEqual(by_name["Amira Test"]["rank"],1)
        self.assertEqual(by_name["Bahrom Test"]["rank"],2)
        self.assertIsNone(by_name["Dilshod Test"]["rank"])
        self.assertEqual(by_name["Dilshod Test"]["dq"],1)
        self.assertEqual(by_name["Samira Test"]["monthly_points"],30)
        self.assertEqual(by_name["Samira Test"]["attendance_total"],1)

        ident=by_name["Samira Test"]["id"]
        self.assertEqual(self.client.post("/api/admin/math/payment",json={
            "student_id":ident,"month":"2026-10","paid":True,"amount_uzs":250000
        }).status_code,401)
        p=self.client.post("/api/admin/math/payment",headers=self.auth,json={
            "student_id":ident,"month":"2026-10","paid":True,"amount_uzs":250000
        })
        self.assertEqual(p.status_code,200,p.json)
        latest=self.client.get("/api/math/overview?month="+published[:7]+"&date="+published).json
        by_name={x["full_name"]:x for x in latest["students"]}
        self.assertTrue(by_name["Samira Test"]["paid"])
        self.assertFalse(by_name["Amira Test"]["paid"])
        self.assertGreater(latest["revision"],overview["revision"])

        p=self.client.post("/api/admin/math/payment",headers=self.auth,json={
            "student_id":ident,"month":"2026-10","paid":False
        })
        self.assertEqual(p.status_code,200,p.json)
        latest=self.client.get("/api/math/overview?month="+published[:7]+"&date="+published).json
        self.assertFalse(next(x for x in latest["students"] if x["id"]==ident)["paid"])

        # Identical date/title means another test, not a silent overwrite.
        payload["question_count"]=28
        for entry in payload["entries"]:
            if entry.get("correct") is not None:
                entry["correct"]=min(entry["correct"],28)
        second=self.client.post("/api/admin/math/commit",json=payload,headers=self.auth)
        self.assertEqual(second.status_code,201,second.json)
        self.assertNotEqual(second.json["test_id"],r.json["test_id"])
        self.assertTrue(second.json["title"].endswith("(2)"),second.json)
        tests={t["id"]:t for t in self.client.get("/api/math/overview?date="+published).json["tests"]}
        self.assertEqual(tests[r.json["test_id"]]["questions"],32)
        self.assertEqual(tests[second.json["test_id"]]["questions"],28)

        # Missing scores must never be converted silently to zero or DQ.
        payload["date"]="2026-10-08"
        payload["title"]="Unknown score test"
        payload["entries"]=[{"name":"Student Unknown","status":"present","correct":None}]
        self.assertEqual(self.client.post("/api/admin/math/commit",
                 json=payload,headers=self.auth).status_code,400)

    def test_latest_results_follow_last_published_test_not_today(self):
        published=dt.datetime.now(ZoneInfo("Asia/Tashkent")).date().isoformat()
        first={"date":"2026-10-23","title":"Recent dated test",
               "question_count":30,"entries":[{"name":"Newest Test Alpha","correct":20}]}
        second={"date":"2026-10-19","title":"Uploaded later backdated test",
                "question_count":30,"entries":[{"name":"Newest Test Beta","correct":27}]}
        r1=self.client.post("/api/admin/math/commit",json=first,headers=self.auth)
        self.assertEqual(r1.status_code,201,r1.json)
        self.assertEqual(r1.json["uploaded_date"],published)
        r2=self.client.post("/api/admin/math/commit",json=second,headers=self.auth)
        self.assertEqual(r2.status_code,201,r2.json)
        self.assertEqual(r2.json["uploaded_date"],published)
        self.assertNotEqual(r1.json["test_id"],r2.json["test_id"])
        latest=self.client.get("/api/math/overview?date=latest").json
        self.assertEqual(latest["day"],published)
        current=self.client.get("/api/math/overview?date="+published).json
        tests={t["id"]:t for t in current["tests"]}
        self.assertEqual(tests[r1.json["test_id"]]["test_date"],"2026-10-23")
        self.assertEqual(tests[r2.json["test_id"]]["test_date"],"2026-10-19")
        self.assertEqual(tests[r1.json["test_id"]]["uploaded_date"],published)
        self.assertEqual(tests[r2.json["test_id"]]["uploaded_date"],published)
        self.assertEqual(tests[r1.json["test_id"]]["rows"][0]["correct_answers"],20)
        self.assertEqual(tests[r2.json["test_id"]]["rows"][0]["correct_answers"],27)

    def test_bulk_csv_and_excel_preview(self):
        csv_file=b"name,correct,status,grade\nMalika Test,24,present,5\nAli Test,,DQ,4\nUnknown Test,,,3\n"
        payload={"files":[(io.BytesIO(csv_file),"results.csv")]}
        res=self.client.post("/api/admin/math/preview",data=payload,content_type="multipart/form-data",
                 headers=self.auth)
        self.assertEqual(res.status_code,200,res.json)
        rows=res.json["files"][0]["rows"]
        self.assertEqual(len(rows),3)
        self.assertEqual(rows[0]["correct"],24)
        self.assertEqual(rows[1]["status"],"dq")
        self.assertEqual(rows[2]["status"],"unresolved")
        self.assertTrue(res.json["files"][0]["warnings"])
        self.assertEqual(self.client.post("/api/admin/math/preview",
                 data={"files":(io.BytesIO(csv_file),"file.csv")},
                 content_type="multipart/form-data").status_code,401)

        from openpyxl import Workbook
        wb=Workbook();ws=wb.active
        ws.append(["Name","Correct","Status"])
        ws.append(["Sample Student",15,"present"])
        memory=io.BytesIO();wb.save(memory);memory.seek(0)
        result=self.client.post("/api/admin/math/preview",
            data={"files":(memory,"math.xlsx")},content_type="multipart/form-data",headers=self.auth)
        self.assertEqual(result.status_code,200,result.json)
        self.assertEqual(result.json["files"][0]["rows"][0]["correct"],15)

        image=self.client.post("/api/admin/math/preview",
            data={"files":(io.BytesIO(b"not really a picture"),"test.png")},
            content_type="multipart/form-data",headers=self.auth)
        self.assertEqual(image.status_code,200,image.json)
        self.assertEqual(image.json["files"][0]["rows"],[])
        self.assertTrue(image.json["files"][0]["warnings"])


if __name__=="__main__":
    unittest.main()
