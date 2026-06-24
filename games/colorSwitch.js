const { useState, useEffect, useRef, useCallback } = React;

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const COLOR_NAMES = ['红', '蓝', '绿', '黄'];

export default function ColorSwitch({ difficulty = 0.5, onComplete, onFail }) {
  const target = Math.floor(5 + difficulty * 10);
  const speed = 1.5 + difficulty * 2;

  const [score, setScore] = useState(0);
  const [playerColor, setPlayerColor] = useState(0);
  const [message, setMessage] = useState('');

  const canvasRef = useRef();
  const animRef = useRef(null);
  const stateRef = useRef({
    obstacles: [],
    nextSpawn: 0,
    lastTime: 0,
    respawnTimer: 0,
    score: 0,
    playerColor: 0,
    gameOver: false
  });

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 500;

    const state = stateRef.current;
    state.obstacles = [];
    state.nextSpawn = 0;
    state.lastTime = 0;
    state.respawnTimer = 0;
    state.score = 0;
    state.playerColor = 0;
    state.gameOver = false;

    setScore(0);
    setPlayerColor(0);
    setMessage('');

    function spawnObstacle() {
      state.obstacles.push({
        y: -40,
        color: Math.floor(Math.random() * 4),
        height: 40,
        passed: false
      });
    }

    function resetGame() {
      state.obstacles = [];
      state.nextSpawn = 0;
      state.score = 0;
      state.playerColor = 0;
      state.respawnTimer = 30;
      setScore(0);
      setPlayerColor(0);
      setMessage('碰撞！已重置');
      setTimeout(() => setMessage(''), 800);
    }

    function loop(timestamp) {
      const state = stateRef.current;
      if (state.gameOver) return;

      const dt = Math.min((timestamp - state.lastTime) / 16.67, 3);
      state.lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 分数
      ctx.fillStyle = '#111';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${state.score}/${target}`, 20, 30);

      // 重置保护期
      if (state.respawnTimer > 0) {
        state.respawnTimer--;
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px system-ui';
        ctx.fillText('碰撞！已重置', 90, 250);
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      const px = canvas.width / 2;
      const py = canvas.height - 60;

      // 玩家球
      ctx.fillStyle = COLORS[state.playerColor];
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(COLOR_NAMES[state.playerColor], px - 10, py + 5);

      // 生成障碍物
      state.nextSpawn -= dt;
      if (state.nextSpawn <= 0) {
        spawnObstacle();
        state.nextSpawn = 60 + Math.random() * 40;
      }

      // 更新和绘制障碍物
      let collided = false;
      for (let obs of state.obstacles) {
        obs.y += speed * dt;

        ctx.fillStyle = COLORS[obs.color];
        ctx.fillRect(50, obs.y, 300, 30);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, obs.y, 300, 30);

        if (!obs.passed && obs.y + 30 >= py - 20 && obs.y <= py + 20) {
          if (obs.color === state.playerColor) {
            obs.passed = true;
            state.score++;
            setScore(state.score);
            if (state.score >= target) {
              state.gameOver = true;
              onComplete && onComplete();
              return;
            }
          } else {
            collided = true;
            break;
          }
        }
      }

      state.obstacles = state.obstacles.filter(o => o.y < canvas.height + 50);

      if (collided) {
        resetGame();
      }

      animRef.current = requestAnimationFrame(loop);
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(loop);
  }, [difficulty, target, speed, onComplete]);

  useEffect(() => {
    startGame();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [startGame]);

  function switchColor() {
    const state = stateRef.current;
    if (state.gameOver || state.respawnTimer > 0) return;
    state.playerColor = (state.playerColor + 1) % 4;
    setPlayerColor(state.playerColor);
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
    message && React.createElement('div', { style: { color: 'red', marginTop: 8, fontWeight: 'bold' } }, message),
    React.createElement('div', { style: { marginTop: 8, color: '#666', fontSize: 14 } }, '点击屏幕或按空格切换颜色，匹配下落的颜色条')
  );
}

export const meta = { name: 'Color Switch', component: ColorSwitch, controlType: "action" };
