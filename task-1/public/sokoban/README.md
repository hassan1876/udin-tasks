# Sokoban - Classic Puzzle Game

A clean, modern implementation of the classic Sokoban puzzle game built with vanilla JavaScript, HTML5 Canvas, and CSS.

## 🎮 How to Run

Simply open `index.html` in any modern web browser. No build process or server required!

```bash
# Navigate to the sokoban folder
cd public/sokoban

# Open in browser (or just double-click index.html)
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

## 🕹️ Controls

- **Arrow Keys** or **WASD**: Move the player
- **Z** or **Ctrl+Z**: Undo last move
- **R**: Reset current level
- **Undo Button**: Undo last move (up to 100 moves)
- **Reset Button**: Restart current level
- **Next Level Button**: Skip to next level

## 📖 Rules

The goal is to push all boxes (📦) onto the goal spots (🎯):

1. **Push, Don't Pull**: You can only push boxes, never pull them
2. **One Box at a Time**: You cannot push two boxes simultaneously
3. **Strategic Planning**: Plan your moves carefully - boxes pushed into corners cannot be moved!
4. **Level Complete**: When all goals have boxes on them, you win!

## 🎯 Game Mechanics

### Movement System
- **Grid-based**: All movement snaps to the tile grid
- **Atomic moves**: Each input processes completely before accepting the next
- **Collision detection**: Walls and boxes block movement appropriately

### Push Logic
When the player moves into a box:
1. ✅ If the next cell is empty or a goal → Box and player both move
2. ❌ If the next cell has a wall → No movement
3. ❌ If the next cell has another box → No movement (can't push two boxes)

### Win Condition
Level completes when:
- All goal spots have boxes on them
- Number of boxes equals number of goals
- Victory overlay shows stats and options to replay or continue

## 📁 File Structure

```
sokoban/
├── index.html      # Main game page and UI structure
├── style.css       # All styling and responsive design
├── main.js         # Complete game engine and logic
├── levels.js       # Level definitions and data
└── README.md       # This file
```

## 🎨 Customization

### Adding Custom Levels

Edit `levels.js` and add new level objects to the `LEVELS` array:

```javascript
{
    name: "My Custom Level",
    map: [
        "#####",
        "#.@ #",
        "#$  #",
        "#####"
    ]
}
```

**Level Legend:**
- `#` = Wall
- `.` = Goal (target spot)
- ` ` = Floor (empty space)
- `$` = Box
- `@` = Player
- `*` = Box on goal (shorthand)
- `+` = Player on goal (shorthand)

### Adjusting Tile Size

In `main.js`, modify the `TILE_SIZE` constant:

```javascript
const TILE_SIZE = 64; // Default: 64 pixels
```

The game automatically scales tiles to fit the canvas while maintaining aspect ratio.

### Changing Colors

Edit `style.css` or modify the rendering functions in `main.js`:

- **Walls**: `drawTile()` → TILE_TYPES.WALL
- **Boxes**: `drawBox()` function
- **Player**: `drawPlayer()` function
- **Goals**: `drawTile()` → TILE_TYPES.GOAL

### Adding Custom Sprites

To use custom PNG sprites instead of procedural rendering:

1. Create an `assets/` folder
2. Add sprite images (player.png, box.png, wall.png, etc.)
3. Modify the `drawTile()`, `drawBox()`, and `drawPlayer()` functions in `main.js`
4. Use `ctx.drawImage()` instead of `ctx.fillRect()`

Example:
```javascript
const sprites = {
    player: new Image(),
    box: new Image(),
    // ... load other sprites
};

sprites.player.src = 'assets/player.png';

function drawPlayer(x, y) {
    ctx.drawImage(sprites.player, x, y, actualTileSize, actualTileSize);
}
```

## ✅ Testing Checklist

The following scenarios have been tested and validated:

- [x] **Move into empty tile**: Player moves successfully
- [x] **Move into wall**: Movement blocked, player stays in place
- [x] **Push single box with space beyond**: Box and player both move
- [x] **Push box into wall**: Movement blocked
- [x] **Push box into another box**: Movement blocked (no chain pushing)
- [x] **All goals filled**: Win overlay appears
- [x] **Reset level**: Returns to initial state
- [x] **Undo move**: Reverts to previous state (including push count)
- [x] **Level progression**: Advances through all levels
- [x] **Keyboard controls**: All keys (arrows, WASD, shortcuts) work
- [x] **Box on goal visual**: Boxes turn green when on goals
- [x] **Stats tracking**: Move and push counters update correctly

## 🔧 Technical Details

### Architecture

The game uses a clean separation of concerns:

1. **State Management**: Pure game state (player position, boxes, counters)
2. **Level Parsing**: Converts text-based levels to grid representation
3. **Game Logic**: Handles movement, collision, and win detection
4. **Rendering**: Canvas-based drawing with procedural graphics
5. **History System**: Stack-based undo with state snapshots

### Performance

- Efficient collision detection using array lookups
- History limited to 100 moves to prevent memory issues
- Smooth 60fps rendering using canvas
- Minimal reflows with cached tile calculations

### Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6+ JavaScript (let/const, arrow functions, template literals)
- CSS Grid and Flexbox

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Known Limitations

- No mobile touch/swipe controls (keyboard only)
- No level editor UI (must edit levels.js manually)
- No sound effects or music
- Maximum 100-move undo history

## 📝 License

Free to use, modify, and distribute. No attribution required.

## 🎓 Learning Resources

To understand Sokoban puzzle design:
- [Sokoban Wiki](http://www.sokobano.de/wiki/)
- [Level Design Guidelines](http://www.sneezingtiger.com/sokoban/levels.html)

---

**Made with vanilla JavaScript** - No frameworks, no build tools, just pure web fundamentals! 🚀
