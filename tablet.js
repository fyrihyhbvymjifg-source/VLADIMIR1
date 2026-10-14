(() => {
'use strict';
const stage=document.getElementById('tablet');
const dashboard=document.getElementById('dashboard');
const forbes=document.getElementById('forbesScreen');
const dialog=document.getElementById('dialogLayer');
const overlay=document.getElementById('playerOverlay');
const order=[["Lauren_Degraf", "8 млрд"], ["Tommy_Ritchie", "5,67 млрд"], ["Eldar_Bill", "5,2 млрд"], ["Pikmi_Grey", "4,95 млрд"], ["Sam_NonStop", "2,75 млрд"], ["Dizni", "2,1 млрд"], ["Andrey_Fox", "1,5 млрд"], ["Sasha_Prince", "1,4 млрд"], ["Welttime_Hunter", "1,4 млрд"], ["Ares_Steelhex", "1,2 млрд"], ["Ralph_Deep", "1,03 млрд"], ["Spike_Moskvin", "849 млн"], ["Calypso_Person", "624 млн"], ["Evgeniy_Kiselev", "600 млн"], ["Danix_Chase", "600 млн"], ["Aleks_sber", null], ["Andrey_Nebro", null], ["Angel_Ld", null], ["Donatello_Deep", null], ["Elita_Wizzart", null], ["Guy_Ritchie", null], ["Lyntic_Farm", null], ["Macan_Ritchie", null], ["Thomas_Under", null], ["Tima_Evans", null], ["Tuborosho_BeMad", null], ["Valeriy_Invest", null], ["Vanya_Foksovich", null], ["Vito_Luchiano", null]];
const base=window.BR_PLAYERS||[];
const players=order.map(([nick,wealth],i)=>{
  const match=base.find(p=>p.nick.toLowerCase()===nick.toLowerCase() || (nick==='Dizni'&&p.nick==='Dizni_Xamster'))||{};
  return {rank:i+1,nick,name:match.name||nick,vk:match.vk||'',wealth:wealth||'Не указано',move:([9,10].includes(i+1)?'+2':[11,12].includes(i+1)?'-2':''),role:nick==='Sasha_Prince'?'🎥 Блогер':nick==='Calypso_Person'?'🛠️ Разработчик · 🎥 Блогер':''};
});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function resize(){const scale=Math.min((innerWidth-24)/1280,(innerHeight-24)/800,1.35);stage.style.setProperty('--stage-scale',String(Math.max(.15,scale)));}
window.addEventListener('resize',resize,{passive:true});resize();
function screen(show){document.querySelectorAll('.main-area .screen').forEach(s=>{s.classList.toggle('active',s===show);s.setAttribute('aria-hidden',String(s!==show));});}
function openForbes(){closeDialog();closeProfile();screen(forbes);try{history.replaceState(null,'',location.pathname+'#forbes');}catch(e){} document.getElementById('boardScroll').scrollTop=0;}
function goHome(){closeProfile();closeDialog();screen(dashboard);try{history.replaceState(null,'',location.pathname);}catch(e){} }
function initials(n){return n.split('_').map(x=>x[0]).join('').slice(0,2).toUpperCase();}
function render(){
  document.getElementById('boardScroll').innerHTML=players.map(p=>`<button type="button" class="rank-card ${p.rank<=3?'rank-top rank-top-'+p.rank:''}" data-rank="${p.rank}" role="listitem" aria-label="${esc(p.nick)}, место ${p.rank}, состояние ${esc(p.wealth)}">
    <span class="rank-position">${String(p.rank).padStart(2,'0')}</span>
    <span class="rank-avatar">${p.rank===1?'<span class="mini-crown">♛</span>':''}${esc(initials(p.nick))}</span>
    <span class="rank-person"><strong>${esc(p.nick)}</strong><small>${esc(p.name)}</small>${p.role?`<em>${esc(p.role)}</em>`:''}</span>
    <span class="rank-money"><strong>${esc(p.wealth)}</strong>${p.move?`<small class="rank-change ${p.move[0]==='+'?'up':'down'}">${p.move[0]==='+'?'↑':'↓'} ${esc(p.move)}</small>`:''}</span>
    <svg class="rank-chevron"><use href="#chevron"/></svg>
  </button>`).join('');
  document.querySelectorAll('.rank-card').forEach(b=>b.addEventListener('click',()=>openProfile(players[Number(b.dataset.rank)-1])));
}
function openProfile(p){
  document.getElementById('modalAvatar').textContent=initials(p.nick);
  document.getElementById('modalPlace').textContent=`МЕСТО #${p.rank} · VLADIMIR`;
  document.getElementById('modalNick').textContent=p.nick;
  document.getElementById('modalName').textContent=p.name;
  document.getElementById('modalWealth').textContent=p.wealth;
  let badge=document.getElementById('modalTier');if(!badge){badge=document.createElement('div');badge.id='modalTier';badge.className='club-modal-tier';document.getElementById('modalWealth').parentElement.after(badge);}
  const value=parseFloat(p.wealth.replace(',','.'))*(p.wealth.includes('млрд')?1e9:1e6);
  const tier=window.ForbesCore?.tierFor(value,window.FORBES_CLUB_CONFIG?.servers[78]?.minimum,window.FORBES_CLUB_CONFIG?.tiers||[]);
  badge.textContent=tier||'ОЦЕНКА НЕ УКАЗАНА';if(tier){const note=document.createElement('small');note.textContent='Расчётный уровень по сумме из демо-рейтинга';badge.append(note);}
  const vk=document.getElementById('modalVk');vk.hidden=!p.vk;if(p.vk)vk.href=p.vk;
  overlay.hidden=false;document.getElementById('playerModalClose').focus();
}
function closeProfile(){overlay.hidden=true;}
function closeDialog(){dialog.hidden=true;}
function openDialog(title,message,link){document.getElementById('dialogTitle').textContent=title;document.getElementById('dialogText').textContent=message;const a=document.getElementById('dialogLink');a.hidden=!link;if(link)a.href=link;dialog.hidden=false;document.getElementById('dialogOk').focus();}
document.getElementById('forbesButton').addEventListener('click',openForbes);
document.getElementById('profileLogo').addEventListener('click',openForbes);
document.getElementById('backButton').addEventListener('click',goHome);
document.getElementById('playerModalClose').addEventListener('click',closeProfile);
overlay.addEventListener('click',e=>{if(e.target===overlay)closeProfile();});
document.querySelectorAll('.action:not(.forbes-action)').forEach(b=>b.addEventListener('click',()=>{
 const title=b.dataset.action;const link=b.dataset.link;
 if(link)openDialog(title,'Этот раздел доступен на основном сайте. Нажмите «Открыть на сайте», чтобы перейти к нему.',link);
 else openDialog(title,'Этот пункт показан как часть игрового планшета. Для его работы требуется подключение к игровому клиенту.');
}));
document.querySelectorAll('.rail-button').forEach(b=>b.addEventListener('click',()=>{
 const id=b.dataset.rail;
 if(id==='profile'||id==='account')openDialog('Профиль','Профиль игрока на основном сайте.','profile.html');
 if(id==='notifications')openDialog('Уведомления','События и объявления проекта.','events.html');
 if(id==='settings')openDialog('Настройки','Настройки доступны на основном сайте.','site.html');
}));
document.getElementById('exitBtn').addEventListener('click',()=>openDialog('Закрыть планшет','Открыть основную веб-версию FORBES?','site.html'));
document.getElementById('dialogClose').addEventListener('click',closeDialog);
document.getElementById('dialogOk').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!overlay.hidden)closeProfile();else if(!dialog.hidden)closeDialog();else if(forbes.classList.contains('active'))goHome();}});
render();if(location.hash==='#forbes')screen(forbes);else screen(dashboard);
})();
