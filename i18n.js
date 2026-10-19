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
   const known=button.textContent.trim();
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
