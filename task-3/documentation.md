# Multiplayer Tap Sprint – Backend API Docs

This document describes how the frontend should interact with the backend service in `task-3/server.js` using Socket.io and HTTP.

## Overview
- **Transport**: Socket.io (WebSocket) for realtime events, Express HTTP for health and leaderboard.
- **Authoritative timing**: The server decides the start time and enforces the 15s tap window. Clients must use the emitted `startTime` from the server to begin their local countdowns.
- **Rooms**: Optional `gameId` to separate sessions. Defaults to `"default"` if omitted.

## Connection
```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
	transports: ['websocket'],
});

socket.on('connect', () => {
	console.log('connected', socket.id);
});
```

## Socket.io Events

### 1) join_game
- **Client → Server**: Join a game lobby and register a player.
- **Event**: `join_game`
- **Payload**:
```json
{
	"username": "Alice",
	"gameId": "room-123" // optional, defaults to "default"
}
```
- **Ack**:
```json
{
	"ok": true,
	"playerId": "player_xxx",
	"gameId": "room-123"
}
```
- **Server emits**: `lobby_update` to the room
```json
{
	"gameId": "room-123",
	"players": [ { "playerId": "player_xxx", "username": "Alice" } ]
}
```
- **Usage**:
```js
socket.emit('join_game', { username: 'Alice', gameId: 'room-123' }, (res) => {
	if (!res?.ok) return console.error('join failed', res?.error);
	// save res.playerId and res.gameId for later
});
```

### 2) start_game
- **Client → Server**: Request the server to start the game for a room. Typically called by the host/any player when ready.
- **Event**: `start_game`
- **Payload**:
```json
{
	"gameId": "room-123"
}
```
- **Ack**:
```json
{
	"ok": true,
	"gameId": "room-123",
	"startTime": 1730830000000,
	"durationMs": 15000
}
```
- **Server broadcasts**: `game_start` to the room
```json
{
	"gameId": "room-123",
	"startTime": 1730830000000,
	"durationMs": 15000
}
```
- **Client rule (fairness)**: Use `startTime` from server to begin local countdown; do not rely on local `Date.now()` to decide the window.

### 3) tap
- **Client → Server**: Send a tap event during the 15s window.
- **Event**: `tap`
- **Payload**:
```json
{
	"gameId": "room-123",
	"playerId": "player_xxx"
}
```
- **Server validates**: Accepts only when `Date.now()` is within `[startTime, endTime]` for that room.
- **Server emits (optional live update)**: `tap_update`
```json
{
	"gameId": "room-123",
	"playerId": "player_xxx",
	"taps": 42
}
```
- **Usage**:
```js
function sendTap(gameId, playerId) {
	// Typically call on button mousedown/touchstart
	socket.emit('tap', { gameId, playerId });
}
```

### 4) game_results
- **Server → Clients**: Emitted after the 15s window ends.
- **Event**: `game_results`
- **Payload**:
```json
{
	"gameId": "room-123",
	"startTime": 1730830000000,
	"endTime": 1730830015000,
	"durationMs": 15000,
	"scores": [
		{ "playerId": "player_xxx", "username": "Alice", "taps": 42 },
		{ "playerId": "player_yyy", "username": "Bob", "taps": 37 }
	],
	"winner": { "playerId": "player_xxx", "username": "Alice", "taps": 42 }
}
```
- **Usage**:
```js
socket.on('game_results', (data) => {
	// show leaderboard modal, reset UI, etc.
	console.log('results', data);
});
```

### 5) lobby_update
- **Server → Clients**: Emitted when players join/leave the lobby.
- **Event**: `lobby_update`
- **Payload**: see above in `join_game`.

## Recommended Client Flow
1. Connect socket.
2. `join_game` with a username (and optional `gameId`). Save `playerId` and `gameId`.
3. Display lobby via `lobby_update`.
4. When ready, call `start_game`. On `game_start`, use `startTime` and `durationMs` to start the local countdown.
5. During the window, send `tap` for each user tap.
6. On `game_results`, show scores and winner.

## HTTP Endpoints

### GET /health
- Response:
```json
{ "ok": true }
```

### GET /leaderboard
- Response:
```json
{
	"top": [
		{ "username": "Alice", "taps": 42, "gameId": "room-123", "timestamp": 1730830000000 }
	],
	"recentGames": [
		{
			"gameId": "room-123",
			"timestamp": 1730830000000,
			"winner": { "playerId": "player_xxx", "username": "Alice", "taps": 42 },
			"scores": [ { "playerId": "player_xxx", "username": "Alice", "taps": 42 } ]
		}
	]
}
```

## Example UI Snippets

### Start button handler
```js
async function onStart(gameId) {
	socket.emit('start_game', { gameId }, (res) => {
		if (!res?.ok) return console.error('start failed', res?.error);
		// Optionally reflect pending start state in UI
	});
}
```

### Timer sync using server startTime
```js
let countdownInterval;
socket.on('game_start', ({ startTime, durationMs, gameId }) => {
	const endTime = startTime + durationMs; // server authoritative
	clearInterval(countdownInterval);
	countdownInterval = setInterval(() => {
		const now = Date.now();
		const msLeft = Math.max(0, endTime - now);
		updateTimerUI(msLeft);
		if (msLeft === 0) clearInterval(countdownInterval);
	}, 50);
});
```

## Notes on Fairness
- The server broadcasts a universal `startTime` based on `Date.now()` from the server.
- The server counts taps only when its own time is within the valid window; late/early taps are ignored.
- This prevents clients with clock skew or varying latency from gaining extra time.

## Local Development
- Start server:
```bash
npm install
node server.js
```
- Default port: `3001`. Configure with `PORT` env var.

## Error Cases
- `join_game` may respond with `{ ok: false, error: 'username_required' | 'game_already_started' }`.
- `start_game` may respond with `{ ok: false, error: 'already_running' | 'no_players' }`.
- `tap` silently ignored when outside server window or for unknown player.
