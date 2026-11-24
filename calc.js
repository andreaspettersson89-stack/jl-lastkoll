// Uträkningen. Ren funktion: samma indata ger alltid samma svar. Testas i test/calc.test.js.
// Regler (Transportstyrelsen):
//  B   : bilens totalvikt högst 3 500 kg. Släp högst 750 kg totalvikt, ELLER bil + släp
//        (registrerade totalvikter) högst 3 500 kg.
//  B96 : som B, men bil + släp högst 4 250 kg.
//  BE  : bilens totalvikt högst 3 500 kg, släpets totalvikt högst 3 500 kg.
// Körkortsreglerna räknas på REGISTRERADE totalvikter, inte på hur mycket som är lastat.
(function (root) {
  function tal(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = Number(String(v).replace(",", ".").replace(/\s/g, ""));
    return isFinite(n) && n >= 0 ? n : null;
  }

  function korkort(behorighet, bil, slap) {
    var bt = tal(bil.totalvikt);
    if (bt === null) return { ok: null, text: "Fyll i bilens totalvikt" };
    if (bt > 3500) return { ok: false, text: "Bilens totalvikt är över 3 500 kg. Det kräver C1 eller C, inte " + behorighet + "." };
    if (!slap) return { ok: true, text: behorighet + " räcker för bilen utan släp." };
    var st = tal(slap.totalvikt);
    if (st === null) return { ok: null, text: "Fyll i släpets totalvikt" };
    var summa = bt + st;
    if (behorighet === "BE") {
      if (st <= 3500) return { ok: true, text: "BE räcker: släpets totalvikt " + st + " kg är högst 3 500 kg." };
      return { ok: false, text: "Släpets totalvikt " + st + " kg är över 3 500 kg. BE räcker inte." };
    }
    if (st <= 750) return { ok: true, text: behorighet + " räcker: släpets totalvikt är högst 750 kg." };
    var tak = behorighet === "B96" ? 4250 : 3500;
    if (summa <= tak) return { ok: true, text: behorighet + " räcker: bil + släp registrerat " + summa + " kg, högst " + tak + " kg." };
    var forslag = behorighet === "B" && summa <= 4250 ? " Det räcker med B96 (högst 4 250 kg) eller BE." : " Det kräver BE.";
    return { ok: false, text: "Med " + behorighet + " får du inte dra det här släpet: bil + släp registrerat " + summa + " kg, över " + tak + " kg." + forslag };
  }

  // in: { bil, slap|null, behorighet, ovrigtIBilen, lastSlap, lastFlak }  (kg)
  function rakna(inp) {
    var bil = inp.bil || {}, slap = inp.slap || null;
    var saknas = [];
    var bTj = tal(bil.tjanstevikt), bTot = tal(bil.totalvikt);
    var bSlapB = tal(bil.slapBromsad), bSlapO = tal(bil.slapObromsad), bTag = tal(bil.tagvikt);
    if (bTj === null) saknas.push("bilens tjänstevikt");
    if (bTot === null) saknas.push("bilens totalvikt");

    var ovrigt = tal(inp.ovrigtIBilen) || 0;
    var lastSlap = inp.lastSlap || 0, lastFlak = inp.lastFlak || 0;
    var bilVikt = (bTj || 0) + ovrigt + lastFlak;

    var res = { saknas: saknas, bil: null, slap: null, tag: null, korkort: korkort(inp.behorighet || "B", bil, slap), rumSlap: null, rumFlak: null };

    if (bTot !== null && bTj !== null) {
      res.bil = { vikt: bilVikt, grans: bTot, grund: "bilens totalvikt" };
    }

    var slapVikt = 0, slapGrans = null;
    if (slap) {
      var sTj = tal(slap.tjanstevikt), sTot = tal(slap.totalvikt);
      if (sTj === null) saknas.push("släpets tjänstevikt");
      if (sTot === null) saknas.push("släpets totalvikt");
      var drag = slap.bromsat === false ? bSlapO : bSlapB;
      if (drag === null) saknas.push(slap.bromsat === false ? "bilens max släpvagnsvikt, obromsad" : "bilens max släpvagnsvikt, bromsad");
      slapVikt = (sTj || 0) + lastSlap;
      if (sTj !== null && sTot !== null && drag !== null) {
        if (drag < sTot) { slapGrans = drag; res.slap = { vikt: slapVikt, grans: drag, grund: "vad bilen får dra (" + (slap.bromsat === false ? "obromsat" : "bromsat") + ")" }; }
        else { slapGrans = sTot; res.slap = { vikt: slapVikt, grans: sTot, grund: "släpets totalvikt" }; }
      }
    }

    if (bTag !== null && bTj !== null) {
      res.tag = { vikt: bilVikt + slapVikt, grans: bTag, grund: "bilens tågvikt (bil + släp)" };
    }

    // Hur många kilo till ryms på flaket / släpet, med hänsyn till alla gränser.
    if (res.bil) {
      var rf = bTot - bilVikt;
      if (res.tag) rf = Math.min(rf, bTag - bilVikt - slapVikt);
      res.rumFlak = rf;
    }
    if (slap && res.slap) {
      var rs = slapGrans - slapVikt;
      if (res.tag) rs = Math.min(rs, bTag - bilVikt - slapVikt);
      res.rumSlap = rs;
    }
    return res;
  }

  function status(del) {
    if (!del) return "okand";
    if (del.vikt > del.grans) return "over";
    if (del.vikt >= del.grans * 0.9) return "nara";
    return "ok";
  }

  root.Lastkollen = { rakna: rakna, korkort: korkort, status: status, tal: tal };
})(typeof window !== "undefined" ? window : globalThis);
