const { useState, useEffect, useRef } = React;

export default function FlappyBird({ difficulty = 0.5, onComplete, onFail }) {
  const target = Math.floor(5 + difficulty * 10);
  const gravity = 0.25 + difficulty * 0.15;
  const jumpStrength = -5 - difficulty * 1.5;
  const pipeSpeed = 2 + difficulty * 1.5;
  const pipeGap = 240 - difficulty * 40;

  const [ready, setReady] = useState(false);
  const canvasRef = useRef();
  const animRef = useRef();
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 500;

    let bird = { x: 80, y: 200, vy: 0, radius: 12 };
    let pipes = [];
    let frame = 0;
    let passed = new Set();
    let respawnTimer = 0;

    function spawnPipe() {
      const minH = 50;
      const maxH = canvas.height - pipeGap - minH - 20;
      const topH = Math.floor(minH + Math.random() * (maxH - minH));
      pipes.push({ x: canvas.width, topH, gap: pipeGap, id: frame });
    }

    function jump() {
      if (gameOverRef.current || !readyRef.current) return;
      bird.vy = jumpStrength;
    }
    canvas._jump = jump;

    function resetBird() {
      bird.x = 80;
      bird.y = 200;
      bird.vy = 0;
      pipes = [];
      passed.clear();
      scoreRef.current = 0;
      respawnTimer = 40;
    }

    function loop() {
      if (gameOverRef.current || !readyRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      if (respawnTimer > 0) {
        respawnTimer--;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.font = 'bold 20px system-ui';
        ctx.fillText(`${scoreRef.current}/${target}`, 20, 30);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px system-ui';
        ctx.fillText('碰撞！已重置', 130, 30);

        ctx.fillStyle = '#a16207';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

        animRef.current = requestAnimationFrame(loop);
        return;
      }

      bird.vy += gravity;
      bird.y += bird.vy;

      if (bird.y + bird.radius > canvas.height - 20) {
        bird.y = canvas.height - 20 - bird.radius;
        bird.vy = 0;
      }
      if (bird.y - bird.radius < 0) {
        bird.y = bird.radius;
        bird.vy = 0;
      }

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bird.x + 4, bird.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      if (frame % Math.floor(150 / pipeSpeed) === 0) {
        spawnPipe();
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= pipeSpeed;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, 0, 50, p.topH);
        ctx.fillRect(p.x, p.topH + p.gap, 50, canvas.height - p.topH - p.gap);

        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, 50, p.topH);
        ctx.strokeRect(p.x, p.topH + p.gap, 50, canvas.height - p.topH - p.gap);

        if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) {
          if (bird.y - bird.radius < p.topH || bird.y + bird.radius > p.topH + p.gap) {
            resetBird();
            break;
          }
        }

        if (!passed.has(p.id) && p.x + 50 < bird.x) {
          passed.add(p.id);
          scoreRef.current++;
          if (scoreRef.current >= target) {
            gameOverRef.current = true;
            onComplete && onComplete();
            return;
          }
        }

        if (p.x < -60) {
          pipes.splice(i, 1);
        }
      }

      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(`${scoreRef.current}/${target}`, 20, 30);

      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [ready, difficulty]);

  function handleClick() {
    if (!ready) return;
    if (canvasRef.current && canvasRef.current._jump) {
      canvasRef.current._jump();
    }
  }

  useEffect(() => {
    function handle(e) {
      if (!readyRef.current) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        if (canvasRef.current && canvasRef.current._jump) {
          canvasRef.current._jump();
        }
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return React.createElement('div', null,
    React.createElement('div', null, `点击/触摸跳跃：通过 ${target} 个管道（碰撞会重置）`),
    React.createElement('div', { style: { position: 'relative', display: 'inline-block' } },
      React.createElement('canvas', {
        ref: canvasRef,
        onClick: handleClick,
        style: { border: '1px solid #ddd', borderRadius: 8, cursor: ready ? 'pointer' : 'default' }
      }),
      !ready && React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 8
        }
      },
        React.createElement('button', {
          className: 'btn',
          style: { fontSize: 18, padding: '12px 28px' },
          onClick: (e) => {
            e.stopPropagation();
            setReady(true);
          }
        }, '▶ 点击开始')
      )
    )
  );
}

export const meta = { name: 'Flappy Bird', component: FlappyBird, controlType: "action" };
