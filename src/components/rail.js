// Horizontal scroll-snap product rail with desktop arrows
import { el, icon, renderIcons } from '../utils/dom.js'
import { renderProductCard } from './productCard.js'

export function renderRail(title, products, options = {}) {
  const section = el('section', { class: 'mb-6' })

  // Header
  const header = el('div', { class: 'flex items-center justify-between mb-3' },
    el('h2', { class: 'font-heading text-lg sm:text-xl font-bold text-ink dark:text-ink-dark' }, title),
    el('div', { class: 'flex items-center gap-2' },
      options.subtitle ? el('span', { class: 'text-2xs text-muted hidden sm:inline' }, options.subtitle) : null,
      el('button', {
        class: 'hidden lg:flex w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-line dark:border-line-dark items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors',
        'data-rail-prev': '',
        'aria-label': 'Scroll left',
      }, icon('chevron-left', 18, 'text-ink dark:text-ink-dark')),
      el('button', {
        class: 'hidden lg:flex w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-line dark:border-line-dark items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors',
        'data-rail-next': '',
        'aria-label': 'Scroll right',
      }, icon('chevron-right', 18, 'text-ink dark:text-ink-dark')),
    ),
  )
  section.appendChild(header)

  // Scroll container
  const scrollWrap = el('div', {
    class: 'flex gap-3 overflow-x-auto no-scrollbar scroll-snap-x pb-2',
    'data-rail-scroll': '',
  })

  for (const product of products) {
    const cardWrap = el('div', { class: 'scroll-snap-start shrink-0 w-36 sm:w-40 lg:w-44' })
    cardWrap.appendChild(renderProductCard(product))
    scrollWrap.appendChild(cardWrap)
  }

  section.appendChild(scrollWrap)

  // Arrow handlers
  setTimeout(() => {
    const prev = section.querySelector('[data-rail-prev]')
    const next = section.querySelector('[data-rail-next]')
    if (prev) prev.addEventListener('click', () => scrollWrap.scrollBy({ left: -400, behavior: 'smooth' }))
    if (next) next.addEventListener('click', () => scrollWrap.scrollBy({ left: 400, behavior: 'smooth' }))
  }, 0)

  renderIcons(section)
  return section
}
