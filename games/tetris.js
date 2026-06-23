const { useState, useEffect, useRef } = React;

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]]
];

const COLORS = ['#06b6d4', '#eab308', '#a855f7', '#f97316', '#3b82f6', '#22c55e', '#ef4444'];

function rotate(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const res = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      res[c][rows - 1 - r] = shape[r][c];
    }
  }
  return res;
}

export default function Tetris({ difficulty = 0.5, onComplete, onFail }) {
  const target = Math.floor(5 + difficulty * 15);
  const dropInterval = Math.max(150, 1000 - difficulty * 800);

  const canvasRef = useRef();
  const animRef = useRef();
  const gameOverRef = useRef(false);

  const W = 10, H = 20, CS = 24;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = W * CS;
    canvas.height = H * CS;

    let board = Array.from({ length: H }, () => Array(W).fill(0));
    let lines = 0;
    let current = null;
    let currentX = 0, currentY = 0, currentColor = 0;
    let lastDrop = 0;

    function newPiece() {
      const type = Math.floor(Math.random() * SHAPES.length);
      current = SHAPES[type].map(r => [...r]);
      currentColor = type + 1;
      currentX = Math.floor((W - current[0].length) / 2);
      currentY = 0;

      if (collision(current, currentX, currentY)) {
        gameOverRef.current = true;
        onFail && onFail();
        return false;
      }
      return true;
    }

    function collision(shape, x, y) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const nx = x + c, ny = y + r;
            if (nx < 0 || nx >= W || ny >= H) return true;
            if (ny >= 0 && board[ny][nx]) return true;
          }
        }
      }
      return false;
    }

    function lock() {
      for (let r = 0; r < current.length; r++) {
        for (let c = 0; c < current[r].length; c++) {
          if (current[r][c]) {
            board[currentY + r][currentX + c] = currentColor;
          }
        }
      }
      let cleared = 0;
      for (let r = H - 1; r >= 0; r--) {
        if (board[r].every(v => v !== 0)) {
          board.splice(r, 1);
          board.unshift(Array(W).fill(0));
          cleared++;
          r++;
        }
      }
      lines += cleared;
      if (lines >= target) {
        gameOverRef.current = true;
        onComplete && onComplete();
        return;
      }
      newPiece();
    }

    function move(dx, dy) {
      if (!current) return;
      if (!collision(current, currentX + dx, currentY + dy)) {
        currentX += dx;
        currentY += dy;
        return true;
      }
      if (dy > 0) lock();
      return false;
    }

    function rotatePiece() {
      if (!current) return;
      const rotated = rotate(current);
      let kicks = [0, -1, 1, -2, 2];
      for (let k of kicks) {
        if (!collision(rotated, currentX + k, currentY)) {
          current = rotated;
          currentX += k;
          return;
        }
      }
    }

    canvas._controls = { move, rotatePiece };

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x++) {
        ctx.beginPath(); ctx.moveTo(x * CS, 0); ctx.lineTo(x * CS, H * CS); ctx.stroke();
      }
      for (let y = 0; y <= H; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CS); ctx.lineTo(W * CS, y * CS); ctx.stroke();
      }

      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W; c++) {
          if (board[r][c]) {
            ctx.fillStyle = COLORS[board[r][c] - 1];
            ctx.fillRect(c * CS + 1, r * CS + 1, CS - 2, CS - 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.strokeRect(c * CS + 1, r * CS + 1, CS - 2, CS - 2);
          }
        }
      }

      if (current) {
        ctx.fillStyle = COLORS[currentColor - 1];
        for (let r = 0; r < current.length; r++) {
          for (let c = 0; c < current[r].length; c++) {
            if (current[r][c]) {
              ctx.fillRect((currentX + c) * CS + 1, (currentY + r) * CS + 1, CS - 2, CS - 2);
              ctx.strokeStyle = 'rgba(0,0,0,0.2)';
              ctx.strokeRect((currentX + c) * CS + 1, (currentY + r) * CS + 1, CS - 2, CS - 2);
            }
          }
        }
      }

      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`消除：${lines}/${target}`, 4, 18);
    }

    function loop(timestamp) {
      if (gameOverRef.current) return;
      if (!current) newPiece();

      if (timestamp - lastDrop > dropInterval) {
        move(0, 1);
        lastDrop = timestamp;
      }

      draw();
      animRef.current = requestAnimationFrame(loop);
    }

    newPiece();
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty]);

  useEffect(() => {
    function handle(e) {
      if (!canvasRef.current || !canvasRef.current._controls) return;
      const { move, rotatePiece } = canvasRef.current._controls;
      switch (e.key) {
        case 'ArrowLeft': case 'a': e.preventDefault(); move(-1, 0); break;
        case 'ArrowRight': case 'd': e.preventDefault(); move(1, 0); break;
        case 'ArrowDown': case 's': e.preventDefault(); move(0, 1); break;
        case 'ArrowUp': case 'w': case ' ': e.preventDefault(); rotatePiece(); break;
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return React.createElement('div', null,
    React.createElement('div', null, `消除 ${target} 行通关`),
    React.createElement('canvas', {
      ref: canvasRef,
      style: { border: '1px solid #ddd', borderRadius: 8 }
    })
  );
}

export const meta = { name: '俄罗斯方块', component: Tetris, controlType: "direction" };
