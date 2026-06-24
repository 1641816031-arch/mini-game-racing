const { useState, useEffect, useRef } = React;

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
const COLOR_NAMES = ['红', '蓝', '绿', '黄'];

export default function ColorSwitch({ difficulty = 0.5, onComplete, onFail }) {
  const target = Math.floor(5 + difficulty * 10);
  const speed = 1.5 + difficulty * 2;

  const [score, setScore] = useState(0);
  const [playerColor, setPlayerColor] = useState(0);
  const [message, setMessage] = useState('');

  const canvasRef = useRef();
  const gameRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 500;

    const game = {
      obstacles: [],
      nextSpawn: 0,
      lastTime: 0,
      respawnTimer: 0,
      score: 0,
      playerColor: 0,
      gameOver: false
    };
    gameRef.current = game;

    setScore(0);
    setPlayerColor(0);
    setMessage('');

    function spawnObstacle() {
      game.obstacles.push({
        y: -40,
        color: Math.floor(Math.random() * 4),
        height: 40,
        passed: false
      });
    }

    function resetGame() {
      game.obstacles = [];
      game.nextSpawn = 0;
      game.score = 0;
      game.playerColor = 0;
      game.respawnTimer = 30;
      setScore(0);
      setPlayerColor(0);
      setMessage('碰撞！已重置');
      setTimeout(() => setMessage(''), 800);
    }

    function loop(timestamp) {
      if (game.gameOver) return;

      const dt = Math.min((timestamp - game.lastTime) / 16.67, 3);
      game.lastTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 16px system-ui';
      ctx.fillText(`${game.score}/${target}`, 20, 30);

      if (game.respawnTimer > 0) {
        game.respawnTimer--;
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 24px system-ui';
        ctx.fillText('碰撞！已重置', 90, 250);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const px = canvas.width / 2;
      const py = canvas.height - 60;

      ctx.fillStyle = COLORS[game.playerColor];
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(COLOR_NAMES[game.playerColor], px - 10, py + 5);

      game.nextSpawn -= dt;
      if (game.nextSpawn <= 0) {
        spawnObstacle();
        game.nextSpawn = 60 + Math.random() * 40;
      }

      let collided = false;
      for (let i = 0; i < game.obstacles.length; i++) {
        const obs = game.obstacles[i];
        obs.y += speed * dt;

        ctx.fillStyle = COLORS[obs.color];
        ctx.fillRect(50, obs.y, 300, 30);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, obs.y, 300, 30);

        if (!obs.passed && obs.y + 30 >= py - 20 && obs.y <= py + 20) {
          if (obs.color === game.playerColor) {
            obs.passed = true;
            game.score++;
            setScore(game.score);
            if (game.score >= target) {
              game.gameOver = true;
              onComplete && onComplete();
              return;
            }
          } else {
            collided = true;
            break;
          }
        }
      }

      game.obstacles = game.obstacles.filter(o => o.y < canvas.height + 50);

      if (collided) {
        resetGame();
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      game.gameOver = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [difficulty, target, speed, onComplete]);

  function switchColor() {
    const game = gameRef.current;
    if (!game || game.gameOver || game.respawnTimer > 0) return;
    game.playerColor = (game.playerColor + 1) % 4;
    setPlayerColor(game.playerColor);
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
