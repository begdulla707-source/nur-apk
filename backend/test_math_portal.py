"""Integration coverage for math results, dense rank, DQ, monthly payments, imports."""
import hashlib
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
        overview=self.client.get("/api/math/overview?date=2026-10-07&month=2026-10").json
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
        latest=self.client.get("/api/math/overview?month=2026-10&date=2026-10-07").json
        by_name={x["full_name"]:x for x in latest["students"]}
        self.assertTrue(by_name["Samira Test"]["paid"])
        self.assertFalse(by_name["Amira Test"]["paid"])
        self.assertGreater(latest["revision"],overview["revision"])

        p=self.client.post("/api/admin/math/payment",headers=self.auth,json={
            "student_id":ident,"month":"2026-10","paid":False
        })
        self.assertEqual(p.status_code,200,p.json)
        latest=self.client.get("/api/math/overview?month=2026-10&date=2026-10-07").json
        self.assertFalse(next(x for x in latest["students"] if x["id"]==ident)["paid"])

        # Changing the question count for the same dated test is rejected.
        payload["question_count"]=28
        for entry in payload["entries"]:
            if entry.get("correct") is not None:
                entry["correct"]=min(entry["correct"],28)
        self.assertEqual(self.client.post("/api/admin/math/commit",
                 json=payload,headers=self.auth).status_code,409)

        # Missing scores must never be converted silently to zero or DQ.
        payload["date"]="2026-10-08"
        payload["title"]="Unknown score test"
        payload["entries"]=[{"name":"Student Unknown","status":"present","correct":None}]
        self.assertEqual(self.client.post("/api/admin/math/commit",
                 json=payload,headers=self.auth).status_code,400)

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
