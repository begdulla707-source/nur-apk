"""Integration checks for the requested Top 15, administrator publication and profiles."""
import datetime
import hashlib
import os
import unittest

os.environ.setdefault("DATABASE_URL","postgresql://test:test@localhost:5432/nurapk_test")
os.environ.setdefault("ADMIN_TOKEN_SHA256",hashlib.sha256(b"ci-test-admin-secret").hexdigest())
os.environ.setdefault("SESSION_SECRET","ci-only-session-hmac-key-with-adequate-length")
os.environ.setdefault("ALLOWED_ORIGINS","https://nur-apk.vercel.app")
from backend.app import app

class RankingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client=app.test_client()
        r=cls.client.post("/api/admin/login",json={"token":"ci-test-admin-secret"})
        assert r.status_code==200, r.json
        cls.headers={"Authorization":"Bearer "+r.json["session"]}
    def send(self,path,body=None,method="GET",admin=True):
        return self.client.open(path,method=method,json=body,
            headers=self.headers if admin else {})
    def test_ranking_publication_top_profiles_and_period(self):
        subjects=self.client.get("/api/bootstrap").json["subjects"]
        math=next(s for s in subjects if s["code"]=="mat")
        group=self.send("/api/admin/groups",{"subject_id":math["id"],
                 "code":"QA17","title":"QA Ranking Group"},"POST")
        self.assertEqual(group.status_code,201,group.json)
        group_id=group.json["id"]
        r=self.send("/api/admin/v2/students",{"full_name":"Sevara Test Student","group_id":group_id,
               "phone":"+998901234567","notes":"Private admin info"},"POST")
        self.assertEqual(r.status_code,201,r.json)
        student_id=r.json["id"]
        today=datetime.date.today()
        lesson=self.send("/api/admin/sessions",{"group_id":group_id,
                   "title":"Bugungi natija","held_on":today.isoformat()},"POST")
        self.assertEqual(lesson.status_code,201,lesson.json)
        score=self.send("/api/admin/marks",{"session_id":lesson.json["id"],
                   "marks":[{"student_id":student_id,"score":98}]},"POST")
        self.assertEqual(score.status_code,200,score.json)
        anonymous=self.send("/api/admin/ranking/settings",admin=False)
        self.assertEqual(anonymous.status_code,401)
        old=self.send("/api/admin/ranking/settings").json["settings"]
        try:
            settings=self.send("/api/admin/ranking/settings",{"is_published":True,
                     "period_start":today.isoformat(),"period_end":today.isoformat(),
                     "top_limit":15},"PATCH")
            self.assertEqual(settings.status_code,200,settings.json)
            top=self.client.get("/api/top15?group_id="+str(group_id))
            self.assertEqual(top.status_code,200,top.json)
            self.assertEqual(top.json["ranking"][0]["student_id"],student_id)
            self.assertEqual(top.json["ranking"][0]["rank"],1)
            self.assertEqual(top.json["ranking"][0]["average"],98)
            profile=self.client.get("/api/students/"+str(student_id)+"/profile")
            self.assertEqual(profile.status_code,200,profile.json)
            body=profile.get_data(as_text=True)
            self.assertNotIn("998901234567",body)
            self.assertNotIn("Private admin info",body)
            priv=self.send("/api/admin/students/"+str(student_id)+"/performance")
            self.assertEqual(priv.status_code,200,priv.json)
            self.assertEqual(priv.json["summary"]["average"],98)
            self.assertIn("Private admin info",priv.get_data(as_text=True))
            hidden=self.send("/api/admin/ranking/settings",{"is_published":False},"PATCH")
            self.assertEqual(hidden.status_code,200,hidden.json)
            self.assertEqual(self.client.get("/api/ranking").json["ranking"],[])
            self.assertEqual(self.client.get("/api/top15").json["ranking"],[])
            self.assertEqual(self.client.get("/api/students/"+str(student_id)+"/profile").status_code,403)
            invalid=self.send("/api/admin/ranking/settings",{"period_start":"2050-01-10",
                    "period_end":"2050-01-01"},"PATCH")
            self.assertEqual(invalid.status_code,400)
        finally:
            restore=self.send("/api/admin/ranking/settings",{"is_published":old["published"],
               "period_start":old["period_start"],"period_end":old["period_end"],
               "top_limit":old["top_limit"]},"PATCH")
            assert restore.status_code==200,restore.json

if __name__=="__main__":
    unittest.main()
