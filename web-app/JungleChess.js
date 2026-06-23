/**
 * Pure game module for classic Chinese Jungle Chess (Dou Shou Qi).
 *
 * Design decision: game state is represented as a flat immutable list of
 * pieces plus turn/status metadata. Terrain is static and queried through this
 * module, keeping rules out of the browser UI.
 */

const WIDTH = 7;
const HEIGHT = 9;

const PLAYERS = Object.freeze(["blue", "red"]);

const PIECES = Object.freeze([
  Object.freeze({ type: "rat", label: "Rat", rank: 1, symbol: "R" }),
  Object.freeze({ type: "cat", label: "Cat", rank: 2, symbol: "C" }),
  Object.freeze({ type: "dog", label: "Dog", rank: 3, symbol: "D" }),
  Object.freeze({ type: "wolf", label: "Wolf", rank: 4, symbol: "W" }),
  Object.freeze({ type: "leopard", label: "Leopard", rank: 5, symbol: "P" }),
  Object.freeze({ type: "tiger", label: "Tiger", rank: 6, symbol: "T" }),
  Object.freeze({ type: "lion", label: "Lion", rank: 7, symbol: "L" }),
  Object.freeze({ type: "elephant", label: "Elephant", rank: 8, symbol: "E" })
]);

const DENS = Object.freeze({
  red: Object.freeze({ x: 3, y: 0 }),
  blue: Object.freeze({ x: 3, y: 8 })
});

const TRAPS = Object.freeze({
  red: Object.freeze([
    Object.freeze({ x: 2, y: 0 }),
    Object.freeze({ x: 4, y: 0 }),
    Object.freeze({ x: 3, y: 1 })
  ]),
  blue: Object.freeze([
    Object.freeze({ x: 2, y: 8 }),
    Object.freeze({ x: 4, y: 8 }),
    Object.freeze({ x: 3, y: 7 })
  ])
});

const riverColumns = [1, 2, 4, 5];
const riverRows = [3, 4, 5];

const WATER = Object.freeze(riverRows.flatMap(y =>
  riverColumns.map(x => Object.freeze({ x, y }))
));

const pieceInfo = type => PIECES.find(piece => piece.type === type);

const makePiece = (player, type, x, y) => {
  const info = pieceInfo(type);
  return Object.freeze({
    id: `${player}-${type}`,
    player,
    type,
    label: info.label,
    rank: info.rank,
    symbol: info.symbol,
    position: Object.freeze({ x, y })
  });
};

const initialPieces = Object.freeze([
  makePiece("red", "lion", 0, 0),
  makePiece("red", "tiger", 6, 0),
  makePiece("red", "dog", 1, 1),
  makePiece("red", "cat", 5, 1),
  makePiece("red", "rat", 0, 2),
  makePiece("red", "leopard", 2, 2),
  makePiece("red", "wolf", 4, 2),
  makePiece("red", "elephant", 6, 2),
  makePiece("blue", "elephant", 0, 6),
  makePiece("blue", "wolf", 2, 6),
  makePiece("blue", "leopard", 4, 6),
  makePiece("blue", "rat", 6, 6),
  makePiece("blue", "cat", 1, 7),
  makePiece("blue", "dog", 5, 7),
  makePiece("blue", "tiger", 0, 8),
  makePiece("blue", "lion", 6, 8)
]);

const samePosition = (a, b) => a.x === b.x && a.y === b.y;
const insideBoard = ({ x, y }) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;
const opponent = player => PLAYERS.find(candidate => candidate !== player);
const clonePosition = ({ x, y }) => Object.freeze({ x, y });
const isWater = position => WATER.some(water => samePosition(water, position));
const denOwner = position =>
  Object.entries(DENS).find(([, den]) => samePosition(den, position))?.[0] ?? null;
const trapOwner = position =>
  Object.entries(TRAPS).find(([, traps]) =>
    traps.some(trap => samePosition(trap, position)))?.[0] ?? null;

const freezePiece = piece => Object.freeze({
  ...piece,
  position: clonePosition(piece.position)
});

const freezeGame = game => Object.freeze({
  pieces: Object.freeze(game.pieces.map(freezePiece)),
  turn: game.turn,
  status: game.status,
  winner: game.winner,
  lastMove: game.lastMove ? Object.freeze({
    from: clonePosition(game.lastMove.from),
    to: clonePosition(game.lastMove.to),
    piece: game.lastMove.piece,
    captured: game.lastMove.captured
  }) : null
});

/**
 * Create a new classic Jungle Chess game in the standard initial setup.
 *
 * @returns {Readonly<object>} A new immutable game state.
 */
const newGame = () => freezeGame({
  pieces: initialPieces,
  turn: "blue",
  status: "playing",
  winner: null,
  lastMove: null
});

/**
 * Get the player whose turn it is.
 *
 * @param {Readonly<object>} game - Current game state.
 * @returns {"blue"|"red"} The current player.
 */
const currentPlayer = game => game.turn;

/**
 * Return all active pieces.
 *
 * @param {Readonly<object>} game - Current game state.
 * @returns {ReadonlyArray<object>} Active pieces on the board.
 */
const board = game => game.pieces;

/**
 * Find the piece at a board position.
 *
 * @param {{x:number, y:number}} position - Board coordinate.
 * @param {Readonly<object>} game - Current game state.
 * @returns {object|null} The piece at the position, or null.
 */
const pieceAt = (position, game) =>
  game.pieces.find(piece => samePosition(piece.position, position)) ?? null;

/**
 * Find the animal printed on a starting square.
 *
 * These marks are static board decoration. They remain on the board after a
 * piece moves away, matching traditional Jungle Chess boards.
 *
 * @param {{x:number, y:number}} position - Board coordinate.
 * @returns {object|null} Starting animal mark, or null for ordinary squares.
 */
const initialMarkAt = position => {
  const markedPiece = initialPieces.find(piece => samePosition(piece.position, position));
  return markedPiece
    ? Object.freeze({
      player: markedPiece.player,
      type: markedPiece.type,
      label: markedPiece.label,
      rank: markedPiece.rank,
      symbol: markedPiece.symbol
    })
    : null;
};

/**
 * Report the terrain at a coordinate.
 *
 * @param {{x:number, y:number}} position - Board coordinate.
 * @returns {Readonly<object>} Terrain summary for rendering and rule checks.
 */
const terrainAt = position => Object.freeze({
  type: isWater(position)
    ? "water"
    : denOwner(position)
      ? "den"
      : trapOwner(position)
        ? "trap"
        : "land",
  denOwner: denOwner(position),
  trapOwner: trapOwner(position)
});

const effectiveRank = piece => {
  if (!piece.position) {
    return piece.rank;
  }

  const owner = trapOwner(piece.position);
  return owner && owner !== piece.player ? 0 : piece.rank;
};

/**
 * Decide whether one piece may capture another according to classic rank rules.
 *
 * Pieces in an opponent trap have effective rank 0. Rat may capture Elephant,
 * Elephant may not capture Rat, and normal captures require equal or higher
 * effective rank.
 *
 * @param {object} attacker - Moving piece.
 * @param {object} defender - Opponent piece on destination square.
 * @returns {boolean} True when capture is legal.
 */
const canCapture = (attacker, defender) => {
  if (attacker.player === defender.player) {
    return false;
  }

  if (attacker.type === "rat" && defender.type === "elephant") {
    return true;
  }

  if (attacker.type === "elephant" && defender.type === "rat") {
    return false;
  }

  return effectiveRank(attacker) >= effectiveRank(defender);
};

const canEnter = (piece, destination) =>
  denOwner(destination) !== piece.player &&
  (piece.type === "rat" || !isWater(destination));

const orthogonalDirections = Object.freeze([
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: 0, y: -1 })
]);

const riverJumpers = Object.freeze(["lion", "tiger"]);

const jumpDestination = (piece, from, direction, game) => {
  if (!riverJumpers.includes(piece.type)) {
    return null;
  }

  const first = { x: from.x + direction.x, y: from.y + direction.y };

  if (!insideBoard(first) || !isWater(first)) {
    return null;
  }

  const waterLine = [];
  let cursor = first;

  while (insideBoard(cursor) && isWater(cursor)) {
    waterLine.push(cursor);
    cursor = { x: cursor.x + direction.x, y: cursor.y + direction.y };
  }

  const ratBlocksJump = waterLine.some(position => {
    const pieceInRiver = pieceAt(position, game);
    return pieceInRiver?.type === "rat";
  });

  return insideBoard(cursor) && !ratBlocksJump ? cursor : null;
};

const candidateDestinations = (piece, game) => {
  return orthogonalDirections
    .map(direction => jumpDestination(piece, piece.position, direction, game) ??
      { x: piece.position.x + direction.x, y: piece.position.y + direction.y })
    .filter(insideBoard);
};

const isWaterToLandElephantCapture = (attacker, defender) =>
  attacker.type === "rat" &&
  defender.type === "elephant" &&
  isWater(attacker.position) &&
  !isWater(defender.position);

const canLandOn = (piece, destination, game) => {
  if (!canEnter(piece, destination)) {
    return false;
  }

  const target = pieceAt(destination, game);

  if (!target) {
    return true;
  }

  if (isWaterToLandElephantCapture(piece, target)) {
    return false;
  }

  return canCapture(piece, target);
};

/**
 * Calculate legal destination squares for the current player's piece.
 *
 * Movement is orthogonal by one square. Rat may enter water. Lion and Tiger may
 * jump in a straight line across a river if no Rat is in the crossed water.
 *
 * @param {{x:number, y:number}} position - Position of the piece to move.
 * @param {Readonly<object>} game - Current game state.
 * @returns {ReadonlyArray<{x:number, y:number}>} Legal destination positions.
 */
const validMoves = (position, game) => {
  if (game.status !== "playing") {
    return Object.freeze([]);
  }

  const piece = pieceAt(position, game);

  if (!piece || piece.player !== game.turn) {
    return Object.freeze([]);
  }

  return Object.freeze(candidateDestinations(piece, game)
    .filter(destination => canLandOn(piece, destination, game))
    .map(clonePosition));
};

const isLegalMove = (from, to, game) =>
  validMoves(from, game).some(move => samePosition(move, to));

const movePiece = (movingPiece, to, pieces) =>
  pieces
    .filter(piece => !samePosition(piece.position, to))
    .map(piece => piece.id === movingPiece.id
      ? { ...piece, position: to }
      : piece);

/**
 * Move a piece and return a new game state.
 *
 * Illegal moves return the original game unchanged. Legal moves switch turns,
 * except entering the opponent den, which immediately wins the game.
 *
 * @param {{x:number, y:number}} from - Source coordinate.
 * @param {{x:number, y:number}} to - Destination coordinate.
 * @param {Readonly<object>} game - Current game state.
 * @returns {Readonly<object>} New game state, or original state if illegal.
 */
const move = (from, to, game) => {
  if (!isLegalMove(from, to, game)) {
    return game;
  }

  const movingPiece = pieceAt(from, game);
  const capturedPiece = pieceAt(to, game);
  const movedPieces = movePiece(movingPiece, to, game.pieces);
  const hasWon = samePosition(to, DENS[opponent(movingPiece.player)]);

  return freezeGame({
    pieces: movedPieces,
    turn: hasWon ? game.turn : opponent(game.turn),
    status: hasWon ? "won" : "playing",
    winner: hasWon ? movingPiece.player : null,
    lastMove: {
      from,
      to,
      piece: movingPiece.id,
      captured: capturedPiece ? capturedPiece.id : null
    }
  });
};

/**
 * Check whether the game has been won.
 *
 * @param {Readonly<object>} game - Current game state.
 * @returns {boolean} True when a player has entered the opponent den.
 */
const isVictory = game => game.status === "won";

/**
 * Get the winning player.
 *
 * @param {Readonly<object>} game - Current game state.
 * @returns {"blue"|"red"|null} Winning player, or null while still playing.
 */
const winner = game => game.winner;

/**
 * Return a serialisable summary of the game state for UI and tests.
 *
 * @param {Readonly<object>} game - Current game state.
 * @returns {Readonly<object>} State summary.
 */
const gameState = game => Object.freeze({
  currentPlayer: game.turn,
  status: game.status,
  winner: game.winner,
  piecesRemaining: game.pieces.length,
  lastMove: game.lastMove
});

const JungleChess = {
  newGame,
  currentPlayer,
  validMoves,
  move,
  canCapture,
  isVictory,
  winner,
  board,
  pieceAt,
  initialMarkAt,
  gameState,
  terrainAt,
  pieces: () => PIECES,
  dimensions: () => Object.freeze({ width: WIDTH, height: HEIGHT }),
  dens: () => DENS,
  traps: () => TRAPS,
  water: () => WATER
};

export default Object.freeze(JungleChess);
