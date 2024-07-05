// Wrap everything in a function
function initChessClock() {
  const { useState, useEffect, useRef } = React;

  const ChessClock = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [playerCount, setPlayerCount] = useState(2);
    const [initialTime, setInitialTime] = useState(300); // 5 minutes in seconds
    const [players, setPlayers] = useState([]);
    const [activePlayerIndex, setActivePlayerIndex] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [editingName, setEditingName] = useState(null);

    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'pink'];
    const audioRef = useRef(null);

    useEffect(() => {
      setPlayers((prevPlayers) => {
        const newPlayers = Array.from({ length: playerCount }, (_, index) => {
          const existingPlayer = prevPlayers[index];
          return {
            name: existingPlayer ? existingPlayer.name : `Player ${index + 1}`,
            time: initialTime,
            color: colors[index % colors.length],
            isActive: true,
          };
        });
        return newPlayers;
      });
    }, [playerCount, initialTime]);

    useEffect(() => {
      let interval;
      if (activePlayerIndex !== null && !isPaused) {
        interval = setInterval(() => {
          setPlayers((prevPlayers) => {
            const updatedPlayers = [...prevPlayers];
            if (updatedPlayers[activePlayerIndex].time > 0) {
              updatedPlayers[activePlayerIndex].time -= 1;
              if (updatedPlayers[activePlayerIndex].time === 0) {
                updatedPlayers[activePlayerIndex].isActive = false;
                if (audioRef.current) audioRef.current.play();
                setIsPaused(true);
                if (updatedPlayers.filter(p => p.isActive).length === 1) {
                  setGameOver(true);
                } else {
                  switchToNextActivePlayer(updatedPlayers, activePlayerIndex);
                }
              }
            }
            return updatedPlayers;
          });
        }, 1000);
      }
      return () => clearInterval(interval);
    }, [activePlayerIndex, isPaused]);

    useEffect(() => {
      const handleKeyPress = (event) => {
        if (event.code === 'Space' && gameStarted && !gameOver && !isPaused) {
          event.preventDefault(); // Prevent scrolling
          switchPlayer(activePlayerIndex);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }, [gameStarted, gameOver, isPaused, activePlayerIndex]);

    const switchToNextActivePlayer = (players, currentIndex) => {
      let nextIndex = (currentIndex + 1) % playerCount;
      while (!players[nextIndex].isActive && nextIndex !== currentIndex) {
        nextIndex = (nextIndex + 1) % playerCount;
      }
      setActivePlayerIndex(nextIndex);
    };

    const startGame = () => {
      setActivePlayerIndex(0);
      setGameStarted(true);
      setGameOver(false);
      setIsPaused(false);
    };

    const switchPlayer = (currentIndex) => {
      if (isPaused) return;
      switchToNextActivePlayer(players, currentIndex);
    };

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleNameChange = (index, newName) => {
      setPlayers((prevPlayers) => {
        const updatedPlayers = [...prevPlayers];
        updatedPlayers[index].name = newName;
        return updatedPlayers;
      });
    };

    const togglePause = () => {
      setIsPaused(!isPaused);
    };

    const restartGame = () => {
      setPlayers(players.map(player => ({ ...player, time: initialTime, isActive: true })));
      setActivePlayerIndex(0);
      setGameOver(false);
      setIsPaused(false);
      setGameStarted(false);
    };

    return (
      React.createElement('div', { className: "chess-clock" },
        React.createElement('h1', null, "Multi-Player Chess Clock"),
        !gameStarted && React.createElement('div', { className: "setup" },
          React.createElement('div', null,
            React.createElement('label', null, "Players"),
            React.createElement('input', {
              type: "number",
              min: "2",
              max: "6",
              value: playerCount,
              onChange: (e) => setPlayerCount(Math.max(2, Math.min(6, Number(e.target.value)))),
              disabled: gameStarted
            })
          ),
          React.createElement('div', null,
            React.createElement('label', null, "Initial Time (s)"),
            React.createElement('input', {
              type: "number",
              value: initialTime,
              onChange: (e) => setInitialTime(Number(e.target.value)),
              disabled: gameStarted
            })
          )
        ),
        React.createElement('div', { className: "players-grid" },
          players.map((player, index) => 
            React.createElement('div', { key: index, className: "player" },
              React.createElement('div', { className: "timer", style: { color: player.color } },
                formatTime(player.time)
              ),
              editingName === index ?
                React.createElement('div', { className: "name-edit" },
                  React.createElement('input', {
                    type: "text",
                    value: player.name,
                    onChange: (e) => handleNameChange(index, e.target.value),
                    onBlur: () => setEditingName(null),
                    onKeyPress: (e) => e.key === 'Enter' && setEditingName(null),
                    autoFocus: true
                  }),
                  React.createElement('button', { onClick: () => setEditingName(null) }, "Save")
                ) :
                React.createElement('div', { className: "player-button" },
                  React.createElement('button', {
                    onClick: () => gameStarted ? switchPlayer(index) : setEditingName(index),
                    disabled: (gameStarted && (activePlayerIndex !== index || isPaused || !player.isActive)) || gameOver,
                    style: {
                      backgroundColor: player.color,
                      opacity: (gameStarted && activePlayerIndex !== index) ? 0.5 : 1
                    }
                  }, player.name),
                  !gameStarted && React.createElement('button', {
                    onClick: () => setEditingName(index),
                    className: "edit-name"
                  }, "Edit Name")
                )
            )
          )
        ),
        React.createElement('div', { className: "controls" },
          !gameStarted ?
            React.createElement('button', { onClick: startGame }, "Start Game") :
            React.createElement(React.Fragment, null,
              React.createElement('button', { onClick: togglePause },
                isPaused ? "Resume" : "Pause"
              ),
              React.createElement('button', { onClick: restartGame }, "Restart Game")
            )
        ),
        gameOver && React.createElement('div', { className: "game-over" },
          `Game Over! ${players.find(p => p.isActive)?.name} wins!`
        ),
        React.createElement('audio', {
          ref: audioRef,
          src: "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3"
        })
      )
    );
  };

  // Render the app only when React and ReactDOM are available
  if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
    ReactDOM.render(React.createElement(ChessClock), document.getElementById('root'));
  } else {
    console.error('React or ReactDOM is not loaded');
  }
}

// Call the init function when the page has loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChessClock);
} else {
  initChessClock();
}
