const { useState, useEffect } = React;

const EMOJIS = ['🍎','🍌','🍇','🍊','🍓','🍉','🍒','🍍','🥝','🍑','🥭','🍋','🥥','🍈','🍐'];

function generateCards(pairCount) {
  const selected = EMOJIS.slice(0, pairCount);
  const cards = [...selected, ...selected];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((emoji, id) => ({ id, emoji, flipped: false, matched: false }));
}

export default function Memory({ difficulty = 0.5, onComplete, onFail }) {
  const rows = Math.floor(3 + difficulty * 2);
  const cols = Math.floor(4 + difficulty * 2);
  const pairCount = (rows * cols) / 2;
  const timeLimit = Math.floor(60 + (1 - difficulty) * 120);

  const [cards, setCards] = useState(() => generateCards(pairCount));
  const [flippedIds, setFlippedIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;
    const timer = setTimeout(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          onFail && onFail();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  function clickCard(id) {
    if (gameOver) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;
    if (flippedIds.length >= 2) return;

    const newCards = cards.map((c, i) => i === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          const matchedCards = newCards.map((c, i) => 
            (i === a || i === b) ? { ...c, matched: true } : c
          );
          setCards(matchedCards);
          setFlippedIds([]);

          if (matchedCards.every(c => c.matched)) {
            setHasWon(true);
            setGameOver(true);
            onComplete && onComplete();
          }
        }, 400);
      } else {
        setTimeout(() => {
          const backCards = newCards.map((c, i) => 
            (i === a || i === b) ? { ...c, flipped: false } : c
          );
          setCards(backCards);
          setFlippedIds([]);
        }, 800);
      }
    }
  }

  return React.createElement('div', null,
    React.createElement('div', { style: { fontSize: 18, marginBottom: 8 } },
      `剩余时间：${timeLeft}秒 | 剩余：${cards.filter(c => !c.matched).length / 2}对`
    ),
    React.createElement('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 60px)`,
        gap: 8,
        justifyContent: 'center'
      }
    },
      cards.map((card, i) =>
        React.createElement('div', {
          key: i,
          onClick: () => clickCard(i),
          style: {
            width: 60,
            height: 60,
            perspective: '400px',
            cursor: 'pointer'
          }
        },
          React.createElement('div', {
            style: {
              width: '100%',
              height: '100%',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: (card.flipped || card.matched) ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }
          },
            React.createElement('div', {
              style: {
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: '#3b82f6',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }, '?'),
            React.createElement('div', {
              style: {
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                background: card.matched ? '#dcfce7' : '#e0f2fe',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                transform: 'rotateY(180deg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }
            }, card.emoji)
          )
        )
      )
    ),
    hasWon && React.createElement('div', { style: { color: 'green', marginTop: 10 } }, '✅ 全部配对！'),
    (gameOver && !hasWon) && React.createElement('div', { style: { color: 'red', marginTop: 10 } }, '💥 时间到！')
  );
}

export const meta = { name: '翻牌记忆', component: Memory, controlType: 'none' };
