const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../club-core.js');
const tiers = [{name:'MEMBER',multiplier:1},{name:'VIP',multiplier:2},{name:'ELITE',multiplier:5},{name:'LEGEND',multiplier:10}];
const assets = (bank,debts=0) => ({cash:0,bank,business:0,property:0,vehicles:0,other:0,debts});

test('Вход включён ровно с 350 млн, на рубль меньше — отказ', () => {
  assert.equal(C.assess(assets(349999999),350000000,tiers).eligible,false);
  assert.equal(C.assess(assets(349999999),350000000,tiers).missing,1);
  assert.equal(C.assess(assets(350000000),350000000,tiers).tier,'MEMBER');
});
test('Все типы активов складываются, обязательства вычитаются один раз', () => {
  const result=C.assess({cash:55e6,bank:95e6,business:180e6,property:40e6,vehicles:45e6,other:5e6,debts:100e6},350e6,tiers);
  assert.equal(result.gross,420e6); assert.equal(result.net,320e6); assert.equal(result.missing,30e6); assert.equal(result.eligible,false);
});
test('Уровни меняются на границах 1×, 2×, 5× и 10×', () => {
  for (const [capital,tier] of [[350e6,'MEMBER'],[699999999,'MEMBER'],[700e6,'VIP'],[1750e6,'ELITE'],[3500e6,'LEGEND']]) assert.equal(C.tierFor(capital,350e6,tiers),tier);
  assert.equal(C.tierFor(350e6,700e6,tiers),null);
});
test('Неизвестный порог не разрешает вход даже с большим капиталом', () => {
  for(const threshold of [null,undefined,0,-1,NaN]) {
    const a=C.assess(assets(100e9),threshold,tiers);
    assert.equal(a.eligible,false); assert.equal(a.tier,null); assert.equal(a.configured,false);
  }
});
test('Отрицательный чистый капитал допустим, полоса ограничена 0–100', () => {
  const debt=C.assess(assets(10,100),350e6,tiers);
  assert.equal(debt.net,-90); assert.equal(debt.progress,0);
  assert.equal(C.assess(assets(8e9),350e6,tiers).progress,100);
});
test('Повреждённые, неполные и слишком большие данные отклоняются', () => {
  for(const value of [-1,NaN,Infinity,'350000000',0.1,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>C.calculate(assets(value)));
  assert.throws(()=>C.calculate({bank:350e6}));
  assert.throws(()=>C.calculate({...assets(Number.MAX_SAFE_INTEGER),cash:1}));
});
const application={nick:'Player_Name',serverId:78,capital:350e6,vk:'https://vk.com/player',reason:'Прошу учесть приобретённый бизнес.',evidence:'',consent:true,demo:true};
test('Полная заявка проходит; пустые и некорректные поля отклоняются', () => {
  assert.deepEqual(C.validateApplication(application),[]);
  for(const patch of [{nick:'<script>'},{serverId:0},{capital:NaN},{capital:-1},{vk:'https://vk.com.attacker.example/user'},{reason:'abc'},{consent:false},{evidence:'javascript:alert(1)'}]) assert.ok(C.validateApplication({...application,...patch}).length>0);
});
test('VK проверяется по точному домену и HTTPS', () => {
  assert.ok(C.isVK('https://vk.ru/id123'));
  assert.equal(C.isVK('https://vk.com@evil.example/player'),false);
  assert.equal(C.isVK('http://vk.com/player'),false);
  assert.equal(C.isVK('https://vk.com/'),false);
});
test('Ответ игрового сервера должен содержать снимок выбранного сервера и дату', () => {
  const p={nick:'Player_Name',serverId:78,assets:assets(350e6),checkedAt:'2026-10-14T19:00:00Z'};
  assert.equal(C.validSnapshot(p,78),p);
  assert.throws(()=>C.validSnapshot(p,79));
  assert.throws(()=>C.validSnapshot({...p,checkedAt:null},78));
});
test('Экспорт заявки явно помечает демонстрационные данные', () => {
  const text=C.applicationText(application);
  assert.match(text,/демонстрационный черновик/); assert.match(text,/Сервер: 78/); assert.match(text,/Player_Name/);
});
