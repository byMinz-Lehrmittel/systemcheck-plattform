/* Spiel «Wer steckt hinter dem Buchstaben?» – Modul 1, DISG */

const TYPEN = {
  D: { name: "Dominant" },
  I: { name: "Initiativ" },
  S: { name: "Stetig" },
  G: { name: "Gewissenhaft" }
};
const REIHENFOLGE = ["D", "I", "G", "S"]; // wie im Layout: oben D, I – unten G, S

/* Die acht Themen. «blase» ist der Text in der Sprechblase. */
const THEMEN = [
  { blase: "Darauf konzentriere ich mich", antworten: { D: "Anpacken", I: "Positiv bleiben", S: "Harmonie", G: "Kleine Details" } },
  { blase: "Danach suche ich", antworten: { D: "Action", I: "Spass", S: "Freundlichkeit", G: "Genauigkeit" } },
  { blase: "Gehe ich Risiken ein?", antworten: { D: "Mutig drauf los", I: "Probiert aus", S: "Braucht Ermutigung", G: "Wägt gründlich ab" } },
  { blase: "Das mag ich", antworten: { D: "Abenteuer", I: "Viele Freunde", S: "Anderen zu helfen", G: "Sich klug fühlen" } },
  { blase: "Das mag ich nicht", antworten: {
      D: "Verlieren, zu viele Regeln, keine Kontrolle",
      I: "Negativität, Details, langweilige Arbeiten",
      S: "Konflikte, Gemeinheit, plötzliche Veränderung",
      G: "Unordnung, Ungenauigkeit, Zeitdruck" } },
  { blase: "Dabei helfe ich anderen", antworten: { D: "Aktiv zu werden", I: "Motiviert zu bleiben", S: "Gemeinsam zu handeln", G: "Sich zu verbessern" } },
  { blase: "Die schönste Belohnung ist", antworten: { D: "Pokale", I: "Fröhliche Gesichter", S: "Aufrichtiges Dankeschön", G: "Erfolg" } },
  { blase: "So spreche ich", antworten: { D: "Sehr direkt", I: "Erzählt gerne Geschichten", S: "Höflich und respektvoll", G: "Nachdenklich" } }
];

const LOB = ["Super!", "Genau!", "Richtig!", "Stark!", "Toll!"];
const SPEICHER = "systemcheck_disg_v2";
const app = document.getElementById("spiel");

let stand = { erledigt: [], stufe2fertig: false };
try { Object.assign(stand, JSON.parse(localStorage.getItem(SPEICHER)) || {}); } catch (e) {}
const speichern = () => { try { localStorage.setItem(SPEICHER, JSON.stringify(stand)); } catch (e) {} };

const mischen = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SCHLOSS = '<svg viewBox="0 0 12 14" aria-hidden="true"><path d="M3 6V4a3 3 0 0 1 6 0v2h1v8H2V6h1zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v2z"/></svg>';

function lob() {
  const el = document.getElementById("lob");
  el.textContent = LOB[Math.floor(Math.random() * LOB.length)];
  el.classList.add("zeigen");
  setTimeout(() => el.classList.remove("zeigen"), 650);
}
function wackeln(el) { el.classList.remove("falsch"); void el.offsetWidth; el.classList.add("falsch"); }

function steuerung(mitte, zurueck) {
  return `<div class="steuerung">
    <div class="pille-rahmen">${zurueck ? '<button class="rund-zurueck" type="button" data-aktion="zurueck" aria-label="Zurück">‹--</button>' : ""}${mitte}</div>
    <button class="knopf neu-starten" type="button" data-aktion="neu">Neu starten</button>
  </div>`;
}
function stufenPillen() {
  const n = stand.erledigt.length;
  const offen = n >= 4;
  return `<span class="pille ${offen ? "leer" : ""}">Stufe 1 (${n}/4)</span>` +
    (offen ? `<button class="pille" type="button" data-aktion="stufe2">Stufe 2</button>`
           : `<span class="pille aus" aria-disabled="true">${SCHLOSS}Stufe 2</span>`);
}
function aktionen(handler) {
  app.querySelectorAll("[data-aktion]").forEach((b) => b.addEventListener("click", () => {
    const a = b.dataset.aktion;
    if (a === "neu") { if (confirmNeu()) { stand = { erledigt: [], stufe2fertig: false }; speichern(); auswahl(); } }
    else if (handler[a]) handler[a]();
  }));
}
function confirmNeu() { return window.confirm("Möchtest du wirklich von vorne beginnen? Dein Fortschritt wird gelöscht."); }
function oben() { app.closest(".panel").scrollIntoView({ behavior: "smooth", block: "start" }); }

/* ---------- Auswahl (Stufe 1) ---------- */
function auswahl() {
  const n = stand.erledigt.length;
  const alle = n >= 4;
  app.innerHTML = steuerung(stufenPillen(), false) +
    (alle
      ? `<p class="hinweis"><strong>Jetzt wird es kniffliger.</strong><br>Versuche alle vier Aussagen den DISG-Persönlichkeitstypen zuzuordnen.</p>
         <p class="hinweis"><button class="knopf" type="button" data-aktion="stufe2">Stufe 2 starten</button></p>`
      : `<p class="hinweis">Wähle einen Persönlichkeitstyp und entdecke, was ihn ausmacht.</p>`) +
    `<div class="typ-raster">${REIHENFOLGE.map((t) => `
      <button class="karte typ-karte ${stand.erledigt.includes(t) ? "erledigt" : ""}" type="button" data-typ="${t}">
        <img class="foto" src="assets/img/foto-${t}.webp" alt="">
        <span class="badge ${t}">${t}</span>
        <div class="name">${TYPEN[t].name}</div>
        ${stand.erledigt.includes(t) ? '<span class="nur-sr">(bereits entdeckt)</span>' : ""}
      </button>`).join("")}</div>`;
  aktionen({ stufe2: () => stufe2(0) });
  app.querySelectorAll("[data-typ]").forEach((k) => k.addEventListener("click", () => stufe1(k.dataset.typ, 0)));
}

/* ---------- Stufe 1: ein Typ, acht Themen ---------- */
function stufe1(typ, i) {
  if (i >= THEMEN.length) return typEntdeckt(typ);
  const thema = THEMEN[i];
  const reihen = mischen(REIHENFOLGE);
  app.innerHTML = steuerung(`<span class="pille">Stufe 1, ${typ}-Typ, ${i + 1}/8</span>`, true) +
    `<div class="frage">
      <div class="karte typ-karte">
        <img class="foto" src="assets/img/foto-${typ}.webp" alt="">
        <span class="badge ${typ}">${typ}</span>
        <div class="name">${TYPEN[typ].name}</div>
      </div>
      <div class="frage-rechts">
        <img class="blase" src="assets/img/blase-${i + 1}.webp" alt="${thema.blase}" width="338" height="269">
        <div class="antworten">${reihen.map((t) => `<button class="antwort" type="button" data-t="${t}">${thema.antworten[t]}</button>`).join("")}</div>
      </div>
    </div>`;
  aktionen({ zurueck: () => (i === 0 ? auswahl() : stufe1(typ, i - 1)) });
  let gesperrt = false;
  app.querySelectorAll(".antwort").forEach((b) => b.addEventListener("click", () => {
    if (gesperrt) return;
    if (b.dataset.t === typ) {
      gesperrt = true;
      b.classList.add("richtig");
      lob();
      setTimeout(() => stufe1(typ, i + 1), 750);
    } else wackeln(b);
  }));
}

function typEntdeckt(typ) {
  if (!stand.erledigt.includes(typ)) stand.erledigt.push(typ);
  speichern();
  const alle = stand.erledigt.length >= 4;
  app.innerHTML = `<div class="fertig">
      <h2><span class="badge ${typ}">${typ}</span>-Typ entdeckt!</h2>
      <p>Du hast typische Merkmale des ${typ}-Typs entdeckt.<br>Natürlich sind Menschen deutlich vielseitiger. Aber das gibt dir einen Eindruck über einige Eigenheiten.</p>
      <button class="knopf" type="button" data-aktion="weiter">${alle ? "Weiter zu Stufe 2" : "Weiter zur Auswahl"}</button>
      <div class="unten"><button class="knopf" type="button" data-aktion="neu">Neu starten</button></div>
    </div>`;
  aktionen({ weiter: auswahl });
  oben();
}

/* ---------- Stufe 2: alle vier zuordnen ---------- */
function stufe2(i) {
  if (i >= THEMEN.length) return geschafft();
  const thema = THEMEN[i];
  const reihen = mischen(REIHENFOLGE);
  app.innerHTML = steuerung(`<span class="pille">Stufe 2, alle vier zuordnen, ${i + 1}/8</span>`, true) +
    `<p class="hinweis">Tippe zuerst eine Aussage an und dann die Person, zu der sie passt.</p>
    <div class="stufe2">
      <div class="links">
        <img class="blase gross" src="assets/img/blase-${i + 1}.webp" alt="${thema.blase}" width="338" height="269">
        ${reihen.map((t) => `<button class="antwort" type="button" data-t="${t}" aria-pressed="false">${thema.antworten[t]}</button>`).join("")}
      </div>
      <div class="fotos">${["D", "S", "I", "G"].map((t) => `
        <button class="foto-ziel" type="button" data-ziel="${t}" aria-label="${TYPEN[t].name} (${t})">
          <span class="badge ${t}">${t}</span>
          <img src="assets/img/foto-${t}.webp" alt="">
        </button>`).join("")}</div>
    </div>`;
  aktionen({ zurueck: () => (i === 0 ? auswahl() : stufe2(i - 1)) });

  let gewaehlt = null;
  let richtig = 0;
  const ziele = app.querySelectorAll(".foto-ziel");
  const markieren = () => ziele.forEach((z) => z.classList.toggle("bereit", !!gewaehlt && !z.querySelector(".zugeordnet")));

  app.querySelectorAll(".antwort").forEach((b) => b.addEventListener("click", () => {
    app.querySelectorAll(".antwort").forEach((x) => { x.classList.remove("gewaehlt"); x.setAttribute("aria-pressed", "false"); });
    if (gewaehlt === b) { gewaehlt = null; markieren(); return; }
    gewaehlt = b; b.classList.add("gewaehlt"); b.setAttribute("aria-pressed", "true");
    markieren();
  }));
  ziele.forEach((z) => z.addEventListener("click", () => {
    if (!gewaehlt || z.querySelector(".zugeordnet")) return;
    if (gewaehlt.dataset.t === z.dataset.ziel) {
      const tag = document.createElement("span");
      tag.className = "zugeordnet";
      tag.textContent = gewaehlt.textContent;
      z.appendChild(tag);
      gewaehlt.classList.add("weg");
      gewaehlt = null;
      richtig++;
      markieren();
      lob();
      if (richtig === 4) setTimeout(() => stufe2(i + 1), 1100);
    } else {
      wackeln(z);
      wackeln(gewaehlt);
    }
  }));
}

function geschafft() {
  stand.stufe2fertig = true;
  speichern();
  app.innerHTML = `<div class="fertig">
      <h2>Geschafft!</h2>
      <p>Du kennst die Merkmale der vier DISG-Persönlichkeitstypen.<br>Das ist eine gute Grundlage, um weiter über die vielseitige Individualität von Menschen nachzudenken.</p>
      <a class="knopf" href="uebersicht.html#lernende">Zurück zur Übersicht</a>
      <div class="unten"><button class="knopf" type="button" data-aktion="neu">Neu starten</button></div>
    </div>`;
  aktionen({});
  oben();
}

auswahl();
