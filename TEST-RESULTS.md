# Verification — 2026-11-13

## Chessmate 1.10.0 — opening defense lab

- Production build and **321 unit tests passed**. New coverage includes all 8,192 indexed reference continuations replayed legally, position-key transpositions, castling/en-passant rights, full-history repetition and terminal stops, corrupt-route filtering, opening-study backup compatibility, and conditional setup coaching for both colors.
- **14 targeted Edge browser scenarios passed**: five new defense-lab scenarios, all five coaching-control checks, three line-coach regressions, and the offline browser close/reopen workflow. The first attempted lab run could not reach a stalled test server; after replacing only that verified 4174 process, all five passed. The final 14-scenario run passed after narration and layout integration.
- Verified Caro-Kann/French branches from the current position, free replies, both sides' commentary, current-position transpositions, branch/cursor reload and JSON restoration, unchanged pending game on return, and saving the actual opponent reply before testing alternatives.
- Verified that Black can apply only the first tested move at the live decision. Historical opponent alternatives cannot rewrite the game. An uncatalogued position supports castling and legal free exploration; interrupted engine requests cannot leave stale alternatives after navigating.
- Checked keyboard operation and 390px mobile width, automatic/paused modes, offline local requests, and existing 3D commentary/playback. The final reference grid collapses after selection, and wide layouts place the line coach before generic coaching. Full curriculum, guided-practice, and review browser suites were not repeated.
- Setup explanations are original board-conditioned principles rather than tactical promises. Immediate checks/capture concerns keep priority. Tests suppress opening patterns after structural changes or later/low-material positions. Existing deeper tactical fixtures remain covered by the unchanged baseline tests; no new forced tactical-win claim was added.
- The derived CC0 catalog index is lazy-loaded locally; no service or dependency was added. Vite reports its existing large-chunk advisory for local data/3D code. Backup schema 3, browser origin, engine files, and separate launchers remain compatible. Actual macOS/M4 execution is still unverified.

## Chessmate 1.9.0 — adjustable play and coaching

- Production build and **293 unit tests passed**. Nineteen coaching preference tests cover presets, independent options, legacy defaults, nonmutation, versions 1/2/3 backup compatibility, preservation of game state, and rejection of invalid new settings.
- **19 distinct targeted Edge browser scenarios passed** across five new coaching-control cases, existing exploration and line commentary, and a complete offline close/reopen workflow. Three existing selectors initially collided with the new customization checkbox label; scoped assistance-summary selectors fixed those fixtures, and all affected scenarios passed on rerun. Unrelated full curriculum, review, and guided-practice suites were not repeated.
- Verified multiple automatic replies, enabling coaching midgame without resetting history, short/long narration, opening-only help without answer/capture panels, independent live commentary, restored preferences, narrow-screen width, and unchanged pending games throughout exploration.
- Verified mode changes during delayed opponent startup and active coaching searches: cancelled results cannot duplicate moves. Added and passed a regression for choosing automatic play inside a lesson and returning to the saved game, plus restoring a pending backup with automatic replies enabled.
- Visually inspected Just play, Opening help, and expanded customization. The offline workflow used an isolated browser profile, blocked nonlocal requests, closed/reopened the browser, and recovered the original game and practice progress. User browser storage was not modified by verification.
- Backup schema 3, IndexedDB name, fixed browser origin, and separate Windows/Mac launchers remain unchanged. Actual macOS/M4 execution remains unverified.

## Chessmate 1.8.0 — move-by-move line coach

- Production build and **274 unit tests passed**. Fifteen new commentary tests cover both colors, development/central pawns, castling/checks, forks/pins, risky captures, pinned defenders, en passant's actual removed square, mate/repetition with full history, terminal starting positions, branch changes, and current-position-safe highlights.
- **13 distinct targeted Edge browser scenarios passed** across coaching, longer playback, and appearance. One new test initially expected the literal word “develop”; the UI correctly described bringing a piece off the back rank. After fixing that wording assertion, its branch/highlight scenario passed. Unrelated full curriculum, review, and guided-practice browser suites were not repeated.
- Verified automatic commentary in 3D without remote requests, White/Black explanations, manual next/previous and branch changes, paused highlighting, immediate removal of stale markings, six-second coach pace and faster options, mobile width, and unchanged pending live game on return.
- Verified the independent commentary toggle after reload and JSON backup restoration. Older saves default to commentary enabled; the optional preference is validated without changing backup schema 3 or browser origin.
- Visually inspected the line coach beside the 3D board at 1920 × 1080. Future saved-line details are expandable, and board facts are separated from conditional purposes and plans. Commentary uses synchronous board inspection and saved history, with no added engine searches or online dependency.
- Windows installed build verified on the existing fixed origin. Separate launchers are unchanged; actual M4/macOS execution remains unverified.

## Chessmate 1.7.0 — longer line playback

- Production build and **259 unit tests passed**. The 13 new continuation tests verify 10/20-ply limits, extending short PVs with complete history, unchanged input records, legal replay, mate/stalemate/insufficient-material and repetition stops, promotion, cancellation, and rejected missing/illegal/stale results.
- **26 targeted Edge browser scenarios passed**: four new line-playback scenarios plus 22 existing exploration, comparison, 3D, and appearance regressions. Unrelated guided-practice, review, and full curriculum browser suites were not repeated in this pass.
- Verified original five-move and alternative ten-move lines (10/20 half-moves), automatic playback, pause, step back/forward, reset, final-position jump, replay and speed selection. Existing branches and the exact pending live game stayed unchanged. Applying a tested alternative still applied only its first move.
- Verified 3D playback and final positions, no remote runtime requests, saved cursor/branch recovery after reload, JSON backup restoration, delayed engine cancellation without late branches, and early mate. Existing engine-failure, stale-analysis, special-move, mobile, keyboard, reduced-motion, and appearance checks passed.
- Visually inspected the playback controls above the board and the separate Original/Alternative buttons in the coach panel. Completed lines persist using the existing exploration schema; playback reopens paused. Launchers and browser origin are unchanged. Actual M4/macOS execution remains unverified.

## Chessmate 1.6.0 — 3D table and original-move comparison

- Production build and **246 unit tests passed**. New checks cover retained original branches, backup round-trip, invalid original references, optional 3D preferences, score comparisons, and position-matched reply arrows.
- **36 distinct targeted Edge browser scenarios passed** across two runs (14 exploration/comparison scenarios, then 26 final-layout, 3D, appearance, chess-rule, and offline scenarios, with four overlapping comparisons). Existing guided-practice and review suites were unchanged and were not rerun in this pass.
- Verified comparison of two full-history searches, original/alternative arrows after flipping, clickable replies in either line, stale-search cancellation, restoring the pending original, branch persistence after reopening, and applying only the first alternative move.
- Verified real 3D square picking for both colors, camera controls and keyboard controls, drag-to-orbit without a chess move, zoom/reset, legal moves, underpromotion, 2D/3D switching, persisted view, mobile width, and graphics-context interruption with a flat-board fallback. The 3D/comparison session made no non-local requests.
- Regression coverage includes all 96 lesson answers through the UI, castling, en passant, underpromotion, repetition, mate/stalemate, imports/backups, engine restart, all appearance choices, reduced motion, and a real browser close/reopen offline session.
- Visually inspected the rendered 3D table and adjacent comparison controls at 1600 × 1100. Rendering is demand-driven, with no perpetual animation loop. Three.js, procedural geometry/textures, engine, and licenses are served locally.
- Actual macOS/M4 execution remains unverified. The unchanged separate Mac launchers are included; 3D requires browser WebGL support and has a flat-board fallback.

## Chessmate 1.5.0 — responsive workspace and focused practice

- Production build and **241 unit tests passed**, covering all 96 authored solutions and variations, focused selection for every opening/situation, due-item ordering, session labels and backup round-trip, legal starting diagrams, mate-in-one claims, and queen-promotion stalemates.
- **41 browser scenarios passed** in the full regression run. After correcting two new starting diagrams and tuning board width, the affected all-96 curriculum run and three focused/responsive scenarios were rerun successfully.
- Responsive coverage: 1920 × 1080, 2560 × 1440, and 390 × 844. Verified increased board width, full workspace use, adjacent coach/notebook columns on wide screens, no horizontal overflow, and keyboard operation of focused practice choices.
- Focused practice checks include Sicilian selection, resuming at the saved item, an explicit paused-session replacement notice, mate execution, endgame selection, and an unchanged live game.
- All 12 new positions received five-second Stockfish searches, with forced candidate searches where needed. Final results are in `verification/targeted-analysis.json`; every final row has a usable line. The largest positive finite candidate gap was 2 centipawns. Mate and stalemate claims are also checked directly using chess.js. The verification script now rejects missing engine lines instead of silently recording an empty result.
- Existing saves, themes, original exercises, offline assets, and separate Windows/Mac launchers remain compatible. No runtime services or remote content were added.

## Chessmate 1.4.0 — themes and Style studio

- Production build and all **213 unit tests passed**.
- **Seven targeted Edge browser scenarios passed**: all existing styles, independent piece selection, new materials, matching/reset controls, saved legacy games and preferences, arrows/circles, hints, movement/reduced motion, desktop/mobile layouts, and a complete offline close/reopen session.
- Inspected desktop studio, Deep Sea/Porcelain board, and narrow-screen screenshots. Corrected preview grid row sizing so empty and occupied squares have equal dimensions; reran the affected material scenario.
- Eight board themes and six piece finishes are bundled as original local CSS/SVG. Porcelain has distinct silhouettes. No remote artwork, dependencies, or changes to game rules were introduced. Existing appearance IDs, backup schema 3, and Windows/Mac launchers are retained.

## Chessmate 1.3.0 — understand, practice, review

- Windows Setup completed a clean `npm ci` using the pinned project-local Node runtime, then the TypeScript/Vite production build passed. System Node was unchanged.
- **213 unit tests passed**, including 22 new cases for guided-session selection and topic rotation, deduplication, hints/missed-answer scheduling, v1/v2 migration, persisted training branches, review color/history/scores, cached results, malformed data, and annotated threats.
- **37 distinct Edge browser scenarios passed**: the full 36-scenario suite, followed by final targeted rechecks and an additional review-return regression. Coverage includes all 84 lesson solutions, castling, en passant, underpromotion, checkmate, stalemate, repetition, undo/redo, free exploration, stale engine results, failure/restart, guided retries/skips/resumption, capture inspection, board highlights, imported review color choice, cancel/resume, exact pending-game restoration, keyboard controls, narrow layouts, and reduced motion.
- Two offline workflows block non-loopback requests and close/reopen real isolated browser profiles. The new workflow completes all six guided positions and analyzes a saved game; its practice results and review analysis survive reopening. No external application requests were observed. User browser profiles were not modified by tests.
- Windows launch checks passed on port 4173: an unrelated listener was rejected; Stop refused an unrelated PowerShell process; Launch started a healthy server; a repeated launch reused its PID; Stop terminated only its own verified Node server.
- Mac: all seven shell/command files passed Bash syntax checks, plus **14 mocked scenarios** covering Apple Silicon/Intel selection, unsupported OS/architecture, paths with spaces, occupied/unrelated ports, existing server reuse, no-browser launch, PID ownership, missing runtime, and checksum rejection before extraction. Official Node 22.23.4 macOS archive SHA-256 values were read from nodejs.org before pinning.
- **Actual macOS/M4 execution remains unverified.** Mocked checks do not validate Finder/Gatekeeper behavior or Safari execution. No claim of an actual Mac run is made.
- Authored chess content and engine files are unchanged. The existing deeper tactical reports below remain applicable; capture inspection and review display measured Stockfish lines rather than introducing new authored tactical claims.
- The optional opening-name data chunk still triggers Vite's >500 kB advisory. It remains lazy-loaded local data, with no runtime network dependency.

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
