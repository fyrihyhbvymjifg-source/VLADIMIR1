(() => {
  'use strict';
  const C = window.ForbesCore, config = window.FORBES_CLUB_CONFIG;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const svg = icon => `<svg aria-hidden="true"><use href="#${icon}"/></svg>`;
  const money = value => new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 0}).format(value) + ' ₽';
  const compact = value => value === null ? 'Не задан' : new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2}).format(value / 1e6) + ' млн';
  const demo = config.mode !== 'live';
  const storageKey = 'forbes.club.drafts.v1';
  const defaults = { cash: 55000000, bank: 95000000, business: 180000000, property: 40000000, vehicles: 45000000, other: 5000000, debts: 0 };
  let serverId = config.defaultServer, assets = {...defaults}, nick = 'Player_Name';
  let checkedAt = null, currentTab = 'capital', decision = null, busy = false, operation = 0, toastTimer;
  let remoteMinimum, profileReady = demo, draft = null, drafts = {}, storeAvailable = true;
  let lastFocus = null, modalFocus = null;
  const workingForms = {}, liveDrafts = {};
  try { drafts = demo ? JSON.parse(localStorage.getItem(storageKey) || '{}') : {}; if (!drafts || Array.isArray(drafts) || typeof drafts !== 'object') drafts = {}; }
  catch (_) { storeAvailable = false; drafts = {}; }
  const minimum = () => demo ? (config.servers[serverId]?.minimum ?? null) : (remoteMinimum ?? null);
  const serverName = () => config.servers[serverId]?.name || 'Сервер ' + serverId;
  const assessment = () => C.assess(assets, minimum(), config.tiers);

  const screen = document.createElement('section');
  screen.id = 'clubScreen'; screen.className = 'club-screen screen'; screen.setAttribute('aria-label', 'Клуб Forbes');
  screen.setAttribute('aria-hidden', 'true');
  screen.innerHTML = `<div class="club-panel">
    <header class="club-head"><button class="club-back" id="clubBack">${svg('arrow-left')}<span>Клуб Forbes</span></button><span class="club-head-spacer"></span><span class="club-mode" id="clubMode">${demo ? 'ДЕМО' : 'ИГРОВОЙ ПРОФИЛЬ'}</span><label><span class="sr-only">Сервер</span><select id="clubServer" aria-label="Выбрать сервер">${Object.entries(config.servers).map(([id,s])=>`<option value="${esc(id)}">${esc(id)} · ${esc(s.name)}</option>`).join('')}<option value="other">Другой сервер</option></select></label><input id="clubOtherServer" class="club-server-input" type="number" min="1" max="999" step="1" aria-label="Номер сервера" hidden></header>
    <nav class="club-tabs" role="tablist" aria-label="Разделы клуба"><button id="capitalTab" role="tab" data-club-tab="capital" aria-controls="capitalView" aria-selected="true">Мой капитал</button><button id="applicationTab" role="tab" data-club-tab="application" aria-controls="applicationView" aria-selected="false" tabindex="-1">Заявка</button><button id="rulesTab" role="tab" data-club-tab="rules" aria-controls="rulesView" aria-selected="false" tabindex="-1">Как это работает</button><button class="club-demo-toggle" id="clubDemoToggle" ${demo?'':'hidden'}>Настроить демо ↗</button></nav>
    <div class="club-body" id="clubBody">
      <div class="club-view" id="capitalView" role="tabpanel" aria-labelledby="capitalTab">
        <div class="club-title-row"><div><div class="club-overline">YOUR CAPITAL. YOUR STATUS.</div><h2>Твоё место среди лучших.</h2><p class="club-description">Капитал открывает доступ в клуб. Проверь активы персонажа<br>или отправь их на ручную оценку.</p></div><svg class="club-mini-crown" aria-hidden="true"><use href="#crown"/></svg></div>
        <div class="club-capital-grid"><div class="club-summary"><div class="club-summary-label"><span>Общий капитал</span><b class="club-tier" id="clubTier">КАНДИДАТ</b></div><div class="club-capital" id="clubCapital"></div><div class="club-threshold" id="clubThreshold"></div><div class="club-progress" id="clubProgress" role="progressbar" aria-label="Капитал относительно порога входа" aria-valuemin="0" aria-valuemax="100"><span id="clubProgressFill"></span></div><div class="club-progress-caption"><span id="clubProgressLabel"></span><b id="clubProgressValue"></b></div><div class="club-summary-foot" id="clubAsOf"></div></div><div class="club-assets" id="clubAssets"></div></div>
        <div class="club-state" id="clubState" aria-live="polite"><div class="club-state-icon" id="clubStateIcon">↗</div><div class="club-state-copy"><strong id="clubStateTitle"></strong><p id="clubStateText"></p></div></div>
        <div class="club-main-actions"><button class="club-button" id="clubCheck">Проверить мой капитал</button><button class="club-button secondary" id="clubApply">Подать заявку</button><button class="club-button quiet" id="clubRanking" hidden>Открыть рейтинг →</button></div>
        <p class="club-footnote" id="clubDataNote">${demo?'Демонстрационный профиль. Суммы и допуск тестовые; синхронизация с игрой не подключена.':'Проверяется персонаж из игровой сессии. Решение о допуске подтверждает сервер.'}</p>
      </div>
      <div class="club-view" id="applicationView" role="tabpanel" aria-labelledby="applicationTab" hidden>
        <div class="club-overline">РУЧНАЯ ПРОВЕРКА</div><div class="club-title-row"><div><h2>Капитал заслуживает оценки.</h2><p class="club-description">Если имущество не учлось или нужна ручная проверка, укажи данные<br>и приложи ссылку на подтверждение.</p></div></div>
        <form id="clubApplication" class="club-form" novalidate>
          <label class="club-field">Игровой ник<input id="appNick" maxlength="32" autocomplete="off" placeholder="Имя_Фамилия" required></label>
          <label class="club-field">Сервер<input id="appServer" readonly></label>
          <label class="club-field">Заявленный капитал, ₽<input id="appCapital" type="number" min="0" step="1" max="9007199254740991" inputmode="numeric" required><small>Общая стоимость активов за вычетом обязательств</small></label>
          <label class="club-field">Ссылка на VK<input id="appVK" type="url" maxlength="500" placeholder="https://vk.com/…" required></label>
          <label class="club-field wide">Причина обращения<textarea id="appReason" minlength="10" maxlength="1500" placeholder="Например: бизнес куплен недавно и ещё не учтён в капитале." required></textarea></label>
          <label class="club-field wide">Ссылка на скриншоты или подтверждение <small>Необязательно</small><input id="appEvidence" type="url" maxlength="1000" placeholder="https://…"></label>
          <label class="club-checkbox"><input id="appConsent" type="checkbox" required><span>Данные относятся к моему персонажу. Понимаю, что заявка проходит проверку и сама по себе не даёт место в рейтинге.</span></label>
          <div id="appError" class="club-error" role="alert" hidden></div>
          <div class="club-form-actions"><button type="submit" class="club-button" id="appSubmit">${demo?'Сохранить заявку · демо':'Отправить на проверку'}</button><span class="club-small-note">${demo?'Черновик сохранится в этом браузере':'Статус поступит после ответа сервера'}</span></div>
        </form>
        <div class="club-saved" id="appSaved" hidden><div class="club-overline" id="appSavedOverline"></div><h3 id="appSavedTitle"></h3><p id="appSavedText"></p><pre class="club-application-preview" id="appPreview" tabindex="0"></pre><div class="club-contact-actions"><button class="club-button" id="appCopy">Скопировать текст</button><a class="club-button secondary" id="appVKLink" target="_blank" rel="noopener noreferrer" hidden>Передать через VK ↗</a><a class="club-button secondary" id="appSupportLink" target="_blank" rel="noopener noreferrer" hidden>Техподдержка ↗</a><button class="club-button quiet" id="appEdit">Изменить</button></div><div class="club-contact-note" id="appContactNote"></div></div>
      </div>
      <div class="club-view club-rules" id="rulesView" role="tabpanel" aria-labelledby="rulesTab" hidden>
        <div class="club-overline">FORBES MEMBERSHIP</div><div class="club-title-row"><div><h2>Статус, за которым стоят активы.</h2><p class="club-description">В рейтинг входит личный капитал персонажа на выбранном сервере.</p></div></div>
        <div class="club-formula">Наличные + банк + бизнес + недвижимость + транспорт + прочее имущество <strong>− обязательства</strong></div>
        <div class="club-tiers" id="clubTiers"></div>
        <h3>Два пути в клуб</h3><ul><li><strong>Автоматическая проверка.</strong> После подключения к игре сервер подтверждает владение и стоимость активов. При капитале от порога игрок получает допуск.</li><li><strong>Заявка.</strong> Если данные неполные, игрок передаёт подтверждения проверяющему через форму, VK или техподдержку. Допуск появляется после одобрения.</li></ul>
        <h3>Прозрачная оценка</h3><ul><li>Каждый объект учитывается один раз. Оценивается только принадлежащая персонажу доля.</li><li>Стоимость имущества берётся из единого каталога оценки сервера, а не из произвольной цены объявления.</li><li>Обязательства вычитаются. Капитал разных серверов и персонажей не суммируется.</li><li>Порог и уровни настраивает администрация каждого сервера. Если порог не задан, автоматический допуск недоступен.</li><li>Рейтинг доступен для просмотра всем. Допуск означает право участвовать; позиция определяется проверенным капиталом.</li></ul><p id="clubRulesNote"></p>
      </div>
    </div><footer class="club-footer"><b>♛ FORBES</b><span id="clubFooterServer"></span><span>${demo?'ПРЕЗЕНТАЦИОННАЯ СБОРКА':'ПРОВЕРКА КАПИТАЛА'}</span></footer>
  </div>`;
  document.querySelector('.main-area').append(screen);
  const modal = document.createElement('div'); modal.className = 'club-demo-layer'; modal.id = 'clubDemoLayer'; modal.hidden = true;
  modal.innerHTML = `<div class="club-demo-dialog" role="dialog" aria-modal="true" aria-labelledby="demoTitle"><div class="club-demo-top"><h2 id="demoTitle">Сценарии для презентации</h2><button id="demoClose" class="club-demo-close" aria-label="Закрыть настройки демо">×</button></div><p>Тестовые суммы в миллионах игровых рублей. Можно показать отказ, допуск на границе и разные статусы клуба.</p><div class="club-presets"><button class="club-button secondary" data-preset="below">Ниже порога</button><button class="club-button secondary" data-preset="boundary">Ровно 350 млн</button><button class="club-button secondary" data-preset="member">MEMBER</button><button class="club-button secondary" data-preset="vip">VIP</button><button class="club-button secondary" data-preset="elite">ELITE</button><button class="club-button secondary" data-preset="legend">LEGEND</button></div><form id="demoForm"><div class="club-demo-grid">${C.categories.map(c=>`<label class="club-field">${c.label}, млн<input name="${c.key}" type="number" min="0" max="100000000" step="0.000001" required></label>`).join('')}</div><p id="demoTotal"></p><div id="demoError" class="club-error" role="alert" hidden></div><div class="club-demo-actions"><button type="submit" class="club-button">Применить суммы</button><button type="button" class="club-button quiet" id="demoReset">Сбросить демо-заявку</button></div></form></div>`;
  $('tablet').append(modal);
  const toastEl = document.createElement('div'); toastEl.id = 'clubToast'; toastEl.className = 'club-toast'; toastEl.hidden = true; toastEl.setAttribute('role','status'); $('tablet').append(toastEl);
  function toast(message) { clearTimeout(toastTimer); toastEl.textContent = message; toastEl.hidden = false; toastTimer = setTimeout(()=>toastEl.hidden = true, 5000); }
  function isSafeContact(value, vk) { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && (!vk || ['vk.com','vk.ru','vk.me','www.vk.com','www.vk.ru'].includes(u.hostname)); } catch (_) { return false; } }
  function persistDrafts() { try { localStorage.setItem(storageKey, JSON.stringify(drafts)); storeAvailable = true; return true; } catch (_) { storeAvailable = false; return false; } }
  function loadDraft() { const d = (demo ? drafts : liveDrafts)[String(serverId)]; draft = d && d.data?.demo === demo && d.data?.serverId === serverId && !C.validateApplication(d.data).length ? d : null; }
  function captureForm() { if (currentTab !== 'application' || $('clubApplication').hidden) return; workingForms[serverId] = { nick:$('appNick').value, capital:$('appCapital').value, vk:$('appVK').value, reason:$('appReason').value, evidence:$('appEvidence').value, consent:$('appConsent').checked }; }
  function setBusy(value) { busy = value; ['clubCheck','clubApply','clubServer','clubOtherServer','clubDemoToggle','appSubmit'].forEach(id=>$(id).disabled = value); $('clubState').setAttribute('aria-busy', String(value)); }
  function state(status, title, message, symbol = '↗') { $('clubState').dataset.status = status; $('clubStateTitle').textContent = title; $('clubStateText').textContent = message; $('clubStateIcon').textContent = symbol; }
  function draw() {
    const a = assessment(), min = minimum();
    $('clubCapital').textContent = profileReady ? compact(a.net) : '—';
    $('clubThreshold').textContent = min === null ? 'Порог этого сервера ещё не задан' : 'Порог входа · ' + money(min);
    $('clubProgressFill').style.width = (profileReady ? a.progress : 0) + '%';
    $('clubProgress').setAttribute('aria-valuenow', String(Math.round(profileReady ? a.progress : 0)));
    $('clubProgressLabel').textContent = !profileReady ? 'Данные пока не получены' : !a.configured ? 'Нужна ручная проверка' : a.eligible ? 'Порог капитала достигнут' : 'До порога ' + compact(a.missing);
    $('clubProgressValue').textContent = a.configured && profileReady ? Math.round(a.progress) + '%' : '—';
    $('clubTier').textContent = decision?.status === 'member' ? decision.tier : 'КАНДИДАТ';
    $('clubTier').dataset.tier = decision?.status === 'member' ? decision.tier : '';
    $('clubAsOf').textContent = demo ? 'ДЕМО-ПРОФИЛЬ · ' + nick : checkedAt ? 'Данные на ' + new Date(checkedAt).toLocaleString('ru-RU') : 'Ожидаем данные игрового профиля';
    $('clubAssets').innerHTML = C.categories.map(c=>`<div class="club-asset" id="asset-${c.key}">${svg(c.icon)}<span>${c.label}</span><b>${profileReady ? (c.key==='debts' && assets.debts ? '−' : '')+compact(assets[c.key]) : '—'}</b></div>`).join('');
    $('clubFooterServer').textContent = 'SERVER ' + serverId + ' · ' + serverName().toUpperCase();
    $('clubTiers').innerHTML = config.tiers.map(t=>`<div class="club-tier-card"><strong>${esc(t.name)}</strong><span>${min ? 'от '+compact(min*t.multiplier)+' ₽' : 'Не настроено'}</span><small>${t.multiplier}× порог сервера</small></div>`).join('');
    $('clubRulesNote').textContent = 'Для сервера 78 порог — 350 млн ₽. Уровни 1× / 2× / 5× / 10× — предложенные настройки этой сборки. '+(demo?'Игровая синхронизация, одобрение и пересчёт рейтинга в демо не выполняются.':'Фактический статус выдаёт игровой сервер.');
    $('clubRanking').hidden = decision?.status !== 'member';
    $('clubCheck').textContent = decision ? 'Проверить ещё раз' : 'Проверить мой капитал';
    if (decision?.status === 'member') state('member', 'Добро пожаловать в Forbes' + (demo?' · демо':''), 'Статус '+decision.tier+'. '+(demo?'Показан тестовый допуск. Список из 29 игроков сохранён.':'Капитал и допуск подтверждены сервером.'), '✓');
    else if (decision?.status === 'ineligible') state('ineligible', 'Пока не хватает '+compact(decision.missing)+' ₽', 'Пополнить капитал можно деньгами или имуществом. Если что-то не учлось — подай заявку.', '↑');
    else if (decision?.status === 'review') state('review', 'Нужна ручная проверка', 'Подай заявку и приложи подтверждение активов. Автоматический допуск пока недоступен.', '…');
    else if (!a.configured) state('review', 'Для сервера '+serverId+' порог не настроен', 'Можно подготовить заявку. Автоматическое решение появится после настройки порога.', '…');
    else state('ready', 'Проверим капитал и определим статус', 'Считаются деньги, бизнес, недвижимость, транспорт и прочее имущество за вычетом обязательств.', '↗');
  }
  function setTab(tab, focus = false) {
    captureForm();
    currentTab = tab;
    for (const b of screen.querySelectorAll('[data-club-tab]')) { const on = b.dataset.clubTab === tab; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
    for (const t of ['capital','application','rules']) $(t+'View').hidden = t !== tab;
    $('clubBody').scrollTop = 0;
    if (tab === 'application') renderApplication();
    if (focus) $(tab+'Tab').focus();
  }
  function closeClub() {
    captureForm();
    operation++; setBusy(false); closeDemo(); screen.classList.remove('active'); screen.setAttribute('aria-hidden','true');
    $('forbesScreen').classList.add('active'); $('forbesScreen').setAttribute('aria-hidden','false');
    try { history.replaceState(null,'',location.pathname+location.search+'#forbes'); } catch (_) {}
    (lastFocus?.isConnected ? lastFocus : $('clubJoin')).focus();
  }
  async function openClub(tab='capital') {
    if (!$('clubDemoLayer').hidden) closeDemo();
    if (!screen.classList.contains('active')) lastFocus = document.activeElement;
    $('playerOverlay').hidden = true; $('dialogLayer').hidden = true;
    for (const s of document.querySelectorAll('.main-area .screen')) { s.classList.toggle('active',s===screen); s.setAttribute('aria-hidden',String(s!==screen)); }
    try { history.replaceState(null,'',location.pathname+location.search+'#club'); } catch (_) {}
    loadDraft(); draw(); setTab(tab); $('clubBack').focus();
    if (!demo && !profileReady) await refreshProfile();
  }
  async function request(path, options={}) {
    const base = new URL(config.apiBase.replace(/\/$/, '')+'/', location.href);
    if (base.origin !== location.origin || !/^https?:$/.test(base.protocol)) throw new Error('Игровое подключение должно работать на том же сайте.');
    const response = await fetch(new URL(path, base), { credentials:'same-origin', cache:'no-store', ...options, signal: options.signal || AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(response.status === 401 ? 'Войди в игровой аккаунт и повтори проверку.' : 'Сервис проверки недоступен. Попробуй позже.');
    return response.json();
  }
  async function refreshProfile() {
    const token = ++operation; setBusy(true); state('checking','Получаем игровой профиль','Сверяем данные персонажа с сервером.','…');
    try {
      const p = C.validSnapshot(await request('profile?serverId='+serverId),serverId);
      if (token !== operation) return;
      if (!(p.minimum === null || Number.isSafeInteger(p.minimum) && p.minimum > 0)) throw new Error('Сервер не вернул корректный порог.');
      assets = p.assets; nick = p.nick; checkedAt = p.checkedAt; remoteMinimum = p.minimum; profileReady = true; decision = null; draw();
      if (currentTab === 'application') renderApplication();
    } catch(e) { if (token === operation) state('error','Не удалось получить данные',e.message,'!'); }
    finally { if (token === operation) setBusy(false); }
  }
  const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
  async function checkCapital() {
    if (busy) return;
    if (!demo && !profileReady) { await refreshProfile(); if (!profileReady) return; }
    const token = ++operation; decision = null; draw(); setBusy(true);
    try {
      if (demo) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        for (const c of C.categories) {
          if (token !== operation) return;
          state('checking', 'Проверка · '+c.label.toLowerCase(), 'Демонстрация сверки активов персонажа. '+nick+' · SERVER '+serverId, '…');
          $('asset-'+c.key).dataset.state='checking'; await pause(reduced ? 0 : 240);
          if (token !== operation) return;
          $('asset-'+c.key).dataset.state='done';
        }
        const a = assessment(); decision = {status: !a.configured ? 'review' : a.eligible ? 'member':'ineligible', tier:a.tier, missing:a.missing};
        checkedAt = new Date().toISOString();
      } else {
        state('checking','Подтверждаем капитал','Решение принимает игровой сервер.','…');
        const result = await request('admission', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serverId})});
        if (token !== operation) return;
        const p = C.validSnapshot(result.profile,serverId);
        if (!['member','ineligible','review'].includes(result.status) || !(p.minimum === null || Number.isSafeInteger(p.minimum) && p.minimum > 0)) throw new Error('Некорректный ответ проверки.');
        if (result.status === 'member' && !config.tiers.some(t=>t.name===result.tier)) throw new Error('Неизвестный статус участника.');
        const a = C.assess(p.assets,p.minimum,config.tiers);
        if ((result.status === 'member' && !a.eligible) || (result.status === 'ineligible' && (!a.configured || a.eligible))) throw new Error('Ответ сервера содержит противоречивый допуск.');
        assets=p.assets; nick=p.nick; checkedAt=p.checkedAt; remoteMinimum=p.minimum;
        decision={status:result.status,tier:result.tier,missing:a.missing};
      }
      draw();
    } catch(e) { if (token===operation) state('error','Проверка не завершена',e.message,'!'); }
    finally { if (token===operation) setBusy(false); }
  }
  function fillApplication(data) {
    $('appNick').value=data?.nick || nick; $('appNick').readOnly=!demo && profileReady;
    $('appServer').value=serverId+' · '+serverName();
    $('appCapital').value=data?.capital ?? (profileReady?Math.max(0,assessment().net):'');
    $('appVK').value=data?.vk || ''; $('appReason').value=data?.reason || ''; $('appEvidence').value=data?.evidence || ''; $('appConsent').checked=!!data?.consent;
    $('appError').hidden=true;
  }
  function renderApplication(edit=false) {
    const saved = !!draft && !edit;
    $('clubApplication').hidden=saved; $('appSaved').hidden=!saved;
    if (!saved) { fillApplication(workingForms[serverId] || draft?.data); return; }
    const sent = !demo && draft.remoteStatus === 'pending';
    $('appSavedOverline').textContent=sent ? 'ЗАЯВКА № '+draft.id : 'ЛОКАЛЬНЫЙ ЧЕРНОВИК';
    $('appSavedTitle').textContent=sent ? 'Заявка на рассмотрении' : storeAvailable ? 'Заявка сохранена в этом браузере' : 'Текст заявки подготовлен';
    $('appSavedText').textContent=sent ? 'Сервис подтвердил получение заявки. Решение будет принято после проверки.' : 'Администрации ничего не отправлено. Скопируй текст и передай его в официальный канал приёма заявок.';
    $('appPreview').textContent=C.applicationText(draft.data);
    for (const [id,url,vk] of [['appVKLink',config.contacts.vk,true],['appSupportLink',config.contacts.support,false]]) { $(id).hidden=!isSafeContact(url,vk); if (!$(id).hidden) $(id).href=url; }
    $('appContactNote').textContent=($('appVKLink').hidden && $('appSupportLink').hidden) ? 'Официальные адреса приёма заявок ещё не заданы. Кнопки VK и техподдержки появятся после их настройки.' : 'Переход открывает официальный канал. Текст нужно вставить и отправить самостоятельно.';
    $('appEdit').hidden=sent;
  }
  async function submitApplication(event) {
    event.preventDefault(); if (busy) return;
    const data={nick:$('appNick').value.trim(),serverId,capital:$('appCapital').value.trim()==='' ? NaN : Number($('appCapital').value),vk:$('appVK').value.trim(),reason:$('appReason').value.trim(),evidence:$('appEvidence').value.trim(),consent:$('appConsent').checked,demo};
    const errors=C.validateApplication(data);
    if (errors.length) { $('appError').textContent=errors.join('\n'); $('appError').hidden=false; $('appError').scrollIntoView({block:'nearest'}); return; }
    const token=++operation; setBusy(true);
    try {
      let result={data,createdAt:new Date().toISOString(),remoteStatus:'draft'};
      if (!demo) {
        // Nick, capital and evidence are claims, never authoritative game data.
        const r=await request('applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if (token!==operation) return;
        if (typeof r.id!=='string' || r.id.length>100 || r.status!=='pending') throw new Error('Сервер не подтвердил получение заявки.');
        result={...result,id:r.id,remoteStatus:'pending'};
      }
      draft=result;
      if (demo) { drafts[String(serverId)]=result; persistDrafts(); }
      else liveDrafts[String(serverId)]=result;
      delete workingForms[serverId];
      renderApplication(); $('clubBody').scrollTop=0; $('appCopy').focus();
    } catch(e) { if(token===operation){$('appError').textContent=e.message;$('appError').hidden=false;} }
    finally { if(token===operation) setBusy(false); }
  }
  function demoValues() { const v={}; for(const c of C.categories) { const input=$('demoForm').elements.namedItem(c.key); if(input.value.trim()==='' || !input.checkValidity()) throw new Error('Заполни все суммы неотрицательными числами.'); v[c.key]=Math.round(Number(input.value)*1e6); } C.calculate(v); return v; }
  function demoTotal() { try { $('demoTotal').textContent='Итого: '+money(C.calculate(demoValues()).net); } catch(_) { $('demoTotal').textContent='Проверь суммы активов.'; } }
  function fillDemo(value) { for(const c of C.categories) $('demoForm').elements.namedItem(c.key).value=value[c.key]/1e6; demoTotal(); }
  function openDemo() { if(!demo || busy) return; modalFocus=document.activeElement; fillDemo(assets); $('demoError').hidden=true; modal.hidden=false; $('demoClose').focus(); }
  function closeDemo() { if(modal.hidden) return; modal.hidden=true; modalFocus?.focus(); }
  function changeServer(id) {
    if(!Number.isInteger(id)||id<1||id>999) { toast('Укажи номер сервера от 1 до 999.'); return; }
    captureForm();
    operation++; setBusy(false); serverId=id; decision=null; checkedAt=null; remoteMinimum=undefined; profileReady=demo;
    $('clubServer').value=config.servers[id] ? String(id) : 'other'; $('clubOtherServer').hidden=!!config.servers[id]; $('clubOtherServer').value=id;
    loadDraft(); draw(); if(currentTab==='application') renderApplication(); if(!demo) refreshProfile();
  }
  // Entry points use the original tablet and ranking without changing its 29 players.
  const invite=document.createElement('div'); invite.className='club-invite';
  invite.innerHTML=`<svg class="club-invite-icon" aria-hidden="true"><use href="#crown"/></svg><div class="club-invite-copy"><strong>Твоё имя может быть здесь.</strong><span>SERVER 78 · Вход от 350 млн ₽ общего капитала</span></div><button class="club-button" id="clubJoin">Попасть в Forbes ↗</button>`;
  document.querySelector('.leaderboard-panel').append(invite);
  const rulesButton=document.createElement('button'); rulesButton.className='club-button quiet club-hero-link';rulesButton.textContent='Как попасть в рейтинг';rulesButton.addEventListener('click',()=>openClub('rules'));document.querySelector('.board-hero').append(rulesButton);
  const aside=document.createElement('div');aside.className='club-aside';aside.innerHTML='<div class="club-overline">FORBES CLUB</div><strong>350 млн <span style="font-size:14px;color:#7191b8">₽</span></strong><p>Порог на сервере 78.<br>Деньги + имущество.</p><button class="club-button secondary" id="clubAsideOpen">Проверить капитал</button>';document.querySelector('.profile-card').append(aside);
  const caption=document.querySelector('.board-footer span:last-child');caption.textContent='Демо-рейтинг · 29 игроков · листай ↓';
  $('clubJoin').addEventListener('click',()=>openClub());$('clubAsideOpen').addEventListener('click',()=>openClub());
  $('clubBack').addEventListener('click',closeClub);$('clubRanking').addEventListener('click',closeClub);
  $('clubCheck').addEventListener('click',checkCapital);$('clubApply').addEventListener('click',()=>setTab('application',true));
  screen.querySelectorAll('[data-club-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.clubTab)));
  screen.querySelector('.club-tabs').addEventListener('keydown',e=>{if(!e.target.dataset.clubTab || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=['capital','application','rules'];let i=tabs.indexOf(currentTab);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;setTab(tabs[i],true);});
  $('clubServer').value=String(serverId);$('clubServer').addEventListener('change',()=>{if($('clubServer').value==='other') { $('clubOtherServer').hidden=false;$('clubOtherServer').value=79;changeServer(79);$('clubOtherServer').focus(); } else changeServer(Number($('clubServer').value));});
  $('clubOtherServer').addEventListener('change',()=>changeServer(Number($('clubOtherServer').value)));
  $('clubApplication').addEventListener('submit',submitApplication);$('appEdit').addEventListener('click',()=>{renderApplication(true);$('appNick').focus();});
  $('appCopy').addEventListener('click',async()=>{ if(!draft)return;const value=C.applicationText(draft.data);try{await navigator.clipboard.writeText(value);toast('Текст заявки скопирован.');}catch(_){const sel=window.getSelection();const range=document.createRange();range.selectNodeContents($('appPreview'));sel.removeAllRanges();sel.addRange(range);toast('Текст выделен. Нажми Ctrl+C или выбери «Копировать».');}});
  $('clubDemoToggle').addEventListener('click',openDemo);$('demoClose').addEventListener('click',closeDemo);modal.addEventListener('click',e=>{if(e.target===modal)closeDemo();});
  $('demoForm').addEventListener('input',demoTotal);
  modal.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const target={below:220,boundary:350,member:420,vip:700,elite:1750,legend:3500}[b.dataset.preset]*1e6;const a={...defaults,cash:0,bank:0,business:0,property:0,vehicles:0,other:0,debts:0};a.bank=target;fillDemo(b.dataset.preset==='member'?defaults:a);}));
  $('demoForm').addEventListener('submit',e=>{e.preventDefault();try{assets=demoValues();decision=null;checkedAt=null;draw();closeDemo();setTab('capital');}catch(error){$('demoError').textContent=error.message;$('demoError').hidden=false;}});
  $('demoReset').addEventListener('click',()=>{delete drafts[String(serverId)];delete workingForms[serverId];draft=null;persistDrafts();if(currentTab==='application')renderApplication();toast('Демо-заявка этого сервера удалена.');});
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!modal.hidden){e.preventDefault();e.stopImmediatePropagation();closeDemo();return;}
    if(e.key==='Escape'&&screen.classList.contains('active')){e.preventDefault();e.stopImmediatePropagation();closeClub();return;}
    if(e.key==='Tab'&&!modal.hidden){const list=[...modal.querySelectorAll('button,input')].filter(el=>!el.disabled);const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  },true);
  draw();loadDraft();
  if(location.hash==='#club')openClub();
})();
