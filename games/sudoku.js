const { useState, useEffect } = React;

/* ===== 工具 ===== */

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* ===== 检查合法 ===== */
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;

    let r = Math.floor(row / 3) * 3 + Math.floor(i / 3);
    let c = Math.floor(col / 3) * 3 + (i % 3);

    if (board[r][c] === num) return false;
  }
  return true;
}

/* ===== 生成完整解 ===== */
function solve(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let n of shuffle([1,2,3,4,5,6,7,8,9])) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (solve(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/* ===== 判断唯一解 ===== */
function countSolutions(board) {
  let count = 0;

  function dfs(b) {
    if (count > 1) return;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(b, r, c, n)) {
              b[r][c] = n;
              dfs(b);
              b[r][c] = 0;
            }
          }
          return;
        }
      }
    }

    count++;
  }

  dfs(board.map(r => [...r]));
  return count;
}

/* ===== 挖空（保证唯一解） ===== */
function makePuzzle(solution, holes) {
  let puzzle = solution.map(r => [...r]);

  let cells = [];
  for (let i = 0; i < 81; i++) cells.push(i);

  shuffle(cells);

  let removed = 0;

  for (let idx of cells) {
    if (removed >= holes) break;

    let r = Math.floor(idx / 9);
    let c = idx % 9;

    let backup = puzzle[r][c];
    puzzle[r][c] = 0;

    let copy = puzzle.map(r => [...r]);

    if (countSolutions(copy) !== 1) {
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return puzzle;
}

/* ===== 组件 ===== */

export default function Sudoku({ difficulty = 0.5, onComplete }) {

  // 空格数量（30~55）
  const holes = Math.floor(30 + difficulty * 25);

  const [board, setBoard] = useState([]);
  const [solution, setSolution] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {

    let full = Array.from({ length: 9 }, () => Array(9).fill(0));
    solve(full);

    let puzzle = makePuzzle(full, holes);

    setBoard(puzzle);
    setSolution(full);

  }, [holes]);

  /* ===== 优化后的输入处理：支持直接覆盖修改 ===== */
  useEffect(() => {
    function handle(e) {
      if (!selected) return;
      let [r, c] = selected;

      // 1. 获取用户输入的数字
      let num = parseInt(e.key);

      // 2. 检查是否输入了 1-9 的有效数字
      if (num >= 1 && num <= 9) {
        // 直接创建新盘面并覆盖当前位置，不再检查 board[r][c] 是否为 0
        let newBoard = board.map(row => [...row]);
        newBoard[r][c] = num;
        setBoard(newBoard);
      } 
      // 3. 虽然你不想用删除键，但保留 Backspace 清空功能会更灵活
      else if (e.key === "Backspace" || e.key === "Delete") {
        let newBoard = board.map(row => [...row]);
        newBoard[r][c] = 0;
        setBoard(newBoard);
      }
    }

    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [selected, board]);

  /* ===== 完成检测 ===== */
  useEffect(() => {
    if (!board.length) return;

    // 检查是否全填满且完全正确
    const isComplete = board.every((row, r) => 
      row.every((v, c) => v === solution[r][c])
    );

    if (isComplete) {
      // 延迟一点点，让玩家看清最后一个填进去的数字
      setTimeout(() => {
        onComplete && onComplete();
      }, 100);
    }
  }, [board, solution]);

  /* ===== UI ===== */

  return React.createElement("div", null,

    React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(9, 40px)",
        gap: 2
      }
    },

      board.map((row, r) =>
        row.map((v, c) => {

          let isSelected = selected && selected[0] === r && selected[1] === c;

          let wrong = v && v !== solution[r][c];

          return React.createElement("div", {
            key: r + "-" + c,
            onClick: () => setSelected([r, c]),
            style: {
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: isSelected ? "#dbeafe" : "#fff",
              border: "1px solid #ddd",
              fontSize: 18,
              color: wrong ? "red" : "#111",
              cursor: "pointer"
            }
          }, v || "");
        })
      )
    )
  );
}

export const meta = { name: "数独", component: Sudoku, controlType: "none" };