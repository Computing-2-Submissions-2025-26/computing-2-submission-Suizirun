import JungleChess from "./JungleChess.js";

let game = null;
let selectedPosition = null;

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#status");
const lobbyElement = document.querySelector("#lobby");
const gameShellElement = document.querySelector("#game-shell");
const startGameButton = document.querySelector("#start-game");
const newGameButton = document.querySelector("#new-game");

const samePosition = (a, b) => a && b && a.x === b.x && a.y === b.y;

const positionKey = ({ x, y }) => `${x},${y}`;

const legalMoveKeys = () =>
  selectedPosition && game
    ? new Set(JungleChess.validMoves(selectedPosition, game).map(positionKey))
    : new Set();

const isDen = position =>
  JungleChess.terrainAt(position).type === "den";

const isTrap = position =>
  JungleChess.terrainAt(position).type === "trap";

const isWater = position =>
  JungleChess.terrainAt(position).type === "water";

const pieceText = piece => `${piece.symbol}${piece.rank}`;

const describeCell = (position, piece) => {
  const terrain = JungleChess.terrainAt(position);
  const cellName = `Column ${position.x + 1}, row ${position.y + 1}`;
  const terrainText = terrain.type === "land"
    ? ""
    : `, ${terrain.denOwner ?? terrain.trapOwner ?? ""} ${terrain.type}`.trimEnd();
  const pieceDescription = piece ? `, ${piece.player} ${piece.label}` : "";
  return `${cellName}${terrainText}${pieceDescription}`;
};

const renderStatus = () => {
  if (!game) {
    statusElement.textContent = "Ready";
    return;
  }

  const state = JungleChess.gameState(game);
  statusElement.textContent = state.status === "won"
    ? `${state.winner.toUpperCase()} wins`
    : `${state.currentPlayer.toUpperCase()} to move`;
};

const makePieceElement = piece => {
  const pieceElement = document.createElement("span");
  pieceElement.className = `piece ${piece.player} ${piece.type}`;
  pieceElement.dataset.rank = piece.rank;
  pieceElement.dataset.symbol = piece.symbol;
  pieceElement.textContent = pieceText(piece);
  return pieceElement;
};

const handleCellClick = position => {
  if (!game) {
    return;
  }

  if (JungleChess.isVictory(game)) {
    return;
  }

  const piece = JungleChess.pieceAt(position, game);
  const legalDestinations = legalMoveKeys();

  if (selectedPosition && legalDestinations.has(positionKey(position))) {
    game = JungleChess.move(selectedPosition, position, game);
    selectedPosition = null;
    render();
    return;
  }

  selectedPosition = piece && piece.player === JungleChess.currentPlayer(game)
    ? position
    : null;

  render();
};

const makeCellElement = position => {
  const piece = JungleChess.pieceAt(position, game);
  const legalDestinations = legalMoveKeys();
  const cell = document.createElement("button");

  cell.type = "button";
  cell.className = [
    "cell",
    isDen(position) ? "den" : "",
    isTrap(position) ? "trap" : "",
    isWater(position) ? "water" : "",
    samePosition(selectedPosition, position) ? "selected" : "",
    legalDestinations.has(positionKey(position)) ? "legal" : ""
  ].filter(Boolean).join(" ");
  cell.setAttribute("role", "gridcell");
  cell.setAttribute("aria-label", describeCell(position, piece));
  cell.disabled = JungleChess.isVictory(game);
  cell.addEventListener("click", () => handleCellClick(position));

  if (piece) {
    cell.append(makePieceElement(piece));
  }

  return cell;
};

function render() {
  if (!game) {
    boardElement.replaceChildren();
    renderStatus();
    return;
  }

  const { width, height } = JungleChess.dimensions();
  const positions = Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width)
  }));

  boardElement.replaceChildren(...positions.map(makeCellElement));
  renderStatus();
}

const startGame = () => {
  game = JungleChess.newGame();
  selectedPosition = null;
  lobbyElement.hidden = true;
  gameShellElement.hidden = false;
  render();
};

startGameButton.addEventListener("click", startGame);

newGameButton.addEventListener("click", () => {
  game = JungleChess.newGame();
  selectedPosition = null;
  render();
});

render();
