import assert from "node:assert/strict";
import JungleChess from "../web-app/JungleChess.js";

/**
 * API specification:
 * JungleChess exposes pure functions for creating a classic game, querying
 * board/terrain state, validating movement, applying moves, checking capture
 * rules, and reporting victory. Tests assert observable behaviour only.
 */

const piece = (player, type, rank, position) => ({
  id: `${player}-${type}-${position.x}-${position.y}`,
  player,
  type,
  label: type,
  rank,
  symbol: type[0].toUpperCase(),
  position
});

const gameWith = (pieces, turn = "blue") => ({
  pieces,
  turn,
  status: "playing",
  winner: null,
  lastMove: null
});

const hasMove = (moves, position) =>
  moves.some(move => move.x === position.x && move.y === position.y);

describe("JungleChess classic API", () => {
  it("sets up a classic 7 by 9 game with sixteen pieces", () => {
    const game = JungleChess.newGame();
    const pieceTypes = JungleChess.pieces().map(candidate => candidate.type);

    assert.equal(JungleChess.dimensions().width, 7);
    assert.equal(JungleChess.dimensions().height, 9);
    assert.equal(JungleChess.board(game).length, 16);
    assert.deepEqual(pieceTypes, [
      "rat",
      "cat",
      "dog",
      "wolf",
      "leopard",
      "tiger",
      "lion",
      "elephant"
    ]);
    assert.equal(JungleChess.currentPlayer(game), "blue");
  });

  it("exposes dens, traps, and water terrain for the UI", () => {
    assert.equal(JungleChess.terrainAt({ x: 3, y: 0 }).type, "den");
    assert.equal(JungleChess.terrainAt({ x: 3, y: 0 }).denOwner, "red");
    assert.equal(JungleChess.terrainAt({ x: 2, y: 8 }).type, "trap");
    assert.equal(JungleChess.terrainAt({ x: 2, y: 8 }).trapOwner, "blue");
    assert.equal(JungleChess.terrainAt({ x: 1, y: 4 }).type, "water");
  });

  it("exposes static starting animal marks for board decoration", () => {
    assert.equal(JungleChess.initialMarkAt({ x: 0, y: 8 }).type, "tiger");
    assert.equal(JungleChess.initialMarkAt({ x: 3, y: 3 }), null);
  });

  it("switches turn after a legal move", () => {
    const game = JungleChess.newGame();
    const moved = JungleChess.move({ x: 0, y: 8 }, { x: 0, y: 7 }, game);

    assert.notEqual(moved, game);
    assert.equal(JungleChess.currentPlayer(moved), "red");
  });

  it("allows orthogonal one-square movement on land", () => {
    const game = JungleChess.newGame();
    const moves = JungleChess.validMoves({ x: 0, y: 8 }, game);

    assert.equal(hasMove(moves, { x: 0, y: 7 }), true);
    assert.equal(hasMove(moves, { x: 1, y: 8 }), true);
  });

  it("rejects diagonal and two-square movement by returning the original game", () => {
    const game = JungleChess.newGame();

    assert.equal(JungleChess.move({ x: 0, y: 8 }, { x: 1, y: 7 }, game), game);
    assert.equal(JungleChess.move({ x: 0, y: 8 }, { x: 0, y: 6 }, game), game);
  });

  it("prevents non-rat animals from entering water", () => {
    const game = gameWith([
      piece("blue", "cat", 2, { x: 1, y: 2 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 1, y: 2 }, game), { x: 1, y: 3 }), false);
  });

  it("allows Rat to enter water", () => {
    const game = gameWith([
      piece("blue", "rat", 1, { x: 1, y: 2 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 1, y: 2 }, game), { x: 1, y: 3 }), true);
  });

  it("allows Lion and Tiger to jump a clear river", () => {
    const game = gameWith([
      piece("blue", "lion", 7, { x: 0, y: 3 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 0, y: 3 }, game), { x: 3, y: 3 }), true);
  });

  it("blocks Lion and Tiger river jumps when a Rat is in the water", () => {
    const game = gameWith([
      piece("blue", "lion", 7, { x: 0, y: 3 }),
      piece("red", "rat", 1, { x: 1, y: 3 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 0, y: 3 }, game), { x: 3, y: 3 }), false);
  });

  it("captures opponent pieces of equal or lower rank", () => {
    const cat = { player: "blue", type: "cat", rank: 2 };
    const rat = { player: "red", type: "rat", rank: 1 };
    const wolf = { player: "red", type: "wolf", rank: 4 };

    assert.equal(JungleChess.canCapture(cat, rat), true);
    assert.equal(JungleChess.canCapture(cat, wolf), false);
  });

  it("allows Rat to capture Elephant, but not Elephant to capture Rat", () => {
    const rat = { player: "blue", type: "rat", rank: 1 };
    const elephant = { player: "red", type: "elephant", rank: 8 };

    assert.equal(JungleChess.canCapture(rat, elephant), true);
    assert.equal(JungleChess.canCapture(elephant, rat), false);
  });

  it("makes pieces in opponent traps capturable by lower ranked pieces", () => {
    const game = gameWith([
      piece("blue", "rat", 1, { x: 2, y: 7 }),
      piece("red", "elephant", 8, { x: 2, y: 8 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 2, y: 7 }, game), { x: 2, y: 8 }), true);
  });

  it("does not allow a piece to enter its own den", () => {
    const game = gameWith([
      piece("blue", "rat", 1, { x: 3, y: 7 })
    ]);

    assert.equal(hasMove(JungleChess.validMoves({ x: 3, y: 7 }, game), { x: 3, y: 8 }), false);
  });

  it("detects victory when a piece enters the opponent den", () => {
    const game = gameWith([
      piece("blue", "rat", 1, { x: 3, y: 1 })
    ]);
    const finished = JungleChess.move({ x: 3, y: 1 }, { x: 3, y: 0 }, game);

    assert.equal(JungleChess.isVictory(finished), true);
    assert.equal(JungleChess.winner(finished), "blue");
    assert.equal(JungleChess.gameState(finished).status, "won");
  });
});
