# Classic Jungle Chess Coursework App

CID: 02603669

This project follows the sample structure of which Applications style split between:

- `web-app/JungleChess.js`: pure game logic module.
- `web-app/index.html`: semantic page structure.
- `web-app/default.css`: visual presentation.
- `web-app/main.js`: event-driven browser UI.
- `tests/`: Mocha behavioural tests using Node `assert`.

The game implements a classic 7 by 9 Dou Shou Qi board with eight animals per
player, dens, traps, rivers, Rat river movement, Lion/Tiger river jumps, trap
rank reduction, Rat versus Elephant rules, and den-entry victory.

## Run Tests

```bash
npm install
npm test
```

## Run Web App

```bash
npm start
```

Then open `http://localhost:8080`.
