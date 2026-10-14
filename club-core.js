/* Чистые расчёты интерфейса. Решение о реальном допуске принимает сервер. */
(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  else root.ForbesCore = core;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const categories = [
    { key: 'cash', label: 'Наличные', icon: 'ruble' },
    { key: 'bank', label: 'Банковские счета', icon: 'coins' },
    { key: 'business', label: 'Бизнес', icon: 'bars' },
    { key: 'property', label: 'Недвижимость', icon: 'shield' },
    { key: 'vehicles', label: 'Транспорт', icon: 'car' },
    { key: 'other', label: 'Прочее имущество', icon: 'gift' },
    { key: 'debts', label: 'Обязательства', icon: 'news' }
  ];
  function amount(value) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('Сумма должна быть целым неотрицательным числом.');
    return value;
  }
  function calculate(assets) {
    if (!assets || typeof assets !== 'object') throw new Error('Нет данных об активах.');
    let gross = 0;
    for (const c of categories) {
      const value = amount(assets[c.key]);
      if (c.key !== 'debts') gross += value;
    }
    if (!Number.isSafeInteger(gross)) throw new Error('Сумма активов слишком велика.');
    return { gross, debts: assets.debts, net: gross - assets.debts };
  }
  function tierFor(net, minimum, tiers) {
    if (!Number.isSafeInteger(minimum) || minimum <= 0 || net < minimum) return null;
    const eligible = tiers.filter(t => Number.isFinite(t.multiplier) && t.multiplier >= 1 && net >= minimum * t.multiplier);
    return eligible.sort((a, b) => b.multiplier - a.multiplier)[0]?.name || 'MEMBER';
  }
  function assess(assets, minimum, tiers) {
    const capital = calculate(assets);
    const configured = Number.isSafeInteger(minimum) && minimum > 0;
    return { ...capital, configured, eligible: configured && capital.net >= minimum,
      missing: configured ? Math.max(0, minimum - capital.net) : null,
      tier: tierFor(capital.net, minimum, tiers),
      progress: configured ? Math.max(0, Math.min(100, capital.net / minimum * 100)) : 0 };
  }
  function isVK(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && ['vk.com', 'www.vk.com', 'vk.ru', 'www.vk.ru'].includes(u.hostname) && u.pathname.length > 1 && !u.username && !u.password; }
    catch (_) { return false; }
  }
  function validateApplication(data) {
    const errors = [];
    if (!/^[A-Za-z][A-Za-z0-9_]{2,31}$/.test(data.nick || '')) errors.push('Укажи игровой ник: 3–32 латинских символа, цифры или подчёркивание.');
    if (!Number.isInteger(data.serverId) || data.serverId < 1 || data.serverId > 999) errors.push('Проверь номер сервера.');
    if (!Number.isSafeInteger(data.capital) || data.capital < 0) errors.push('Укажи заявленный капитал в игровых рублях.');
    if (!isVK(data.vk)) errors.push('Укажи ссылку на профиль https://vk.com/… или https://vk.ru/…');
    if (!data.reason || data.reason.trim().length < 10 || data.reason.length > 1500) errors.push('Опиши причину заявки: от 10 до 1500 символов.');
    if (data.evidence) {
      try { const u = new URL(data.evidence); if (u.protocol !== 'https:' || u.username || u.password) throw new Error(); }
      catch (_) { errors.push('Ссылка на подтверждение должна начинаться с https://'); }
    }
    if (!data.consent) errors.push('Подтверди достоверность указанных данных.');
    return errors;
  }
  function applicationText(data) {
    return ['Заявка в FORBES', 'Ник: ' + data.nick, 'Сервер: ' + data.serverId,
      'Заявленный капитал: ' + new Intl.NumberFormat('ru-RU').format(data.capital) + ' ₽',
      'VK: ' + data.vk, 'Причина: ' + data.reason,
      'Подтверждение: ' + (data.evidence || 'Предоставлю проверяющему'),
      'Тип данных: ' + (data.demo ? 'демонстрационный черновик; игровые данные не проверены' : 'сведения игрока для ручной проверки')].join('\n');
  }
  function validSnapshot(data, serverId) {
    if (!data || data.serverId !== serverId || typeof data.nick !== 'string' || data.nick.length > 32) throw new Error('Ответ не соответствует выбранному игроку или серверу.');
    calculate(data.assets);
    if (!data.checkedAt || !Number.isFinite(Date.parse(data.checkedAt))) throw new Error('Нет времени проверки данных.');
    return data;
  }
  return { categories, amount, calculate, tierFor, assess, isVK, validateApplication, applicationText, validSnapshot };
});
