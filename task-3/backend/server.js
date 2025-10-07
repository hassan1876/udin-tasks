const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Configuration
const PORT = process.env.PORT || 3001;
const TAP_WINDOW_MS = 15_000; // 15 seconds
const MAX_LEADERBOARD_GAMES = 50;

// In-memory state
// games: gameId -> {
//   status: 'lobby' | 'running' | 'ended',
//   players: Map<playerId, { playerId, username, socketId, taps }>,
//   startTime: number|null,
//   endTime: number|null,
//   timeoutHandle: NodeJS.Timeout|null
// }
const games = new Map();

// Keep recent finished games to build a leaderboard
// items: { gameId, timestamp, winner: { playerId, username, taps }, scores: [{ playerId, username, taps }] }
const recentGames = [];

function createGameIfMissing(gameId) {
  if (!games.has(gameId)) {
    games.set(gameId, {
      status: 'lobby',
      players: new Map(),
      startTime: null,
      endTime: null,
      timeoutHandle: null,
    });
  }
  return games.get(gameId);
}

function generateId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function computeResults(game) {
  const scores = Array.from(game.players.values())
    .map((p) => ({ playerId: p.playerId, username: p.username, taps: p.taps }))
    .sort((a, b) => b.taps - a.taps);
  const winner = scores[0] || null;
  return { scores, winner };
}

function recordGameToLeaderboard(gameId, game) {
  const { scores, winner } = computeResults(game);
  recentGames.push({
    gameId,
    timestamp: Date.now(),
    winner,
    scores,
  });
  if (recentGames.length > MAX_LEADERBOARD_GAMES) {
    recentGames.shift();
  }
}

function buildLeaderboardTopN(n = 10) {
  // Flatten all player scores across recent games and take best N
  const allScores = [];
  for (const g of recentGames) {
    for (const s of g.scores) {
      allScores.push({ username: s.username, taps: s.taps, gameId: g.gameId, timestamp: g.timestamp });
    }
  }
  allScores.sort((a, b) => b.taps - a.taps || a.timestamp - b.timestamp);
  return allScores.slice(0, n);
}

// Server setup
const app = express();
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Bonus: leaderboard endpoint (in-memory)
app.get('/leaderboard', (req, res) => {
  res.json({
    top: buildLeaderboardTopN(10),
    recentGames: recentGames.slice(-10),
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // join_game(username, gameId?) -> returns playerId
  socket.on('join_game', (payload = {}, ack) => {
    try {
      const username = String(payload.username || '').trim();
      const gameId = String(payload.gameId || 'default');
      if (!username) {
        if (typeof ack === 'function') ack({ ok: false, error: 'username_required' });
        return;
      }

      const game = createGameIfMissing(gameId);
      if (game.status !== 'lobby') {
        if (typeof ack === 'function') ack({ ok: false, error: 'game_already_started' });
        return;
      }

      const playerId = generateId('player');
      game.players.set(playerId, {
        playerId,
        username,
        socketId: socket.id,
        taps: 0,
      });
      socket.join(gameId);

      // Notify room of lobby update
      io.to(gameId).emit('lobby_update', {
        gameId,
        players: Array.from(game.players.values()).map((p) => ({ playerId: p.playerId, username: p.username })),
      });

      if (typeof ack === 'function') {
        ack({ ok: true, playerId, gameId });
      }
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: 'internal_error' });
    }
  });

  // start_game() -> server triggers countdown and sends synchronized start time
  socket.on('start_game', (payload = {}, ack) => {
    try {
      const gameId = String(payload.gameId || 'default');
      const game = createGameIfMissing(gameId);
      if (game.status === 'running') {
        if (typeof ack === 'function') ack({ ok: false, error: 'already_running' });
        return;
      }
      if (game.players.size === 0) {
        if (typeof ack === 'function') ack({ ok: false, error: 'no_players' });
        return;
      }

      // Reset all players' tap counts for a fresh round
      for (const p of game.players.values()) {
        p.taps = 0;
      }

      game.status = 'running';
      game.startTime = Date.now(); // authoritative server start time
      game.endTime = game.startTime + TAP_WINDOW_MS;

      // Broadcast universal start signal
      io.to(gameId).emit('game_start', {
        gameId,
        startTime: game.startTime,
        durationMs: TAP_WINDOW_MS,
      });

      // Schedule end of game
      if (game.timeoutHandle) {
        clearTimeout(game.timeoutHandle);
      }
      game.timeoutHandle = setTimeout(() => {
        // Stop accepting taps and compute results
        game.status = 'ended';
        const results = computeResults(game);
        io.to(gameId).emit('game_results', {
          gameId,
          startTime: game.startTime,
          endTime: game.endTime,
          durationMs: TAP_WINDOW_MS,
          scores: results.scores,
          winner: results.winner,
        });

        // Record to leaderboard
        recordGameToLeaderboard(gameId, game);
      }, TAP_WINDOW_MS + 5); // +5ms guard

      if (typeof ack === 'function') {
        ack({ ok: true, gameId, startTime: game.startTime, durationMs: TAP_WINDOW_MS });
      }
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: 'internal_error' });
    }
  });

  // tap() -> count if within window
  socket.on('tap', (payload = {}) => {
    try {
      const gameId = String(payload.gameId || 'default');
      const playerId = String(payload.playerId || '');
      const game = games.get(gameId);
      if (!game) return;
      if (game.status !== 'running') return; // Only count during running state
      const now = Date.now();
      if (game.startTime == null || game.endTime == null) return;
      if (now < game.startTime || now > game.endTime) return; // Server-authoritative timing

      const player = game.players.get(playerId);
      if (!player) return;
      if (player.socketId !== socket.id) return; // basic sanity check

      player.taps += 1;

      // Optional live updates (throttled by client usually). Keep it simple and emit per tap.
      io.to(gameId).emit('tap_update', {
        gameId,
        playerId,
        taps: player.taps,
      });
    } catch (_) {
      // no-op
    }
  });

  socket.on('disconnect', () => {
    // Remove player from any game they were part of
    for (const [gameId, game] of games) {
      let removed = null;
      for (const [pid, p] of game.players) {
        if (p.socketId === socket.id) {
          removed = pid;
          break;
        }
      }
      if (removed) {
        game.players.delete(removed);
        io.to(gameId).emit('lobby_update', {
          gameId,
          players: Array.from(game.players.values()).map((p) => ({ playerId: p.playerId, username: p.username })),
        });
      }
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Tap Sprint backend listening on port ${PORT}`);
});


