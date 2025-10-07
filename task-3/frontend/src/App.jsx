import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:3001'

function useSocket() {
	const socketRef = useRef(null)
	if (!socketRef.current) {
		socketRef.current = io(SOCKET_URL, { transports: ['websocket'] })
	}
	return socketRef.current
}

function JoinScreen({ onJoin }) {
	const [username, setUsername] = useState('')
	const [gameId, setGameId] = useState('')
	return (
		<div className="screen join">
			<h1>Tap Sprint</h1>
			<input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
			<input placeholder="Game ID (optional)" value={gameId} onChange={(e) => setGameId(e.target.value)} />
			<button className="primary" onClick={() => onJoin(username.trim(), gameId.trim() || 'default')}>Join Game</button>
		</div>
	)
}

function LobbyScreen({ players, onStart }) {
	return (
		<div className="screen lobby">
			<h2>Lobby</h2>
			<p>Waiting for others… Anyone can start.</p>
			<ul className="players">
				{players.map((p) => (
					<li key={p.playerId}>{p.username}</li>
				))}
			</ul>
			<button className="primary" onClick={onStart}>Start Game</button>
		</div>
	)
}

function GameScreen({ timerMs, canTap, onTap, scoreboard }) {
	return (
		<div className="screen game">
			<h2>Go!</h2>
			<div className="timer">{(timerMs / 1000).toFixed(2)}s</div>
			<button disabled={!canTap} className={`tap ${canTap ? '' : 'disabled'}`} onClick={onTap}>TAP!</button>
			<div className="scoreboard">
				<h3>Live Scores</h3>
				<ul>
					{scoreboard.map((s) => (
						<li key={s.playerId}><span>{s.username}</span><b>{s.taps}</b></li>
					))}
				</ul>
			</div>
		</div>
	)
}

function ResultsScreen({ scores, winner, onBack }) {
	return (
		<div className="screen results">
			<h2>Results</h2>
			{winner ? <div className="winner">Winner: <b>{winner.username}</b> ({winner.taps})</div> : null}
			<ul className="scores">
				{scores.map((s) => (
					<li key={s.playerId}><span>{s.username}</span><b>{s.taps}</b></li>
				))}
			</ul>
			<button className="primary" onClick={onBack}>Play Again</button>
		</div>
	)
}

export default function App() {
	const socket = useSocket()
	const [phase, setPhase] = useState('join') // 'join' | 'lobby' | 'game' | 'results'
	const [players, setPlayers] = useState([])
	const [myPlayerId, setMyPlayerId] = useState('')
	const [gameId, setGameId] = useState('default')
	const [timerMs, setTimerMs] = useState(0)
	const [scores, setScores] = useState([])
	const [winner, setWinner] = useState(null)
	const startTimeRef = useRef(null)
	const endTimeRef = useRef(null)
	const tickIntervalRef = useRef(null)
	const liveTapsRef = useRef(new Map())

	// Socket event handlers
	useEffect(() => {
		function onLobbyUpdate(data) {
			setPlayers(data.players || [])
		}
		function onGameStart(data) {
			startTimeRef.current = data.startTime
			endTimeRef.current = data.startTime + data.durationMs
			setPhase('game')
			// start a high-frequency interval based on server times
			clearInterval(tickIntervalRef.current)
			tickIntervalRef.current = setInterval(() => {
				const now = Date.now()
				const msLeft = Math.max(0, endTimeRef.current - now)
				setTimerMs(msLeft)
				if (msLeft <= 0) {
					clearInterval(tickIntervalRef.current)
				}
			}, 50)
			// reset live taps
			liveTapsRef.current = new Map()
		}
		function onTapUpdate(data) {
			liveTapsRef.current.set(data.playerId, data)
			const arr = Array.from(liveTapsRef.current.values())
			// merge usernames from players list
			const merged = arr.map(x => ({ playerId: x.playerId, username: (players.find(p => p.playerId === x.playerId)?.username) || x.username || 'Player', taps: x.taps }))
			// stable sort desc taps
			merged.sort((a, b) => b.taps - a.taps)
			setScores(merged)
		}
		function onGameResults(data) {
			setScores(data.scores || [])
			setWinner(data.winner || null)
			setPhase('results')
		}

		socket.on('lobby_update', onLobbyUpdate)
		socket.on('game_start', onGameStart)
		socket.on('tap_update', onTapUpdate)
		socket.on('game_results', onGameResults)
		return () => {
			socket.off('lobby_update', onLobbyUpdate)
			socket.off('game_start', onGameStart)
			socket.off('tap_update', onTapUpdate)
			socket.off('game_results', onGameResults)
		}
	}, [socket, players])

	function handleJoin(username, gid) {
		if (!username) return
		socket.emit('join_game', { username, gameId: gid }, (res) => {
			if (res?.ok) {
				setGameId(res.gameId)
				setMyPlayerId(res.playerId)
				setPhase('lobby')
			}
		})
	}

	function handleStart() {
		socket.emit('start_game', { gameId })
	}

	const canTap = useMemo(() => {
		const now = Date.now()
		return phase === 'game' && startTimeRef.current != null && endTimeRef.current != null && now >= startTimeRef.current && now <= endTimeRef.current
	}, [phase, timerMs])

	function handleTap() {
		if (!canTap) return
		socket.emit('tap', { gameId, playerId: myPlayerId })
	}

	function handleBackToLobby() {
		setPhase('lobby')
		setScores([])
		setWinner(null)
		setTimerMs(0)
	}

	return (
		<div className="app">
			{phase === 'join' && <JoinScreen onJoin={handleJoin} />}
			{phase === 'lobby' && <LobbyScreen players={players} onStart={handleStart} />}
			{phase === 'game' && <GameScreen timerMs={timerMs} canTap={canTap} onTap={handleTap} scoreboard={scores} />}
			{phase === 'results' && <ResultsScreen scores={scores} winner={winner} onBack={handleBackToLobby} />}
		</div>
	)
}


