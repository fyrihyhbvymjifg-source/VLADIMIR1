/* Единственное место настройки клуба. Значения остальных серверов задаёт администрация. */
window.FORBES_CLUB_CONFIG = {
  mode: 'demo',
  apiBase: '/api/forbes',
  defaultServer: 78,
  servers: {
    78: { name: 'Vladimir', minimum: 350000000 }
  },
  tiers: [
    { name: 'MEMBER', multiplier: 1 },
    { name: 'VIP', multiplier: 2 },
    { name: 'ELITE', multiplier: 5 },
    { name: 'LEGEND', multiplier: 10 }
  ],
  // Ссылки именно на приём заявок; личные VK игроков сюда не подставляются.
  contacts: { vk: '', support: '' }
};
