const PLAYERS = [
  "Jogador 1",  "Jogador 2",
  "Jogador 3",  "Jogador 4",
  "Jogador 5",  "Jogador 6",
  "Jogador 7",  "Jogador 8",
  "Jogador 9",  "Jogador 10",
  "Jogador 11", "Jogador 12",
  "Jogador 13", "Jogador 14",
  "Jogador 15", "Jogador 16",

  "Jogador 17", "Jogador 18",
  "Jogador 19", "Jogador 20",
  "Jogador 21", "Jogador 22",
  "Jogador 23", "Jogador 24",
  "Jogador 25", "Jogador 26",
  "Jogador 27", "Jogador 28",
  "Jogador 29", "Jogador 30",
  "Jogador 31", "Jogador 32",
];

const ROUND_NAMES = ["16AVOS", "OITAVAS", "QUARTAS", "SEMI"];

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
    for (let m = 0; m < count; m++) {
      matches.push({ p1: null, p2: null, winner: null });
    }
    rounds.push(matches);
  }
  return rounds;
}

function render() {
  const bracket = document.getElementById("bracket");
  bracket.innerHTML = "";

  const leftSemi  = state.left[3][0];
  const rightSemi = state.right[3][0];
  state.final.p1 = leftSemi.winner  || null;
  state.final.p2 = rightSemi.winner || null;

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
    if (colDef.side === "final") {
      bracket.appendChild(buildFinalCol());
    } else {
      bracket.appendChild(buildCol(colDef, colIdx));
    }
  });

  requestAnimationFrame(drawAllConnectors);
}

function buildCol(colDef, colIdx) {
  const { side, round, label } = colDef;
  const matches = state[side][round];

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
  svg.setAttribute("data-col", colIdx);
  col.appendChild(svg);

  matches.forEach((match, matchIdx) => {
    const mu = document.createElement("div");
    mu.className = "matchup";

    const card1 = buildCard(match.p1, match, "p1", side, round, matchIdx);
    const vsl   = document.createElement("div");
    vsl.className = "vs-line";
    const card2 = buildCard(match.p2, match, "p2", side, round, matchIdx);

    mu.appendChild(card1);
    mu.appendChild(vsl);
    mu.appendChild(card2);
    col.appendChild(mu);
  });

  return col;
}

function buildCard(playerName, match, playerKey, side, round, matchIdx) {
  const card = document.createElement("div");
  card.className = "player-card";
  card.dataset.side     = side;
  card.dataset.round    = round;
  card.dataset.matchIdx = matchIdx;
  card.dataset.player   = playerKey;

  if (!playerName) {
    card.classList.add("tbd");
    card.innerHTML = `<span class="player-icon">⏳</span><span class="player-name">A definir</span>`;
    return card;
  }

  const otherKey = playerKey === "p1" ? "p2" : "p1";
  const otherName = match[otherKey];
  const isWinner   = match.winner === playerName;
  const isEliminated = match.winner && match.winner !== playerName;

  if (isWinner)     card.classList.add("winner");
  if (isEliminated) card.classList.add("eliminated");

  const icon = isWinner ? "✔" : isEliminated ? "✖" : "🎮";
  const num  = getPlayerNum(playerName);

  card.innerHTML = `
    <span class="player-num">${num}</span>
    <span class="player-name">${playerName}</span>
    <span class="player-icon">${icon}</span>
  `;

  if (!match.winner && playerName && otherName) {
    card.addEventListener("click", () => handleWin(playerName, side, round, matchIdx, match));
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

  const match = state.final;

  const card1 = buildFinalCard(match.p1, match, "p1");
  const vsl   = document.createElement("div");
  vsl.className = "vs-line";
  const card2 = buildFinalCard(match.p2, match, "p2");

  mu.appendChild(card1);
  mu.appendChild(vsl);
  mu.appendChild(card2);
  col.appendChild(mu);

  return col;
}

function buildFinalCard(playerName, match, playerKey) {
  const card = document.createElement("div");
  card.className = "player-card";

  if (!playerName) {
    card.classList.add("tbd");
    card.innerHTML = `<span class="player-icon">⏳</span><span class="player-name">A definir</span>`;
    return card;
  }

  const isChampion   = match.winner === playerName;
  const isRunnerUp   = match.winner && match.winner !== playerName;

  if (isChampion) { card.classList.add("champion"); }
  if (isRunnerUp) { card.classList.add("eliminated"); }

  const icon = isChampion ? "🏆" : isRunnerUp ? "🥈" : "🎮";

  card.innerHTML = `
    <span class="player-name">${playerName}</span>
    <span class="player-icon">${icon}</span>
  `;

  const otherKey  = playerKey === "p1" ? "p2" : "p1";
  const otherName = match[otherKey];

  if (!match.winner && playerName && otherName) {
    card.addEventListener("click", () => handleFinalWin(playerName, match));
  }

  return card;
}

function handleWin(playerName, side, round, matchIdx, match) {
  state[side][round][matchIdx].winner = playerName;

  const nextRound = round + 1;
  if (nextRound <= 3) {
    const nextMatchIdx = Math.floor(matchIdx / 2);
    const slot = matchIdx % 2 === 0 ? "p1" : "p2";
    state[side][nextRound][nextMatchIdx][slot] = playerName;
  }

  render();
}

function handleFinalWin(playerName, match) {
  state.final.winner = playerName;
  render();
  setTimeout(() => showWinner(playerName), 300);
}

function showWinner(name) {
  document.getElementById("winnerName").textContent = name;
  document.getElementById("winnerModal").classList.add("active");
}

function closeModal() {
  document.getElementById("winnerModal").classList.remove("active");
}

function drawAllConnectors() {

  const bracket = document.getElementById("bracket");
  const colEls  = Array.from(bracket.querySelectorAll(".col"));

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

  const fromCards = Array.from(fromCol.querySelectorAll(".matchup, .final-matchup")).length
    ? fromCol.querySelectorAll(".matchup")
    : fromCol.querySelectorAll(".final-matchup");

  const toMatchups = Array.from(toCol.querySelectorAll(".matchup, .final-matchup"));

  let svg = fromCol.querySelector(".connectors-svg");
  if (!svg) return;

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const fromMatchups = Array.from(fromCol.querySelectorAll(".matchup"));
  const toMatchupsArr = Array.from(toCol.querySelectorAll(".matchup, .final-matchup"));

  if (!fromMatchups.length || !toMatchupsArr.length) return;

  const svgRect = svg.getBoundingClientRect();

  for (let i = 0; i < fromMatchups.length; i += 2) {
    const muA = fromMatchups[i];
    const muB = fromMatchups[i + 1];
    const toMu = toMatchupsArr[Math.floor(i / 2)];
    if (!muA || !muB || !toMu) continue;

    const rectA = muA.getBoundingClientRect();
    const rectB = muB.getBoundingClientRect();
    const rectT = toMu.getBoundingClientRect();

    const midAY = rectA.top + rectA.height / 2 - svgRect.top;
    const midBY = rectB.top + rectB.height / 2 - svgRect.top;
    const midABY = (midAY + midBY) / 2;

    const fromSide = fromCol.dataset.side;
    let fromX, toX;
    const isRightSide = (fromSide === "right") ||
      (fromCol.closest && fromCol.closest('[data-side="right"]')) ||
      fromCol === document.querySelectorAll('.col')[5] ||
      fromCol === document.querySelectorAll('.col')[6] ||
      fromCol === document.querySelectorAll('.col')[7] ||
      fromCol === document.querySelectorAll('.col')[8];

    const fromCRect = fromCol.getBoundingClientRect();
    const toCRect   = toCol.getBoundingClientRect();
    const goingRight = toCRect.left > fromCRect.left;

    fromX = goingRight ? fromCRect.right - svgRect.left : fromCRect.left - svgRect.left;
    toX   = goingRight ? toCRect.left  - svgRect.left  : toCRect.right - svgRect.left;
    const toY = rectT.top + rectT.height / 2 - svgRect.top;

    const midX = (fromX + toX) / 2;

    const winnerA = getMatchWinner(muA);
    const winnerB = getMatchWinner(muB);
    const active  = winnerA && winnerB;

    const pathA = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathA.setAttribute("d", `M ${fromX} ${midAY} H ${midX} V ${midABY}`);
    pathA.classList.add("connector-line");
    if (active) pathA.classList.add("active");

    const pathB = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathB.setAttribute("d", `M ${fromX} ${midBY} H ${midX} V ${midABY}`);
    pathB.classList.add("connector-line");
    if (active) pathB.classList.add("active");

    const pathC = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathC.setAttribute("d", `M ${midX} ${midABY} H ${toX}`);
    pathC.classList.add("connector-line");
    if (active) pathC.classList.add("active");

    svg.appendChild(pathA);
    svg.appendChild(pathB);
    svg.appendChild(pathC);
  }

  if (fromMatchups.length === 1 && toMatchupsArr.length === 1) {
    const muA = fromMatchups[0];
    const toMu = toMatchupsArr[0];
    if (!muA || !toMu) return;

    const rectA = muA.getBoundingClientRect();
    const rectT = toMu.getBoundingClientRect();
    const fromCRect = fromCol.getBoundingClientRect();
    const toCRect   = toCol.getBoundingClientRect();

    const goingRight = toCRect.left > fromCRect.left;
    const fromX = goingRight ? fromCRect.right - svgRect.left : fromCRect.left - svgRect.left;
    const toX   = goingRight ? toCRect.left  - svgRect.left  : toCRect.right - svgRect.left;
    const fromY = rectA.top + rectA.height / 2 - svgRect.top;
    const toY   = rectT.top + rectT.height / 2 - svgRect.top;

    const winnerA = getMatchWinner(muA);
    const active  = !!winnerA;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${fromX} ${fromY} H ${(fromX+toX)/2} V ${toY} H ${toX}`);
    path.classList.add("connector-line");
    if (active) path.classList.add("active");
    svg.appendChild(path);
  }
}

function getMatchWinner(matchupEl) {
  if (!matchupEl) return null;
  const winnerCard = matchupEl.querySelector(".player-card.winner, .player-card.champion");
  if (!winnerCard) return null;
  return winnerCard.querySelector(".player-name")?.textContent || null;
}

function getPlayerNum(name) {
  const m = name.match(/\d+/);
  return m ? m[0] : "?";
}

function adjustLayout() {
  const header  = document.querySelector(".site-header");
  const prizes  = document.querySelector(".prizes-strip");
  if (!header || !prizes) return;
  const h = header.getBoundingClientRect().height + prizes.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--header-h", h + "px");
}

function scaleToFit() {
  const wrapper = document.querySelector(".bracket-wrapper");
  const bracket = document.getElementById("bracket");
  if (!wrapper || !bracket) return;

  bracket.style.transform = "none";
  bracket.style.transformOrigin = "top left";

  const wW = wrapper.clientWidth;
  const wH = wrapper.clientHeight;
  const bW = bracket.scrollWidth;
  const bH = bracket.scrollHeight;

  const scaleX = wW / bW;
  const scaleY = wH / bH;
  const scale  = Math.min(scaleX, scaleY, 1);

  if (scale < 1) {
    const offX = (wW - bW * scale) / 2;
    const offY = (wH - bH * scale) / 2;
    bracket.style.transform = `translate(${offX}px, ${offY}px) scale(${scale})`;
    bracket.style.transformOrigin = "top left";
    bracket.style.width  = bW + "px";
    bracket.style.height = bH + "px";
  } else {
    bracket.style.transform = "none";
    bracket.style.width  = "100%";
    bracket.style.height = "100%";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  adjustLayout();
  render();
  requestAnimationFrame(() => {
    scaleToFit();
    drawAllConnectors();
  });
});

window.addEventListener("resize", () => {
  adjustLayout();
  scaleToFit();
  drawAllConnectors();
});

window.closeModal = closeModal;
