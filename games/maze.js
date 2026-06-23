const { useState, useEffect, useRef } = React;

/* ===== 方向 ===== */
const DIRS = [
  [0, -1], // 上
  [1, 0],  // 右
  [0, 1],  // 下
  [-1, 0]  // 左
];

/* ===== 打乱 ===== */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/* ===== DFS生成迷宫 ===== */
function generateMaze(size) {
  let grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      walls: [true, true, true, true],
      visited: false
    }))
  );

  function dfs(x, y) {
    grid[y][x].visited = true;

    shuffle([0, 1, 2, 3]).forEach(dir => {
      let [dx, dy] = DIRS[dir];
      let nx = x + dx;
      let ny = y + dy;

      if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
      if (grid[ny][nx].visited) return;

      // 打通墙
      grid[y][x].walls[dir] = false;
      grid[ny][nx].walls[(dir + 2) % 4] = false;

      dfs(nx, ny);
    });
  }

  dfs(0, 0);
  return grid;
}

/* ===== 组件 ===== */
export default function Maze({ difficulty = 0.5, onComplete }) {

  // 难度：5~15
  const size = Math.floor(5 + difficulty * 10);

  const [maze, setMaze] = useState([]);
  const [player, setPlayer] = useState({ x: 0, y: 0 });

  const canvasRef = useRef();

  useEffect(() => {
    setMaze(generateMaze(size));
    setPlayer({ x: 0, y: 0 });
  }, [size]);

  /* ===== 绘制 ===== */
  useEffect(() => {
    if (!maze.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const cell = 32;

    canvas.width = size * cell;
    canvas.height = size * cell;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cellData = maze[y][x];

        let px = x * cell;
        let py = y * cell;

        // 上
        if (cellData.walls[0]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cell, py);
          ctx.stroke();
        }

        // 右
        if (cellData.walls[1]) {
          ctx.beginPath();
          ctx.moveTo(px + cell, py);
          ctx.lineTo(px + cell, py + cell);
          ctx.stroke();
        }

        // 下
        if (cellData.walls[2]) {
          ctx.beginPath();
          ctx.moveTo(px, py + cell);
          ctx.lineTo(px + cell, py + cell);
          ctx.stroke();
        }

        // 左
        if (cellData.walls[3]) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cell);
          ctx.stroke();
        }
      }
    }

    /* 玩家 */
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(
      player.x * cell + cell / 2,
      player.y * cell + cell / 2,
      6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    /* 终点 */
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(
      (size - 1) * cell + 8,
      (size - 1) * cell + 8,
      cell - 16,
      cell - 16
    );

  }, [maze, player]);

  /* ===== 移动 ===== */
  useEffect(() => {
    function move(e) {
      let dir = null;

      if (e.key === "ArrowUp" || e.key === "w") dir = 0;
      if (e.key === "ArrowRight" || e.key === "d") dir = 1;
      if (e.key === "ArrowDown" || e.key === "s") dir = 2;
      if (e.key === "ArrowLeft" || e.key === "a") dir = 3;

      if (dir === null) return;

      let { x, y } = player;
      let cell = maze[y][x];

      // 有墙就不能走
      if (cell.walls[dir]) return;

      let [dx, dy] = DIRS[dir];
      let nx = x + dx;
      let ny = y + dy;

      setPlayer({ x: nx, y: ny });

      // 到终点
      if (nx === size - 1 && ny === size - 1) {
        onComplete && onComplete();
      }
    }

    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [player, maze]);

  return React.createElement("canvas", { ref: canvasRef });
}

export const meta = { name: "迷宫", component: Maze, controlType: "direction" };