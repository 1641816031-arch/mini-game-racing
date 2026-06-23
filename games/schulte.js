const { useState, useEffect } = React;

function generateGrid(size) {
  const nums = Array.from({ length: size * size }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

export default function Schulte({ difficulty = 0.5, onComplete, onFail }) {
  const size = Math.floor(3 + difficulty * 2);
  const [grid, setGrid] = useState(() => generateGrid(size));
  const [nextNum, setNextNum] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  function clickCell(num) {
    if (gameOver) return;
    if (num === nextNum) {
      const newNext = nextNum + 1;
      setNextNum(newNext);
      if (newNext > size * size) {
        setHasWon(true);
        setGameOver(true);
        onComplete && onComplete();
      }
    } else {
      // 点错：重置回第一个数字
      setNextNum(1);
    }
  }

  return React.createElement('div', null,
    React.createElement('div', null, `下一个：${nextNum}`),
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 60px)`,
        gap: 6,
        marginTop: 12
      }
    },
      grid.map((num, i) =>
        React.createElement('div', {
          key: i,
          onClick: () => clickCell(num),
          style: {
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            background: num < nextNum ? '#22c55e' : '#fff',
            color: num < nextNum ? '#fff' : '#111',
            borderRadius: 8,
            cursor: 'pointer',
            border: '2px solid #ddd',
            transition: 'all 0.2s'
          }
        }, num)
      )
    ),
    hasWon && React.createElement('div', { style: { color: 'green', marginTop: 10 } }, '✅ 全部完成！')
  );
}

export const meta = { name: '舒尔特方格', component: Schulte, controlType: "none" };
