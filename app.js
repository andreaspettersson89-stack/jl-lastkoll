(function () {
  "use strict";
  var L = window.Lastkollen;
  var NYCKEL = "lastkollen-v1";
  var $ = function (id) { return document.getElementById(id); };

  // ---------- delarna ----------
  var DELAR = [];
  window.HAKI_BLOCK.forEach(function (b) {
    b[4].forEach(function (storlek, i) {
      DELAR.push({
        id: b[0] + "|" + b[5][i], grupp: b[1], namn: b[2], beskr: b[3], storlek: storlek,
        art: b[5][i], kg: Number(b[6][i].replace(",", "."))
      });
    });
  });
  var DEL_PER_ID = {};
  DELAR.forEach(function (d) { DEL_PER_ID[d.id] = d; });

  // ---------- läget, sparas i telefonen ----------
  var STANDARD = {
    bilar: [{ id: "b1", namn: "Mitsubishi L200", regnr: "", tjanstevikt: "", totalvikt: "", slapBromsad: "", slapObromsad: "", tagvikt: "" }],
    slapar: [], valdBil: "b1", valtSlap: "", behorighet: "B", ovrigt: "",
    zon: "flak", antal: { flak: {}, slap: {} }, favoriter: {}, baraFavoriter: false
  };
  var S;
  try { S = JSON.parse(localStorage.getItem(NYCKEL)) || null; } catch (e) { S = null; }
  if (!S || !S.bilar) S = JSON.parse(JSON.stringify(STANDARD));
  S.antal = S.antal || { flak: {}, slap: {} }; S.antal.flak = S.antal.flak || {}; S.antal.slap = S.antal.slap || {};
  S.favoriter = S.favoriter || {};
  function spara() { try { localStorage.setItem(NYCKEL, JSON.stringify(S)); } catch (e) { /* privat läge: räknar ändå */ } }

  function bil() { return S.bilar.find(function (b) { return b.id === S.valdBil; }) || S.bilar[0] || null; }
  function slap() { return S.slapar.find(function (s) { return s.id === S.valtSlap; }) || null; }
  function nyId(p) { return p + Date.now().toString(36) + Math.floor(Math.random() * 1000); }

  var kg = function (n) { return Math.round(n).toLocaleString("sv-SE") + " kg"; };
  var kgDec = function (n) { return (Math.round(n * 10) / 10).toLocaleString("sv-SE") + " kg"; };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fordonNamn(f) { return (f.namn || "Utan namn") + (f.regnr ? " (" + f.regnr.toUpperCase() + ")" : ""); }

  function summa(zon) {
    var t = 0, st = 0, a = S.antal[zon];
    Object.keys(a).forEach(function (id) { var d = DEL_PER_ID[id]; if (d && a[id] > 0) { t += d.kg * a[id]; st += a[id]; } });
    return { kg: t, st: st };
  }

  function berakna() {
    var s = slap();
    return L.rakna({
      bil: bil() || {}, slap: s, behorighet: S.behorighet, ovrigtIBilen: S.ovrigt,
      lastFlak: summa("flak").kg, lastSlap: s ? summa("slap").kg : 0
    });
  }

  // ---------- ekipage ----------
  function ritaVal() {
    var vb = $("valBil"); vb.innerHTML = "";
    S.bilar.forEach(function (b) { var o = el("option", null, fordonNamn(b)); o.value = b.id; vb.appendChild(o); });
    var ny = el("option", null, "+ Lägg till bil"); ny.value = "__ny"; vb.appendChild(ny);
    vb.value = bil() ? bil().id : "__ny";
    $("andraBil").disabled = !bil();

    var vs = $("valSlap"); vs.innerHTML = "";
    var inget = el("option", null, "Inget släp"); inget.value = ""; vs.appendChild(inget);
    S.slapar.forEach(function (s) { var o = el("option", null, fordonNamn(s)); o.value = s.id; vs.appendChild(o); });
    var nys = el("option", null, "+ Lägg till släp"); nys.value = "__ny"; vs.appendChild(nys);
    vs.value = slap() ? slap().id : "";
    $("andraSlap").disabled = !slap();

    Array.prototype.forEach.call($("valKorkort").children, function (b) { b.classList.toggle("vald", b.dataset.v === S.behorighet); });
    if (!slap() && S.zon === "slap") S.zon = "flak";
    Array.prototype.forEach.call($("valZon").children, function (b) {
      b.classList.toggle("vald", b.dataset.v === S.zon);
      if (b.dataset.v === "slap") b.disabled = !slap();
    });
    $("ovrigt").value = S.ovrigt;
  }

  $("valBil").addEventListener("change", function (e) {
    if (e.target.value === "__ny") { oppnaBil(null); e.target.value = bil() ? bil().id : "__ny"; return; }
    S.valdBil = e.target.value; spara(); allt();
  });
  $("valSlap").addEventListener("change", function (e) {
    if (e.target.value === "__ny") { oppnaSlap(null); e.target.value = slap() ? slap().id : ""; return; }
    S.valtSlap = e.target.value; if (S.valtSlap) S.zon = "slap"; spara(); allt(); ritaDelar();
  });
  $("andraBil").addEventListener("click", function () { oppnaBil(bil()); });
  $("andraSlap").addEventListener("click", function () { oppnaSlap(slap()); });
  $("valKorkort").addEventListener("click", function (e) { var v = e.target.dataset && e.target.dataset.v; if (!v) return; S.behorighet = v; spara(); allt(); });
  $("valZon").addEventListener("click", function (e) { var v = e.target.dataset && e.target.dataset.v; if (!v || e.target.disabled) return; S.zon = v; spara(); allt(); ritaDelar(); });
  $("ovrigt").addEventListener("input", function (e) { S.ovrigt = e.target.value; spara(); uppdatera(); });

  // ---------- dialoger ----------
  var BILFALT = [["bNamn", "namn"], ["bReg", "regnr"], ["bTj", "tjanstevikt"], ["bTot", "totalvikt"], ["bSB", "slapBromsad"], ["bSO", "slapObromsad"], ["bTag", "tagvikt"]];
  var SLAPFALT = [["sNamn", "namn"], ["sReg", "regnr"], ["sTj", "tjanstevikt"], ["sTot", "totalvikt"]];
  var redigerar = null;

  function oppnaBil(b) {
    redigerar = b ? b.id : null;
    $("dlgBilRubrik").textContent = b ? "Ändra bil" : "Lägg till bil";
    BILFALT.forEach(function (f) { $(f[0]).value = b ? (b[f[1]] || "") : ""; });
    $("bTaBort").hidden = !b || S.bilar.length < 2;
    $("dlgBil").showModal();
  }
  $("dlgBil").addEventListener("close", function () {
    var v = $("dlgBil").returnValue;
    if (v === "spara") {
      var obj = redigerar ? S.bilar.find(function (b) { return b.id === redigerar; }) : { id: nyId("b") };
      BILFALT.forEach(function (f) { obj[f[1]] = $(f[0]).value.trim(); });
      if (!redigerar) S.bilar.push(obj);
      S.valdBil = obj.id;
    } else if (v === "tabort" && redigerar && confirm("Ta bort bilen?")) {
      S.bilar = S.bilar.filter(function (b) { return b.id !== redigerar; });
      S.valdBil = S.bilar[0] ? S.bilar[0].id : "";
    }
    $("dlgBil").returnValue = ""; spara(); allt();
  });

  function oppnaSlap(s) {
    redigerar = s ? s.id : null;
    $("dlgSlapRubrik").textContent = s ? "Ändra släp" : "Lägg till släp";
    SLAPFALT.forEach(function (f) { $(f[0]).value = s ? (s[f[1]] || "") : ""; });
    $("sBroms").checked = s ? s.bromsat !== false : true;
    $("sTaBort").hidden = !s;
    $("dlgSlap").showModal();
  }
  $("dlgSlap").addEventListener("close", function () {
    var v = $("dlgSlap").returnValue;
    if (v === "spara") {
      var obj = redigerar ? S.slapar.find(function (s) { return s.id === redigerar; }) : { id: nyId("s") };
      SLAPFALT.forEach(function (f) { obj[f[1]] = $(f[0]).value.trim(); });
      obj.bromsat = $("sBroms").checked;
      if (!redigerar) S.slapar.push(obj);
      S.valtSlap = obj.id; S.zon = "slap";
    } else if (v === "tabort" && redigerar && confirm("Ta bort släpet?")) {
      S.slapar = S.slapar.filter(function (s) { return s.id !== redigerar; });
      if (S.valtSlap === redigerar) S.valtSlap = "";
    }
    $("dlgSlap").returnValue = ""; spara(); allt(); ritaDelar();
  });

  // ---------- resultat ----------
  function stapel(rubrik, del) {
    var st = L.status(del);
    var w = el("div", "stapel " + st);
    var topp = el("div", "stapel-topp");
    topp.appendChild(el("span", null, rubrik));
    topp.appendChild(el("b", null, kg(del.vikt) + " / " + kg(del.grans)));
    w.appendChild(topp);
    var spar = el("div", "stapel-spar"), fyll = el("div", "stapel-fyll");
    fyll.style.width = Math.min(100, Math.max(0, del.vikt / del.grans * 100)) + "%";
    spar.appendChild(fyll); w.appendChild(spar);
    var skill = del.grans - del.vikt;
    w.appendChild(el("div", "stapel-under", (skill < 0 ? "ÖVERLAST " + kg(-skill) + ". " : "") + "Gräns: " + del.grund));
    return w;
  }

  function ritaResultat(r) {
    var box = $("resultat"); box.innerHTML = "";
    if (!bil()) { box.appendChild(el("div", "varning", "Lägg till en bil först.")); return; }
    if (r.saknas.length) {
      var v = el("div", "varning", "Fyll i " + r.saknas.join(", ") + ", så räknar appen.");
      var knapp = el("button", "knapp-accent", r.saknas.some(function (x) { return x.indexOf("släpets") === 0; }) && !r.saknas.some(function (x) { return x.indexOf("bilens") === 0; }) ? "Fyll i släpet" : "Fyll i bilen");
      knapp.type = "button";
      knapp.onclick = function () { if (knapp.textContent === "Fyll i släpet") oppnaSlap(slap()); else oppnaBil(bil()); };
      v.appendChild(el("br")); v.appendChild(knapp); box.appendChild(v);
    }
    if (r.korkort.ok !== null) box.appendChild(el("div", "varning " + (r.korkort.ok ? "gron" : "rod"), (r.korkort.ok ? "✓ " : "✕ ") + r.korkort.text));

    if (r.slap) box.appendChild(stapel("Släpet", r.slap));
    if (r.bil) box.appendChild(stapel("Bilen", r.bil));
    if (r.tag) box.appendChild(stapel("Bil + släp", r.tag));

    var kv = el("div", "kvar");
    function ruta(rubrik, varde) {
      var d = el("div", varde < 0 ? "minus" : null);
      d.appendChild(el("small", null, rubrik));
      d.appendChild(el("b", null, varde < 0 ? "−" + kg(-varde) : kg(varde)));
      kv.appendChild(d);
    }
    if (r.rumSlap !== null) ruta("Kvar på släpet", r.rumSlap);
    if (r.rumFlak !== null) ruta("Kvar på flaket / i bilen", r.rumFlak);
    if (kv.children.length) box.appendChild(kv);
  }

  function ritaBotten(r) {
    var b = $("botten"); b.innerHTML = "";
    function chip(rubrik, del) {
      var c = el("div", "chip " + L.status(del));
      c.appendChild(document.createTextNode(rubrik));
      c.appendChild(el("b", null, del ? kg(del.vikt) + " / " + kg(del.grans) : "fyll i vikter"));
      b.appendChild(c);
    }
    if (slap()) chip("Släpet", r.slap);
    chip("Bilen", r.bil);
  }

  // ---------- delar ----------
  var radRefs = {};
  function ritaDelar() {
    var box = $("delar"); box.innerHTML = ""; radRefs = {};
    var q = $("sok").value.trim().toLowerCase();
    var ord = q.split(/\s+/).filter(Boolean);
    var antalZon = S.antal[S.zon];
    var visade = 0;
    window.HAKI_GRUPPER.forEach(function (gnamn, gi) {
      var lista = DELAR.filter(function (d) {
        if (d.grupp !== gi) return false;
        if (S.baraFavoriter && !S.favoriter[d.id] && !(antalZon[d.id] > 0)) return false;
        if (!ord.length) return true;
        var hay = (gnamn + " " + d.namn + " " + d.beskr + " " + d.storlek + " " + d.art).toLowerCase();
        return ord.every(function (o) { return hay.indexOf(o) >= 0; });
      });
      if (!lista.length) return;
      visade += lista.length;
      var det = el("details", "grupp");
      if (ord.length || S.baraFavoriter || lista.some(function (d) { return antalZon[d.id] > 0; })) det.open = true;
      var sum = el("summary"); sum.appendChild(el("span", null, gnamn));
      var ga = el("span", "grupp-antal"); sum.appendChild(ga);
      det.appendChild(sum);
      lista.forEach(function (d) {
        var rad = el("div", "del");
        var stj = el("button", "stjarna" + (S.favoriter[d.id] ? " pa" : ""), "★");
        stj.type = "button"; stj.setAttribute("aria-label", "Markera som min del");
        stj.onclick = function () { if (S.favoriter[d.id]) delete S.favoriter[d.id]; else S.favoriter[d.id] = true; stj.classList.toggle("pa"); spara(); };
        var namn = el("div", "del-namn");
        namn.appendChild(document.createTextNode(d.namn + (d.storlek !== "–" ? " " + d.storlek : "")));
        var info = el("small");
        info.appendChild(document.createTextNode(kgDec(d.kg) + " st · art " + d.art + " · "));
        var ryms = el("span", "ryms"); info.appendChild(ryms);
        namn.appendChild(info);
        var steg = el("div", "stegare");
        var minus = el("button", null, "−"); minus.type = "button"; minus.setAttribute("aria-label", "En färre");
        var inp = el("input"); inp.type = "number"; inp.inputMode = "numeric"; inp.min = "0"; inp.value = antalZon[d.id] || ""; inp.placeholder = "0";
        inp.setAttribute("aria-label", "Antal " + d.namn + " " + d.storlek);
        var plus = el("button", null, "+"); plus.type = "button"; plus.setAttribute("aria-label", "En till");
        function satt(n) {
          n = Math.max(0, Math.floor(n || 0));
          if (n) S.antal[S.zon][d.id] = n; else delete S.antal[S.zon][d.id];
          inp.value = n || ""; spara(); uppdatera();
        }
        minus.onclick = function () { satt((S.antal[S.zon][d.id] || 0) - 1); };
        plus.onclick = function () { satt((S.antal[S.zon][d.id] || 0) + 1); };
        inp.oninput = function () { satt(Number(inp.value)); };
        inp.onfocus = function () { inp.select(); };
        steg.appendChild(minus); steg.appendChild(inp); steg.appendChild(plus);
        rad.appendChild(stj); rad.appendChild(namn); rad.appendChild(steg);
        det.appendChild(rad);
        radRefs[d.id] = { rad: rad, ryms: ryms, grupp: ga, gi: gi };
      });
      box.appendChild(det);
    });
    if (!visade) box.appendChild(el("div", "tom-lista", S.baraFavoriter ? "Inga stjärnmärkta delar än. Tryck på ★ vid de delar du brukar lasta." : "Inga delar matchar sökningen."));
    $("baraStjarnor").classList.toggle("pa", S.baraFavoriter);
    $("baraStjarnor").setAttribute("aria-pressed", String(S.baraFavoriter));
    uppdatera();
  }

  $("sok").addEventListener("input", ritaDelar);
  $("baraStjarnor").addEventListener("click", function () { S.baraFavoriter = !S.baraFavoriter; spara(); ritaDelar(); });
  $("tom").addEventListener("click", function () {
    var namn = S.zon === "slap" ? "släpet" : "flaket";
    if (!summa(S.zon).st || !confirm("Töm allt på " + namn + "?")) return;
    S.antal[S.zon] = {}; spara(); ritaDelar();
  });

  // ---------- uppdatera siffror utan att rita om listan ----------
  function uppdatera() {
    var r = berakna();
    ritaResultat(r); ritaBotten(r);
    var rum = S.zon === "slap" ? r.rumSlap : r.rumFlak;
    var antalZon = S.antal[S.zon];
    var perGrupp = {};
    Object.keys(radRefs).forEach(function (id) {
      var ref = radRefs[id], d = DEL_PER_ID[id], n = antalZon[id] || 0;
      ref.rad.classList.toggle("har", n > 0);
      if (n) perGrupp[ref.gi] = (perGrupp[ref.gi] || 0) + n;
      if (rum === null) { ref.ryms.textContent = "fyll i vikterna"; ref.ryms.className = "ryms"; return; }
      var fler = Math.floor(rum / d.kg);
      ref.ryms.textContent = fler > 0 ? "ryms " + fler + " till" : (rum < 0 ? "överlast" : "får inte plats");
      ref.ryms.className = "ryms" + (fler > 0 ? "" : " slut");
    });
    Object.keys(radRefs).forEach(function (id) { var ref = radRefs[id]; ref.grupp.textContent = perGrupp[ref.gi] ? perGrupp[ref.gi] + " st" : ""; });
    var s = summa(S.zon);
    $("lastatText").textContent = (S.zon === "slap" ? "På släpet: " : "På flaket: ") + s.st + " delar, " + kg(s.kg);
  }

  function allt() { ritaVal(); uppdatera(); }

  $("kalla").textContent = "Vikterna kommer från " + window.HAKI_KALLA + ". " + DELAR.length + " delar.";
  allt(); ritaDelar();
})();
