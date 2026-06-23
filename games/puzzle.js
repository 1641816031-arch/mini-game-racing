const { useState, useEffect } = React;

/* ===== 生成可解拼图 ===== */

function generatePuzzle(size, shuffleSteps = 200) {
  let board = [];
  let n = size * size;

  for (let i = 0; i < n - 1; i++) board.push(i + 1);
  board.push(0); // 空格

  let empty = n - 1;

  function swap(i, j) {
    [board[i], board[j]] = [board[j], board[i]];
  }

  for (let i = 0; i < shuffleSteps; i++) {
    let row = Math.floor(empty / size);
    let col = empty % size;

    let moves = [];

    if (row > 0) moves.push(empty - size);
    if (row < size - 1) moves.push(empty + size);
    if (col > 0) moves.push(empty - 1);
    if (col < size - 1) moves.push(empty + 1);

    let target = moves[Math.floor(Math.random() * moves.length)];

    swap(empty, target);
    empty = target;
  }

  return board;
}

/* ===== 判断完成 ===== */
function isSolved(board) {
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[board.length - 1] === 0;
}

/* ===== 组件 ===== */

export default function Puzzle({ difficulty = 0.5, onComplete }) {

  // 难度：3~5
  const size = Math.floor(3 + difficulty * 2);

  const [board, setBoard] = useState([]);
  const [empty, setEmpty] = useState(0);

  useEffect(() => {
    let b = generatePuzzle(size, 150 + size * 50);
    setBoard(b);
    setEmpty(b.indexOf(0));
  }, [size]);

  /* ===== 移动逻辑 ===== */

  function move(index) {
    let row = Math.floor(index / size);
    let col = index % size;

    let er = Math.floor(empty / size);
    let ec = empty % size;

    // 必须相邻
    if (Math.abs(row - er) + Math.abs(col - ec) !== 1) return;

    let newBoard = [...board];

    [newBoard[index], newBoard[empty]] = [newBoard[empty], newBoard[index]];

    setBoard(newBoard);
    setEmpty(index);

    if (isSolved(newBoard)) {
      onComplete && onComplete();
    }
  }

  /* ===== 键盘 ===== */
  useEffect(() => {
    function handle(e) {
      let dir = null;

      if (e.key === "ArrowUp" || e.key === "w") dir = "up";
      if (e.key === "ArrowDown" || e.key === "s") dir = "down";
      if (e.key === "ArrowLeft" || e.key === "a") dir = "left";
      if (e.key === "ArrowRight" || e.key === "d") dir = "right";

      if (!dir) return;

      let er = Math.floor(empty / size);
      let ec = empty % size;

      let target = null;

      if (dir === "up" && er < size - 1) target = empty + size;
      if (dir === "down" && er > 0) target = empty - size;
      if (dir === "left" && ec < size - 1) target = empty + 1;
      if (dir === "right" && ec > 0) target = empty - 1;

      if (target !== null) move(target);
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [empty, board]);

  /* ===== UI ===== */

  return React.createElement("div", null,

    React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 70px)`,
        gap: 6
      }
    },

      board.map((v, i) =>
        React.createElement("div", {
          key: i,
          onClick: () => move(i),
          style: {
            width: 70,
            height: 70,
            background: v ? "#e0f2fe" : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: "bold",
            cursor: v ? "pointer" : "default",
            transition: "all 0.2s ease",
            borderRadius: 8
          }
        }, v || "")
      )
    )
  );
}

export const meta = { name: "华容道", component: Puzzle, controlType: "direction" };