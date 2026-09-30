// Sticky navbar with glass blur, search, location pill, cart, login
import { getState, subscribe, getCartCount, getCartTotal, toggleTheme } from '../store.js'
import { navigate } from '../router.js'
import { formatPrice } from '../utils/format.js'
import { el, sanitize, icon, renderIcons, delegate } from '../utils/dom.js'
import { debounce } from '../utils/debounce.js'
import { searchProducts, getSuggestions, getTrendingSearches } from '../services/api.js'
import { openLocationModal } from './locationModal.js'
import { openLoginModal } from './loginModal.js'
import { openCartDrawer } from './cartDrawer.js'
import { toast } from './toast.js'

const searchPlaceholders = [
  "Search 'milk'",
  "Search 'paneer butter masala ingredients'",
  "Ask AI: 'healthy breakfast under ₹300'",
  "Search 'atta'",
  "Ask AI: 'what can I cook with paneer?'",
  "Search 'chocolate'",
]

let navbarMounted = false

export function renderNavbar() {
  const state = getState()

  const nav = el('header', {
    id: 'navbar',
    class: 'sticky top-0 z-40 transition-all duration-300 glass border-b border-line dark:border-line-dark',
  })

  // ===== Top row =====
  const topRow = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6' },
    el('div', { class: 'flex items-center gap-3 h-14 lg:h-16' },
      // Logo
      el('a', { href: '#/', class: 'flex items-center gap-1.5 shrink-0', 'aria-label': 'FreshBasket AI home' },
        el('span', { class: 'text-2xl' }, '🧺'),
        el('span', { class: 'hidden sm:flex flex-col leading-none' },
          el('span', { class: 'font-heading font-extrabold text-base text-ink dark:text-ink-dark' }, 'FreshBasket'),
          el('span', { class: 'font-heading font-bold text-2xs ai-text' }, 'AI'),
        ),
      ),
      // Location pill
      el('button', {
        class: 'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors shrink-0',
        onclick: () => openLocationModal(),
      },
        el('span', { class: 'relative flex' },
          el('span', { class: 'absolute inline-flex h-2 w-2 rounded-full bg-brand animate-pulse-dot' }),
          el('span', { class: 'inline-flex h-2 w-2 rounded-full bg-brand' }),
        ),
        el('span', { class: 'flex flex-col items-start text-left' },
          el('span', { class: 'text-2xs text-muted' }, 'Delivery in 9 min'),
          el('span', { class: 'text-xs font-semibold text-ink dark:text-ink-dark max-w-[120px] truncate' },
            sanitize(state.address?.label || state.address?.line1 || 'Set location'),
          ),
        ),
        icon('chevron-down', 14, 'text-muted'),
      ),
      // Search bar
      el('div', { class: 'flex-1 relative' },
        buildSearchBar(),
      ),
      // Theme toggle
      el('button', {
        class: 'p-2 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors shrink-0',
        onclick: () => toggleTheme(),
        'aria-label': 'Toggle theme',
      }, icon(state.theme === 'dark' ? 'sun' : 'moon', 20, 'text-ink dark:text-ink-dark')),
      // Login / avatar
      state.user
        ? el('button', {
            class: 'flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors shrink-0',
            onclick: () => navigate('#/account'),
          },
            el('span', { class: 'w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold' }, sanitize(state.user.name?.[0] || 'U')),
            el('span', { class: 'hidden lg:inline text-sm font-semibold text-ink dark:text-ink-dark' }, sanitize(state.user.name || 'Account')),
          )
        : el('button', {
            class: 'flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl border-2 border-brand text-brand font-semibold text-sm hover:bg-brand-tint transition-colors shrink-0',
            onclick: () => openLoginModal(),
          }, icon('user', 16), el('span', { class: 'hidden sm:inline' }, 'Login')),
      // Cart pill
      el('button', {
        'data-cart-pill': '',
        class: 'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors shrink-0 relative',
        onclick: () => openCartDrawer(),
      },
        icon('shopping-basket', 18),
        el('span', { class: 'hidden sm:inline' }, 'Cart'),
        getCartCount() > 0
          ? el('span', {
              'data-cart-badge': '',
              class: 'bg-accent text-ink text-2xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1',
            }, String(getCartCount()))
          : null,
      ),
    ),
  )

  // ===== Mobile location row =====
  const mobileLoc = el('div', { class: 'md:hidden px-4 pb-2' },
    el('button', {
      class: 'flex items-center gap-2 w-full px-3 py-1.5 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors',
      onclick: () => openLocationModal(),
    },
      el('span', { class: 'relative flex' },
        el('span', { class: 'absolute inline-flex h-2 w-2 rounded-full bg-brand animate-pulse-dot' }),
        el('span', { class: 'inline-flex h-2 w-2 rounded-full bg-brand' }),
      ),
      el('span', { class: 'flex flex-col items-start text-left' },
        el('span', { class: 'text-2xs text-muted' }, 'Delivery in 9 min'),
        el('span', { class: 'text-xs font-semibold text-ink dark:text-ink-dark truncate' },
          sanitize(state.address?.label || state.address?.line1 || 'Set location'),
        ),
      ),
      icon('chevron-down', 14, 'text-muted'),
    ),
  )

  nav.appendChild(topRow)
  nav.appendChild(mobileLoc)
  renderIcons(nav)

  // Scroll blur effect
  if (!navbarMounted) {
    navbarMounted = true
    let scrolled = false
    window.addEventListener('scroll', () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        scrolled = isScrolled
        nav.classList.toggle('shadow-soft', scrolled)
      }
    }, { passive: true })
  }

  // Subscribe to cart changes
  subscribe(() => updateCartPill())

  return nav
}

function updateCartPill() {
  const count = getCartCount()
  const badge = document.querySelector('[data-cart-badge]')
  const pill = document.querySelector('[data-cart-pill]')
  if (badge) {
    badge.textContent = String(count)
    badge.style.display = count > 0 ? 'flex' : 'none'
  } else if (count > 0 && pill) {
    const newBadge = el('span', {
      'data-cart-badge': '',
      class: 'bg-accent text-ink text-2xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1',
    }, String(count))
    pill.appendChild(newBadge)
    if (window.lucide) window.lucide.createIcons({ root: pill })
  }
  if (badge && count > 0) {
    badge.classList.add('animate-bounce-once')
    setTimeout(() => badge.classList.remove('animate-bounce-once'), 500)
  }
}

function buildSearchBar() {
  const wrapper = el('div', { class: 'relative w-full' })

  const input = el('input', {
    type: 'text',
    id: 'search-input',
    placeholder: searchPlaceholders[0],
    class: 'w-full h-10 pl-10 pr-24 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors',
    'aria-label': 'Search products',
  })

  const searchIcon = el('span', { class: 'absolute left-3 top-1/2 -translate-y-1/2 text-muted' },
    icon('search', 18),
  )

  const aiBtn = el('button', {
    class: 'absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg ai-gradient text-white text-xs font-semibold hover:opacity-90 transition-opacity',
    onclick: () => {
      const q = input.value.trim()
      if (q) navigate('#/search?q=' + encodeURIComponent(q))
      else navigate('#/planner')
    },
  },
    icon('sparkles', 14),
    el('span', { class: 'hidden sm:inline' }, 'Ask AI'),
  )

  wrapper.appendChild(searchIcon)
  wrapper.appendChild(input)
  wrapper.appendChild(aiBtn)
  renderIcons(wrapper)

  // Placeholder rotation
  let phIndex = 0
  setInterval(() => {
    if (document.activeElement === input) return
    phIndex = (phIndex + 1) % searchPlaceholders.length
    input.style.transition = 'opacity 0.3s'
    input.style.opacity = '0'
    setTimeout(() => {
      input.placeholder = searchPlaceholders[phIndex]
      input.style.opacity = '1'
    }, 300)
  }, 3000)

  // Search dropdown
  const dropdown = el('div', {
    id: 'search-dropdown',
    class: 'hidden absolute top-full left-0 right-0 mt-2 bg-surface dark:bg-surface-dark rounded-2xl shadow-lift border border-line dark:border-line-dark z-50 max-h-96 overflow-y-auto',
  })
  wrapper.appendChild(dropdown)

  const debouncedSearch = debounce(async (q) => {
    if (!q.trim()) {
      dropdown.classList.add('hidden')
      return
    }
    const { products } = await getSuggestions(q)
    const trending = await getTrendingSearches()
    showSearchDropdown(dropdown, products, q, trending)
  }, 200)

  input.addEventListener('input', (e) => debouncedSearch(e.target.value))
  input.addEventListener('focus', (e) => {
    if (e.target.value.trim()) debouncedSearch(e.target.value)
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim()
      if (q) {
        navigate('#/search?q=' + encodeURIComponent(q))
        input.blur()
        dropdown.classList.add('hidden')
      }
    }
  })

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) dropdown.classList.add('hidden')
  })

  return wrapper
}

function showSearchDropdown(dropdown, products, query, trending) {
  dropdown.innerHTML = ''

  // Ask AI row
  const aiRow = el('button', {
    class: 'w-full flex items-center gap-2 px-4 py-3 hover:bg-canvas dark:hover:bg-surface-dark transition-colors border-b border-line dark:border-line-dark text-left',
    onclick: () => {
      navigate('#/search?q=' + encodeURIComponent(query))
      dropdown.classList.add('hidden')
    },
  },
    el('span', { class: 'w-8 h-8 rounded-lg ai-gradient flex items-center justify-center shrink-0' }, icon('sparkles', 16, 'text-white')),
    el('span', { class: 'text-sm' },
      el('span', { class: 'font-semibold ai-text' }, 'Ask AI about'),
      el('span', { class: 'text-muted' }, ' "' + sanitize(query) + '"'),
    ),
  )
  dropdown.appendChild(aiRow)

  if (products.length > 0) {
    const label = el('div', { class: 'px-4 py-2 text-2xs font-semibold text-muted uppercase tracking-wide' }, 'Products')
    dropdown.appendChild(label)
    for (const p of products.slice(0, 5)) {
      const row = el('button', {
        class: 'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-canvas dark:hover:bg-surface-dark transition-colors text-left',
        onclick: () => {
          navigate('#/product/' + p.id)
          dropdown.classList.add('hidden')
          const input = document.getElementById('search-input')
          if (input) input.value = ''
        },
      },
        el('span', { class: 'text-2xl shrink-0' }, p.image),
        el('span', { class: 'flex-1 min-w-0' },
          el('div', { class: 'text-sm font-medium text-ink dark:text-ink-dark truncate' }, sanitize(p.name)),
          el('div', { class: 'text-2xs text-muted' }, sanitize(p.brand) + ' • ' + formatPrice(p.price)),
        ),
      )
      dropdown.appendChild(row)
    }
  }

  if (trending.length > 0) {
    const label = el('div', { class: 'px-4 py-2 text-2xs font-semibold text-muted uppercase tracking-wide' }, 'Trending')
    dropdown.appendChild(label)
    const chipRow = el('div', { class: 'flex flex-wrap gap-2 px-4 pb-3' })
    for (const t of trending.slice(0, 6)) {
      const chip = el('button', {
        class: 'px-3 py-1.5 rounded-full bg-canvas dark:bg-surface-dark text-xs font-medium text-ink dark:text-ink-dark hover:bg-brand-tint transition-colors',
        onclick: () => {
          navigate('#/search?q=' + encodeURIComponent(t))
          dropdown.classList.add('hidden')
        },
      }, sanitize(t))
      chipRow.appendChild(chip)
    }
    dropdown.appendChild(chipRow)
  }

  dropdown.classList.remove('hidden')
  renderIcons(dropdown)
}
