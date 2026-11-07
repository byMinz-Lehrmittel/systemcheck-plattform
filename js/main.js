/* Systemcheck – gemeinsame Funktionen (Zugang, Audio-Player, Video) */

const ZUGANG = {
  code: "2309",                 // Code aus dem Kauf auf byMinz.ch
  schluessel: "systemcheck_zugang_v1",
  ok() { try { return localStorage.getItem(this.schluessel) === "ja"; } catch (e) { return sessionStorage.getItem(this.schluessel) === "ja"; } },
  merken() { try { localStorage.setItem(this.schluessel, "ja"); } catch (e) { sessionStorage.setItem(this.schluessel, "ja"); } }
};

// Geschützte Seiten: ohne Code zurück zur Startseite
// (die gewünschte Seite wird gemerkt, z.B. wenn jemand einen QR-Code scannt)
const SEITEN = ["uebersicht.html", "audio-persoenlichkeiten.html", "spiel-disg.html", "spiel-energie.html"];
if (document.documentElement.dataset.geschuetzt === "ja" && !ZUGANG.ok()) {
  const seite = location.pathname.split("/").pop();
  location.replace("index.html" + (SEITEN.includes(seite) ? "?weiter=" + encodeURIComponent(seite + location.hash) : ""));
}
function weiterZiel() {
  const w = new URLSearchParams(location.search).get("weiter") || "";
  return SEITEN.includes(w.split("#")[0]) ? w : "uebersicht.html";
}

/* ---------- Startseite: Code prüfen ---------- */
function startseite() {
  const form = document.getElementById("code-form");
  if (!form) return;
  if (ZUGANG.ok()) { location.replace(weiterZiel()); return; }
  const feld = document.getElementById("code");
  const fehler = document.getElementById("fehler");
  const karte = form.closest(".karte");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (feld.value.trim() === ZUGANG.code) {
      ZUGANG.merken();
      location.href = weiterZiel();
    } else {
      fehler.textContent = "Dieser Code stimmt leider nicht. Versuch es nochmals.";
      karte.classList.remove("wackeln"); void karte.offsetWidth; karte.classList.add("wackeln");
      feld.select();
    }
  });
}

/* ---------- Audio-Player ---------- */
const ICON_PLAY = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1.5v13l11-6.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="1.5" width="4" height="13" rx="1"/><rect x="9.5" y="1.5" width="4" height="13" rx="1"/></svg>';
const alleAudios = [];

function zeit(s) {
  if (!isFinite(s)) return "00:00";
  s = Math.floor(s);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function audioPlayer(el) {
  const titel = el.dataset.titel || "Audio";
  const audio = new Audio();
  audio.preload = "metadata";
  audio.src = el.dataset.src;
  alleAudios.push(audio);

  el.innerHTML = `
    <div class="player-zeile">
      <button class="player-knopf" type="button" aria-label="${titel} abspielen">${ICON_PLAY}</button>
      <span class="player-zeit">00:00 | 00:00</span>
    </div>
    <div class="player-balken" role="slider" tabindex="0" aria-label="Position in ${titel}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>`;

  const knopf = el.querySelector(".player-knopf");
  const anzeige = el.querySelector(".player-zeit");
  const balken = el.querySelector(".player-balken");
  const fuellung = balken.querySelector("span");

  const aktualisieren = () => {
    const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    fuellung.style.width = p + "%";
    balken.setAttribute("aria-valuenow", Math.round(p));
    anzeige.textContent = zeit(audio.currentTime) + " | " + zeit(audio.duration);
  };
  audio.addEventListener("loadedmetadata", aktualisieren);
  audio.addEventListener("timeupdate", aktualisieren);
  audio.addEventListener("play", () => { knopf.innerHTML = ICON_PAUSE; knopf.setAttribute("aria-label", titel + " pausieren"); });
  audio.addEventListener("pause", () => { knopf.innerHTML = ICON_PLAY; knopf.setAttribute("aria-label", titel + " abspielen"); });
  audio.addEventListener("ended", () => { audio.currentTime = 0; aktualisieren(); });
  audio.addEventListener("error", () => { anzeige.textContent = "Datei folgt"; });

  knopf.addEventListener("click", () => {
    if (audio.paused) {
      alleAudios.forEach((a) => a !== audio && a.pause());
      audio.play();
    } else audio.pause();
  });

  const springen = (clientX) => {
    const r = balken.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (audio.duration) audio.currentTime = p * audio.duration;
  };
  balken.addEventListener("pointerdown", (e) => {
    springen(e.clientX);
    balken.setPointerCapture(e.pointerId);
    const bewegen = (ev) => springen(ev.clientX);
    balken.addEventListener("pointermove", bewegen);
    balken.addEventListener("pointerup", () => balken.removeEventListener("pointermove", bewegen), { once: true });
  });
  balken.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
}

/* ---------- Video im Fenster ---------- */
function videos() {
  const knoepfe = document.querySelectorAll("[data-video]");
  if (!knoepfe.length) return;
  const dialog = document.createElement("dialog");
  dialog.className = "video-dialog";
  dialog.innerHTML = '<button class="schliessen" type="button" aria-label="Video schliessen">✕</button><video controls playsinline preload="metadata"></video>';
  document.body.appendChild(dialog);
  const video = dialog.querySelector("video");
  const schliessen = () => { video.pause(); dialog.close(); };
  dialog.querySelector(".schliessen").addEventListener("click", schliessen);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) schliessen(); });
  dialog.addEventListener("close", () => video.pause());
  knoepfe.forEach((k) => k.addEventListener("click", () => {
    alleAudios.forEach((a) => a.pause());
    video.src = k.dataset.video;
    dialog.showModal();
    video.play().catch(() => {});
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  startseite();
  document.querySelectorAll(".player[data-src]").forEach(audioPlayer);
  videos();
});
