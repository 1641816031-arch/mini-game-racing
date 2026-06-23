const { useState, useEffect } = React;

function generateBoard(size) {
  let board = Array.from({ length: size }, () => Array(size).fill(false));
  const steps = Math.floor(size * size * 0.5 + Math.random() * size * 2);
  for (let i = 0; i < steps; i++) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    toggleAt(board, r, c, size);
  }
  return board;
}

function toggleAt(board, r, c, size) {
  board[r][c] = !board[r][c];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
      board[nr][nc] = !board[nr][nc];
    }
  }
}

function isAllOff(board) {
  return board.every(row => row.every(cell => !cell));
}

export default function LightsOut({ difficulty = 0.5, onComplete, onFail }) {
  const size = Math.floor(3 + difficulty * 3);

  const [board, setBoard] = useState(() => generateBoard(size));
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  function clickCell(r, c) {
    if (gameOver) return;

    const newBoard = board.map(row => [...row]);
    toggleAt(newBoard, r, c, size);
    setBoard(newBoard);
    setMoves(m => m + 1);

    if (isAllOff(newBoard)) {
      setHasWon(true);
      setGameOver(true);
      onComplete && onComplete();
    }
  }

  return React.createElement('div', null,
    React.createElement('div', null, `步数：${moves} | 目标：熄灭所有灯`),
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 50px)`,
        gap: 4,
        marginTop: 12
      }
    },
      board.map((row, r) =>
        row.map((on, c) =>
          React.createElement('div', {
            key: `${r}-${c}`,
            onClick: () => clickCell(r, c),
            style: {
              width: 50,
              height: 50,
              borderRadius: 8,
              background: on ? '#fbbf24' : '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: on ? '0 0 10px #fbbf24' : 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }
          })
        )
      )
    ),
    hasWon && React.createElement('div', { style: { color: 'green', marginTop: 10 } }, '✅ 通关！')
  );
}

export const meta = { name: '关灯游戏', component: LightsOut, controlType: "none" };
