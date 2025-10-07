to chatgpt : Create a sokoban game clone using your preferred AI provider. The player sprite must be able to move in all directions. Blocks can only be pushed and not pulled. Only one block can be pushed at a time. write a prompt to use it in lovable
to lovable agent : Create a small, runnable Sokoban clone as a single-page web app (HTML + CSS + vanilla JavaScript). Deliver a complete project (index.html, style.css, main.js, assets folder if needed, README). The game must be simple to run (open index.html in a browser) and well-documented.

Requirements / behavior:
1. Movement:
   - The player sprite must be able to move in all cardinal directions: Up, Down, Left, Right (arrow keys and WASD). Smooth grid-based movement (snap to tiles).
   - Optional: also support touch (swipe) and on-screen arrow buttons for mobile.

2. Sokoban rules:
   - Blocks (boxes/crates) can only be **pushed**, not pulled.
   - Only **one** block can be pushed at a time.
   - Pushing is allowed only if the target tile behind the pushed block is empty (floor or goal). If blocked by wall or another block, the player cannot push.
   - Player cannot move into walls.
   - Goals (target spots) should be visually distinct; when a block sits on a goal it should visually indicate success (e.g., highlight or check).
   - Level is complete when all goals are occupied by blocks.

3. World representation & levels:
   - Use a simple grid/tile map representation: an array of strings or 2D array (e.g. `"# . $ @"` style or `["#####", "# . #", "#$@ #", "#####"]`). Include at least 2 example levels in a `levels` array.
   - Provide a small level loader that can switch between levels and a "Reset level" button.

4. Graphics / assets:
   - Minimal art: use colored squares / simple sprite rectangles drawn on an HTML5 `<canvas>` or use small PNGs in an `assets/` folder. Keep assets included or procedurally generated (preferred).
   - Player, block, wall, floor, and goal must be easily distinguishable.

5. Controls & UX:
   - Keyboard: Arrow keys + WASD.
   - Show move counter and push counter.
   - Provide Undo (single-step) functionality (optional but preferred).
   - Provide Reset and Next Level buttons.
   - Display "Level Complete!" overlay when solved.

6. Code quality:
   - Modular, well-commented code with clear separation: level parsing, rendering, input handling, game state, and rules logic.
   - Implement solid push logic that enforces “only one block pushed at a time” and “no pulling”.
   - Add unit-test style checks or simple console asserts for key mechanics (e.g., trying to push two blocks in a row should fail, pushing into wall fails, goal detection works).
   - Avoid external libraries — keep it vanilla JS (ES6+). If you prefer a tiny framework (Phaser), state it clearly and provide instructions; otherwise prefer zero-dependency.

7. Deliverables in the repo:
   - `index.html` - game UI and instructions.
   - `style.css` - minimal responsive styling.
   - `main.js` - full game logic.
   - `levels.js` or `levels` constant - at least 2 example levels.
   - `README.md` - how to run, controls, explanation of rules, file structure, and how to add custom levels.
   - Optional: small sprite PNGs in `assets/` if used.

8. Extra notes for implementation (these are hard constraints — follow them precisely):
   - When the player attempts a move into a cell containing a block:
     a) If the next cell in that same direction is empty or a goal, move the block one tile into that next cell and move the player into the block’s old cell (successful push).
     b) If the next cell is a wall or another block, cancel the player’s movement (nothing moves).
     c) Do not allow pushing two blocks in one move (i.e., if the next cell after the block contains another block, movement blocked).
   - The player must not be able to “pull” a block by moving away — only moves that go into a block can push it.
   - The grid must remain aligned: no half-tiles allowed.
   - Movement should be atomic per input (i.e., process one move fully before accepting the next).

9. Testing checklist to include in README:
   - Move into empty tile: player moves.
   - Move into wall: no movement.
   - Move into single block with empty tile beyond: block moves, player moves.
   - Move into single block with wall/another block beyond: no movement.
   - All goals occupied -> level complete overlay appears.
   - Reset reloads the level to original state.
   - Undo reverts last move (if implemented).

10. Example level format and two small example levels (include these exact levels in the code):
   - Legend: `#`=wall, `.`=goal, ` `=floor, `$`=box, `@`=player
   - Level A:
     ```
     ["#####",
      "#.  #",
      "# $$#",
      "# @ #",
      "#####"]
     ```
   - Level B:
     ```
     ["#######",
      "#  .  #",
      "# $$$ #",
      "#  @  #",
      "#######"]
     ```

Make the generated project runnable by simply opening `index.html` in a modern browser. Provide clear comments at the top of `main.js` describing how the grid is represented and where to add new levels. Also include a short note in README about how to adapt the tile size and add custom sprites.

End of prompt.

