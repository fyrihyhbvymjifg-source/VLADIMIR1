(() => {
 'use strict';
 const stage = document.getElementById('tablet');
 const dashboard = document.getElementById('dashboard');
 const forbes = document.getElementById('forbesScreen');
 const detail = document.getElementById('detailScreen');
 const dialog = document.getElementById('dialogLayer');
 const sections = {
   news: {title:'Новости',desc:'Последние новости, события и обновления проекта. Все актуальные публикации доступны на основном сайте.',href:'events.html',icon:'news'},
   about: {title:'О проекте',desc:'Информация о FORBES, его возможностях и главных разделах. Перейдите на основной сайт, чтобы узнать больше.',href:'site.html',icon:'crown'},
   team: {title:'Команда',desc:'Сведения о команде и администрации проекта. Просматривайте список участников на сайте.',href:'admins.html',icon:'users'},
   stats: {title:'Статистика',desc:'Рейтинги, лидеры и достижения участников FORBES.',href:'leaders.html',icon:'bars'},
   rules: {title:'Правила',desc:'Ознакомьтесь с действующими правилами и условиями использования проекта.',href:'terms.html',icon:'star'},
   community: {title:'Сообщество',desc:'Общайтесь с другими участниками сообщества FORBES в разделе чата.',href:'chat.html',icon:'chat'}
 };
 function resize(){const scale = Math.min((window.innerWidth-28)/1280,(window.innerHeight-28)/800,1.35);stage.style.setProperty('--stage-scale',String(Math.max(.18,scale)));}
 window.addEventListener('resize',resize,{passive:true});resize();
 function screen(which){[dashboard,forbes,detail].forEach(x=>{x.classList.toggle('active',x===which);x.setAttribute('aria-hidden',String(x!==which));});}
 function openForbes(){closeDialog();screen(forbes);history.replaceState(null,'',location.pathname+'#forbes');}
 function goHome(){closeDialog();screen(dashboard);history.replaceState(null,'',location.pathname);}
 function openDetail(key){const d=sections[key];if(!d)return;document.getElementById('detailTitle').textContent=d.title;document.getElementById('detailDescription').textContent=d.desc;document.getElementById('detailLink').href=d.href;document.getElementById('detailIcon').innerHTML='<svg><use href="#'+d.icon+'"/></svg>';screen(detail);history.replaceState(null,'',location.pathname+'#'+key);}
 function closeDialog(){dialog.hidden=true;}
 function openDialog(title,message,link){document.getElementById('dialogTitle').textContent=title;document.getElementById('dialogText').textContent=message;const a=document.getElementById('dialogLink');a.hidden=!link;if(link)a.href=link;dialog.hidden=false;document.getElementById('dialogOk').focus();}
 document.getElementById('forbesButton').addEventListener('click',openForbes);
 document.getElementById('profileLogo').addEventListener('click',openForbes);
 document.getElementById('backButton').addEventListener('click',goHome);
 document.getElementById('detailBack').addEventListener('click',openForbes);
 document.querySelectorAll('.section-card').forEach(b=>b.addEventListener('click',()=>openDetail(b.dataset.section)));
 document.querySelectorAll('.action:not(.forbes-action)').forEach(b=>b.addEventListener('click',()=>{
   const title=b.dataset.action;
   const link=b.dataset.link;
   if(link){openDialog(title,'Этот раздел доступен на основном сайте FORBES. Нажмите «Открыть на сайте», чтобы перейти к нему.',link);}
   else{openDialog(title,'Этот пункт показан как часть игрового интерфейса. Для работы с ним требуется подключение к игровому клиенту.');}
 }));
 document.querySelectorAll('.rail-button').forEach(b=>b.addEventListener('click',()=>{
   const id=b.dataset.rail;
   if(id==='profile'||id==='account')openDialog('Профиль','Ваш профиль и настройки аккаунта доступны на основном сайте FORBES.','profile.html');
   if(id==='notifications')openDialog('Уведомления','Актуальные события и объявления проекта можно посмотреть на сайте.','events.html');
   if(id==='settings')openDialog('Настройки','Настройки игрового клиента отображаются здесь как прототип. Для просмотра сайта перейдите по кнопке ниже.','site.html');
 }));
 document.getElementById('exitBtn').addEventListener('click',()=>openDialog('Выйти из планшета','Открыть основную веб-версию FORBES?','site.html'));
 document.getElementById('dialogClose').addEventListener('click',closeDialog);
 document.getElementById('dialogOk').addEventListener('click',closeDialog);
 dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!dialog.hidden)closeDialog();else if(detail.classList.contains('active'))openForbes();else if(forbes.classList.contains('active'))goHome();}});
 const hash=location.hash.slice(1);
 if(hash==='forbes')screen(forbes);else if(sections[hash])openDetail(hash);else screen(dashboard);
})();
