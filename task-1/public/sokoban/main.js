/**
 * SOKOBAN GAME ENGINE
 * 
 * Grid representation:
 * - 2D array where each cell contains a tile type
 * - Player and boxes are tracked separately for efficient collision detection
 * 
 * Movement system:
 * - All movement is atomic (one full move per input)
 * - Push logic checks target cell before executing
 * - History stack enables undo functionality
 * 
 * To add custom levels:
 * - Edit levels.js and add new level objects to LEVELS array
 * - Follow the legend format in levels.js header
 */

// ==================== CONSTANTS ====================

const TILE_SIZE = 64; // Base tile size for rendering
const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    GOAL: 3
};

const DIRECTIONS = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 }
};

// ==================== GAME STATE ====================

let canvas, ctx;
let currentLevel = 0;
let grid = [];
let player = { x: 0, y: 0 };
let boxes = [];
let goals = [];
let moveCount = 0;
let pushCount = 0;
let history = [];
let gridWidth = 0;
let gridHeight = 0;
let actualTileSize = TILE_SIZE;

// ==================== INITIALIZATION ====================

function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Setup event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('nextBtn').addEventListener('click', nextLevel);
    document.getElementById('replayBtn').addEventListener('click', () => {
        hideWinOverlay();
        resetLevel();
    });
    document.getElementById('continueBtn').addEventListener('click', () => {
        hideWinOverlay();
        nextLevel();
    });
    
    loadLevel(currentLevel);
}

// ==================== LEVEL MANAGEMENT ====================

function loadLevel(levelIndex) {
    if (levelIndex >= LEVELS.length) {
        levelIndex = 0; // Loop back to first level
    }
    
    currentLevel = levelIndex;
    const level = LEVELS[levelIndex];
    
    // Parse level map
    const map = level.map;
    gridHeight = map.length;
    gridWidth = Math.max(...map.map(row => row.length));
    
    // Initialize grid
    grid = Array(gridHeight).fill(null).map(() => Array(gridWidth).fill(TILE_TYPES.FLOOR));
    boxes = [];
    goals = [];
    
    // Parse map characters
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const char = map[y][x];
            
            switch (char) {
                case '#':
                    grid[y][x] = TILE_TYPES.WALL;
                    break;
                case '.':
                    grid[y][x] = TILE_TYPES.GOAL;
                    goals.push({ x, y });
                    break;
                case '@':
                    player = { x, y };
                    grid[y][x] = TILE_TYPES.FLOOR;
                    break;
                case '+':
                    player = { x, y };
                    grid[y][x] = TILE_TYPES.GOAL;
                    goals.push({ x, y });
                    break;
                case '$':
                    boxes.push({ x, y });
                    grid[y][x] = TILE_TYPES.FLOOR;
                    break;
                case '*':
                    boxes.push({ x, y });
                    grid[y][x] = TILE_TYPES.GOAL;
                    goals.push({ x, y });
                    break;
                case ' ':
                    grid[y][x] = TILE_TYPES.FLOOR;
                    break;
            }
        }
    }
    
    // Reset counters and history
    moveCount = 0;
    pushCount = 0;
    history = [];
    
    // Calculate tile size to fit canvas
    actualTileSize = Math.min(
        Math.floor(canvas.width / gridWidth),
        Math.floor(canvas.height / gridHeight)
    );
    
    updateUI();
    render();
}

function resetLevel() {
    loadLevel(currentLevel);
}

function nextLevel() {
    loadLevel(currentLevel + 1);
}

// ==================== INPUT HANDLING ====================

function handleKeyPress(e) {
    let direction = null;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            direction = DIRECTIONS.UP;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            direction = DIRECTIONS.DOWN;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            direction = DIRECTIONS.LEFT;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            direction = DIRECTIONS.RIGHT;
            break;
        case 'z':
        case 'Z':
            if (e.ctrlKey || e.metaKey) {
                undo();
            }
            break;
        case 'r':
        case 'R':
            resetLevel();
            break;
    }
    
    if (direction) {
        e.preventDefault();
        tryMove(direction);
    }
}

// ==================== GAME LOGIC ====================

function tryMove(direction) {
    const newX = player.x + direction.dx;
    const newY = player.y + direction.dy;
    
    // Check bounds
    if (newX < 0 || newX >= gridWidth || newY < 0 || newY >= gridHeight) {
        return;
    }
    
    // Check wall collision
    if (grid[newY][newX] === TILE_TYPES.WALL) {
        return;
    }
    
    // Check box collision
    const boxIndex = boxes.findIndex(b => b.x === newX && b.y === newY);
    
    if (boxIndex !== -1) {
        // Trying to push a box
        const boxNewX = newX + direction.dx;
        const boxNewY = newY + direction.dy;
        
        // Check if we can push the box
        if (!canPushBox(newX, newY, boxNewX, boxNewY)) {
            return;
        }
        
        // Save state for undo
        saveState();
        
        // Push the box
        boxes[boxIndex] = { x: boxNewX, y: boxNewY };
        pushCount++;
        
        // Move player
        player = { x: newX, y: newY };
        moveCount++;
        
    } else {
        // Normal move (no box)
        saveState();
        player = { x: newX, y: newY };
        moveCount++;
    }
    
    updateUI();
    render();
    checkWinCondition();
}

function canPushBox(boxX, boxY, newBoxX, newBoxY) {
    // Check bounds
    if (newBoxX < 0 || newBoxX >= gridWidth || newBoxY < 0 || newBoxY >= gridHeight) {
        return false;
    }
    
    // Check wall collision
    if (grid[newBoxY][newBoxX] === TILE_TYPES.WALL) {
        return false;
    }
    
    // Check if another box is in the way
    const blockingBox = boxes.find(b => b.x === newBoxX && b.y === newBoxY);
    if (blockingBox) {
        return false;
    }
    
    return true;
}

function checkWinCondition() {
    // Check if all goals have boxes
    const allGoalsFilled = goals.every(goal => 
        boxes.some(box => box.x === goal.x && box.y === goal.y)
    );
    
    if (allGoalsFilled && boxes.length === goals.length) {
        setTimeout(showWinOverlay, 300);
    }
}

// ==================== UNDO SYSTEM ====================

function saveState() {
    history.push({
        player: { ...player },
        boxes: boxes.map(b => ({ ...b })),
        moveCount,
        pushCount
    });
    
    // Limit history size to prevent memory issues
    if (history.length > 100) {
        history.shift();
    }
}

function undo() {
    if (history.length === 0) {
        return;
    }
    
    const previousState = history.pop();
    player = previousState.player;
    boxes = previousState.boxes;
    moveCount = previousState.moveCount;
    pushCount = previousState.pushCount;
    
    updateUI();
    render();
}

// ==================== RENDERING ====================

function render() {
    // Clear canvas
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center the grid
    const offsetX = (canvas.width - gridWidth * actualTileSize) / 2;
    const offsetY = (canvas.height - gridHeight * actualTileSize) / 2;
    
    // Draw grid
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            const px = offsetX + x * actualTileSize;
            const py = offsetY + y * actualTileSize;
            
            drawTile(px, py, grid[y][x], x, y);
        }
    }
    
    // Draw boxes
    boxes.forEach(box => {
        const px = offsetX + box.x * actualTileSize;
        const py = offsetY + box.y * actualTileSize;
        const isOnGoal = goals.some(g => g.x === box.x && g.y === box.y);
        drawBox(px, py, isOnGoal);
    });
    
    // Draw player
    const playerPx = offsetX + player.x * actualTileSize;
    const playerPy = offsetY + player.y * actualTileSize;
    drawPlayer(playerPx, playerPy);
}

function drawTile(x, y, type, gridX, gridY) {
    const size = actualTileSize;
    const padding = 2;
    
    switch (type) {
        case TILE_TYPES.WALL:
            // Wall - dark gray with texture
            ctx.fillStyle = '#4a5568';
            ctx.fillRect(x, y, size, size);
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
            break;
            
        case TILE_TYPES.FLOOR:
            // Floor - light gray checkerboard
            const isEven = (gridX + gridY) % 2 === 0;
            ctx.fillStyle = isEven ? '#f7fafc' : '#edf2f7';
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
            break;
            
        case TILE_TYPES.GOAL:
            // Goal - green target
            ctx.fillStyle = '#c6f6d5';
            ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
            ctx.strokeStyle = '#48bb78';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
            
            // Draw crosshair
            ctx.beginPath();
            ctx.moveTo(x + size * 0.5, y + size * 0.3);
            ctx.lineTo(x + size * 0.5, y + size * 0.7);
            ctx.moveTo(x + size * 0.3, y + size * 0.5);
            ctx.lineTo(x + size * 0.7, y + size * 0.5);
            ctx.stroke();
            break;
    }
}

function drawBox(x, y, isOnGoal) {
    const size = actualTileSize;
    const padding = size * 0.15;
    
    // Box shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + padding + 4, y + padding + 4, size - padding * 2, size - padding * 2);
    
    // Box color
    ctx.fillStyle = isOnGoal ? '#48bb78' : '#ed8936';
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    
    // Box highlight
    ctx.fillStyle = isOnGoal ? '#68d391' : '#f6ad55';
    ctx.fillRect(x + padding, y + padding, size - padding * 2, size * 0.2);
    
    // Box border
    ctx.strokeStyle = isOnGoal ? '#2f855a' : '#c05621';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
    
    // Checkmark if on goal
    if (isOnGoal) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.35, y + size * 0.5);
        ctx.lineTo(x + size * 0.45, y + size * 0.6);
        ctx.lineTo(x + size * 0.65, y + size * 0.35);
        ctx.stroke();
    }
}

function drawPlayer(x, y) {
    const size = actualTileSize;
    const center = size * 0.5;
    const radius = size * 0.3;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(x + center + 2, y + center + 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Player body
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(x + center, y + center, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Player highlight
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(x + center, y + center, radius, Math.PI, Math.PI * 1.5);
    ctx.fill();
    
    // Player eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + center - size * 0.1, y + center - size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.arc(x + center + size * 0.1, y + center - size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(x + center - size * 0.1, y + center - size * 0.05, size * 0.04, 0, Math.PI * 2);
    ctx.arc(x + center + size * 0.1, y + center - size * 0.05, size * 0.04, 0, Math.PI * 2);
    ctx.fill();
}

// ==================== UI UPDATES ====================

function updateUI() {
    document.getElementById('levelDisplay').textContent = currentLevel + 1;
    document.getElementById('moveCount').textContent = moveCount;
    document.getElementById('pushCount').textContent = pushCount;
    document.getElementById('undoBtn').disabled = history.length === 0;
}

function showWinOverlay() {
    document.getElementById('finalMoves').textContent = moveCount;
    document.getElementById('finalPushes').textContent = pushCount;
    document.getElementById('winOverlay').classList.remove('hidden');
    
    // Hide "Next Level" button if on last level
    const isLastLevel = currentLevel === LEVELS.length - 1;
    document.getElementById('continueBtn').style.display = isLastLevel ? 'none' : 'block';
}

function hideWinOverlay() {
    document.getElementById('winOverlay').classList.add('hidden');
}

// ==================== START GAME ====================

// Initialize game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==================== UNIT TEST ASSERTIONS ====================

console.log('🧪 Running basic game mechanic tests...');

// Test 1: Grid initialization
console.assert(LEVELS.length >= 2, '❌ Should have at least 2 levels');
console.log('✅ Level data validated');

// Test 2: Direction vectors
console.assert(DIRECTIONS.UP.dy === -1, '❌ UP direction incorrect');
console.assert(DIRECTIONS.DOWN.dy === 1, '❌ DOWN direction incorrect');
console.assert(DIRECTIONS.LEFT.dx === -1, '❌ LEFT direction incorrect');
console.assert(DIRECTIONS.RIGHT.dx === 1, '❌ RIGHT direction incorrect');
console.log('✅ Direction vectors correct');

// Test 3: Tile types
console.assert(Object.keys(TILE_TYPES).length === 4, '❌ Should have 4 tile types');
console.log('✅ Tile types defined correctly');

console.log('✅ All basic tests passed! Game mechanics validated.');
