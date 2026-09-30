// Account — profile, addresses, wishlist, AI preferences, theme toggle
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { getState, toggleTheme, setAiPrefs, logout, toggleWishlist, addToCart } from '../store.js'
import { getProductById } from '../data/products.js'
import { formatPrice } from '../utils/format.js'
import { toast } from '../components/toast.js'

export function renderAccountPage() {
  const state = getState()

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  page.appendChild(el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold text-ink dark:text-ink-dark mb-4' }, 'Account'))

  const grid = el('div', { class: 'grid lg:grid-cols-2 gap-4' })

  // ===== Profile card =====
  const profile = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  profile.appendChild(el('div', { class: 'flex items-center gap-3 mb-4' },
    el('div', { class: 'w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold' },
      sanitize(state.user?.name?.[0] || 'G'),
    ),
    el('div', {},
      el('div', { class: 'text-sm font-bold text-ink dark:text-ink-dark' }, sanitize(state.user?.name || 'Guest User')),
      el('div', { class: 'text-xs text-muted' }, sanitize(state.user?.phone || 'Not logged in')),
    ),
  ))

  // Theme toggle
  profile.appendChild(el('div', { class: 'flex items-center justify-between py-3 border-t border-line dark:border-line-dark' },
    el('div', { class: 'flex items-center gap-2' },
      icon(state.theme === 'dark' ? 'moon' : 'sun', 18, 'text-muted'),
      el('span', { class: 'text-sm font-medium text-ink dark:text-ink-dark' }, state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'),
    ),
    el('button', {
      class: 'relative w-12 h-6 rounded-full transition-colors ' + (state.theme === 'dark' ? 'bg-brand' : 'bg-line dark:bg-line-dark'),
      onclick: () => toggleTheme(),
      'aria-label': 'Toggle theme',
    },
      el('span', {
        class: 'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ' + (state.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'),
      }),
    ),
  ))

  if (state.user) {
    profile.appendChild(el('button', {
      class: 'w-full mt-3 py-2.5 rounded-xl border border-line dark:border-line-dark text-sm font-medium text-muted hover:text-hot transition-colors',
      onclick: () => { logout(); toast('Logged out', 'info'); navigate('#/') },
    }, 'Logout'))
  }
  grid.appendChild(profile)

  // ===== AI Preferences =====
  const prefs = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  prefs.appendChild(el('div', { class: 'flex items-center gap-2 mb-4' },
    el('span', { class: 'w-8 h-8 rounded-lg ai-gradient flex items-center justify-center' },
      (() => { const s = el('span'); s.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 text-white"></i>'; return s })(),
    ),
    el('h3', { class: 'font-heading text-sm font-bold ai-text' }, 'AI Preferences'),
  ))

  // Diet
  prefs.appendChild(el('div', { class: 'mb-3' },
    el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Diet'),
    el('div', { class: 'flex gap-2' },
      ...['omnivore', 'vegetarian', 'vegan'].map(d =>
        el('button', {
          class: `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${state.aiPrefs.diet === d ? 'ai-gradient text-white' : 'bg-canvas dark:bg-surface-dark text-ink dark:text-ink-dark border border-line dark:border-line-dark'}`,
          onclick: () => { setAiPrefs({ diet: d }); toast('Diet preference updated', 'success') },
        }, d),
      ),
    ),
  ))

  // Household size
  prefs.appendChild(el('div', { class: 'mb-3' },
    el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Household Size'),
    el('div', { class: 'flex items-center gap-2' },
      el('button', {
        class: 'w-8 h-8 rounded-lg border border-line dark:border-line-dark flex items-center justify-center text-ink dark:text-ink-dark hover:border-brand',
        onclick: () => setAiPrefs({ household: Math.max(1, state.aiPrefs.household - 1) }),
      }, '−'),
      el('span', { class: 'text-sm font-bold w-8 text-center', id: 'household-val' }, String(state.aiPrefs.household)),
      el('button', {
        class: 'w-8 h-8 rounded-lg border border-line dark:border-line-dark flex items-center justify-center text-ink dark:text-ink-dark hover:border-brand',
        onclick: () => setAiPrefs({ household: Math.min(10, state.aiPrefs.household + 1) }),
      }, '+'),
    ),
  ))

  // Monthly budget
  prefs.appendChild(el('div', { class: 'mb-3' },
    el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Monthly Budget: ' + formatPrice(state.aiPrefs.monthlyBudget)),
    el('input', {
      type: 'range',
      min: '1000',
      max: '20000',
      step: '500',
      value: state.aiPrefs.monthlyBudget,
      class: 'w-full accent-brand',
      oninput: (e) => setAiPrefs({ monthlyBudget: Number(e.target.value) }),
    }),
  ))

  // Allergies
  prefs.appendChild(el('div', { class: 'mb-3' },
    el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Allergies'),
    el('div', { class: 'flex flex-wrap gap-2' },
      ...['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy'].map(a =>
        el('button', {
          class: `px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${state.aiPrefs.allergies.includes(a) ? 'bg-hot text-white' : 'bg-canvas dark:bg-surface-dark text-ink dark:text-ink-dark border border-line dark:border-line-dark'}`,
          onclick: () => {
            const allergies = state.aiPrefs.allergies.includes(a)
              ? state.aiPrefs.allergies.filter(x => x !== a)
              : [...state.aiPrefs.allergies, a]
            setAiPrefs({ allergies })
          },
        }, a),
      ),
    ),
  ))

  prefs.appendChild(el('p', { class: 'text-2xs text-muted mt-2' }, 'These preferences drive Smart Pick and the AI Assistant.'))

  grid.appendChild(prefs)

  // ===== Saved Addresses =====
  const addrCard = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  addrCard.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Saved Addresses'))
  if (state.savedAddresses.length === 0) {
    addrCard.appendChild(el('p', { class: 'text-sm text-muted' }, 'No saved addresses yet.'))
  } else {
    for (const addr of state.savedAddresses) {
      addrCard.appendChild(el('div', { class: 'flex items-start gap-3 p-3 rounded-xl bg-canvas dark:bg-surface-dark mb-2' },
        icon('map-pin', 18, 'text-brand'),
        el('div', {},
          el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, sanitize(addr.label)),
          el('div', { class: 'text-xs text-muted' }, sanitize(addr.line1 + ', ' + addr.pincode)),
        ),
      ))
    }
  }
  grid.appendChild(addrCard)

  // ===== Wishlist =====
  const wishCard = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  wishCard.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Wishlist (' + state.wishlist.length + ')'))
  if (state.wishlist.length === 0) {
    wishCard.appendChild(el('p', { class: 'text-sm text-muted' }, 'No wishlist items yet.'))
  } else {
    for (const pid of state.wishlist) {
      const product = getProductById(pid)
      if (!product) continue
      wishCard.appendChild(el('div', { class: 'flex items-center gap-3 p-2 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors' },
        el('span', { class: 'text-2xl' }, product.image),
        el('div', { class: 'flex-1 min-w-0' },
          el('div', { class: 'text-sm font-medium text-ink dark:text-ink-dark truncate' }, sanitize(product.name)),
          el('div', { class: 'text-xs text-muted' }, formatPrice(product.price)),
        ),
        el('button', {
          class: 'px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold',
          onclick: () => { addToCart(product); toast('Added to cart', 'success') },
        }, 'Add'),
        el('button', {
          class: 'p-1.5 text-muted hover:text-hot',
          onclick: () => { toggleWishlist(pid); toast('Removed from wishlist', 'info') },
        }, icon('heart', 16, 'text-hot fill-hot')),
      ))
    }
  }
  grid.appendChild(wishCard)

  page.appendChild(grid)
  renderIcons(page)
  return page
}
