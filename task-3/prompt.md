1-Create a multi-player game where multiple players press a button on their keyboard. The player with the most taps in a 15 second sprint wins. Ensure that the game is able to accurately represent the start time for users in different geographic locations and that the game is fair to all players. As before explain your code. i want two prompts one for generating the ui and the other for backend
2-to cursor
Title: Multiplayer Tap Sprint Game – Backend Service
Description (Paste this in your backend AI tool or environment):

Build a multiplayer tap sprint backend that supports multiple users tapping a button as fast as they can within 15 seconds. The player with the most taps wins.

Functional Requirements:

Use Express.js with WebSocket (Socket.io) for real-time updates.

Maintain an in-memory game state (no database needed).

Players can join a game session before it starts.

When all players are ready, the server synchronizes the start time by broadcasting a universal start signal with a precise timestamp (Date.now() from the server).

Clients must use this timestamp to begin their local countdown — not their local time — ensuring fairness across geographic locations.

Each client sends tap events to the server during the 15-second window.

The server counts taps per player, ensures no taps are accepted after the window closes, and determines the winner.

When time’s up, broadcast results to all clients with player scores and winner name.

Endpoints / Events:

join_game(username) → joins a room and returns player ID.

start_game() → server triggers countdown and sends synchronized start time to all players.

tap() → client sends each tap; server counts it if within 15s window.

game_results → broadcasted after game ends.

Fairness Consideration:

All timing logic (start time and end time) must be server-authoritative.

Clients only send tap actions; they never decide timing locally.

Bonus:

Add a /leaderboard endpoint showing the top scores of recent games (kept in memory).

Deliverables:

server.js (main backend file)

Explanation of how time synchronization ensures fairness across locations.

3-generate a documentation for this bakcend service to be used in front end develeopment

4- use generated documentation to generate front-end that intract with backend
