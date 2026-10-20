"""Independent app contact inbox regression test (temporary CI PostgreSQL only)."""
import hashlib
import os
import unittest
os.environ.setdefault("DATABASE_URL","postgresql://test:test@localhost:5432/nurapk_test")
os.environ["ADMIN_TOKEN_SHA256"]=hashlib.sha256(b"ci-test-admin-secret").hexdigest()
os.environ["SESSION_SECRET"]="ci-only-session-hmac-key-with-adequate-length"
os.environ["ALLOWED_ORIGINS"]="https://nur-apk.vercel.app,https://appassets.androidplatform.net"
from backend.app import app

class ContactTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client=app.test_client()
        r=cls.client.post("/api/admin/login",json={"token":"ci-test-admin-secret"})
        assert r.status_code==200,r.json
        cls.header={"Authorization":"Bearer "+r.json["session"]}
    def test_submissions_and_admin_inbox(self):
        data={"full_name":"Test Student","sender_type":"student","subject_code":"mat",
            "message":"Assalomu alaykum, jadvalni bilmoqchiman"}
        r=self.client.post("/api/contact",json=data)
        self.assertEqual(r.status_code,201,r.json)
        id=r.json["reference"]
        ticket=r.json.get("reply_ticket")
        self.assertTrue(isinstance(ticket,str) and len(ticket)>=40)
        empty=self.client.post("/api/notifications/sync",json={"tickets":[]})
        self.assertEqual(empty.status_code,200,empty.json)
        self.assertFalse(empty.json["replies"])
        no_ownership=self.client.post("/api/notifications/sync",
                json={"tickets":["a"*43]})
        self.assertEqual(no_ownership.status_code,200,no_ownership.json)
        self.assertFalse(no_ownership.json["replies"])
        self.assertEqual(self.client.post("/api/notifications/sync",json={"tickets":["bad"]}).status_code,400)
        self.assertEqual(self.client.post("/api/admin/inbox/"+str(id)+"/reply",
                 json={"message":"Salom, bu sizga javob"}).status_code,401)
        reply=self.client.post("/api/admin/inbox/"+str(id)+"/reply",
                 json={"message":"Salom, bu sizga javob"},headers=self.header)
        self.assertEqual(reply.status_code,201,reply.json)
        mine=self.client.post("/api/notifications/sync",json={"tickets":[ticket]})
        self.assertEqual(mine.status_code,200,mine.json)
        self.assertTrue(any(x["reference"]==id for x in mine.json["replies"]))
        self.assertFalse(any(x["reference"]==id for x in empty.json["replies"]))
        self.assertEqual(self.client.get("/api/admin/inbox").status_code,401)
        inbox=self.client.get("/api/admin/inbox",headers=self.header)
        self.assertEqual(inbox.status_code,200,inbox.json)
        self.assertTrue(any(x["id"]==id for x in inbox.json["messages"]))
        self.assertNotIn("Test Student",self.client.get("/api/bootstrap").get_data(as_text=True))
        self.assertEqual(self.client.post("/api/contact",json={"full_name":"Anon","sender_type":"student","message":"Hello!"}).status_code,400)
        self.assertEqual(self.client.post("/api/contact",json={"full_name":"Anon","sender_type":"parent","message":"Question!"}).status_code,201)
        updated=self.client.patch("/api/admin/inbox/"+str(id),headers=self.header,json={"is_read":True})
        self.assertEqual(updated.status_code,200,updated.json)
        self.assertEqual(self.client.patch("/api/admin/inbox/"+str(id),json={"archived":True}).status_code,401)
        archived=self.client.patch("/api/admin/inbox/"+str(id),headers=self.header,json={"archived":True})
        self.assertEqual(archived.status_code,200,archived.json)
        self.assertFalse(any(x["id"]==id for x in self.client.get("/api/admin/inbox",headers=self.header).json["messages"]))

if __name__=="__main__":
    unittest.main()
