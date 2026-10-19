# Nur Oqiw Orayi — payment system design (NOT enabled)
The attached Paynet image is a merchant QR payment instruction. A QR image by itself is not a payment API, and does not automatically prove who paid.

## Required production workflow
1. Sign an official merchant/payment acceptance agreement in the registered business's name with Paynet or an approved provider exposing merchant API.
2. Receive provider-verified merchant identifiers, sandbox/test keys, webhook signing secrets and callback URLs from the provider (not from this image).
3. Admin sets fees per subject/group/student as authorized, not the hypothetical 200–350 amounts.
4. Server issues unique `order_id` tied to student/full name, chosen group, amount, currency and expiry. Names alone do not reliably identify a payment; the payer's selected profile/phone/order must be validated.
5. Payment button opens a *provider-hosted payment page* or dynamic provider QR for this `order_id`; never collect card data inside the Nur app.
6. Provider sends a signed server-to-server status notification. Backend verifies signature, merchant, amount, currency, order ID and unique transaction ID, applying idempotency and replay prevention; as a backup, server calls the official transaction-status endpoint.
7. Nur database stores only validated payment status and reference. The public app polls for order status after returning, showing “To‘lov tasdiqlandi” only after backend confirmation, otherwise “Tekshirilmoqda”.
8. Admin-only Payments tab lists payer, matched student, group, amount, time, provider reference, status, reversals/refunds and exports relevant permitted data.
9. Admin reconciliation dashboard investigates incomplete or ambiguous/unmatched payments; never manually infer payment from a screenshot or QR scan.
10. Implement consent, retention and complaint/refund policy before release.

## Never do this
- No fake or guessed webhook API based on Paynet QR screenshot.
- No token, secret or bank data in APK, HTML, git or chat.
- Do not claim a payment is confirmed based on a successful redirect alone.

**Current state:** No payment button, transaction handler, fee or confirmation UI is enabled. Waiting for official Paynet merchant API details and the business's permission.
