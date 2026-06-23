const { useState, useEffect } = React;

/* ===== 工具 ===== */

function clone(board) {
  return board.map(row => [...row]);
}

function addRandom(board) {
  let empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) empty.push([r, c]);
    }
  }
  if (!empty.length) return board;

  let [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return board;
}

/* ===== 移动逻辑 ===== */

function slide(row) {
  let arr = row.filter(v => v);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      arr[i + 1] = 0;
    }
  }
  arr = arr.filter(v => v);
  while (arr.length < 4) arr.push(0);
  return arr;
}

function move(board, dir) {
  let moved = false;
  let newBoard = clone(board);

  for (let i = 0; i < 4; i++) {
    let row = [];

    for (let j = 0; j < 4; j++) {
      if (dir === 0) row.push(newBoard[j][i]);       // 上
      if (dir === 1) row.push(newBoard[i][3 - j]);   // 右
      if (dir === 2) row.push(newBoard[3 - j][i]);   // 下
      if (dir === 3) row.push(newBoard[i][j]);       // 左
    }

    let newRow = slide(row);

    for (let j = 0; j < 4; j++) {
      let val = newRow[j];

      if (dir === 0) {
        if (newBoard[j][i] !== val) moved = true;
        newBoard[j][i] = val;
      }
      if (dir === 1) {
        if (newBoard[i][3 - j] !== val) moved = true;
        newBoard[i][3 - j] = val;
      }
      if (dir === 2) {
        if (newBoard[3 - j][i] !== val) moved = true;
        newBoard[3 - j][i] = val;
      }
      if (dir === 3) {
        if (newBoard[i][j] !== val) moved = true;
        newBoard[i][j] = val;
      }
    }
  }

  return moved ? addRandom(newBoard) : board;
}

/* ===== 是否还能动 ===== */

function canMove(board) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

/* ===== 组件 ===== */

export default function Game2048({ difficulty = 0.5, onComplete, onFail }) {

  const target = Math.pow(2, Math.floor(7 + difficulty * 4)); // 128~2048

  const [board, setBoard] = useState(() => {
    let b = Array.from({ length: 4 }, () => Array(4).fill(0));
    return addRandom(addRandom(b));
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  /* ===== 键盘 ===== */
  useEffect(() => {
    function handle(e) {
      let dir = null;

      if (e.key === "ArrowUp" || e.key === "w") dir = 0;
      if (e.key === "ArrowRight" || e.key === "d") dir = 1;
      if (e.key === "ArrowDown" || e.key === "s") dir = 2;
      if (e.key === "ArrowLeft" || e.key === "a") dir = 3;

      if (dir === null || gameOver) return;

      let newBoard = move(board, dir);

      if (newBoard !== board) {
        setBoard(newBoard);
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [board, gameOver]);

  /* ===== 检查胜负 ===== */
  useEffect(() => {
    if (gameOver) return; // ⭐防止重复触发

    for (let row of board) {
      for (let v of row) {
        if (v >= target) {
          setGameOver(true);
          setHasWon(true);
          onComplete && onComplete();
          return;
        }
      }
    }

    if (!canMove(board)) {
      setGameOver(true);
      onFail && onFail();
    }

  }, [board]);

  /* ===== UI ===== */

  return React.createElement("div", null,

    React.createElement("div", null, "目标: " + target),

    React.createElement("div", {
      style: {
        width: 260,
        height: 260,
        background: "#bbada0",
        padding: 10,
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 10
      }
    },

      board.flat().map((v, i) =>
        React.createElement("div", {
          key: i,
          style: {
            background: v ? "#f3f4f6" : "#cdc1b4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: "bold",
            transition: "all 0.15s ease"
          }
        }, v || "")
      )
    ),

    hasWon && React.createElement("div", { style: { color: "green", marginTop: 10 } }, "✅ 通关"),
    (gameOver && !hasWon) && React.createElement("div", { style: { color: "red", marginTop: 10 } }, "游戏失败")
  );
}

export const meta = { name: "2048", component: Game2048, controlType: "direction" };