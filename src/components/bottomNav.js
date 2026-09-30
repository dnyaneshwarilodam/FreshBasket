// Mobile bottom navigation
import { navigate, getCurrentRoute } from '../router.js'
import { getState, subscribe, getCartCount } from '../store.js'
import { el, icon, renderIcons } from '../utils/dom.js'
import { openCartDrawer } from './cartDrawer.js'

export function renderBottomNav() {
  const state = getState()
  const route = getCurrentRoute()
  const currentPath = route?.path || '/'

  const nav = el('nav', {
    class: 'lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-line dark:border-line-dark pb-safe',
    'aria-label': 'Bottom navigation',
  })

  const items = [
    { icon: 'home', label: 'Home', path: '/' },
    { icon: 'layout-grid', label: 'Categories', path: '/category/fruits-veg' },
    { icon: 'sparkles', label: 'AI', path: '/planner', isAI: true },
    { icon: 'package', label: 'Orders', path: '/orders' },
    { icon: 'shopping-basket', label: 'Cart', path: '#', isCart: true },
  ]

  const row = el('div', { class: 'flex items-center justify-around h-16 px-2' })

  for (const item of items) {
    const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path))
    const cartCount = getCartCount()

    const btn = el('button', {
      class: `flex flex-col items-center justify-center gap-0.5 w-16 h-16 rounded-xl transition-all ${item.isAI ? 'relative' : ''}`,
      onclick: () => {
        if (item.isCart) {
          openCartDrawer()
        } else {
          navigate('#' + item.path)
        }
      },
      'aria-label': item.label,
    })

    if (item.isAI) {
      btn.classList.add('-mt-6')
      const aiBtn = el('div', {
        class: 'w-14 h-14 rounded-full ai-gradient flex items-center justify-center shadow-ai-glow',
      }, icon('sparkles', 24, 'text-white'))
      btn.appendChild(aiBtn)
      const label = el('span', { class: 'text-2xs font-semibold ai-text mt-0.5' }, item.label)
      btn.appendChild(label)
    } else {
      const iconWrap = el('div', { class: 'relative' },
        icon(item.icon, 22, isActive ? 'text-brand' : 'text-muted'),
      )
      if (item.isCart && cartCount > 0) {
        const badge = el('span', {
          class: 'absolute -top-1.5 -right-1.5 bg-hot text-white text-2xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1',
        }, String(cartCount))
        iconWrap.appendChild(badge)
      }
      btn.appendChild(iconWrap)
      btn.appendChild(el('span', {
        class: `text-2xs font-medium ${isActive ? 'text-brand' : 'text-muted'}`,
      }, item.label))
    }

    row.appendChild(btn)
  }

  nav.appendChild(row)
  renderIcons(nav)

  // Update cart badge on state change
  subscribe(() => {
    const badge = nav.querySelector('[data-cart-badge-bottom]')
    const count = getCartCount()
    if (badge) {
      badge.textContent = String(count)
      badge.style.display = count > 0 ? 'flex' : 'none'
    }
  })

  return nav
}
