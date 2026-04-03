const PLAYERS = [
  "Levi",  "Paraíso",
  "DVD",  "Tidor",
  "PL",  "Iagão",
  "NOG",  "Nariz",
  "JM",  "Gabriel",
  "Cauã", "Kerlin",
  "Kayki", "NK",
  "Luan", "Brenin",
  
  "RN",  "Mateus",
  "Renan", "Daniel",
  "Heitor", "Maguila",
  "Cassiano", "Marcus",
  "Luiz", "Jair",
  "Kayo", "Gabryel",
  "Fael", "KN",
  "Caxumba", "",
];

let state = {
  left:  buildSideState(0),
  right: buildSideState(16),
  final: { p1: null, p2: null, winner: null },
};

function buildSideState(offset) {
  const rounds = [];
  const r0 = [];
  for (let m = 0; m < 8; m++) {
    r0.push({ p1: PLAYERS[offset + m * 2], p2: PLAYERS[offset + m * 2 + 1], winner: null });
  }
  rounds.push(r0);
  for (let r = 1; r <= 3; r++) {
    const matches = [];
    const count = 8 / Math.pow(2, r);
    for (let m = 0; m < count; m++) matches.push({ p1: null, p2: null, winner: null });
    rounds.push(matches);
  }
  return rounds;
}

function syncFinal() {
  state.final.p1 = state.left[3][0].winner  || null;
  state.final.p2 = state.right[3][0].winner || null;
}

const API = "http://localhost:3000";

async function saveResult(entry) {
  try {
    await fetch(`${API}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (e) {
    console.warn("Não foi possível salvar resultado:", e);
  }
}

async function loadResults() {
  try {
    const res  = await fetch(`${API}/results`);
    const text = await res.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.final) {
          applyFinalWin(entry.winner);
        } else {
          applyWin(entry.winner, entry.side, entry.round, entry.matchIdx);
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn("Não foi possível carregar resultados:", e);
  }
}

function applyWin(playerName, side, round, matchIdx) {
  state[side][round][matchIdx].winner = playerName;
  const nextRound = round + 1;
  if (nextRound <= 3) {
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const slot = matchIdx % 2 === 0 ? "p1" : "p2";
    state[side][nextRound][nextMatchIdx][slot] = playerName;
  }
}

function applyFinalWin(playerName) {
  syncFinal();
  state.final.winner = playerName;
}

function handleWin(playerName, side, round, matchIdx) {
  applyWin(playerName, side, round, matchIdx);
  saveResult({ side, round, matchIdx, winner: playerName });
}

function handleFinalWin(playerName) {
  state.final.winner = playerName;
  saveResult({ final: true, winner: playerName });
  setTimeout(() => showWinner(playerName), 300);
}

function showWinner(name) {
  document.getElementById("winnerName").textContent = name;
  document.getElementById("winnerModal").classList.add("active");
}
function closeModal() {
  document.getElementById("winnerModal").classList.remove("active");
}
window.closeModal = closeModal;

function getPlayerNum(name) {
  const m = name.match(/\d+/);
  return m ? m[0] : "?";
}
function isMobile() {
  return window.innerWidth <= 768;
}

function renderDesktop() {
  const bracket = document.getElementById("bracket");
  bracket.innerHTML = "";
  syncFinal();

  const cols = [
    { side: "left",  round: 0, label: "16AVOS"  },
    { side: "left",  round: 1, label: "OITAVAS" },
    { side: "left",  round: 2, label: "QUARTAS" },
    { side: "left",  round: 3, label: "SEMI"    },
    { side: "final", round: -1,label: "FINAL"   },
    { side: "right", round: 3, label: "SEMI"    },
    { side: "right", round: 2, label: "QUARTAS" },
    { side: "right", round: 1, label: "OITAVAS" },
    { side: "right", round: 0, label: "16AVOS"  },
  ];

  cols.forEach((colDef, colIdx) => {
    bracket.appendChild(colDef.side === "final" ? buildFinalCol() : buildCol(colDef, colIdx));
  });

  requestAnimationFrame(drawAllConnectors);
}

function buildCol(colDef, colIdx) {
  const { side, round, label } = colDef;
  const col = document.createElement("div");
  col.className = "col";
  col.dataset.side  = side;
  col.dataset.round = round;

  const lbl = document.createElement("div");
  lbl.className = "col-label";
  lbl.textContent = label;
  col.appendChild(lbl);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("connectors-svg");
  col.appendChild(svg);

  state[side][round].forEach((match, matchIdx) => {
    const mu = document.createElement("div");
    mu.className = "matchup";
    mu.appendChild(buildCard(match.p1, match, "p1", side, round, matchIdx));
    const vsl = document.createElement("div");
    vsl.className = "vs-line";
    mu.appendChild(vsl);
    mu.appendChild(buildCard(match.p2, match, "p2", side, round, matchIdx));
    col.appendChild(mu);
  });

  return col;
}

function buildCard(playerName, match, playerKey, side, round, matchIdx) {
  const card = document.createElement("div");
  card.className = "player-card";

  if (!playerName) {
    card.classList.add("tbd");
    card.innerHTML = `<span class="player-icon">⏳</span><span class="player-name">A definir</span>`;
    return card;
  }

  const isWinner     = match.winner === playerName;
  const isEliminated = match.winner && match.winner !== playerName;

  if (isWinner)     card.classList.add("winner");
  if (isEliminated) card.classList.add("eliminated");

  const icon = isWinner ? "✔" : isEliminated ? "✖" : "🎮";
  card.innerHTML = `
    <span class="player-num">${getPlayerNum(playerName)}</span>
    <span class="player-name">${playerName}</span>
    <span class="player-icon">${icon}</span>
  `;

  const otherKey  = playerKey === "p1" ? "p2" : "p1";
  if (!match.winner && playerName && match[otherKey]) {
    card.addEventListener("click", () => {
      handleWin(playerName, side, round, matchIdx);
      renderDesktop();
    });
  }
  return card;
}

function buildFinalCol() {
  const col = document.createElement("div");
  col.className = "col col-final";

  const lbl = document.createElement("div");
  lbl.className = "final-label";
  lbl.textContent = "⚽ FINAL ⚽";
  col.appendChild(lbl);

  const mu = document.createElement("div");
  mu.className = "final-matchup";
  mu.appendChild(buildFinalCard(state.final.p1, "p1"));
  const vsl = document.createElement("div");
  vsl.className = "vs-line";
  mu.appendChild(vsl);
  mu.appendChild(buildFinalCard(state.final.p2, "p2"));
  col.appendChild(mu);
  return col;
}

function buildFinalCard(playerName, playerKey) {
  const card = document.createElement("div");
  card.className = "player-card";
  const match = state.final;

  if (!playerName) {
    card.classList.add("tbd");
    card.innerHTML = `<span class="player-icon">⏳</span><span class="player-name">A definir</span>`;
    return card;
  }

  const isChampion = match.winner === playerName;
  const isRunnerUp = match.winner && match.winner !== playerName;
  if (isChampion) card.classList.add("champion");
  if (isRunnerUp) card.classList.add("eliminated");

  const icon = isChampion ? "🏆" : isRunnerUp ? "🥈" : "🎮";
  card.innerHTML = `<span class="player-name">${playerName}</span><span class="player-icon">${icon}</span>`;

  const otherKey  = playerKey === "p1" ? "p2" : "p1";
  if (!match.winner && playerName && match[otherKey]) {
    card.addEventListener("click", () => {
      handleFinalWin(playerName);
      renderDesktop();
    });
  }
  return card;
}

function drawAllConnectors() {
  const colEls = Array.from(document.querySelectorAll("#bracket .col"));
  if (colEls.length < 9) return;
  drawColConnectors(colEls[0], colEls[1]);
  drawColConnectors(colEls[1], colEls[2]);
  drawColConnectors(colEls[2], colEls[3]);
  drawColConnectors(colEls[3], colEls[4]);
  drawColConnectors(colEls[8], colEls[7]);
  drawColConnectors(colEls[7], colEls[6]);
  drawColConnectors(colEls[6], colEls[5]);
  drawColConnectors(colEls[5], colEls[4]);
}

function drawColConnectors(fromCol, toCol) {
  if (!fromCol || !toCol) return;
  const svg = fromCol.querySelector(".connectors-svg");
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const fromMatchups = Array.from(fromCol.querySelectorAll(".matchup"));
  const toMatchups   = Array.from(toCol.querySelectorAll(".matchup, .final-matchup"));
  if (!fromMatchups.length || !toMatchups.length) return;

  const svgRect   = svg.getBoundingClientRect();
  const fromCRect = fromCol.getBoundingClientRect();
  const toCRect   = toCol.getBoundingClientRect();
  const goingRight = toCRect.left > fromCRect.left;

  if (fromMatchups.length === 1 && toMatchups.length === 1) {
    const rA = fromMatchups[0].getBoundingClientRect();
    const rT = toMatchups[0].getBoundingClientRect();
    const fX = goingRight ? fromCRect.right - svgRect.left : fromCRect.left - svgRect.left;
    const tX = goingRight ? toCRect.left - svgRect.left    : toCRect.right - svgRect.left;
    const fY = rA.top + rA.height / 2 - svgRect.top;
    const tY = rT.top + rT.height / 2 - svgRect.top;
    const win = fromMatchups[0].querySelector(".player-card.winner, .player-card.champion");
    addPath(svg, `M ${fX} ${fY} H ${(fX+tX)/2} V ${tY} H ${tX}`, !!win);
    return;
  }

  for (let i = 0; i < fromMatchups.length; i += 2) {
    const muA = fromMatchups[i];
    const muB = fromMatchups[i + 1];
    const toMu = toMatchups[Math.floor(i / 2)];
    if (!muA || !muB || !toMu) continue;

    const rA = muA.getBoundingClientRect();
    const rB = muB.getBoundingClientRect();
    const rT = toMu.getBoundingClientRect();

    const midAY  = rA.top + rA.height / 2 - svgRect.top;
    const midBY  = rB.top + rB.height / 2 - svgRect.top;
    const midABY = (midAY + midBY) / 2;
    const fX = goingRight ? fromCRect.right - svgRect.left : fromCRect.left - svgRect.left;
    const tX = goingRight ? toCRect.left - svgRect.left    : toCRect.right - svgRect.left;
    const midX = (fX + tX) / 2;

    const winA = muA.querySelector(".player-card.winner, .player-card.champion");
    const winB = muB.querySelector(".player-card.winner, .player-card.champion");
    const active = winA && winB;

    addPath(svg, `M ${fX} ${midAY} H ${midX} V ${midABY}`, active);
    addPath(svg, `M ${fX} ${midBY} H ${midX} V ${midABY}`, active);
    addPath(svg, `M ${midX} ${midABY} H ${tX}`, active);
  }
}

function addPath(svg, d, active) {
  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute("d", d);
  p.classList.add("connector-line");
  if (active) p.classList.add("active");
  svg.appendChild(p);
}

function getMatchWinner(muEl) {
  const w = muEl && muEl.querySelector(".player-card.winner, .player-card.champion");
  return w ? w.querySelector(".player-name")?.textContent : null;
}

function adjustLayout() {
  const h1 = document.querySelector(".site-header");
  const h2 = document.querySelector(".prizes-strip");
  if (!h1 || !h2) return;
  document.documentElement.style.setProperty(
    "--header-h", (h1.getBoundingClientRect().height + h2.getBoundingClientRect().height) + "px"
  );
}

function scaleToFit() {
  const wrapper = document.querySelector(".bracket-wrapper");
  const bracket = document.getElementById("bracket");
  if (!wrapper || !bracket) return;
  bracket.style.transform = "none";
  bracket.style.width  = "100%";
  bracket.style.height = "100%";

  const wW = wrapper.clientWidth, wH = wrapper.clientHeight;
  const bW = bracket.scrollWidth, bH = bracket.scrollHeight;
  const scale = Math.min(wW / bW, wH / bH, 1);

  if (scale < 1) {
    const offX = (wW - bW * scale) / 2;
    const offY = (wH - bH * scale) / 2;
    bracket.style.width  = bW + "px";
    bracket.style.height = bH + "px";
    bracket.style.transformOrigin = "top left";
    bracket.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
  }
}

let mobileActivePhase = 0;

const PHASE_LABELS = ["16AVOS", "OITAVAS", "QUARTAS", "SEMI", "FINAL"];

function renderMobile() {
  syncFinal();

  const tabsEl     = document.getElementById("mobileTabs");
  const progressEl = document.getElementById("mobileProgress");
  const phasesEl   = document.getElementById("mobilePhases");
  if (!tabsEl || !progressEl || !phasesEl) return;

  tabsEl.innerHTML     = "";
  progressEl.innerHTML = "";
  phasesEl.innerHTML   = "";

  PHASE_LABELS.forEach((label, idx) => {
    const complete = isMobilePhaseComplete(idx);

    const tab = document.createElement("button");
    tab.className = "mobile-tab" + (idx === mobileActivePhase ? " active" : "") + (complete ? " done" : "");
    tab.textContent = label;
    tab.addEventListener("click", () => { mobileActivePhase = idx; renderMobile(); });
    tabsEl.appendChild(tab);

    const dot = document.createElement("div");
    dot.className = "progress-dot" + (complete ? " done" : "") + (idx === mobileActivePhase ? " active" : "");
    progressEl.appendChild(dot);

    const panel = document.createElement("div");
    panel.className = "mobile-phase" + (idx === mobileActivePhase ? " active" : "");

    const title = document.createElement("div");
    title.className = "mobile-phase-title";
    title.textContent = idx === 4 ? "⚽ GRANDE FINAL ⚽" : label + " DE FINAL";
    panel.appendChild(title);

    getMobileMatchups(idx).forEach((match, mIdx) => {
      panel.appendChild(buildMobileMatchup(match, mIdx, idx));
    });

    phasesEl.appendChild(panel);
  });
}

function isMobilePhaseComplete(phaseIdx) {
  const matches = getMobileMatchups(phaseIdx);
  return matches.length > 0 && matches.every(m => m.winner);
}

function getMobileMatchups(phaseIdx) {
  if (phaseIdx === 4) return [state.final];
  return [...state.left[phaseIdx], ...state.right[phaseIdx]];
}

function buildMobileMatchup(match, matchIdx, phaseIdx) {
  const isFinal = phaseIdx === 4;

  const mu = document.createElement("div");
  mu.className = "m-matchup" + (isFinal ? " final-card" : "");

  const lbl = document.createElement("div");
  lbl.className = "m-matchup-label";
  lbl.textContent = isFinal ? "Grande Final" : `Confronto ${matchIdx + 1}`;
  mu.appendChild(lbl);

  let side, round, realIdx;
  if (!isFinal) {
    const halfLen = state.left[phaseIdx].length;
    if (matchIdx < halfLen) { side = "left";  round = phaseIdx; realIdx = matchIdx; }
    else                    { side = "right"; round = phaseIdx; realIdx = matchIdx - halfLen; }
  }

  mu.appendChild(buildMobilePlayer(match.p1, match, "p1", side, round, realIdx, isFinal));

  const vs = document.createElement("div");
  vs.className = "m-vs";
  vs.innerHTML = `<div class="m-vs-line"></div><span class="m-vs-text">VS</span><div class="m-vs-line"></div>`;
  mu.appendChild(vs);

  mu.appendChild(buildMobilePlayer(match.p2, match, "p2", side, round, realIdx, isFinal));
  return mu;
}

function buildMobilePlayer(playerName, match, playerKey, side, round, realIdx, isFinal) {
  const row = document.createElement("div");
  row.className = "m-player";

  if (!playerName) {
    row.classList.add("m-tbd");
    row.innerHTML = `<span class="m-player-icon">⏳</span><span class="m-player-name">A definir</span>`;
    return row;
  }

  const isChampion   = isFinal && match.winner === playerName;
  const isWinner     = !isFinal && match.winner === playerName;
  const isEliminated = match.winner && match.winner !== playerName;

  if (isChampion)    row.classList.add("m-champion");
  else if (isWinner) row.classList.add("m-winner");
  else if (isEliminated) row.classList.add("m-eliminated");

  const icon = isChampion ? "🏆" : isWinner ? "✔" : isEliminated ? "✖" : "🎮";
  row.innerHTML = `
    <span class="m-player-num">${getPlayerNum(playerName)}</span>
    <span class="m-player-name">${playerName}</span>
    <span class="m-player-icon">${icon}</span>
  `;

  const otherKey = playerKey === "p1" ? "p2" : "p1";
  if (!match.winner && playerName && match[otherKey]) {
    row.addEventListener("click", () => {
      if (isFinal) {
        handleFinalWin(playerName);
      } else {
        handleWin(playerName, side, round, realIdx);
      }
      renderMobile();
      if (isMobilePhaseComplete(mobileActivePhase) && mobileActivePhase < 4) {
        mobileActivePhase++;
        renderMobile();
      }
    });
  }
  return row;
}

function fullRender() {
  adjustLayout();
  if (isMobile()) {
    renderMobile();
  } else {
    renderDesktop();
    requestAnimationFrame(() => { scaleToFit(); drawAllConnectors(); });
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadResults();
  fullRender();
});

window.addEventListener("resize", () => {
  adjustLayout();
  if (isMobile()) {
    renderMobile();
  } else {
    scaleToFit();
    drawAllConnectors();
  }
});
