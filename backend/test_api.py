"""Integration tests against disposable PostgreSQL CI database."""
import datetime
import hashlib
import os
import unittest

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/nurapk_test")
os.environ["ADMIN_TOKEN_SHA256"] = hashlib.sha256(b"ci-test-admin-secret").hexdigest()
os.environ["SESSION_SECRET"] = "ci-only-session-hmac-key-with-adequate-length"
os.environ["ALLOWED_ORIGINS"] = "https://nur-apk.vercel.app"

from backend.app import app, db


class PremiumAPITests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        res = cls.client.post("/api/admin/login", json={"token": "ci-test-admin-secret"})
        assert res.status_code == 200, res.json
        cls.auth = {"Authorization": "Bearer " + res.json["session"]}

    def request(self, method, path, payload=None, authorized=True):
        return self.client.open(path, method=method, json=payload,
                                headers=self.auth if authorized else {})

    def test_all_admin_and_public_flows(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        bootstrap = self.client.get("/api/bootstrap")
        self.assertEqual(bootstrap.status_code, 200)
        self.assertEqual(len(bootstrap.json["subjects"]), 4)
        self.assertEqual(len(bootstrap.json["groups"]), 7)
        self.assertEqual(self.request("GET", "/api/admin/v2/dashboard", authorized=False).status_code, 401)
        self.assertEqual(self.request("GET", "/api/admin/v2/dashboard").status_code, 200)

        groups = bootstrap.json["groups"]
        a_group, b_group = groups[0]["id"], groups[1]["id"]

        # Private student contacts stay absent from read-only public roster.
        st = self.request("POST", "/api/admin/v2/students",
                          {"group_id": a_group, "full_name": "Anora Niyazova",
                           "phone": "+998901234567", "notes": "Admin only"})
        self.assertEqual(st.status_code, 201, st.json)
        student_id = st.json["id"]
        pub = self.client.get("/api/students?group_id=" + str(a_group))
        self.assertEqual(pub.status_code, 200)
        self.assertNotIn("phone", pub.get_data(as_text=True))
        self.assertNotIn("Admin only", pub.get_data(as_text=True))

        multi = self.request("POST", "/api/admin/v2/students/import",
                             {"group_id": a_group, "students": [
                                 {"full_name": "Azamat Sultanov"},
                                 {"full_name": "Anora Niyazova"}]})
        self.assertEqual(multi.status_code, 200, multi.json)
        self.assertEqual(multi.json["imported"], 1)
        self.assertEqual(multi.json["skipped"], 1)

        today = datetime.date.today().isoformat()
        lesson = self.request("POST", "/api/admin/sessions",
                              {"group_id": a_group, "title": "Sinov", "held_on": today})
        self.assertEqual(lesson.status_code, 201, lesson.json)
        lesson_id = lesson.json["id"]
        students = self.client.get("/api/students?group_id=" + str(a_group)).json["students"]
        self.assertEqual(len(students), 2)
        other_id = next(s["id"] for s in students if s["id"] != student_id)
        marks = self.request("POST", "/api/admin/marks",
                            {"session_id": lesson_id, "marks": [
                                {"student_id": student_id, "score": 87},
                                {"student_id": other_id, "absent": True}]})
        self.assertEqual(marks.status_code, 200, marks.json)
        ranks = self.client.get("/api/ranking?group_id=" + str(a_group))
        self.assertEqual(ranks.status_code, 200, ranks.json)
        self.assertEqual(next(r for r in ranks.json["ranking"] if r["student_id"] == student_id)["average"], 87.0)
        self.assertEqual(next(r for r in ranks.json["ranking"] if r["student_id"] == other_id)["absences"], 1)

        gradebook = self.request("GET", "/api/admin/v2/gradebook/" + str(lesson_id))
        self.assertEqual(gradebook.status_code, 200, gradebook.json)
        self.assertEqual(gradebook.json["missing"], 0)
        self.assertEqual(gradebook.json["students"][1]["graded"], True)
        analytics = self.request("GET", "/api/admin/v2/analytics?group_id=" + str(a_group))
        self.assertEqual(analytics.status_code, 200, analytics.json)
        self.assertEqual(analytics.json["summary"]["average"], 87.0)
        self.assertEqual(analytics.json["summary"]["absences"], 1)

        # Student can be moved and searched by the admin.
        moved = self.request("PATCH", "/api/admin/v2/students/" + str(student_id),
                             {"group_id": b_group, "notes": "Moved group"})
        self.assertEqual(moved.status_code, 200, moved.json)
        found = self.request("GET", "/api/admin/v2/students?group_id=" + str(b_group))
        self.assertEqual(found.status_code, 200)
        self.assertTrue(any(s["id"] == student_id for s in found.json["students"]))

        # Notices respect schedule and group target.
        future = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=2)).isoformat()
        notice = self.request("POST", "/api/admin/v2/notices",
                              {"title": "Future Notice", "body": "Only later",
                               "pinned": True, "publish_at": future, "group_id": b_group})
        self.assertEqual(notice.status_code, 201, notice.json)
        self.assertNotIn("Future Notice", self.client.get("/api/bootstrap").get_data(as_text=True))
        self.assertNotIn("Future Notice", self.client.get("/api/notices?group_id=" + str(b_group)).get_data(as_text=True))
        self.assertIn("Future Notice", self.request("GET", "/api/admin/v2/notices").get_data(as_text=True))

        # Export is admin only, with CSV rows and private contact fields.
        self.assertEqual(self.request("GET", "/api/admin/v2/export?kind=students", authorized=False).status_code, 401)
        report = self.request("GET", "/api/admin/v2/export?kind=students")
        self.assertEqual(report.status_code, 200)
        self.assertIn("Anora Niyazova", report.get_data(as_text=True))
        self.assertIn("+998901234567", report.get_data(as_text=True))

        self.assertEqual(self.request("DELETE", "/api/admin/students/" + str(student_id)).status_code, 200)
        archived = self.request("GET", "/api/admin/v2/archive?type=students")
        self.assertEqual(archived.status_code, 200)
        self.assertTrue(any(s["id"] == student_id for s in archived.json["items"]))
        restored = self.request("POST", "/api/admin/v2/archive/students/" + str(student_id) + "/restore", {})
        self.assertEqual(restored.status_code, 200)
        self.assertTrue(restored.json["ok"])
        history = self.request("GET", "/api/admin/v2/audit")
        self.assertEqual(history.status_code, 200)
        self.assertGreater(len(history.json["events"]), 0)


if __name__ == "__main__":
    unittest.main()
