/* Nur locale engine: exact UX translations and live DOM updates.
   Languages: UZ, EN, RU, QQ (Qaraqalpaq Latin). Student data is not translated. */
(() => {
'use strict';
const table=[
["TA’LIM MARKAZI","EDUCATION CENTER","УЧЕБНЫЙ ЦЕНТР","OQÍW ORAYÍ"],
["Har bir qadam —","Every step —","Каждый шаг —","Hár bir qádem —"],
["yangi imkoniyat.","a new opportunity.","новая возможность.","jańa imkaniyat."],
["Har bir qadam — yangi imkoniyat.","Every step is a new opportunity.","Каждый шаг — новая возможность.","Hár bir qádem — jańa imkaniyat."],
["O‘rganing, rivojlaning va natijalaringizni kuzatib boring.","Learn, improve and track your progress.","Учитесь, развивайтесь и следите за успехами.","Úyreniń, rawajlanıń hám nátiyjelerińizdi baqlap barıń."],
["JAMI O‘QUVCHILAR","TOTAL STUDENTS","ВСЕГО УЧЕНИКОВ","BARLÍQ OQÍWSHÍLAR"],
["Baza kutilmoqda","Waiting for data","Ожидание данных","Maǵlıwmat kútilmekte"],
["FANLAR","SUBJECTS","ПРЕДМЕТЫ","PÁNLER"],
["Ta’lim yo‘nalishi","Study subject","Учебное направление","Oqıw baǵdarı"],
["Ta’lim yo‘nalishlari","Study subjects","Направления обучения","Oqıw baǵdarları"],
["Fan tanlang","Choose subject","Выберите предмет","Pándi tańlań"],
["Matematika","Mathematics","Математика","Matematika"],
["Fizika","Physics","Физика","Fizika"],
["Rus tili","Russian","Русский язык","Rus tili"],
["Ingliz tili","English","Английский язык","Inglis tili"],
["Ma’lumotlar tayyorlanmoqda","Information coming soon","Информация готовится","Maǵlıwmat tayarlanbaqta"],
["7 ta o‘quv guruhi","7 study groups","7 учебных групп","7 oqıw toparı"],
["Ma’lumot uchun","Information","Информация","Maǵlıwmat"],
["Reyting va natijalar xavfsiz bazaga ulangach avtomatik yangilanadi.","Ratings and results update when the secure server is connected.","Рейтинг и результаты обновятся после подключения защищённого сервера.","Reyting hám nátiyjeler qáwipsiz serverge jalǵanǵannan keyin jańalanadı."],
["Bosh menyu","Home","Главная","Bas bet"],
["← Bosh menyu","← Home","← Главная","← Bas bet"],
["Reyting","Ranking","Рейтинг","Reyting"],
["Natijalar","Results","Результаты","Nátiyjeler"],
["O‘quvchilarning o‘zlashtirish ko‘rsatkichlari.","Student performance and rankings.","Рейтинг успеваемости учеников.","Oqıwshılardıń ózlestiriw kórsetkishleri."],
["Mashg‘ulotlar va testlar bo‘yicha natijalar.","Lesson and assessment results.","Результаты занятий и контрольных.","Sabaqlar hám baqlaw nátiyjeleri."],
["Hozircha reyting ma’lumotlari mavjud emas. Administrator natijalarni kiritgach, reyting avtomatik ko‘rsatiladi.","No ranking data yet. Rankings appear after the administrator enters results.","Данных рейтинга пока нет. Они появятся после внесения результатов администратором.","Házir reyting maǵlıwmatı joq. Admin nátiyjelerdi kirgizgennen keyin kórinedi."],
["Hozircha natijalar joylanmagan. Administrator ma’lumot kiritgach, natijalarni shu yerda ko‘rasiz.","No results yet. They appear here after the administrator enters them.","Результатов пока нет. Они появятся здесь после внесения администратором.","Házir nátiyjeler joq. Admin kirgizgennen keyin usı jerde kóresiz."],
["Matematika guruhlari","Mathematics groups","Группы математики","Matematika toparları"],
["Guruhni tanlang.","Select a group.","Выберите группу.","Topardı tańlań."],
["Guruhni ochish","Open group","Открыть группу","Topardı ashıw"],
["← Guruhlarga qaytish","← Back to groups","← К группам","← Toparlarǵa qaytıw"],
["O‘quvchilar ro‘yxati va guruh natijalari.","Group students and results.","Список учеников и результаты группы.","Topar oqıwshıları hám nátiyjeleri."],
["O‘quvchilar ro‘yxati tez orada qo‘shiladi.","The student list will appear soon.","Список учеников скоро появится.","Oqıwshılar dizimi jaqında qosıladı."],
["Fan bo‘yicha ma’lumotlar.","Subject information.","Информация о предмете.","Pán boyınsha maǵlıwmat."],
["Bu fan bo‘yicha guruhlar hali yaratilmagan.","No groups have been created for this subject.","По этому предмету группы ещё не созданы.","Bul pán boyınsha toparlar ele jaratılmaǵan."],
["Administrator","Administrator","Администратор","Administrator"],
["Boshqaruv paneli faqat tasdiqlangan administratorlarga ochiladi.","The dashboard is available only to authorized administrators.","Панель доступна только авторизованным администраторам.","Basqarıw paneli tek ruxsatlı administratorlar ushın."],
["Xavfsiz kirish tizimi serverda sozlanmoqda. Bu versiyada admin huquqlari berilmaydi, maxfiy tokenlar saqlanmaydi.","Secure sign-in is being configured. No administrator secrets are stored in this app.","Безопасный вход настраивается на сервере. Секреты администратора в приложении не хранятся.","Qáwipsiz kiriw serverde sazlanbaqta. Admin sırlari qosımshada saqlanbaydı."],
["Tezkor menyu","Quick menu","Быстрое меню","Tez menyu"],
["Ilova sozlamalarini shu yerdan boshqaring.","Manage application settings here.","Настройки приложения находятся здесь.","Qosımsha sazlamaların usı jerde basqarıń."],
["Tungi rejim","Dark mode","Тёмная тема","Qarańǵı rejim"],
["Til","Language","Язык","Til"],
["Admin panelga kirish →","Open admin panel →","Войти в админ-панель →","Admin panelge kiriw →"],
["Admin panelga kirish","Admin sign-in","Вход администратора","Admin kiriwi"],
["Til tanlovi prototipda. To‘liq tarjimalar keyingi bosqichda qo‘shiladi.","Choose your language.","Выберите язык интерфейса.","Interfeys tilin tańlań."],
["Yuklanmoqda...","Loading...","Загрузка...","Júklenbekte..."],
["Bu fan bo‘yicha guruh yaratilmagan.","No group exists for this subject.","По этому предмету нет групп.","Bul pán boyınsha topar joq."],
["Bu guruhga hali o‘quvchi qo‘shilmagan.","No students in this group yet.","В этой группе пока нет учеников.","Bul toparǵa ele oqıwshı qosılmaǵan."],
["E’lonlar","Announcements","Объявления","Daǵazalar"],
["Yangiliklar","News","Новости","Jańalıqlar"],
["Barchasi","All","Все","Barlıǵı"],
["Reyting yuklanmoqda...","Loading ranking...","Загрузка рейтинга...","Reyting júklenbekte..."],
["Reyting hozircha administrator tomonidan e’lon qilinmagan.","The administrator has not published the ranking yet.","Администратор ещё не опубликовал рейтинг.","Administrator reytingti ele járiyalamaǵan."],
["Hozircha baholangan o‘quvchilar yo‘q.","No graded students yet.","Оценённых учеников пока нет.","Ele bahalanǵan oqıwshı joq."],
["Profilni ko‘rish","View profile","Открыть профиль","Profildi kóriw"],
["Natijalar yuklanmoqda...","Loading results...","Загрузка результатов...","Nátiyjeler júklenbekte..."],
["Hozircha natijalar yo‘q.","No results available yet.","Результатов пока нет.","Ele nátiyjeler joq."],
["Panel","Dashboard","Панель","Basqarıw"],
["Guruhlar","Groups","Группы","Toparlar"],
["O‘quvchilar","Students","Ученики","Oqıwshılar"],
["Mashg‘ulot","Lesson","Занятие","Sabaq"],
["Mashg‘ulotlar","Lessons","Занятия","Sabaqlar"],
["Baholar","Grades","Оценки","Bahalar"],
["Davomat","Attendance","Посещаемость","Qatnasıw"],
["Tahlil","Analytics","Аналитика","Tallaw"],
["Profil","Profile","Профиль","Profil"],
["Arxiv","Archive","Архив","Arxiv"],
["Tarix","History","История","Tarıyx"],
["Xavfsizlik","Security","Безопасность","Qáwipsizlik"],
["Boshqaruv paneli","Dashboard","Панель управления","Basqarıw paneli"],
["Admin token bilan kirish","Sign in with admin token","Вход по токену администратора","Admin token menen kiriw"],
["Maxfiy admin token","Secret administrator token","Секретный токен администратора","Jasırın admin token"],
["Admin tokenni kiriting","Enter admin token","Введите токен администратора","Admin tokendi kirgiziń"],
["Xavfsiz kirish","Secure sign-in","Безопасный вход","Qáwipsiz kiriw"],
["Token ilova kodida saqlanmaydi; kirgandan keyin vaqtinchalik sessiya ishlatiladi.","The token is not saved in app code; a temporary session is used after sign-in.","Токен не хранится в коде приложения; после входа используется временная сессия.","Token qosımsha kodında saqlanbaydı; kirgennen keyin waqıtsha sessiya isletiledi."],
["Boshqaruv paneli yuklanmoqda...","Loading admin dashboard...","Загрузка панели администратора...","Admin paneli júklenbekte..."],
["Chiqish","Sign out","Выйти","Shıǵıw"],
["Seansdan chiqish","Log out","Выйти из сеанса","Sessiyadan shıǵıw"],
["Guruh qo‘shish","Add group","Добавить группу","Topar qosıw"],
["Fan","Subject","Предмет","Pán"],
["Guruh kodi","Group code","Код группы","Topar kodı"],
["Masalan: K","Example: K","Например: K","Mısalı: K"],
["Guruh nomi","Group name","Название группы","Topar atı"],
["Masalan: K guruhi","Example: Group K","Например: группа K","Mısalı: K toparı"],
["Guruhni saqlash","Save group","Сохранить группу","Topardı saqlaw"],
["Nomini o‘zgartirish","Rename","Переименовать","Atın ózgertiw"],
["Arxivlash","Archive","В архив","Arxivlaw"],
["O‘quvchi qo‘shish","Add student","Добавить ученика","Oqıwshı qosıw"],
["Ism va familiya","Full name","Имя и фамилия","Atı hám familiyası"],
["Ism Familiya","Full Name","Имя Фамилия","Atı Familiyası"],
["O‘quvchini saqlash","Save student","Сохранить ученика","Oqıwshını saqlaw"],
["Guruh o‘quvchilari","Group students","Ученики группы","Topar oqıwshıları"],
["Bu guruhda o‘quvchi yo‘q.","No students in this group.","В этой группе нет учеников.","Bul toparda oqıwshı joq."],
["Tahrirlash","Edit","Изменить","Ózgertiw"],
["Tahrir","Edit","Изменить","Ózgertiw"],
["Avval mashg‘ulot yarating.","Create a lesson date first.","Сначала создайте занятие.","Áweli sabaq kúnin jaratıń."],
["Bu guruhga avval o‘quvchi qo‘shing.","Add students to the group first.","Сначала добавьте учеников в группу.","Áweli toparǵa oqıwshı qosıń."],
["Ball 0–100. DQ — dars qoldirdi. Bo‘sh qoldirilgan qatorlar saqlanmaydi.","Score 0–100. DQ means absent. Empty rows are skipped.","Баллы 0–100. DQ — пропуск занятия. Пустые строки не сохраняются.","Ball 0–100. DQ — sabaqqa kelmedi. Bos qatarlar saqlanbaydı."],
["Ball","Score","Балл","Ball"],
["Natija kuni qo‘shish","Add result date","Добавить дату результатов","Nátiyje kúnin qosıw"],
["Natijalarni kiritish / tahrirlash","Enter / edit grades","Внести / изменить оценки","Bahaların kirgiziw / ózgertiw"],
["Mashg‘ulotni tanlang.","Select lesson.","Выберите занятие.","Sabaqtı tańlań."],
["Natijalarni saqlash","Save results","Сохранить результаты","Nátiyjelerdi saqlaw"],
["Natijalarni ochish","View results","Открыть результаты","Nátiyjelerdi ashıw"],
["Bildirishnoma / e’lon","Notification / announcement","Уведомление / объявление","Xabar / daǵaza"],
["Sarlavha","Title","Заголовок","Atama"],
["Xabar","Message","Сообщение","Xabar"],
["Hammaga e’lon qilish","Publish to all","Опубликовать всем","Barlıǵına járiyalaw"],
["Bu e’lon ilova ichida ko‘rinadi. Telefon push xabarlari alohida sozlanadi.","This notice appears in the app. Phone push alerts are configured separately.","Объявление видно в приложении. Push-уведомления настраиваются отдельно.","Bul daǵaza qosımshada kórinedi. Telefon push xabarları bólek sazlanadı."],
["Administratorga xush kelibsiz","Welcome, administrator","Добро пожаловать, администратор","Xosh keldińiz, administrator"],
["Ma’lumotlar saqlandi","Saved successfully","Данные сохранены","Maǵlıwmat saqlandı"],
["Kamida bitta ball yoki DQ kiriting","Enter at least one score or DQ","Введите хотя бы один балл или DQ","Keminde bir ball yamasa DQ kirgiziń"],
["Yangi nomini kiriting:","Enter a new name:","Введите новое имя:","Jańa atın kirgiziń:"],
["Nom yangilandi","Name updated","Имя изменено","Atı jańalandı"],
["Arxivlandi","Archived","Перенесено в архив","Arxivlandı"],
["Bu elementni arxivlamoqchimisiz? Oldingi ma’lumotlar saqlanadi.","Archive this item? Previous records will be kept.","Перенести элемент в архив? Старые записи сохранятся.","Bul elementti arxivlaysız ba? Aldınǵı jazıwlar saqlanadı."],
["Avval administrator sifatida kiring","Please sign in as administrator first","Сначала войдите как администратор","Áweli administrator bolıp kiriń"],
["Server xatosi:","Server error:","Ошибка сервера:","Server qáteligi:"],
["Server javobi kechikyapti. Qayta urinib ko‘ring","Server response is delayed. Please retry.","Сервер отвечает слишком долго. Повторите попытку.","Server juwabı keshigip atır. Qayta urınıń."],
["Serverga ulanish yo‘q. Internet yoki API sozlamalarini tekshiring","Cannot connect to server. Check internet or API settings.","Нет связи с сервером. Проверьте интернет или API.","Serverge baylanıs joq. Internet yamasa API sazlawın tekseriń."],
["Xizmat vaqtincha mavjud emas.","Service temporarily unavailable.","Сервис временно недоступен.","Xızmet waqıtsha islemeydi."],
["Ma’lumotlar serverga ulanmagan. Bo‘limlarni ko‘rish mumkin.","Data server is offline. You can still browse the screens.","Сервер данных недоступен. Экраны можно просматривать.","Maǵlıwmat serveri islemeydi. Bólimlerdi kóriw múmkin."]
];
const additional=[
["Dashboard Pro","Dashboard Pro","Панель Pro","Basqarıw Pro"],
["O‘quvchilar umumiy soni","Total students","Всего учеников","Barlıq oqıwshılar sanı"],
["Guruhlar statistikasi","Group statistics","Статистика групп","Toparlar statistikası"],
["O‘quvchini tahrirlash","Edit student","Изменить ученика","Oqıwshını ózgertiw"],
["O‘quvchini arxivlash va tiklash","Archive / restore student","Архивирование и восстановление ученика","Oqıwshını arxivlaw hám qaytarıw"],
["Guruh yaratish","Create group","Создать группу","Topar jaratıw"],
["Guruhlarni boshqarish","Manage groups","Управление группами","Toparlardı basqarıw"],
["O‘quvchini boshqa guruhga ko‘chirish","Move student to another group","Перевести ученика в другую группу","Oqıwshını basqa toparǵa ótkeriw"],
["Ball kiritish","Enter score","Ввести балл","Ball kirgiziw"],
["Ballni tahrirlash","Edit score","Исправить балл","Baldı ózgertiw"],
["Davomat nazorati — DQ","Attendance and absences (DQ)","Посещаемость и пропуски (DQ)","Qatnasıw hám sabaq qaldırıw (DQ)"],
["Avtomatik reyting","Automatic ranking","Автоматический рейтинг","Avtomat reyting"],
["Reyting davri va e’lonini boshqarish","Ranking period and publication","Период и публикация рейтинга","Reyting dáwiri hám járiyalawı"],
["Top 15 o‘quvchi","Top 15 students","Топ-15 учеников","Top 15 oqıwshı"],
["O‘quvchi premium profili","Student premium profile","Премиум-профиль ученика","Oqıwshı premium profili"],
["Bildirishnomalar va e’lonlar","Notifications and announcements","Уведомления и объявления","Xabarlar hám daǵazalar"],
["Statistika Pro","Analytics Pro","Статистика Pro","Statistika Pro"],
["Admin xavfsizligi — token va amallar tarixi","Admin security — token and activity log","Безопасность администратора — токен и журнал действий","Admin qáwipsizligi — token hám ámeller tarıyxı"],
["O‘rtacha ball","Average score","Средний балл","Ortasha ball"],
["Baholar","Grades","Оценки","Bahalar"],
["O‘quvchilar","Students","Ученики","Oqıwshılar"],
["Guruhlar","Groups","Группы","Toparlar"],
["Yangi o‘quvchi","New student","Новый ученик","Jańa oqıwshı"],
["Natija kiritish","Enter results","Ввести результаты","Nátiyje kirgiziw"],
["E’lon chiqarish","Publish notice","Опубликовать объявление","Daǵaza járiyalaw"],
["E’tibor talab qiladiganlar","Needs attention","Требуют внимания","Itibar talap etiledi"],
["Tugallanmagan natijalar","Incomplete results","Незаполненные результаты","Tolıqtırılmaǵan nátiyjeler"],
["Guruhlar bo‘yicha o‘zlashtirish","Performance by group","Успеваемость по группам","Toparlar boyınsha ózlestiriw"],
["So‘nggi admin amallari","Recent admin activity","Последние действия администратора","Sońǵı admin ámelleri"],
["Ota-ona / aloqa raqami (faqat admin)","Parent / contact number (admin only)","Телефон родителя (только администратор)","Ata-ana / baylanıs nomeri (tek admin)"],
["Ichki izoh","Private note","Внутренняя заметка","Ishki eskertpe"],
["Qidirish va tahrirlash","Search and edit","Поиск и изменение","Izlew hám ózgertiw"],
["Izlash","Search","Поиск","Izlew"],
["Ommaviy o‘quvchi importi","Bulk student import","Массовое добавление учеников","Oqıwshılardı kóplep qosıw"],
["Qaysi guruhga?","Which group?","В какую группу?","Qaysı toparǵa?"],
["Ro‘yxat","List","Список","Dizim"],
["Ro‘yxatni qo‘shish","Import list","Добавить список","Dizimdi qosıw"],
["Har qatorda: Ism Familiya; telefon. Bir martada 100 ta o‘quvchigacha. Takroriy ismlar o‘tkazib yuboriladi.","Each line: Full Name; phone. Up to 100 students at once. Duplicate names are skipped.","Каждая строка: Имя Фамилия; телефон. До 100 учеников за раз. Дубликаты пропускаются.","Hár qatarda: Atı Familiyası; telefon. Bir márrte 100 ge shekem. Qaytalanǵan atlar ótkeriledi."],
["O‘quvchi topilmadi.","Student not found.","Ученик не найден.","Oqıwshı tabılmadı."],
["O‘quvchi topilmadi","Student not found","Ученик не найден","Oqıwshı tabılmadı"],
["Telefon","Phone","Телефон","Telefon"],
["Bekor qilish","Cancel","Отмена","Biykarlaw"],
["Saqlash","Save","Сохранить","Saqlaw"],
["Admin izohi","Admin note","Примечание администратора","Admin eskertpesi"],
["Natija sanasini qo‘shish","Add result date","Добавить дату результатов","Nátiyje kúnin qosıw"],
["Natija kunlari","Result dates","Даты результатов","Nátiyje kúnleri"],
["Natija kuni nomi","Result date name","Название результата","Nátiyje kúniniń atı"],
["Yaratish","Create","Создать","Jaratıw"],
["Sana (Toshkent)","Date (Tashkent)","Дата (Ташкент)","Sána (Tashkent)"],
["Sana (Toshkent vaqti)","Date (Tashkent time)","Дата (по Ташкенту)","Sána (Tashkent waqtı)"],
["Mashg‘ulot / test nomi","Lesson name","Название занятия","Sabaq atı"],
["Haftalik sinov","Weekly assessment","Недельная проверка","Háptelik tekseriw"],
["Mashg‘ulot nomi","Lesson name","Название занятия","Sabaq atı"],
["Natija kunini qo‘shish","Add result day","Добавить день результатов","Nátiyje kúnin qosıw"],
["Mashg‘ulot yaratilmagan.","No lessons have been added.","Занятия ещё не добавлены.","Sabaq ele qosılmaǵan."],
["Hali natija kuni qo‘shilmagan.","No result dates yet.","Даты результатов ещё не добавлены.","Nátiyje kúnleri ele qosılmaǵan."],
["Mashg‘ulot topilmadi","Lesson not found","Занятие не найдено","Sabaq tabılmadı"],
["Mashg‘ulot nusxasi","Duplicate lesson","Копия занятия","Sabaqtıń nusqası"],
["Mashg‘ulot tahriri","Edit lesson","Изменение занятия","Sabaqtı ózgertiw"],
["Baholarni ochish","Open grades","Открыть оценки","Bahalardı ashıw"],
["Nusxa olish","Duplicate","Создать копию","Nusqa alıw"],
["Davomat nazorati","Attendance tracking","Учёт посещаемости","Qatnasıwdı qadaǵalaw"],
["DQ — dars qoldirdi. Baho kiritilmagan o‘quvchilar alohida ko‘rinadi.","DQ means absent. Students with missing grades are shown separately.","DQ — пропуск урока. Ученики без оценок показаны отдельно.","DQ — sabaqqa kelmedi. Bahası joq oqıwshılar bólek kórinedi."],
["Tekshiruvlar","Assessments","Проверки","Tekseriwler"],
["Qatnashgan","Attended","Присутствовали","Qatnasqanlar"],
["Kiritilmagan natijalar","Missing grades","Невнесённые оценки","Kirgizilmegen bahalar"],
["Davomat o‘zgarishi","Attendance trend","Динамика посещаемости","Qatnasıw ózgerisi"],
["O‘zlashtirish tahlili","Performance analytics","Анализ успеваемости","Ózlestiriw tallawı"],
["80+ ball","80+ points","80+ баллов","80+ ball"],
["50 dan past","Below 50","Ниже 50","50 den tómen"],
["Sana bo‘yicha o‘rtacha ball","Average score by date","Средний балл по датам","Kúnler boyınsha ortasha ball"],
["Guruhlar bo‘yicha taqqoslash","Compare groups","Сравнение групп","Toparlardı salıstırıw"],
["Premium e’lon yaratish","Create premium notice","Создать премиум-объявление","Premium daǵaza jaratıw"],
["Matn","Text","Текст","Tekst"],
["Chop etish vaqti (ixtiyoriy)","Publish time (optional)","Время публикации (необязательно)","Járiyalaw waqtı (qálewge qaray)"],
["Yakunlanish vaqti (ixtiyoriy)","Expiry time (optional)","Время окончания (необязательно)","Tamamlanıw waqtı (qálewge qaray)"],
["Chop etish vaqti","Publish time","Время публикации","Járiyalaw waqtı"],
["Yakunlanish vaqti","Expiry time","Время окончания","Tamamlanıw waqtı"],
["Muhim e’lon (yuqorida turadi)","Important notice (pinned)","Важное объявление (закрепить)","Áhmiyetli daǵaza (joqarıda turadı)"],
["E’lonni saqlash","Save announcement","Сохранить объявление","Daǵazanı saqlaw"],
["E’lonni tahrirlash","Edit announcement","Изменить объявление","Daǵazanı ózgertiw"],
["Rejalashtirilgan e’lon belgilangan vaqtda ilovada ko‘rinadi. Push bildirishnoma hozircha yo‘q.","Scheduled announcements appear at the specified time. Push notifications are not enabled yet.","Запланированные объявления появляются в указанное время. Push-уведомлений пока нет.","Rejelestirilgen daǵazalar belgili waqıtta kórinedi. Push xabarlar házirshe joq."],
["Hamma","Everyone","Все","Barlıǵı"],
["Muhim","Important","Важное","Áhmiyetli"],
["Oddiy qilish","Unpin","Открепить","Ápiwayı qılıw"],
["Yuqoriga chiqarish","Pin to top","Закрепить сверху","Joqarıǵa shıǵarıw"],
["Tiklash","Restore","Восстановить","Qaytarıw"],
["E’lon topilmadi","Announcement not found","Объявление не найдено","Daǵaza tabılmadı"],
["Harakatlar tarixi","Activity history","История действий","Ámeller tarıyxı"],
["Harakatlar jurnali","Activity log","Журнал действий","Ámeller jurnalı"],
["Bu jurnal admin panelidagi muvaffaqiyatli o‘zgartirishlarni qayd qiladi, maxfiy tokenlar yozilmaydi.","This log tracks successful admin changes. Tokens are never recorded.","Журнал фиксирует успешные действия администратора. Токены не записываются.","Bul jurnalda admin ámelleri jazıladı. Tokenler jazılmaydı."],
["Arxiv va tiklash","Archive and restore","Архив и восстановление","Arxiv hám qaytarıw"],
["Arxiv turi","Archive type","Тип архива","Arxiv túri"],
["Arxivdan tiklash","Restore from archive","Восстановить из архива","Arxivten qaytarıw"],
["Ma’lumotlarni eksport qilish","Export data","Экспорт данных","Maǵlıwmattı eksportlaw"],
["O‘quvchilar ro‘yxati","Student list","Список учеников","Oqıwshılar dizimi"],
["Barcha guruhlar","All groups","Все группы","Barlıq toparlar"],
["Guruh","Group","Группа","Topar"],
["Reyting hisoboti","Ranking report","Отчёт рейтинга","Reyting esabatı"],
["Admin sessiyasi","Admin session","Сессия администратора","Admin sessiyası"],
["Faol","Active","Активна","Aktiv"],
["Ma’lumot vaqti","Data time","Время данных","Maǵlıwmat waqtı"],
["Serverni ulash","Connect server","Подключить сервер","Serverdi jalǵaw"],
["Administrator · Жанзаков Б","Administrator · Жанзаков Б","Администратор · Жанзаков Б","Administrator · Жанзаков Б"],
["Sessiya 12 soat amal qiladi. Token va baza parollari dastur ichida emas, faqat server muhitida saqlanadi.","A session lasts 12 hours. Tokens and database passwords stay on the server.","Сессия действует 12 часов. Токены и пароли базы хранятся только на сервере.","Sessiya 12 saat dawam etedi. Token hám baza parolleri tek serverde saqlanadı."],
["Render → nur-apk-api → Environment → DATABASE_URL. Bu satrni chatga yubormang.","Render → nur-apk-api → Environment → DATABASE_URL. Do not share the connection string.","Render → nur-apk-api → Environment → DATABASE_URL. Не присылайте строку подключения в чат.","Render → nur-apk-api → Environment → DATABASE_URL. Bul qatardı chatqa jibermeń."],
["TOP 17 premium funksiya","TOP 17 premium features","ТОП-17 премиум-функций","TOP 17 premium funkciya"],
["Pastdagi “Kodlandi” holati ishlab chiqilgan funksiyani bildiradi. Jonli ishlashi uchun Render DATABASE_URL ulanib, API tekshiruvidan o‘tishi kerak.","Implemented means code exists. Live usage requires the Render database connection and API verification.","Статус «Готов код» означает реализацию. Для работы нужно подключить базу Render и проверить API.","«Kodlandı» — kod jazılǵan. Islewi ushın Render bazası jalǵanıp, API tekseriliwi kerek."],
["Kodlandi","Implemented","Код готов","Kodlandı"],
["Keyingi","Planned","В планах","Keyingi"],
["Qayta urinish","Retry","Повторить","Qayta urınıw"],
["Ma’lumotlar yuklanmoqda...","Loading data...","Загрузка данных...","Maǵlıwmat júklenbekte..."],
["Hozircha alohida ogohlantirish yo‘q.","No alerts at this time.","Сейчас нет предупреждений.","Házir eskertiwler joq."],
["Kiritilmagan baholar topilmadi.","No missing grades found.","Не найдены незаполненные оценки.","Kirgizilmegen bahalar tabılmadı."],
["Bu guruhda o‘quvchi yo‘q.","No students in this group.","В этой группе нет учеников.","Bul toparda oqıwshı joq."],
["O‘quvchilar yuklanmoqda...","Loading students...","Загрузка учеников...","Oqıwshılar júklenbekte..."],
["Noma’lum amal","Unknown action","Неизвестная операция","Belgisiz ámel"],
["Muvaffaqiyatli saqlandi","Saved successfully","Успешно сохранено","Tabıslı saqlandı"],
["Elementni arxivlamoqchimisiz?","Archive this item?","Перенести элемент в архив?","Bul elementti arxivlaysız ba?"],
["Amal bajarildi","Action completed","Действие выполнено","Ámel orınlandı"],
["Bir martada 100 tadan ko‘p o‘quvchi yubormang","Import no more than 100 students at once","Не загружайте более 100 учеников за раз","Bir márte 100 den artıq oqıwshı jibermeń"],
["Guruh topilmadi","Group not found","Группа не найдена","Topar tabılmadı"],
["Top reyting yakunlangan baholar asosida hisoblanadi. DQ o‘rtacha ballga kirmaydi.","Top ranking uses completed grades; DQ is excluded from averages.","Рейтинг основан на оценках; DQ не учитывается в среднем балле.","Top reyting bahalarǵa tiykarlandı; DQ ortasha ballǵa kirmeydi."],
["O‘quvchi profilini ochish","Open student profile","Открыть профиль ученика","Oqıwshı profilin ashıw"],
["Reytingni yuklab bo‘lmadi","Could not load ranking","Не удалось загрузить рейтинг","Reytingti júklew múmkin bolmadı"],
["Profil yuklanmadi","Could not load profile","Не удалось загрузить профиль","Profildi júklew múmkin bolmadı"],
["Profil ochilmoqda...","Opening profile...","Открытие профиля...","Profil ashılmaqta..."],
["← Reytingga qaytish","← Back to ranking","← К рейтингу","← Reytingke qaytıw"],
["O‘quvchi natijalari","Student results","Результаты ученика","Oqıwshı nátiyjeleri"],
["Natijalar hali mavjud emas.","No results available yet.","Результатов пока нет.","Nátiyjeler ele joq."],
["Reyting boshqaruvi","Ranking management","Управление рейтингом","Reytingti basqarıw"],
["Reyting faqat kiritilgan ballardan avtomatik hisoblanadi. Administrator davr va e’lon holatini o‘zgartiradi.","Ranking is calculated from scores. Admins control the date range and publishing.","Рейтинг считается по баллам. Администратор задаёт период и публикацию.","Reyting ballardan esaplanadı. Admin dáwirdi hám járiyalawdı basqaradı."],
["Reytingni foydalanuvchilarga ko‘rsatish","Show ranking to users","Показывать рейтинг ученикам","Reytingti paydalanıwshılarǵa kórsetiw"],
["Davr boshlanishi","Period start","Начало периода","Dáwir bası"],
["Davr tugashi","Period end","Конец периода","Dáwir aqırı"],
["Top o‘quvchilar soni","Top students count","Количество лучших учеников","Top oqıwshılar sanı"],
["Davrni bo‘sh qoldirsangiz, barcha mavjud natijalar hisoblanadi.","Leave dates blank to use all results.","Оставьте даты пустыми для учёта всех результатов.","Bárlıq nátiyjeler ushın sáneni bos qaldırıń."],
["Reyting sozlamalarini saqlash","Save ranking settings","Сохранить настройки рейтинга","Reyting sazlamaların saqlaw"],
["Reyting sozlamalari saqlandi","Ranking settings saved","Настройки рейтинга сохранены","Reyting sazlamaları saqlandı"],
["Top o‘quvchilar","Top students","Лучшие ученики","Top oqıwshılar"],
["Admin ko‘rinishi","Admin preview","Просмотр администратора","Admin kórinisi"],
["Hozircha ball kiritilmagan.","No scores entered yet.","Баллы пока не внесены.","Ball ele kirgizilmegen."],
["O‘quvchi profillari","Student profiles","Профили учеников","Oqıwshı profilleri"],
["Ism familiya","Full name","Имя Фамилия","Atı Familiyası"],
["O‘quvchilarni ko‘rsatish","Show students","Показать учеников","Oqıwshılardı kórsetiw"],
["O‘quvchilar topilmadi.","No students found.","Ученики не найдены.","Oqıwshılar tabılmadı."],
["Ma’lumot yuklanmoqda...","Loading data...","Загрузка данных...","Maǵlıwmat júklenbekte..."],
["O‘rtacha","Average","Средний","Ortasha"],
["O‘rtacha ball","Average score","Средний балл","Ortasha ball"],
["Natijalar tarixi","Results history","История результатов","Nátiyjeler tarıyxı"],
["O‘quvchi topilmadi.","Student not found.","Ученик не найден.","Oqıwshı tabılmadı."],
["Kiritilmagan","Not set","Не указано","Kirgizilmegen"],
["Ichki izoh:","Private note:","Заметка:","Ishki eskertpe:"],
["Telefon:","Phone:","Телефон:","Telefon:"],
["Yo‘q","None","Нет","Joq"],
["Natijalar yo‘q.","No results.","Нет результатов.","Nátiyjeler joq."],
["E’lonni muhim sifatida belgilash","Pin important announcement","Закрепить важное объявление","Áhmiyetli daǵazanı bekkitiw"],
["E’lonni kelajak sanaga rejalash","Schedule announcement","Запланировать объявление","Daǵazanı waqıtqa rejelestiriw"],
["Muayyan guruhga e’lon","Group-specific announcement","Объявление для группы","Toparǵa arnawlı daǵaza"],
["E’lon muddatini belgilash","Set announcement expiry","Указать срок объявления","Daǵaza merzimin belgilew"],
["Guruh yaratish","Create group","Создать группу","Topar jaratıw"]
];
table.push(...additional);
table.push(...[["Mashg‘ulot qo‘shish","Add result date","Добавить дату результата","Nátiyje kúnin qosıw"],["Mashg‘ulot yaratish","Add result date","Добавить дату результата","Nátiyje kúnin qosıw"],["Kiritilmagan natija topilmadi.","No missing results.","Незаполненных результатов нет.","Kirgizilmegen nátiyje joq."],["Hozircha reyting ma’lumotlari mavjud emas.","No ranking data yet.","Нет данных рейтинга.","Ele reyting maǵlıwmatı joq."],["Maktab","School","Школа","Mektep"],["Reytingdagi o‘rni:","Ranking position:","Место в рейтинге:","Reytingtegi ornı:"],["Reyting yakunlangan baholar asosida hisoblanadi.","Ranking is based on completed scores.","Рейтинг рассчитан по итоговым оценкам.","Reyting aqırǵı bahalar boyınsha esaplanadı."],["Oldingi sanadagi mashg‘ulot","Past lesson date","Дата прошлого занятия","Aldınǵı sabaq kúni"],["Mashg‘ulotni tahrirlash","Edit result date","Изменить дату результата","Nátiyje kúnin ózgertiw"],["Mashg‘ulotdan nusxa olish","Duplicate result date","Создать копию даты результата","Nátiyje kúninen nusqa alıw"],["Mashg‘ulot arxivlash","Archive result date","Архивировать дату результата","Nátiyje kúnin arxivlaw"],["Mashg‘ulotni tiklash","Restore result date","Восстановить дату результата","Nátiyje kúnin qaytarıw"]]);
table.push(...[["Tilni tanlang","Choose language","Выберите язык","Tildi tańlań"],["Xabarlar","Messages","Сообщения","Xabarlar"],["Admin xabarlari","Admin messages","Сообщения администратору","Admin xabarları"],["Faqat admin uchun","Admin only","Только для администратора","Tek admin ushın"],["Написать администратору","Contact administrator","Написать администратору","Administratorǵa jazıw"],["Xabar bevosita Nur Oqiw Orayi administratoriga keladi.","Your message is delivered directly to Nur Oqiw Orayi administration.","Сообщение поступит напрямую администратору Nur Oqiw Orayi.","Xabar Nur Oqiw Orayi administratorına tikkeley baradı."],["Kim sifatida yozasiz?","Who are you?","Кто вы?","Kim bolıp jazıp atırsız?"],["O‘quvchi","Student","Ученик","Oqıwshı"],["Ota-ona","Parent","Родитель","Ata-ana"],["Qaysi fandan o‘qiysiz?","Which subject do you study?","Какой предмет изучаете?","Qaysı pánden oqıysız?"],["Boshqa","Other","Другое","Basqa"],["Xabar matni","Message","Сообщение","Xabar teksti"],["Administratorga xabaringizni yozing...","Write your message to admin...","Напишите сообщение администратору...","Administratorǵa xabarıńızdı jazıń..."],["Xabarni yuborish","Send message","Отправить сообщение","Xabardı jiberiw"],["Xabar yuborilmoqda...","Sending message...","Отправка сообщения...","Xabar jiberilmekte..."],["Xabaringiz administratorga yuborildi.","Your message has been sent to the administrator.","Сообщение отправлено администратору.","Xabarıńız administratorǵa jiberildi."],["Ma’lumotlar faqat administratorning shaxsiy xabarlar bo‘limida ko‘rinadi.","Only the administrator can view your message.","Сообщение доступно только администратору.","Xabarıńızdı tek administrator kóre aladı."],["O‘qilmagan xabarlar:","Unread messages:","Непрочитанные сообщения:","Oqılmaǵan xabarlar:"],["O‘qilmaganlar","Unread","Непрочитанные","Oqılmaǵanlar"],["Barcha xabarlar","All messages","Все сообщения","Barlıq xabarlar"],["Yangilash","Refresh","Обновить","Jańalaw"],["O‘qildi","Mark as read","Отметить прочитанным","Oqıldı"],["Hozircha xabar yo‘q.","No messages yet.","Сообщений пока нет.","Házir xabar joq."],["Xabarlar yuklanmoqda...","Loading messages...","Загрузка сообщений...","Xabarlar júklenbekte..."],["Xabar yangilandi","Message updated","Сообщение обновлено","Xabar jańalandı"]]);
table.push(...[["To‘lovlar","Payments","Платежи","Tólemler"],["Paynet QR · To‘lov holatini tekshirish","Paynet QR · Check payment status","Paynet QR · Проверить оплату","Paynet QR · Tólem halatın tekseriw"],["To‘lov bo‘limini ochish","Open payments","Открыть платежи","Tólemlerdi ashıw"],["Nur oqiw orayi uchun Paynet QR orqali to‘lov so‘rovi va uning holati.","Paynet QR payment requests and status for Nur oqiw orayi.","Оплата через Paynet QR и проверка статуса для Nur oqiw orayi.","Nur oqiw orayi ushın Paynet QR tólemi hám onıń halatı."],["To‘lov qilish","Make payment","Оплатить","Tólew"],["O‘quvchining ism-familiyasi, guruhini va qaysi oy uchun to‘lashini tanlang. Summani administrator belgilaydi.","Enter student name, group and payment month. The admin sets the fee.","Укажите имя ученика, группу и месяц. Стоимость задаёт администратор.","Oqıwshı atın, toparın hám tólem ayın kirgiziń. Bahasın admin belgileydi."],["O‘quvchining ism-familiyasi","Student full name","Имя и фамилия ученика","Oqıwshınıń atı hám familiyası"],["Kim to‘layapti?","Who is paying?","Кто платит?","Kim tólep atır?"],["To‘lov davri","Payment month","Месяц оплаты","Tólem ayı"],["Guruhni tanlang","Select a group","Выберите группу","Topardı tańlań"],["To‘lanadigan summa","Amount due","Сумма к оплате","Tólenetuǵın summa"],["To‘lov buyurtmasini yaratish","Create payment request","Создать запрос на оплату","Tólem sorawın jaratıw"],["To‘lov ma’lumotlari yuklanmoqda...","Loading payment information...","Загрузка данных об оплате...","Tólem maǵlıwmatları júklenbekte..."],["To‘lov tizimi hozircha faollashtirilmagan. Administrator oluvchini va guruh narxini tasdiqlashi kerak.","Payments are not active yet. Admin must verify the recipient and group fees.","Оплата пока не включена. Администратор должен подтвердить получателя и стоимость.","Tólem házirshe qosılmaǵan. Admin alıwshını hám topar bahasın tastıyıqlawı kerek."],["Hozircha hech bir guruh uchun to‘lov miqdori belgilanmagan.","No group fees have been set yet.","Стоимость для групп пока не установлена.","Toparlar ushın tólem muǵdarı ele belgilenbegen."],["Paynet QR orqali to‘lang. To‘lov faqat administrator Paynetdagi tranzaksiyani tekshirgach tasdiqlanadi.","Pay by Paynet QR. Payment is confirmed only after the admin checks the actual transfer.","Оплатите по Paynet QR. Оплата подтверждается только после проверки перевода администратором.","Paynet QR arqalı tóleń. Tólemdi admin teksergennen keyin ǵana tastıyıqlaydı."],["Paynet orqali to‘lash","Pay through Paynet","Оплатить через Paynet","Paynet arqalı tólew"],["Paynet QR'dagi mablag‘ oluvchi","Paynet QR recipient","Получатель по Paynet QR","Paynet QR alıwshısı"],["Summa","Amount","Сумма","Summa"],["To‘lov qildim — tekshirishga yuborish","I paid — send for verification","Я оплатил — отправить на проверку","Tóledim — tekseriwge jiberiw"],["Paynet operatsiya raqami","Paynet transaction reference","Номер операции Paynet","Paynet operaciya nomeri"],["Chekdagi operatsiya raqami","Transaction number from receipt","Номер операции из чека","Chektegi operaciya nomeri"],["Izoh (ixtiyoriy)","Note (optional)","Примечание (необязательно)","Eskertpe (qálewge qaray)"],["Qo‘shimcha ma’lumot","Additional information","Дополнительная информация","Qosımsha maǵlıwmat"],["Holatini yangilash","Refresh status","Обновить статус","Halatın jańalaw"],["Tekshirish kodini nusxalash","Copy lookup code","Скопировать код проверки","Tekseriw kodın kóshiriw"],["To‘lovlarim","My payments","Мои платежи","Meniń tólemlerim"],["Sizning to‘lov so‘rovingiz hozircha yo‘q.","You have no payment requests yet.","У вас пока нет запросов на оплату.","Sizde ele tólem sorawı joq."],["Holatini ko‘rish","Check status","Проверить статус","Halatın kóriw"],["Buyurtma yaratildi","Payment request created","Запрос создан","Tólem sorawı jaratıldı"],["Admin tekshiruvida","Pending admin review","Проверяется администратором","Admin tekseriwinde"],["To‘lov tasdiqlandi","Payment confirmed","Оплата подтверждена","Tólem tastıyıqlandı"],["To‘lov tasdiqlanmadi","Payment not confirmed","Оплата не подтверждена","Tólem tastıyıqlanbadı"],["Buyurtma yaratildi. QR orqali to‘lovdan so‘ng operatsiya raqamini administratorga yuboring.","Request created. After paying the QR, send the transaction number to admin.","Запрос создан. После оплаты по QR отправьте номер операции администратору.","Soraw jaratıldı. QR arqalı tólegennen keyin operaciya nomerin adminǵa jiberiń."],["To‘lov faqat haqiqiy Paynet operatsiyasi administrator tomonidan tekshirilgandan keyin tasdiqlanadi.","Payment is confirmed only after the admin checks the real Paynet transaction.","Оплата подтверждается только после проверки реальной операции Paynet.","Tólem tek haqıyqıy Paynet operaciyasın admin teksergennen keyin tastıyıqlanadı."],["To‘lov tasdiqlandi. Administrator Paynet operatsiyasini tekshirgan.","Payment confirmed after administrator verification.","Оплата подтверждена после проверки администратором.","Tólem admin tekseriwinen keyin tastıyıqlandı."],["Ma’lumot yuborildi. Administrator Paynet operatsiyasini tekshirmaguncha tasdiqlangan hisoblanmaydi.","Request sent. Payment is not confirmed until admin verifies the transfer.","Данные отправлены. Оплата не подтверждена, пока администратор не проверит перевод.","Soraw jiberildi. Admin teksergenshe tólem tastıyıqlanbaydı."],["To‘lovni tasdiqlab bo‘lmadi. Administrator bilan bog‘laning.","Payment could not be verified. Contact the administrator.","Оплату не удалось подтвердить. Свяжитесь с администратором.","Tólem tastıyıqlanbadı. Adminǵa jazıń."],["QR-ni skanerlang yoki Paynet ilovasida rasm sifatida oching. To‘lovdan so‘ng operatsiya raqamini yuboring.","Scan the QR or open its image in Paynet. Send the transaction number after paying.","Сканируйте QR или откройте картинку в Paynet. Затем отправьте номер операции.","QR kodtı skanerleń yamasa Paynette súwret retinde ashıń. Soń operaciya nomerin jiberiń."],["To‘lov buyurtmalari","Payment requests","Запросы на оплату","Tólem sorawları"],["To‘lov boshqaruvi","Payment management","Управление оплатой","Tólemdi basqarıw"],["To‘lov sozlamalarini saqlash","Save payment settings","Сохранить настройки оплаты","Tólem sazlamaların saqlaw"],["Guruhlar uchun narxlar","Group fees","Стоимость по группам","Toparlar bahası"],["Hozircha Paynet avtomatik tasdiqlash ulanmagan. QR orqali tushgan pulni haqiqiy hisobdan tekshirib tasdiqlashingiz kerak.","Paynet automatic confirmation is not connected. Check actual funds before approving.","Автоподтверждение Paynet не подключено. Проверьте поступление денег перед подтверждением.","Paynet avtomat tastıyıqlawı ele jalǵanbaǵan. Aqshanı esaptan tekseriń."],["Rasmdagi oluvchi ismi","QR recipient name","Имя получателя на QR","QR alıwshısınıń atı"],["To‘lov qabul qilishni faollashtirish","Enable payments","Включить приём платежей","Tólemdi qosıw"],["So‘mda summa","Amount in UZS","Сумма в сумах","Somdaǵı summa"],["Hozircha hech qanday namunaviy 200–350 minglik narx qo‘yilmagan.","No sample price has been set.","Примерные цены не установлены.","Úlgili narx qoyılmaǵan."],["O‘quvchilar to‘lovlari","Student payments","Оплаты учеников","Oqıwshılar tólemleri"],["Holat bo‘yicha ko‘rsatish","Filter by status","Фильтр по статусу","Halatı boyınsha kórsetiw"],["Yaratilgan","Created","Созданные","Jaratılǵan"],["Tekshiruvda","Under review","На проверке","Tekseriwde"],["Tasdiqlangan","Confirmed","Подтверждённые","Tastıyıqlanǵan"],["Rad etilgan","Rejected","Отклонённые","Biykarlanǵan"],["Hozircha bu holatda to‘lov yo‘q.","No payments with this status.","Платежей с таким статусом нет.","Bul halatta tólem joq."],["Hisobda tekshirib tasdiqlash","Verify in account and approve","Проверить на счёте и подтвердить","Esapta tekserip tastıyıqlaw"],["Rad etish","Reject","Отклонить","Biykarlaw"],["To‘lov sozlamalari saqlandi","Payment settings saved","Настройки оплаты сохранены","Tólem sazlamaları saqlandı"],["To‘lov tizimi hali faollashtirilmagan.","Payments are not enabled yet.","Оплата пока не включена.","Tólem házirshe qosılmaǵan."]]);
// Owner portfolio: human-reviewed UI labels and accessible names.
table.push(...[["Ochish","Open","Открыть","Ashıw"],["Administrator portfoliosi","Administrator portfolio","Портфолио администратора","Administrator portfoliosı"],["Administrator portfoliosini ochish","Open administrator portfolio","Открыть портфолио администратора","Administrator portfoliosın ashıw"],["40+ loyihalar","40+ projects","40+ проектов","40+ joybar"],["loyihalar","projects","проектов","joybarlar"],["Tugallangan loyihalar","Completed projects","Завершённых проектов","Tamamlanǵan joybarlar"],["Administrator portfoliosi va aloqa ma’lumotlari.","Administrator portfolio and contacts.","Портфолио администратора и контакты.","Administrator portfoliosı hám baylanıs maǵlıwmatları."],["Aloqa ma’lumotlari","Contact information","Контактная информация","Baylanıs maǵlıwmatları"],["Telefon","Phone","Телефон","Telefon"],["Qo‘ng‘iroq: +998 91 936 09 24","Call: +998 91 936 09 24","Позвонить: +998 91 936 09 24","Qońıraw: +998 91 936 09 24"],["Texnologiyalar","Technologies","Технологии","Texnologiyalar"],["Ikonchani bosing — profil ochiladi.","Tap an icon to open a profile.","Нажмите на значок, чтобы открыть профиль.","Belgini basıń — profil ashıladı."],["Instagram profilini ochish","Open Instagram profile","Открыть Instagram","Instagram profilin ashıw"],["Telegram profilini ochish","Open Telegram profile","Открыть Telegram","Telegram profilin ashıw"],["Разработчик приложения","App developer","Разработчик приложения","Qosımsha islep shıǵıwshısı"],["Администратор приложения","Application administrator","Администратор приложения","Qosımsha administratori"],["Разработчик и администратор приложения","App developer and administrator","Разработчик и администратор приложения","Qosımsha islep shıǵıwshısı hám administratorı"]]);
// Two-way private inbox and public notice center labels.
table.push(...[["Bildirishnomalar","Notifications","Уведомления","Bildiriwler"],["Bildirishnomalar — 1 ta yangi","Notifications — 1 new","Уведомления — 1 новое","Bildiriwler — 1 jańa"],["Admin javoblari va yangi e’lonlar","Admin replies and new announcements","Ответы администратора и объявления","Admin juwapları hám jańa daǵazalar"],["Administrator javobi","Administrator reply","Ответ администратора","Administratordıń juwabı"],["E’lon","Announcement","Объявление","Daǵaza"],["Hozircha bildirishnoma yo‘q.","No notifications yet.","Уведомлений пока нет.","Házirge bildiriw joq."],["Yangilash","Refresh","Обновить","Jańalaw"],["Yangilandi","Updated","Обновлено","Jańalandı"],["Internet orqali yangilanadi","Updates when online","Обновляется через интернет","Internet arqalı jańalanadı"],["Serverga ulanib bo‘lmadi","Could not reach server","Не удалось подключиться к серверу","Serverge baylanısıp bolmadı"],["Javob yozish","Write a reply","Написать ответ","Juwap jazıw"],["Javob yuborish","Send reply","Отправить ответ","Juwap jiberiw"],["O‘quvchiga javobingiz...","Your reply to the student...","Ваш ответ ученику...","Oqıwshıǵa juwabıńız..."],["Admin xabarlari","Admin messages","Сообщения администратору","Admin xabarları"],["Barcha xabarlar","All messages","Все сообщения","Barlıq xabarlar"],["O‘qilmaganlar","Unread","Непрочитанные","Oqılmaǵanlar"],["Xabarlar yuklanmoqda...","Loading messages...","Загрузка сообщений...","Xabarlar júklenbekte..."],["Javob yuborildi. Userga bildirishnoma yetadi.","Reply sent. A notification will appear in the user's app.","Ответ отправлен. Уведомление появится в приложении пользователя.","Juwap jiberildi. Paydalanıwshı qosımshasında bildiriw kórinedi."],["Bu eski xabarga javob yuborib bo‘lmaydi. Foydalanuvchi yangidan yozishi kerak.","This older message has no reply address; ask the sender to message again.","На старое сообщение ответить нельзя. Попросите написать снова.","Bul eski xabarǵa juwap jiberip bolmaydı. Qaytadan jazıw kerek."],["Javob yuqoridagi bildirishnoma belgisiga keladi.","The reply will appear under the bell icon.","Ответ появится в уведомлениях.","Juwap joqarıdaǵı bildiriw belgisine keledi."],["Xabaringiz administratorga yuborildi. Raqam:","Your message was sent to the administrator. Reference:","Ваше сообщение отправлено администратору. Номер:","Xabarıńız administratorǵa jiberildi. Nomer:"],["Yopish","Close","Закрыть","Jabıw"]]);
const languages={UZ:0,EN:1,RU:2,QQ:3};
const native={UZ:'uz',EN:'en',RU:'ru',QQ:'kaa'};
const normalized=s=>String(s).replace(/[‘’ʻʼ']/g,'’').replace(/\s+/g,' ').trim();
const phrases=new Map(table.map(row=>[normalized(row[0]),row]));
const cache=new WeakMap(),attributeCache=new WeakMap();
let selected='UZ',scheduled=false,observing;
const supports=o=>Object.prototype.hasOwnProperty.call(languages,o);
function formatDynamic(text,locale){
 const value=String(text),idx=languages[locale];
 if(idx===0)return value;
 const match=normalized(value);
 // Translate metadata composed by the application (subject / group, group · count).
 // Never alter personal names or arbitrary user-supplied text.
 for(const delimiter of [' · ',' / ']){
   if(match.includes(delimiter)){
     const pieces=match.split(delimiter);
     const translated=pieces.map(part=>translate(part,locale));
     if(translated.some((part,i)=>part!==pieces[i]))return translated.join(delimiter);
   }
 }
 let m;
 if((m=match.match(/^([A-Z0-9]{1,4}) guruhi$/))) {
   return [null,'Group '+m[1],'Группа '+m[1],m[1]+' toparı'][idx];
 }
 if((m=match.match(/^(\d+) ta guruh$/)))return [
   null,m[1]+' groups',m[1]+' групп',m[1]+' topar'][idx];
 if((m=match.match(/^(\d+) o’quvchi$/)))return [
   null,m[1]+' students',m[1]+' учеников',m[1]+' oqıwshı'][idx];
 if((m=match.match(/^(\d+) ta natija$/)))return [
   null,m[1]+' results',m[1]+' результатов',m[1]+' nátiyje'][idx];
 if((m=match.match(/^(\d+) ta o’quv guruhi$/)))return [
   null,m[1]+' study groups',m[1]+' учебных групп',m[1]+' oqıw toparı'][idx];
 if((m=match.match(/^(\d+) ta natija · (.*)$/)))return [
   null,m[1]+' results · '+m[2],m[1]+' результатов · '+m[2],m[1]+' nátiyje · '+m[2]][idx];
 return null;
}
function translate(original,locale=selected){
 if(!supports(locale)||locale==='UZ')return String(original??'');
 const input=String(original??'');
 const leading=input.match(/^\s*/)?.[0]||'',trailing=input.match(/\s*$/)?.[0]||'';
 const clean=normalized(input);
 if(!clean)return input;
 const key=phrases.get(clean);
 const value=key?key[languages[locale]]:formatDynamic(clean,locale);
 return value===null||value===undefined?input:leading+value+trailing;
}
function translateNode(node){
 if(!node||node.nodeType!==Node.TEXT_NODE || !node.parentElement)return;
 const tag=node.parentElement.tagName;
 if(['SCRIPT','STYLE','TEXTAREA','CODE','PRE','OPTION'].includes(tag)&&tag!=='OPTION')return;
 let state=cache.get(node),current=node.nodeValue;
 if(!state||current!==state.rendered)state={original:current,rendered:current};
 const result=translate(state.original);
 state.rendered=result;
 cache.set(node,state);
 if(current!==result)node.nodeValue=result;
}
function translateAttrs(node){
 if(!node||node.nodeType!==1)return;
 let state=attributeCache.get(node);
 if(!state)state={};
 for(const attr of ['placeholder','title','aria-label','alt']){
   if(!node.hasAttribute(attr))continue;
   const current=node.getAttribute(attr);
   let item=state[attr];
   if(!item||item.rendered!==current)item={original:current,rendered:current};
   const target=translate(item.original);
   item.rendered=target;state[attr]=item;
   if(target!==current)node.setAttribute(attr,target);
 }
 attributeCache.set(node,state);
}
function translateSubtree(root){
 if(!root)return;
 if(root.nodeType===Node.TEXT_NODE){translateNode(root);return}
 if(root.nodeType!==Node.ELEMENT_NODE)return;
 translateAttrs(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let node;
 while((node=walker.nextNode())){
   if(node.nodeType===Node.TEXT_NODE)translateNode(node);
   else translateAttrs(node);
 }
}
function refreshDom(){
 if(!document.body)return;
 translateSubtree(document.body);
 document.documentElement.lang=native[selected];
 for(const button of document.querySelectorAll('.langs button')){
   const name=button.dataset.language;
   button.classList.toggle('on',name===selected);
   button.setAttribute('aria-pressed',String(name===selected));
 }
 const status=document.getElementById('lang-msg');
 if(status)status.textContent=({
   UZ:'Interfeys tili: O‘zbekcha.',EN:'Interface language: English.',
   RU:'Язык интерфейса: Русский.',QQ:'Interfeys tili: Qaraqalpaqsha.'
 })[selected];
}
function setLanguage(locale){
 if(!supports(locale))locale='UZ';
 selected=locale;
 try{localStorage.setItem('nur-apk-language',locale)}catch{}
 refreshDom();
}
function setupPicker(){
 const bar=document.querySelector('.langs');
 if(!bar)return;
 const buttons=Array.from(bar.querySelectorAll('button'));
 for(const button of buttons){
   const known=button.dataset.language||button.textContent.trim();
   button.dataset.language=known;
   button.removeAttribute('onclick');
   button.addEventListener('click',()=>setLanguage(button.dataset.language));
 }
 if(!bar.querySelector('button[data-language="EN"]')){
   const english=document.createElement('button');
   english.type='button';english.textContent='EN';english.dataset.language='EN';
   english.addEventListener('click',()=>setLanguage('EN'));
   bar.append(english);
 }
 // Make language choice explicit and predictable: UZ / EN / RU / QQ.
 for(const locale of ['UZ','EN','RU','QQ']){
   const button=bar.querySelector('button[data-language="'+locale+'"]');
   if(button)bar.append(button);
 }
 window.lang=(button,locale)=>setLanguage(locale);
}
const mutationObserver=new MutationObserver(records=>{
 // Translate only changed nodes rather than rescanning the whole app each frame.
 // MutationObserver notifications from our translations settle in one microtask.
 let scanned=0;
 for(const record of records){
   if(scanned++>650)break;
   if(record.type==='characterData'){translateNode(record.target);continue}
   if(record.type==='attributes'){translateAttrs(record.target);continue}
   for(const node of record.addedNodes||[])translateSubtree(node);
 }
});
function init(){
 setupPicker();
 try{const code=localStorage.getItem('nur-apk-language');selected=supports(code)?code:'UZ'}catch{}
 refreshDom();
 mutationObserver.observe(document.body,{subtree:true,childList:true,characterData:true,
    attributes:true,attributeFilter:['placeholder','title','aria-label','alt']});
}
window.NurI18n={translate,setLanguage,getLanguage:()=>selected,refresh:refreshDom,
   supported:['UZ','EN','RU','QQ']};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
