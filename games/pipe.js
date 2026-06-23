const { useState, useEffect, useRef } = React;

/* ===== 方向 ===== */
const DIRS = [
  [0,-1],[1,0],[0,1],[-1,0]
];

/* ===== 管道定义 ===== */
const PIPE = {
  I: [[0,2],[1,3]],
  L: [[0,1],[1,2],[2,3],[3,0]],
  END: [[1],[2],[3],[0]]
};

function getConn(type, r){
  return PIPE[type][r % PIPE[type].length];
}

/* ===== 生成可解地图 ===== */
function generate(size){

  let board = Array.from({length:size},()=>Array(size));

  // 先生成一条路径
  let path = [];
  let x=0,y=0;

  while(x !== size-1 || y !== size-1){
    path.push([x,y]);

    if(Math.random()<0.5 && x<size-1) x++;
    else if(y<size-1) y++;
  }
  path.push([size-1,size-1]);

  // 初始化
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      board[y][x]={type:"L",rotation:0};
    }
  }

  // 设置路径
  for(let i=0;i<path.length;i++){
    let [x,y]=path[i];

    if(i===0){
      board[y][x]={type:"END",rotation:1};
      continue;
    }

    if(i===path.length-1){
      board[y][x]={type:"END",rotation:3};
      continue;
    }

    board[y][x]={type:"L",rotation:0};
  }

  // 随机旋转（打乱）
  board.forEach(r=>r.forEach(c=>{
    c.rotation = Math.floor(Math.random()*4);
  }));

  return board;
}

/* ===== 连通检测（返回路径） ===== */
function findPath(board){

  const size = board.length;
  let visited = new Set();

  function dfs(x,y,path){
    if(x===size-1 && y===size-1){
      return [...path,[x,y]];
    }

    visited.add(x+","+y);

    let conns = getConn(board[y][x].type,board[y][x].rotation);

    for(let d of conns){
      let [dx,dy]=DIRS[d];
      let nx=x+dx, ny=y+dy;

      if(nx<0||ny<0||nx>=size||ny>=size) continue;

      let next = board[ny][nx];
      let back=(d+2)%4;

      if(!getConn(next.type,next.rotation).includes(back)) continue;

      if(!visited.has(nx+","+ny)){
        let res = dfs(nx,ny,[...path,[x,y]]);
        if(res) return res;
      }
    }

    return null;
  }

  return dfs(0,0,[]);
}

/* ===== 组件 ===== */

export default function Pipe({difficulty=0.5,onComplete}){

  const size = Math.floor(4 + difficulty*4); // 4~8

  const [board,setBoard]=useState([]);
  const [path,setPath]=useState(null);

  const [hover,setHover]=useState(null);
  const [active,setActive]=useState(null);

  const canvasRef = useRef();

  useEffect(()=>{
    let b = generate(size);
    setBoard(b);
    setPath(findPath(b));
  },[size]);

  /* ===== 绘制 ===== */
  useEffect(()=>{
    if(!board.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const cell = 70;
    const pad = 10;

    canvas.width = size*cell;
    canvas.height = size*cell;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.lineCap="round";

    /* 网格 */
    ctx.strokeStyle="#e5e7eb";
    for(let i=0;i<=size;i++){
      ctx.beginPath();
      ctx.moveTo(i*cell,0);
      ctx.lineTo(i*cell,size*cell);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0,i*cell);
      ctx.lineTo(size*cell,i*cell);
      ctx.stroke();
    }

    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){

        let c=board[y][x];

        let isPath = path?.some(p=>p[0]===x && p[1]===y);
        let isHover = hover && hover.x===x && hover.y===y;
        let isActive = active && active.x===x && active.y===y;

        if(isHover){
          ctx.fillStyle="rgba(59,130,246,0.05)";
          ctx.fillRect(x*cell,y*cell,cell,cell);
        }

        if(isActive){
          ctx.fillStyle="rgba(34,197,94,0.15)";
          ctx.fillRect(x*cell,y*cell,cell,cell);
        }

        let conns = getConn(c.type,c.rotation);

        let cx=x*cell+cell/2;
        let cy=y*cell+cell/2;

        ctx.strokeStyle = isPath ? "#22c55e" : "#3b82f6";
        ctx.lineWidth = isPath ? 9 : 7;

        ctx.beginPath();
        for(let d of conns){
          let [dx,dy]=DIRS[d];
          ctx.moveTo(cx,cy);
          ctx.lineTo(
            cx+dx*(cell/2 - pad),
            cy+dy*(cell/2 - pad)
          );
        }
        ctx.stroke();

        /* 起点终点 */
        if(x===0 && y===0){
          ctx.fillStyle="#2563eb";
          ctx.beginPath();
          ctx.arc(cx,cy,8,0,Math.PI*2);
          ctx.fill();
        }

        if(x===size-1 && y===size-1){
          ctx.fillStyle="#16a34a";
          ctx.beginPath();
          ctx.arc(cx,cy,8,0,Math.PI*2);
          ctx.fill();
        }
      }
    }

  },[board,path,hover,active]);

  /* ===== 点击 ===== */
  function click(e){

    const rect = canvasRef.current.getBoundingClientRect();
    const sizePx = rect.width;

    const x = Math.floor((e.clientX-rect.left)/(sizePx/size));
    const y = Math.floor((e.clientY-rect.top)/(sizePx/size));

    let newBoard = board.map(r=>r.map(c=>({...c})));

    newBoard[y][x].rotation++;

    setBoard(newBoard);
    setActive({x,y});
    setTimeout(()=>setActive(null),120);

    let p = findPath(newBoard);
    setPath(p);

    if(p){
      setTimeout(()=>{
        onComplete && onComplete();
      },300);
    }
  }

  function move(e){
    const rect = canvasRef.current.getBoundingClientRect();
    const sizePx = rect.width;

    const x = Math.floor((e.clientX-rect.left)/(sizePx/size));
    const y = Math.floor((e.clientY-rect.top)/(sizePx/size));

    setHover({x,y});
  }

  return React.createElement("canvas",{
    ref:canvasRef,
    onClick:click,
    onMouseMove:move
  });
}

export const meta = { name: "管道", component: Pipe, controlType: "none" };