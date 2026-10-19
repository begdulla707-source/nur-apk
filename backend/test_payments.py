"""Disposable PostgreSQL tests for Paynet QR manual payment verification."""
import datetime as dt
import hashlib
import os
import unittest

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/nurapk_test")
os.environ["ADMIN_TOKEN_SHA256"] = hashlib.sha256(b"ci-test-admin-secret").hexdigest()
os.environ["SESSION_SECRET"] = "ci-only-session-hmac-key-with-adequate-length"
os.environ["ALLOWED_ORIGINS"] = "https://nur-apk.vercel.app,https://appassets.androidplatform.net"
from backend.app import app

class PaymentsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        response=cls.client.post("/api/admin/login",json={"token":"ci-test-admin-secret"})
        assert response.status_code==200,response.json
        cls.auth={"Authorization":"Bearer "+response.json["session"]}

    def req(self,method,path,payload=None,admin=False):
        return self.client.open(path,method=method,json=payload,headers=self.auth if admin else {})

    def test_payment_waits_for_verification(self):
        config=self.req("GET","/api/payments/config")
        self.assertEqual(config.status_code,200,config.json)
        self.assertFalse(config.json["ready"])
        self.assertFalse(config.json["automatic_confirmation"])

        groups=self.client.get("/api/bootstrap").json["groups"]
        group_id=groups[0]["id"]
        example=250000  # Disposable CI database only, never published as a real tariff.
        order_data={"payer_name":"Test Payer","payer_type":"parent",
                    "group_id":group_id,"period":dt.date.today().strftime("%Y-%m")}

        disabled=self.req("POST","/api/payments/orders",order_data)
        self.assertEqual(disabled.status_code,409,disabled.json)
        self.assertEqual(self.req("GET","/api/admin/payments/overview").status_code,401)
        too_early=self.req("PATCH","/api/admin/payments/settings",
              {"enabled":True,"payee_name":"IBIRAYM NURJANOV",
               "payee_verified":False,"qr_enabled":True},admin=True)
        self.assertEqual(too_early.status_code,409,too_early.json)

        tariff=self.req("PUT","/api/admin/payments/tariffs/"+str(group_id),
              {"amount_uzs":example,"active":True},admin=True)
        self.assertEqual(tariff.status_code,200,tariff.json)
        self.assertEqual(tariff.json["amount_uzs"],example)
        settings=self.req("PATCH","/api/admin/payments/settings",
              {"enabled":True,"payee_name":"IBIRAYM NURJANOV",
               "payee_verified":True,"qr_enabled":True},admin=True)
        self.assertEqual(settings.status_code,200,settings.json)
        cfg=self.req("GET","/api/payments/config")
        self.assertTrue(cfg.json["ready"])
        self.assertEqual(cfg.json["groups"][0]["amount_uzs"],example)

        try:
            order=self.req("POST","/api/payments/orders",order_data)
            self.assertEqual(order.status_code,201,order.json)
            self.assertEqual(order.json["status"],"created")
            self.assertTrue(order.json["manual_review"])
            token=order.json["receipt_token"]
            self.assertEqual(len(token),32)
            self.assertEqual(self.req("GET","/api/payments/status?receipt_token=bad").status_code,400)
            before=self.req("GET","/api/payments/status?receipt_token="+token)
            self.assertEqual(before.json["status"],"created")
            transaction="TEST-PAYNET-RECEIPT-1002"
            claim=self.req("POST","/api/payments/claim",
                {"receipt_token":token,"payment_reference":transaction})
            self.assertEqual(claim.status_code,200,claim.json)
            self.assertEqual(claim.json["status"],"submitted")
            pending=self.req("GET","/api/payments/status?receipt_token="+token)
            self.assertEqual(pending.json["status"],"submitted")
            self.assertIsNone(pending.json["confirmed_at"])

            # No public client can approve a transfer.
            wrong=self.req("PATCH","/api/admin/payments/orders/"+str(order.json["order_id"]),
                   {"status":"confirmed","verified_externally":True,
                    "verified_transaction":transaction})
            self.assertEqual(wrong.status_code,401,wrong.json)
            # Admin cannot bypass the explicit real-world verification step.
            unverified=self.req("PATCH","/api/admin/payments/orders/"+str(order.json["order_id"]),
                  {"status":"confirmed","verified_transaction":transaction},admin=True)
            self.assertEqual(unverified.status_code,409,unverified.json)
            mismatch=self.req("PATCH","/api/admin/payments/orders/"+str(order.json["order_id"]),
                   {"status":"confirmed","verified_externally":True,
                    "verified_transaction":"OTHER-PAYNET-TRANSACTION"},admin=True)
            self.assertEqual(mismatch.status_code,409,mismatch.json)
            verified=self.req("PATCH","/api/admin/payments/orders/"+str(order.json["order_id"]),
                  {"status":"confirmed","verified_externally":True,
                   "verified_transaction":transaction},admin=True)
            self.assertEqual(verified.status_code,200,verified.json)
            self.assertEqual(verified.json["status"],"confirmed")
            paid=self.req("GET","/api/payments/status?receipt_token="+token)
            self.assertEqual(paid.json["status"],"confirmed")
            self.assertIsNotNone(paid.json["confirmed_at"])

            listed=self.req("GET","/api/admin/payments/orders?status=confirmed",admin=True)
            self.assertEqual(listed.status_code,200,listed.json)
            self.assertTrue(any(x["order_code"]==order.json["order_code"]
                                for x in listed.json["orders"]))
        finally:
            disabled=self.req("PATCH","/api/admin/payments/settings",
                 {"enabled":False,"qr_enabled":False,"payee_verified":False,
                  "payee_name":"IBIRAYM NURJANOV"},admin=True)
            self.assertEqual(disabled.status_code,200,disabled.json)

if __name__=="__main__":
    unittest.main()
