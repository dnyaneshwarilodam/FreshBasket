// Lightweight confetti burst

export function fireConfetti(container) {
  const colors = ['#0C831F', '#F8CB46', '#E23744', '#7C3AED', '#2563EB', '#2FBF4A']
  const parent = container || document.body
  const pieceCount = 60

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div')
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = 6 + Math.random() * 8
    piece.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      top: 50%;
      left: 50%;
      z-index: 10000;
      pointer-events: none;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `
    parent.appendChild(piece)

    const angle = (Math.PI * 2 * i) / pieceCount + Math.random() * 0.5
    const velocity = 100 + Math.random() * 200
    const vx = Math.cos(angle) * velocity
    const vy = Math.sin(angle) * velocity - 100

    piece.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${vx}px, ${vy}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 1200 + Math.random() * 600, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' }
    )

    setTimeout(() => piece.remove(), 2000)
  }
}
