const { useState, useEffect, useRef } = React;

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const COLOR_NAMES = ['红', '蓝', '绿', '黄'];

export default function ColorSwitch({ difficulty = 0.5, onComplete, onFail }) {
  const target = Math.floor(5 + difficulty * 10);
  const speed = 1.5 + difficulty * 2;

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerColor, setPlayerColor] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  const canvasRef = useRef();
  const animRef = useRef();
  const playerColorRef = useRef(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);

  useEffect(() => {
    gameOverRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    playerColorRef.current = 0;
    setPlayerColor(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 500;

    let obstacles = [];
    let nextSpawn = 0;
    let lastTime = 0;
    let respawnTimer = 0;

    function spawnObstacle() {
      obstacles.push({
        y: -40,
        color: Math.floor(Math.random() * 4),
        height: 40,
        passed: false
      });
    }

    function resetGame() {
      gameOverRef.current = false;
      scoreRef.current = 0;
      setScore(0);
      playerColorRef.current = 0;
      setPlayerColor(0);
      obstacles = [];
      nextSpawn = 0;
      respawnTimer = 30;
    }

    function loop(timestamp) {
      if (gameOverRef.current) return;

      const dt = Math.min((timestamp - lastTime) / 16.67, 3);
      lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (respawnTimer > 0) {
        respawnTimer--;
        ctx.fillStyle = '#111';
        ctx.font = 'bold 20px system-ui';
        ctx.fillText('碰撞！已重置', 120, 250);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px system-ui';
        ctx.fillText(`${scoreRef.current}/${target}`, 20, 30);
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const px = canvas.width / 2;
      const py = canvas.height - 60;

      ctx.fillStyle = COLORS[playerColorRef.current];
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(COLOR_NAMES[playerColorRef.current], px - 10, py + 5);

      nextSpawn -= dt;
      if (nextSpawn <= 0) {
        spawnObstacle();
        nextSpawn = 60 + Math.random() * 40;
      }

      for (let obs of obstacles) {
        obs.y += speed * dt;

        ctx.fillStyle = COLORS[obs.color];
        ctx.fillRect(50, obs.y, 300, 30);

        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, obs.y, 300, 30);

        if (!obs.passed && obs.y + 30 >= py - 20 && obs.y <= py + 20) {
          if (obs.color === playerColorRef.current) {
            obs.passed = true;
            scoreRef.current++;
            setScore(scoreRef.current);
            if (scoreRef.current >= target) {
              gameOverRef.current = true;
              setGameOver(true);
              onComplete && onComplete();
              return;
            }
          } else {
            resetGame();
            return;
          }
        }
      }

      obstacles = obstacles.filter(o => o.y < canvas.height + 50);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${scoreRef.current}/${target}`, 20, 30);

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [difficulty, resetKey]);

  function switchColor() {
    if (gameOverRef.current) return;
    const next = (playerColorRef.current + 1) % 4;
    playerColorRef.current = next;
    setPlayerColor(next);
  }

  useEffect(() => {
    function handle(e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        switchColor();
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return React.createElement('div', null,
    React.createElement('div', null, `点击/空格切换颜色：${COLOR_NAMES[playerColor]} (${score}/${target})`),
    React.createElement('canvas', {
      ref: canvasRef,
      onClick: switchColor,
      style: { border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }
    }),
    React.createElement('div', { style: { marginTop: 8, color: '#666', fontSize: 14 } }, '点击屏幕或按空格切换颜色，匹配下落的颜色条')
  );
}

export const meta = { name: 'Color Switch', component: ColorSwitch, controlType: "action" };
