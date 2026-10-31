# Verification — 2026-10-30

## Chessmate 1.2.1 — naming and repository setup

- Renamed the interface, browser title, launch/setup/stop scripts, package, documentation, and exported files to Chessmate.
- Kept the original IndexedDB name and normal port so existing games and progress remain available. Existing launcher filenames and environment overrides remain compatibility aliases.
- Production build and all **191 unit tests passed**. Six browser scenarios re-ran successfully: offline browser close/reopen, old saves and themes, annotations, hints and exploration, reduced motion, and desktop/mobile layouts.
- The source repository excludes dependencies, the downloaded runtime, generated builds, browser profiles, logs, and personal backups. GPL licensing, corresponding engine source information, and the pinned CC0 catalog are retained.

## Version 1.2 — exploration and the expanded coach

- Production TypeScript/Vite build passed; **191 unit tests passed**.
- **29 distinct Edge browser scenarios passed**. The full suite's all-84 exercise locator was narrowed to the exercise list after a module description matched the same text. The corrected curriculum test and affected coaching cases passed against the final build. A separate persistent-profile test then passed a real browser close/reopen.
- Exploration coverage: both sides, saved branches, undo/redo/reset, three custom candidate moves, first-move application, historical-position restrictions, pausing/resuming a bot search, rapid navigation during a five-second search, engine failure/restart without losing the board, special moves, repetition history, keyboard use, and narrow screens.
- Persistence coverage: version 1 migration, unchanged pending game, branch reload, JSON backup round-trip, corrupt branch rejection, saved practice positions, and appearance preferences.
- **All 84 exercise solutions were entered through the application**, including promotion selection. Every authored solution and variation also passes legal replay checks. Twelve opening modules and six foundation modules are present.
- All **3,865 opening reference lines** were validated using chess.js before building the local index. Recognition by position and transposition behavior are tested. The dataset is pinned to revision `712a58be746c143f4ab935b68acc50f4bac813eb`.
- Offline browser tests blocked external requests. A complete session played a coached move, requested a hint, explored alternatives, saved practice, completed a lesson, closed the browser, and reopened the same isolated profile with its progress intact. No remote application requests were observed.
- Existing legal-move, coaching-evidence, theme, drag, promotion, game-review, PGN, and reduced-motion checks remain covered.

### Engine review

The original 24 positions and all 60 new positions received Stockfish analysis. Plans used approximately 1.5 seconds; tactical/defensive positions and targeted corrections used five seconds per search, including a forced search when the taught move differed from the engine's first choice. Final results are in `verification/lesson-analysis.json` and `verification/expanded-analysis.json`.

The largest finite difference was 15 centipawns for an original exercise and 66 centipawns for a new exercise that asks for a specified defensive idea. Lessons do not label every other move bad. These are finite searches, not proofs of globally optimal strategy. Forks for both colors, pinned defenders, poisoned captures, trap defenses, checkmates, and stalemate-avoiding underpromotion also have concrete legality checks.

### Delivery

The Desktop installation returned HTTP 200 with the final build asset, its source hash matched staging, and the visible installed app retained the existing game. The production origin stays `http://127.0.0.1:4173/`. Testing uses a separate origin/profile. Source, build, local engine assets, pinned catalog, license notices, tests, and verification reports are included. Existing user IndexedDB is not replaced during installation. Version 1 backups migrate when loaded by the new app.

The lazy-loaded catalog is about 856 KB before compression; Vite emits a size advisory for this data chunk. It is loaded locally only when the opening library/assistance needs it.

---

## Version 1.1 — glass boards and interactive study

- Production TypeScript and Vite build passed.
- **50 core tests passed**, including six new checks for legacy-save migration, independent board/piece preferences, corrupt settings, flipped annotation geometry, verified move animation, and both pieces moving during castling.
- **18 browser scenarios passed** (the original 13 plus five new theme/interaction scenarios). The five new scenarios were rerun successfully against the final build.
- Tested all four board styles, all three piece finishes, appearance persistence, older backups retaining a pending game, right-drag arrows, square circles, flipped drawings, drawing without moving pieces, hint highlights, coach evidence highlights, play/pause exploration, motion, reduced-motion behavior, and desktop/mobile layouts.
- Screenshots reviewed for Nebula Glass, Aurora Glass, Obsidian, Classic, and the style studio. All artwork and optional sound are local code; no new network dependencies were introduced.
- A source/build rollback copy was saved outside the installed application. The upgrade only replaces application files; browser IndexedDB and the fixed production origin stay unchanged.

Production build: passed TypeScript checking and Vite production bundling.

Installed Desktop launcher: verified HTTP 200 from the production board using the bundled Desktop Node runtime; stop script terminated that exact server; relaunch served the health endpoint successfully. The installed app was also opened in the visible browser preview.

## Automated checks

- **44 passing core tests:** all 24 lesson answers and continuations, module counts, opening transpositions, castling and undo, en passant, underpromotion, checkmate/stalemate, history-aware repetition, pinned defenders, absolute pins, forks for both colors, poisoned-capture wording, IndexedDB round-trip, backup validation, spacing intervals, PGN setup positions, engine queue serialization, cancellation, stale-worker messages, failure handling, and timeouts.
- **13 passing Edge browser scenarios:** coached play with local Stockfish; all three hints; three-line exploration and return; persistence and reload; undo during analysis; lesson completion and progress; JSON backup/restore; castling; en passant; underpromotion; mate and automatic review; stalemate; repetition after reload; invalid PGN and valid PGN round-trip; restart during analysis; Black-side play; desktop/mobile layouts; dragging; flipping; missed-exercise scheduling; recovery after an actual worker load failure; and all 24 lesson answers entered through the board.
- The coached browser session blocked non-loopback requests and asserted that observed application requests stayed on 127.0.0.1. The built app bundles all scripts, styles, engine files, and pieces. Its content security policy restricts connections to the same origin.
- Screenshots were inspected at 1440 px desktop width and 390 px mobile width. No horizontal overflow at the mobile size.

## Lesson analysis

Every solution was checked with Stockfish 18 lite single-threaded. Ordinary plans used 1.5-second searches; defensive and tactical lessons used 5-second searches. If the preferred move differed, the taught move received a separate forced-move search. Reached depths ranged from 22 to 29.

The largest measured difference between a taught move and the engine's leading choice was **0.06 pawns** in this run (Nbd7 in the fifth QGD exercise). Separate searches can produce slightly different estimates; these figures are not proof of perfect play. The lessons explicitly teach a particular plan rather than declaring all other choices bad.

The Shilling-trap check confirmed **...Qg5** as the preferred reply after the tempting Nxe5, at depth 25. The Lasker-trap exercise's Nxd5 was the leading choice at depth 25; its full illustrative continuation was also checked for legality.

## Limits

The UI tests use disposable browser profiles. User progress is not test data. The engine is a practical analysis tool rather than a mathematical proof; long-term positional commentary is deliberately labeled as general guidance. An easy engine level can still make strong moves. Neither opponent strength nor lesson difficulty is calibrated to a human rating.

Run `npm test` and `npm run test:browser` after setup. Start the local app before browser tests. Optional deeper curriculum verification: `node scripts/verify-lessons.mjs` (writes verification/lesson-analysis.json).
