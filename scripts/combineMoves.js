const moves = require("../src/data/moves/movesDirectory.json");
const fs = require("fs");
const path = require("path");
const outputPath = path.resolve("./src/data/moves/moves.json");

// interface Moves {
//   directions: string[];
//   moveTypes: string[];
//   rotation: string[];
// }

const mixAndMatch = (moves) => {
  // mix and match the movetypes
  // each result should be in this format: "direction moveType rotation"

  const results = [];
  for (const direction of moves.directions) {
    for (const moveType of moves.moveTypes) {
      for (const rotation of moves.rotation) {
        results.push(`${direction} ${moveType} ${rotation}`);
      }
    }
  }

  // randomize the results
  results.sort(() => Math.random() - 0.5).slice(0, 10);

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
};

mixAndMatch(moves);
