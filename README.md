# Lastkollen

Mobilsida för en ställningsfirma: välj bil, släp och körkort, fyll i hur många HAKI Universal-delar
som lastas, och se om ekipaget håller sig inom vikterna.

- Ingen databas, inget konto, ingen AI. Allt sparas i telefonens webbläsare (localStorage `lastkollen-v1`).
- Ingen byggprocess: statiska filer (`index.html`, `app.js`, `calc.js`, `haki-data.js`).
- Vikterna i `haki-data.js` kommer ur HAKI Universal monteringsinstruktion (HAKI AB 2021), s. 5–15.
  Alla 236 rader är kontrollerade mot manualens text (art.nr och vikt i följd).
- Uträkningen ligger i `calc.js`. Testerna: `node test/calc.test.js`.

Reglerna (Transportstyrelsen): B = släp ≤ 750 kg eller bil + släp ≤ 3 500 kg (registrerade
totalvikter); B96 = ≤ 4 250 kg; BE = släp ≤ 3 500 kg. Bilen själv ≤ 3 500 kg.
