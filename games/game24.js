const { useState, useEffect } = React;

function generateNumbers(difficulty) {
  const max = difficulty > 0.6 ? 13 : 9;
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * max) + 1);
}

function evalSafe(expr) {
  try {
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;
    const result = Function('"use strict"; return (' + expr + ')')();
    return result;
  } catch {
    return null;
  }
}

function has24(nums) {
  const EPS = 1e-6;
  function dfs(arr) {
    if (arr.length === 1) return Math.abs(arr[0] - 24) < EPS;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        const rest = arr.filter((_, idx) => idx !== i && idx !== j);
        const ops = [a + b, a - b, b - a, a * b];
        if (Math.abs(b) > EPS) ops.push(a / b);
        if (Math.abs(a) > EPS) ops.push(b / a);
        for (const v of ops) {
          if (dfs([...rest, v])) return true;
        }
      }
    }
    return false;
  }
  return dfs(nums.map(Number));
}

export default function Game24({ difficulty = 0.5, onComplete, onFail }) {
  const timeLimit = Math.floor(30 + (1 - difficulty) * 90);
  const [numbers, setNumbers] = useState(() => {
    let nums;
    do { nums = generateNumbers(difficulty); } while (!has24(nums));
    return nums;
  });
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          setHasWon(false);
          onFail && onFail();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  function submit() {
    if (gameOver) return;
    const result = evalSafe(input);
    if (result === null) {
      setMessage('表达式格式有误');
      return;
    }
    const usedNums = input.match(/\d+/g)?.map(Number).sort((a, b) => a - b);
    const origNums = [...numbers].sort((a, b) => a - b);
    if (JSON.stringify(usedNums) !== JSON.stringify(origNums)) {
      setMessage('必须使用且仅使用给定的4个数字');
      return;
    }
    if (Math.abs(result - 24) < 1e-6) {
      setHasWon(true);
      setGameOver(true);
      setMessage('✅ 正确！');
      setTimeout(() => onComplete && onComplete(), 500);
    } else {
      setMessage(`结果 = ${result.toFixed(2)}，不是24`);
    }
  }

  function addChar(c) {
    if (gameOver) return;
    setInput(i => i + c);
  }

  function backspace() {
    if (gameOver) return;
    setInput(i => i.slice(0, -1));
  }

  return React.createElement('div', null,
    React.createElement('div', { style: { fontSize: 20, marginBottom: 8 } },
      `剩余时间：${timeLeft}秒`
    ),
    React.createElement('div', { style: { fontSize: 28, fontWeight: 'bold', margin: '12px 0' } },
      numbers.join('  ')
    ),
    React.createElement('div', {
      style: {
        fontSize: 20,
        minHeight: 30,
        background: '#f3f4f6',
        padding: 8,
        borderRadius: 8,
        marginBottom: 12
      }
    }, input || '...'),
    message && React.createElement('div', { style: { color: message.includes('✅') ? 'green' : 'red', marginBottom: 8 } }, message),

    React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
      numbers.map((n, i) => React.createElement('button', {
        key: i,
        className: 'btn',
        onClick: () => addChar(String(n))
      }, n))
    ),

    React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
      ['+', '-', '*', '/', '(', ')'].map(c => React.createElement('button', {
        key: c,
        className: 'btn',
        onClick: () => addChar(c)
      }, c))
    ),

    React.createElement('div', { style: { display: 'flex', gap: 8 } },
      React.createElement('button', { className: 'btn', onClick: backspace }, '←'),
      React.createElement('button', { className: 'btn', onClick: () => setInput('') }, '清空'),
      React.createElement('button', { className: 'btn', onClick: submit }, '提交')
    )
  );
}

export const meta = { name: '24点', component: Game24, controlType: "none" };
