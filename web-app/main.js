import JungleChess from "./JungleChess.js";

let game = null;
let selectedPosition = null;

const page = {
  board: document.querySelector("#board"),
  status: document.querySelector("#status"),
  victoryBanner: document.querySelector("#victory-banner"),
  victoryMessage: document.querySelector("#victory-message"),
  lobby: document.querySelector("#lobby"),
  gameShell: document.querySelector("#game-shell"),
  startGameButton: document.querySelector("#start-game"),
  playAgainButton: document.querySelector("#play-again"),
  newGameButton: document.querySelector("#new-game")
};

const samePosition = (a, b) => a && b && a.x === b.x && a.y === b.y;

const positionKey = ({ x, y }) => `${x},${y}`;

const legalMoveKeySet = () =>
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
    page.status.textContent = "Ready to start";
    page.victoryBanner.hidden = true;
    return;
  }

  const state = JungleChess.gameState(game);

  if (state.status === "won") {
    const message = `${state.winner.toUpperCase()} wins!`;
    page.status.textContent = message;
    page.victoryMessage.textContent = message;
    page.victoryBanner.hidden = false;
    return;
  }

  page.status.textContent = `${state.currentPlayer.toUpperCase()} to move`;
  page.victoryBanner.hidden = true;
};

const makePieceElement = piece => {
  const pieceElement = document.createElement("span");
  pieceElement.className = `piece ${piece.player} ${piece.type}`;
  pieceElement.dataset.rank = piece.rank;
  pieceElement.dataset.symbol = piece.symbol;
  pieceElement.setAttribute("aria-hidden", "true");
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
  const legalDestinations = legalMoveKeySet();

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
  const legalDestinations = legalMoveKeySet();
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
    page.board.replaceChildren();
    renderStatus();
    return;
  }

  const { width, height } = JungleChess.dimensions();
  const positions = Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width)
  }));

  page.board.replaceChildren(...positions.map(makeCellElement));
  renderStatus();
}

const resetGame = () => {
  game = JungleChess.newGame();
  selectedPosition = null;
  page.victoryBanner.hidden = true;
};

const startGame = () => {
  resetGame();
  page.lobby.hidden = true;
  page.gameShell.hidden = false;
  render();
};

page.startGameButton.addEventListener("click", startGame);

page.newGameButton.addEventListener("click", () => {
  resetGame();
  render();
});

page.playAgainButton.addEventListener("click", () => {
  resetGame();
  render();
});

render();
