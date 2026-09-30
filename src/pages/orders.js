// Orders page — list with reorder + tracking
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { getState, addOrder, addToCart } from '../store.js'
import { getProductById } from '../data/products.js'
import { formatPrice } from '../utils/format.js'
import { toast } from '../components/toast.js'

export function renderOrdersPage(params) {
  if (params.id) return renderOrderTracking(params.id)

  const state = getState()
  const orders = state.orders

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  page.appendChild(el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold text-ink dark:text-ink-dark mb-4' }, 'Your Orders'))

  if (orders.length === 0) {
    page.appendChild(el('div', { class: 'text-center py-16' },
      el('div', { class: 'text-6xl mb-4' }, '📦'),
      el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark mb-1' }, 'No orders yet'),
      el('p', { class: 'text-sm text-muted mb-6' }, 'Your grocery deliveries will show up here.'),
      el('button', {
        class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm',
        onclick: () => navigate('#/'),
      }, 'Start shopping'),
    ))
    renderIcons(page)
    return page
  }

  const list = el('div', { class: 'space-y-3' })
  for (const order of orders) {
    const itemCount = order.items?.length || 0
    const card = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })

    card.appendChild(el('div', { class: 'flex items-center justify-between mb-3' },
      el('div', {},
        el('div', { class: 'text-sm font-bold text-ink dark:text-ink-dark' }, 'Order ' + order.id),
        el('div', { class: 'text-2xs text-muted' }, new Date(order.placedAt).toLocaleString()),
      ),
      el('span', { class: 'px-2 py-1 rounded-full bg-brand-tint text-brand text-2xs font-bold uppercase' }, order.status),
    ))

    // Item preview
    card.appendChild(el('div', { class: 'flex items-center gap-1 mb-3' },
      ...order.items.slice(0, 6).map(item =>
        el('span', { class: 'w-8 h-8 rounded-lg bg-canvas dark:bg-surface-dark flex items-center justify-center text-lg' }, item.image),
      ),
      el('span', { class: 'text-xs text-muted ml-2' }, itemCount + ' item' + (itemCount !== 1 ? 's' : '')),
    ))

    card.appendChild(el('div', { class: 'flex items-center justify-between' },
      el('span', { class: 'text-sm font-bold text-ink dark:text-ink-dark tabular-nums' }, formatPrice(order.total)),
      el('div', { class: 'flex gap-2' },
        el('button', {
          class: 'px-3 py-1.5 rounded-lg border border-brand text-brand text-xs font-semibold hover:bg-brand hover:text-white transition-colors',
          onclick: () => {
            order.items.forEach(item => {
              const product = getProductById(item.id)
              if (product) addToCart(product)
            })
            toast('Items added to cart!', 'success')
          },
        }, 'Reorder'),
        el('button', {
          class: 'px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors',
          onclick: () => navigate('#/orders/' + order.id),
        }, 'Track'),
      ),
    ))

    list.appendChild(card)
  }
  page.appendChild(list)

  renderIcons(page)
  return page
}

function renderOrderTracking(orderId) {
  const state = getState()
  const order = state.orders.find(o => o.id === orderId)

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  // Back button
  page.appendChild(el('button', {
    class: 'flex items-center gap-1 text-sm text-muted hover:text-brand mb-4',
    onclick: () => navigate('#/orders'),
  }, icon('arrow-left', 16), el('span', {}, 'Back to orders')))

  if (!order) {
    page.appendChild(el('div', { class: 'text-center py-16' },
      el('div', { class: 'text-5xl mb-3' }, '📦'),
      el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark' }, 'Order not found'),
    ))
    renderIcons(page)
    return page
  }

  page.appendChild(el('h1', { class: 'font-heading text-xl font-bold text-ink dark:text-ink-dark mb-2' }, 'Track Order'))
  page.appendChild(el('p', { class: 'text-sm text-muted mb-4' }, 'Order ID: ' + order.id))

  // Map placeholder with rider
  const mapWrap = el('div', {
    class: 'relative h-48 rounded-2xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark overflow-hidden mb-4',
  })
  // SVG path
  mapWrap.appendChild(el('div', { class: 'absolute inset-0 flex items-center justify-center' },
    el('div', { class: 'text-center' },
      el('div', { class: 'text-4xl mb-1' }, '🗺️'),
      el('div', { class: 'text-2xs text-muted' }, 'Live map'),
    ),
  ))
  // SVG path with moving rider
  const svgWrap = el('div', { class: 'absolute inset-0' })
  svgWrap.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
      <path d="M 20 150 Q 100 50 200 100 T 380 50" fill="none" stroke="#0C831F" stroke-width="3" stroke-dasharray="5,5" opacity="0.5"/>
      <circle r="8" fill="#0C831F">
        <animateMotion dur="6s" repeatCount="indefinite" path="M 20 150 Q 100 50 200 100 T 380 50"/>
      </circle>
      <text x="20" y="170" font-size="10" fill="#6B7280">🏪 Store</text>
      <text x="360" y="40" font-size="10" fill="#6B7280">🏠 You</text>
    </svg>
  `
  mapWrap.appendChild(svgWrap)
  page.appendChild(mapWrap)

  // ETA + partner card
  const etaCard = el('div', { class: 'flex items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark mb-4' },
    el('div', { class: 'w-12 h-12 rounded-full bg-brand-tint flex items-center justify-center' },
      icon('bike', 24, 'text-brand'),
    ),
    el('div', { class: 'flex-1' },
      el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, 'Rahul (Delivery Partner)'),
      el('div', { class: 'text-xs text-muted' }, 'Arriving in ' + (order.eta || 9) + ' minutes'),
    ),
    el('button', { class: 'w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center' }, icon('phone', 18)),
  )
  page.appendChild(etaCard)

  // Timeline
  const timeline = order.timeline || [
    { status: 'placed', label: 'Order Placed', done: true },
    { status: 'packing', label: 'Packing', done: false },
    { status: 'picked', label: 'Picked Up', done: false },
    { status: 'onway', label: 'On the Way', done: false },
    { status: 'delivered', label: 'Delivered', done: false },
  ]

  const timelineWrap = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  timelineWrap.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-4' }, 'Order Timeline'))

  for (let i = 0; i < timeline.length; i++) {
    const step = timeline[i]
    const isLast = i === timeline.length - 1
    timelineWrap.appendChild(el('div', { class: 'flex items-start gap-3' },
      el('div', { class: 'flex flex-col items-center' },
        el('div', {
          class: `w-6 h-6 rounded-full flex items-center justify-center text-2xs ${step.done ? 'bg-brand text-white' : 'bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-muted'}`,
        }, step.done ? '✓' : String(i + 1)),
        !isLast ? el('div', { class: `w-0.5 h-8 ${step.done ? 'bg-brand' : 'bg-line dark:bg-line-dark'}` }) : null,
      ),
      el('div', { class: 'pb-4' },
        el('div', { class: `text-sm font-medium ${step.done ? 'text-ink dark:text-ink-dark' : 'text-muted'}` }, step.label),
        step.done && step.time ? el('div', { class: 'text-2xs text-muted' }, new Date(step.time).toLocaleTimeString()) : null,
      ),
    ))
  }
  page.appendChild(timelineWrap)

  // Auto-advance timeline (mock)
  let advanceIndex = timeline.findIndex(s => !s.done)
  if (advanceIndex >= 0) {
    const advancer = setInterval(() => {
      if (advanceIndex < timeline.length) {
        timeline[advanceIndex].done = true
        timeline[advanceIndex].time = new Date().toISOString()
        advanceIndex++
        // Re-render timeline
        clearNode(page)
        // Re-render everything... simpler: just update the page
        const newPage = renderOrderTracking(orderId)
        page.replaceWith(newPage)
        clearInterval(advancer)
      }
    }, 3000)
  }

  renderIcons(page)
  return page
}
