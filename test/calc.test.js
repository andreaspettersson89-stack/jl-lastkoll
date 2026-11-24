// Kör: node test/calc.test.js
const assert = require("assert");
require("../calc.js");
const L = globalThis.Lastkollen;
const bil = { tjanstevikt: 2000, totalvikt: 3000, slapBromsad: 3100, slapObromsad: 750, tagvikt: 6100 };
const lattSlap = { tjanstevikt: 250, totalvikt: 750, bromsat: true };
let n = 0; const t = (namn, f) => { f(); n++; console.log("ok  " + namn); };

t("lätt släp med B: släpets totalvikt styr, flaket styrs av bilens totalvikt", () => {
  const r = L.rakna({ bil, slap: lattSlap, behorighet: "B", ovrigtIBilen: 100, lastSlap: 300, lastFlak: 400 });
  assert.strictEqual(r.korkort.ok, true);
  assert.deepStrictEqual([r.slap.vikt, r.slap.grans, r.slap.grund], [550, 750, "släpets totalvikt"]);
  assert.strictEqual(r.rumSlap, 200);              // 750 - (250 + 300)
  assert.deepStrictEqual([r.bil.vikt, r.bil.grans], [2500, 3000]); // 2000 + 100 + 400
  assert.strictEqual(r.rumFlak, 500);              // min(3000-2500, 6100-2500-550)
  assert.strictEqual(r.saknas.length, 0);
});
t("B och tungt släp: 3000 + 1500 = 4500 → nej, kräver BE", () => {
  const k = L.korkort("B", bil, { totalvikt: 1500 });
  assert.strictEqual(k.ok, false); assert.match(k.text, /4500 kg/); assert.match(k.text, /BE/);
});
t("B: 3000 + 1200 = 4200 → nej med B, föreslår B96", () => {
  const k = L.korkort("B", bil, { totalvikt: 1200 });
  assert.strictEqual(k.ok, false); assert.match(k.text, /B96/);
});
t("B96: 3000 + 1200 = 4200 → ja", () => assert.strictEqual(L.korkort("B96", bil, { totalvikt: 1200 }).ok, true));
t("B96: 3000 + 1300 = 4300 → nej", () => assert.strictEqual(L.korkort("B96", bil, { totalvikt: 1300 }).ok, false));
t("BE: släp 3500 → ja, 3600 → nej", () => {
  assert.strictEqual(L.korkort("BE", bil, { totalvikt: 3500 }).ok, true);
  assert.strictEqual(L.korkort("BE", bil, { totalvikt: 3600 }).ok, false);
});
t("B: släp 750 → ja även om summan är över 3500", () => assert.strictEqual(L.korkort("B", bil, { totalvikt: 750 }).ok, true));
t("bil över 3500 → nej oavsett behörighet", () => assert.strictEqual(L.korkort("BE", { totalvikt: 3600 }, null).ok, false));
t("bilens dragvikt styr när den är lägre än släpets totalvikt", () => {
  const r = L.rakna({ bil: { ...bil, slapBromsad: 1000 }, slap: { tjanstevikt: 400, totalvikt: 1500, bromsat: true }, behorighet: "BE", lastSlap: 500 });
  assert.strictEqual(r.slap.grans, 1000); assert.match(r.slap.grund, /bilen får dra/);
  assert.strictEqual(r.rumSlap, 100);
});
t("tågvikten styr när den är lägst", () => {
  const r = L.rakna({ bil: { ...bil, tagvikt: 3500 }, slap: lattSlap, behorighet: "B", ovrigtIBilen: 0, lastSlap: 650, lastFlak: 500 });
  // bil 2500, släp 900 → tåg 3400; rum = min(750-900, 3500-3400) = -150
  assert.strictEqual(r.tag.vikt, 3400); assert.strictEqual(r.rumSlap, -150); assert.strictEqual(L.status(r.slap), "over");
  assert.strictEqual(r.rumFlak, 100);   // min(3000-2500, 3500-3400)
});
t("obromsat släp använder obromsad dragvikt, och säger till om den saknas", () => {
  const r = L.rakna({ bil: { ...bil, slapObromsad: "" }, slap: { tjanstevikt: 150, totalvikt: 600, bromsat: false }, behorighet: "B" });
  assert.ok(r.saknas.includes("bilens max släpvagnsvikt, obromsad")); assert.strictEqual(r.slap, null);
  const r2 = L.rakna({ bil: { ...bil, slapObromsad: 500 }, slap: { tjanstevikt: 150, totalvikt: 600, bromsat: false }, behorighet: "B" });
  assert.strictEqual(r2.slap.grans, 500);
});
t("tomma fält ger 'saknas', ingen krasch", () => {
  const r = L.rakna({ bil: { tjanstevikt: "", totalvikt: "" }, slap: null, behorighet: "B" });
  assert.deepStrictEqual(r.saknas, ["bilens tjänstevikt", "bilens totalvikt"]); assert.strictEqual(r.bil, null);
});
t("status: 89 % ok, 90 % nära, över gränsen = över", () => {
  assert.strictEqual(L.status({ vikt: 890, grans: 1000 }), "ok");
  assert.strictEqual(L.status({ vikt: 900, grans: 1000 }), "nara");
  assert.strictEqual(L.status({ vikt: 1001, grans: 1000 }), "over");
});
t("tal() tar komma och mellanslag", () => { assert.strictEqual(L.tal("2 950"), 2950); assert.strictEqual(L.tal("10,5"), 10.5); assert.strictEqual(L.tal("x"), null); });
console.log(n + " tester gröna");
