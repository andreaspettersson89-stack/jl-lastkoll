# JL Lastkoll

Mobilsida för en ställningsfirma: välj bil, släp och körkort, fyll i hur många HAKI Universal- och Layher
Allround-delar som lastas (fliken Haki | Layher, samma lass kan blanda båda), och se om ekipaget håller sig inom vikterna.

- Ingen databas, inget konto, ingen AI. Allt sparas i telefonens webbläsare (localStorage `lastkollen-v1`).
- Ingen byggprocess: statiska filer (`index.html`, `app.js`, `calc.js`, `haki-data.js`, `layher-data.js`).
- Vikterna i `haki-data.js` kommer ur HAKI Universal monteringsinstruktion (HAKI AB 2021), s. 5–15.
  Alla 236 rader är kontrollerade mot manualens text (art.nr och vikt i följd).
- Vikterna i `layher-data.js` kommer ur Layher Allround Scaffolding Catalogue 2023/2024 (Ref. No. 8116.260),
  s. 11–47 och pallarna på s. 71. 710 artiklar; 707 hittas i katalogtexten med vikten direkt före art.nr,
  3 står i omkastad ordning i PDF-texten och är förda in för hand (se filhuvudet). Delnamnen är katalogens engelska.
  Layher-delarnas id börjar med `L:` så att sparade Haki-antal inte påverkas.
- Uträkningen ligger i `calc.js`. Testerna: `node test/calc.test.js`.

Reglerna (Transportstyrelsen): B = släp ≤ 750 kg eller bil + släp ≤ 3 500 kg (registrerade
totalvikter); B96 = ≤ 4 250 kg; BE = släp ≤ 3 500 kg. Bilen själv ≤ 3 500 kg.
