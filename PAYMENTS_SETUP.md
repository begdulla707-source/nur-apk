# Nur oqiw orayi — Paynet to‘lov sozlamalari

Bu loyiha **Telegram botdan to‘liq alohida**. Ilova Android'da ham, `nur-apk.vercel.app` saytida ham ishlashi uchun yaratilgan.

## Hozir tayyor

- Bosh menyudan **To‘lovlar** bo‘limiga kirish.
- O‘quvchining ism-familiyasi, **ota-ona / o‘quvchi**, guruh va to‘lov oyini tanlash.
- Har bir guruh uchun to‘lov summasini admin belgilashi (hech qanday avtomatik 200–350 ming tarif yo‘q).
- Paynet QR (foydalanuvchi yuborgan rasm bilan **bir xil QR mazmuni**; qayta generatsiya qilingan va QR skanerda tekshirilgan).
- Maxfiy receipt token bilan to‘lov holatini tekshirish.
- To‘lovdan keyin Paynet **operatsiya raqamini** yuborish.
- Admin panel → **To‘lovlar**: to‘lovlar ro‘yxati, davr, guruh, summa, qaysi o‘quvchi to‘layotgani.
- Admin Paynetdagi **haqiqiy kirimni mustaqil tekshirgandan so‘ng** tasdiqlashi.
- Foydalanuvchida `To‘lov tasdiqlandi` holati faqat shundan keyin chiqishi.

## Xavfsiz ishga tushirish — 1 dan

1. Admin panelga maxfiy token bilan kiring.
2. **To‘lovlar → Guruhlar uchun narxlar** bo‘limida real tariflarni yozing.
3. Paynet QR rasmi ostidagi oluvchi: **IBIRAYM NURJANOV**. Bu hisobga to‘lov qabul qilish vakolati Nur oqiw orayiga tegishli ekanini **mustaqil tekshiring**. Agar hisob noto‘g‘ri bo‘lsa, **to‘lovni faollashtirmang** va QRni almashtiring.
4. Admin sozlamalaridagi 3 ta tasdiqni faqat to‘g‘ri ekaniga ishongach belgilang: oluvchi tasdiqlandi, QR tekshirildi, to‘lov qabul qilish faollashtirildi.
5. O‘quvchi to‘lov so‘rovi yaratadi, QR orqali real Paynet to‘lovi qiladi va chekdagi operatsiya raqamini yozadi.
6. Admin **haqiqiy Paynet hisobotidagi tranzaksiya raqami va summani solishtirib**, tasdiqlaydi. Chatdagi skrinshot yoki shunchaki “to‘ladim” degan xabarga qarab tasdiqlamang.

## Nima uchun avtomatik to‘lov hali yo‘q?

Oddiy Paynet QR ni ko‘rsatish orqali kim to‘laganini va pul tushganini ishonchli avtomatik bilib bo‘lmaydi. Rasmiy **Paynet UWS Connector** (yoki merchant bilan kelishilgan boshqa biznes-integratsiya) talab qilinadi. UWS Paynet serveri tomonidan `GetInformation`, `PerformTransaction`, `CheckTransaction`, `CancelTransaction` kabi so‘rovlarni imzolangan/autentifikatsiyalangan kanal bilan yuborishni nazarda tutadi.

Official docs: https://paynet.uz/developer-guide/en.html

Muhim: ishlab chiqarish rejimida Paynet merchant bilan shartnoma, xizmat ID, to‘lov identifikatorlari, IP cheklash, idempotent tranzaksiyalar va reconciliation kerak. Ular yo‘qligida API hech qachon o‘z-o‘zidan `confirmed` qilmaydi.

## Maxfiylik

- Baza va admin token Android APK yoki HTML ichida saqlanmaydi.
- Oddiy foydalanuvchi boshqa odam to‘lovlarini ko‘rmaydi.
- Faqat admin pullar va ma'lumotlarni ko‘radi.
- Maxfiy receipt tokenni boshqalarga bermang.
- To‘lov bo‘limi **default holatda o‘chiq** (enabled=false); uni admin o‘zi yoqadi.

## Narxlar

O‘quvchiga ko‘rsatiladigan summa serverdagi faollashtirilgan guruh tarifidan olinadi. Server har bir buyurtma uchun summani alohida snapshot saqlaydi: narx keyin o‘zgartirilsa eski buyurtma summasi o‘zgarmaydi.

## APK

Rasmiy Android APK GitHub Actions orqali **Gradle** yordamida yig‘iladi, qo‘lda patch qilinmaydi. Icon va pastki 3 ta nav belgisi o‘zgarmagan. Matematika M4 koordinata, Fizika F3 elektr SVG belgilari qo‘shilgan.
