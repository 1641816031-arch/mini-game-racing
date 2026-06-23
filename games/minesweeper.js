const { useState, useEffect } = React;

/* ===== 工具 ===== */

function createBoard(rows, cols, mines) {
  let board = [];

  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r][c] = {
        mine: false,
        open: false,
        flag: false, // ⭐新增
        count: 0
      };
    }
  }

  // 放雷
  let placed = 0;
  while (placed < mines) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      placed++;
    }
  }

  // 计算数字
  const dirs = [-1,0,1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;

      let count = 0;
      dirs.forEach(dr=>{
        dirs.forEach(dc=>{
          let nr = r + dr;
          let nc = c + dc;
          if (nr>=0 && nc>=0 && nr<rows && nc<cols) {
            if (board[nr][nc].mine) count++;
          }
        });
      });

      board[r][c].count = count;
    }
  }

  return board;
}

/* ===== 自动展开 ===== */

function flood(board, r, c, rows, cols) {
  const stack = [[r,c]];

  while (stack.length) {
    let [x,y] = stack.pop();

    if (board[x][y].open) continue;

    board[x][y].open = true;

    if (board[x][y].count !== 0) continue;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        let nr = x + dr;
        let nc = y + dc;
        if (nr>=0 && nc>=0 && nr<rows && nc<cols) {
          if (!board[nr][nc].open) {
            stack.push([nr,nc]);
          }
        }
      }
    }
  }
}

/* ===== 组件 ===== */

export default function Minesweeper({ difficulty = 0.5, onComplete, onFail }) {

  // 难度线性（已降低：雷数减半）
  const size = Math.floor(9 + difficulty * 7); // 9~16
  const mines = Math.floor(5 + difficulty * 20); // 5~25

  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setBoard(createBoard(size, size, mines));
    setGameOver(false);
  }, [size, mines]);

  // 右键函数 右键插旗
  function toggleFlag(e, r, c){
    e.preventDefault();

    if (gameOver) return;
    if (board[r][c].open) return;

    let newBoard = board.map(row => row.map(cell => ({ ...cell })));

    newBoard[r][c].flag = !newBoard[r][c].flag;

    setBoard(newBoard);
  }

  // if (board[r][c].open || board[r][c].flag) return;
  function openCell(r, c) {
    
    if (gameOver) return;
    if (board[r][c].open) return;

    let newBoard = board.map(row => row.map(cell => ({ ...cell })));

    // 💣 踩雷
    if (newBoard[r][c].mine) {

      newBoard[r][c].exploded = true;

      newBoard.forEach(row =>
        row.forEach(cell => {
          if (cell.mine) cell.open = true;
        })
      );

      setBoard(newBoard);
      setGameOver(true);

      // ⭐延迟触发失败
      setTimeout(()=>{
        onFail && onFail();
      },1000);

      return;
    }

    // 🌊 自动展开
    flood(newBoard, r, c, size, size);

    setBoard(newBoard);

    // 🎯 胜利检测
    let safe = 0;
    let opened = 0;

    newBoard.forEach(row=>{
      row.forEach(cell=>{
        if (!cell.mine) safe++;
        if (cell.open && !cell.mine) opened++;
      });
    });

    if (safe === opened) {
      onComplete && onComplete();
    }
  }

  /* ===== UI ===== */

  return React.createElement("div",null,

    React.createElement("div",{
      style:{
        display:"grid",
        gridTemplateColumns:`repeat(${size}, 28px)`
      }
    },

      board.map((row,r)=>
        row.map((cell,c)=>

          React.createElement("div",{
            key:r+"-"+c,
            onClick:()=>openCell(r,c),
            onContextMenu:(e)=>toggleFlag(e,r,c), // ⭐新增
            style:{
              width:28,
              height:28,
              border:"1px solid #ddd",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
              background: cell.exploded ? "#f87171" :
                          cell.open ? "#fff" : "#e5e7eb",
              cursor: cell.open ? "default" : "pointer",
              fontSize:14
            }
          },

            cell.open
              ? (cell.mine ? "💣" : (cell.count || ""))
              : (cell.flag ? "🚩" : "")

          )
        )
      )
    ),

    gameOver && React.createElement("div",{style:{marginTop:10,color:"red"}},"💥 游戏失败")
  );
}

export const meta = { name: "扫雷", component: Minesweeper, controlType: "none" };