/* Spiel «Energie regulieren in der Schule» – Modul 2
   Nummern per Drag & Drop (oder Antippen) auf die Bilder ziehen,
   pro Bild mindestens einen Pfeil (aktivieren / beruhigen) markieren. */

const STRATEGIEN = {
  1: "Eiskaltes Wasser trinken",
  2: "3 Minuten Musik hören",
  3: "Ans offene Fenster stehen und durchatmen",
  4: "Kapuze hoch, gibt ein sicheres Gefühl",
  5: "Kritzeln während des Zuhörens",
  6: "3 Minuten Treppen rauf- und runterrennen",
  7: "Sich einen Moment zurückziehen",
  8: "Gesicht kurz mit kaltem Wasser abspülen",
  9: "Tief ein- und wieder ausatmen",
  10: "Mehrmals auf Zehenspitzen stellen und wieder sinken",
  11: "Fidgettoys nutzen, für bessere Konzentration",
  12: "In einen Zitronenschnitz beissen"
};

/* Bilder in Reihen wie im Layout. nr = richtige Nummer,
   x/y = Position der Pfeile + Zielkreis im Bild (in %) */
const REIHEN = [
  [{ nr: 5, x: 12, y: 19 }, { nr: 12, x: 66, y: 22 }, { nr: 8, x: 12, y: 29 }],
  [{ nr: 1, x: 68, y: 25 }, { nr: 11, x: 65, y: 24 }, { nr: 2, x: 12, y: 20 }],
  [{ nr: 7, x: 40, y: 14 }, { nr: 6, x: 12, y: 22 }, { nr: 3, x: 3, y: 30 }, { nr: 9, x: 4, y: 22 }],
  [{ nr: 10, x: 13, y: 19 }, { nr: 4, x: 60, y: 18 }]
];

const PFEIL = (richtung) => `<svg viewBox="0 0 20 26" aria-hidden="true"><path d="${
  richtung === "hoch" ? "M10 1 L19 11 H14 V25 H6 V11 H1 Z" : "M10 25 L19 15 H14 V1 H6 V15 H1 Z"
}" /></svg>`;

const app = document.getElementById("energie");
let zustand;

function neu() {
  zustand = { zugeordnet: {}, pfeile: {} }; // zugeordnet[nr]=true, pfeile[nr]={hoch,runter}
  zeichnen();
}

function zeichnen() {
  app.innerHTML = `
    <div class="legende">${Object.entries(STRATEGIEN).map(([nr, text]) => `
      <div class="legende-eintrag">
        <button class="nummer" type="button" data-nr="${nr}" aria-label="Nummer ${nr}: ${text}">${nr}</button>
        <span>${text}</span>
      </div>`).join("")}
    </div>
    <div class="bilder">${REIHEN.map((reihe) => `
      <div class="bilder-reihe">${reihe.map((b) => `
        <div class="illu" data-ziel="${b.nr}">
          <img src="assets/img/energie/strategie-${String(b.nr).padStart(2, "0")}.webp" alt="">
          <div class="steuer" style="left:${b.x}%;top:${b.y}%">
            <div class="pfeile">
              <button class="e-pfeil" type="button" data-pfeil="hoch" aria-pressed="false" aria-label="aktiviert mich">${PFEIL("hoch")}</button>
              <button class="e-pfeil" type="button" data-pfeil="runter" aria-pressed="false" aria-label="beruhigt mich">${PFEIL("runter")}</button>
            </div>
            <button class="zielkreis" type="button" aria-label="Nummer hier ablegen"></button>
          </div>
        </div>`).join("")}
      </div>`).join("")}
    </div>
    <p class="energie-meldung" id="meldung" role="status"></p>
    <p class="hinweis"><button class="knopf" type="button" id="fertig">Fertig</button></p>`;

  app.querySelectorAll(".nummer").forEach(ziehbar);
  app.querySelectorAll(".illu").forEach((illu) => {
    const nr = illu.dataset.ziel;
    illu.addEventListener("click", (e) => {
      if (gewaehlt && !e.target.closest(".e-pfeil")) ablegen(gewaehlt, illu);
    });
    illu.querySelectorAll(".e-pfeil").forEach((p) => p.addEventListener("click", () => {
      zustand.pfeile[nr] = zustand.pfeile[nr] || {};
      const an = !zustand.pfeile[nr][p.dataset.pfeil];
      zustand.pfeile[nr][p.dataset.pfeil] = an;
      p.classList.toggle("an", an);
      p.setAttribute("aria-pressed", an);
      illu.classList.remove("fehlt");
    }));
  });
  document.getElementById("fertig").addEventListener("click", pruefen);
}

/* ---------- Ziehen & Ablegen ---------- */
let gewaehlt = null; // für Antippen statt Ziehen

function ziehbar(knopf) {
  knopf.addEventListener("pointerdown", (e) => {
    if (knopf.classList.contains("erledigt")) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let geist = null;
    let ziel = null;
    let letzter = { x: e.clientX, y: e.clientY };
    let scrollTempo = 0;
    let rafId = null;

    // Automatisch scrollen, wenn man beim Ziehen an den oberen/unteren Rand kommt
    const scrollen = () => {
      if (scrollTempo && geist) {
        window.scrollBy(0, scrollTempo);
        zielSuchen(letzter.x, letzter.y);
      }
      rafId = requestAnimationFrame(scrollen);
    };
    const zielSuchen = (x, y) => {
      geist.hidden = true;
      const unter = document.elementFromPoint(x, y);
      geist.hidden = false;
      const neuZiel = unter && unter.closest(".illu");
      if (ziel !== neuZiel) {
        if (ziel) ziel.classList.remove("drueber");
        ziel = neuZiel;
        if (ziel && !ziel.classList.contains("belegt")) ziel.classList.add("drueber");
      }
    };

    const bewegen = (ev) => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!geist && Math.hypot(dx, dy) > 6) {
        geist = knopf.cloneNode(true);
        geist.classList.add("geist");
        document.body.appendChild(geist);
        knopf.classList.add("unterwegs");
      }
      if (!geist) return;
      letzter = { x: ev.clientX, y: ev.clientY };
      geist.style.left = ev.clientX + "px";
      geist.style.top = ev.clientY + "px";
      const rand = 80, h = window.innerHeight;
      if (ev.clientY > h - rand) scrollTempo = Math.ceil(((ev.clientY - (h - rand)) / rand) * 18);
      else if (ev.clientY < rand) scrollTempo = -Math.ceil(((rand - ev.clientY) / rand) * 18);
      else scrollTempo = 0;
      if (scrollTempo && !rafId) rafId = requestAnimationFrame(scrollen);
      zielSuchen(ev.clientX, ev.clientY);
    };
    const loslassen = () => {
      document.removeEventListener("pointermove", bewegen);
      document.removeEventListener("pointerup", loslassen);
      document.removeEventListener("pointercancel", loslassen);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null; scrollTempo = 0;
      knopf.classList.remove("unterwegs");
      if (ziel) ziel.classList.remove("drueber");
      if (geist) {
        geist.remove();
        if (ziel) ablegen(knopf, ziel);
      } else {
        // nur angetippt: auswählen
        app.querySelectorAll(".nummer.gewaehlt").forEach((n) => n !== knopf && n.classList.remove("gewaehlt"));
        knopf.classList.toggle("gewaehlt");
        gewaehlt = knopf.classList.contains("gewaehlt") ? knopf : null;
        app.classList.toggle("waehlt", !!gewaehlt);
      }
    };
    document.addEventListener("pointermove", bewegen);
    document.addEventListener("pointerup", loslassen);
    document.addEventListener("pointercancel", loslassen);
  });
}

function ablegen(knopf, illu) {
  knopf.classList.remove("gewaehlt");
  gewaehlt = null;
  app.classList.remove("waehlt");
  if (illu.classList.contains("belegt")) return;
  const nr = knopf.dataset.nr;
  if (illu.dataset.ziel === nr) {
    zustand.zugeordnet[nr] = true;
    illu.classList.add("belegt");
    illu.classList.remove("fehlt");
    const kreis = illu.querySelector(".zielkreis");
    kreis.textContent = nr;
    kreis.setAttribute("aria-label", "Nummer " + nr + ": " + STRATEGIEN[nr]);
    knopf.classList.add("erledigt");
    knopf.setAttribute("aria-disabled", "true");
    illu.classList.add("treffer");
    setTimeout(() => illu.classList.remove("treffer"), 600);
  } else {
    illu.classList.remove("falsch"); void illu.offsetWidth; illu.classList.add("falsch");
    knopf.classList.remove("falsch"); void knopf.offsetWidth; knopf.classList.add("falsch");
  }
}

/* ---------- Fertig ---------- */
function pruefen() {
  const offenNr = Object.keys(STRATEGIEN).filter((nr) => !zustand.zugeordnet[nr]);
  const offenPfeil = Object.keys(STRATEGIEN).filter((nr) => {
    const p = zustand.pfeile[nr] || {};
    return !p.hoch && !p.runter;
  });
  const meldung = document.getElementById("meldung");
  app.querySelectorAll(".illu").forEach((i) => {
    const nr = i.dataset.ziel;
    i.classList.toggle("fehlt", offenNr.includes(nr) || offenPfeil.includes(nr));
  });
  if (!offenNr.length && !offenPfeil.length) return geschafft();
  const teile = [];
  if (offenNr.length) teile.push(offenNr.length === 1 ? "Eine Nummer fehlt noch." : offenNr.length + " Nummern fehlen noch.");
  if (offenPfeil.length) teile.push(offenPfeil.length === 1 ? "Bei einem Bild ist noch kein Pfeil markiert." : "Bei " + offenPfeil.length + " Bildern ist noch kein Pfeil markiert.");
  meldung.textContent = teile.join(" ") + " Die Bilder mit Rahmen sind noch nicht fertig.";
}

function geschafft() {
  document.querySelector(".energie-intro").hidden = true;
  app.innerHTML = `<div class="fertig">
      <h2>Geschafft!</h2>
      <p>Du kennst jetzt zwölf Strategien, mit denen du deine Energie in der Schule regulieren kannst.<br>Probiere aus, welche dir am besten helfen.</p>
      <a class="knopf" href="uebersicht.html#lernende">Zurück zur Übersicht</a>
      <div class="unten"><button class="knopf" type="button" id="nochmals">Neu starten</button></div>
    </div>`;
  document.getElementById("nochmals").addEventListener("click", () => {
    document.querySelector(".energie-intro").hidden = false;
    neu();
  });
  app.closest(".panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("neu-starten").addEventListener("click", () => {
  if (Object.keys(zustand.zugeordnet).length || Object.keys(zustand.pfeile).length) {
    if (!window.confirm("Möchtest du wirklich von vorne beginnen?")) return;
  }
  document.querySelector(".energie-intro").hidden = false;
  neu();
});

neu();
