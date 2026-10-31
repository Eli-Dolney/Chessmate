# Open-source components

Chessmate application source, original lesson prose, and original SVG piece artwork are licensed under GPL-3.0-only. The complete GPL text is in LICENSE. This program comes without warranty; see that license for details.

Version 1.1 adds original procedural galaxy/crystal SVG finishes, glass board CSS, annotations, motion, and synthesized audio. These are included under the same application license and contain no externally loaded media.

- Stockfish.js **18.0.8**, Stockfish **18**, GPL-3.0: https://github.com/nmrugg/stockfish.js/tree/v18.0.8 . Unmodified lite single-threaded engine JS/WASM files are bundled. The matching source including build scripts is included in `vendor/stockfish-source-v18.0.8.zip`. Follow its README to build with Emscripten. Corresponding license: `public/licenses/stockfish.txt`.
- chess.js, BSD-2-Clause: https://github.com/jhlywa/chess.js . License: `public/licenses/chess-js.txt`.
- React and React DOM, MIT: https://github.com/facebook/react . Licenses: `public/licenses/react.txt` and `public/licenses/react-dom.txt`.
- Node.js **22.23.4** runtime, including its bundled third-party components: `.runtime/node-v22.23.4-win-x64/LICENSE`. Downloaded from nodejs.org and checked against its published SHA-256 checksum.
- Vite, TypeScript, Vitest, Playwright, and fake-indexeddb are development dependencies; their licenses remain in node_modules. Exact dependency versions and integrity hashes are recorded in package-lock.json.

No remote fonts, analytics, proprietary lessons, or third-party artwork are loaded by the application. Chess opening names and move sequences describe the game; all explanations in this app were authored for this project.

## Offline opening catalog

Lichess chess-openings, CC0-1.0 public domain dedication. Source: https://github.com/lichess-org/chess-openings
Pinned revision: `712a58be746c143f4ab935b68acc50f4bac813eb`.
The original five TSV files, COPYING.txt, README.md and revision are in `vendor/chess-openings`. `npm run build:openings` validates every line and regenerates `src/data/openings.json` using chess.js.
This catalog supplies names and reference moves; all coaching and lesson explanations are original. No opening win rates or frequency statistics are bundled.
