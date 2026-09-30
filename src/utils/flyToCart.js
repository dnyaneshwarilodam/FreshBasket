// Fly-to-cart animation: clones an element and animates to cart target

export function flyToCart(sourceEl, cartSelector = '[data-cart-pill]') {
  if (!sourceEl) return
  const cartEl = document.querySelector(cartSelector)
  if (!cartEl) return

  const sourceRect = sourceEl.getBoundingClientRect()
  const cartRect = cartEl.getBoundingClientRect()

  const fly = sourceEl.cloneNode(true)
  fly.style.position = 'fixed'
  fly.style.left = sourceRect.left + 'px'
  fly.style.top = sourceRect.top + 'px'
  fly.style.width = sourceRect.width + 'px'
  fly.style.height = sourceRect.height + 'px'
  fly.style.zIndex = '9999'
  fly.style.pointerEvents = 'none'
  fly.style.borderRadius = '50%'
  fly.style.objectFit = 'cover'
  fly.style.transition = 'all 0.7s cubic-bezier(0.5, -0.5, 0.6, 1.2)'
  fly.style.opacity = '1'
  document.body.appendChild(fly)

  // Bounce the cart pill
  requestAnimationFrame(() => {
    fly.style.left = cartRect.left + cartRect.width / 2 - 15 + 'px'
    fly.style.top = cartRect.top + cartRect.height / 2 - 15 + 'px'
    fly.style.width = '30px'
    fly.style.height = '30px'
    fly.style.opacity = '0.2'
    fly.style.transform = 'rotate(360deg)'

    cartEl.classList.add('animate-bounce-once')
    setTimeout(() => cartEl.classList.remove('animate-bounce-once'), 500)
  })

  setTimeout(() => fly.remove(), 750)
}
