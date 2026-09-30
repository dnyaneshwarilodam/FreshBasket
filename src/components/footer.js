// Footer with app download banner and category links
import { categories } from '../data/categories.js'
import { navigate } from '../router.js'
import { el, icon, renderIcons } from '../utils/dom.js'

export function renderFooter() {
  const footer = el('footer', { class: 'mt-12 pb-20 lg:pb-0' })

  // App download banner
  const banner = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 mb-8' },
    el('div', {
      class: 'rounded-3xl bg-gradient-to-br from-brand to-brand-hover p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-white',
    },
      el('div', { class: 'flex-1 text-center sm:text-left' },
        el('h3', { class: 'font-heading text-xl sm:text-2xl font-bold mb-1' }, 'Get groceries in 10 minutes'),
        el('p', { class: 'text-sm opacity-90' }, 'Download the FreshBasket AI app for exclusive deals and AI-powered shopping'),
      ),
      el('div', { class: 'flex gap-3' },
        el('button', {
          class: 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-ink font-semibold text-sm hover:opacity-90 transition-opacity',
        }, icon('apple', 18), el('span', { class: 'flex flex-col items-start leading-none' },
          el('span', { class: 'text-2xs opacity-60' }, 'Download on the'),
          el('span', {}, 'App Store'),
        )),
        el('button', {
          class: 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-ink font-semibold text-sm hover:opacity-90 transition-opacity',
        }, el('span', {}, '▶'), el('span', { class: 'flex flex-col items-start leading-none' },
          el('span', { class: 'text-2xs opacity-60' }, 'GET IT ON'),
          el('span', {}, 'Google Play'),
        )),
      ),
    ),
  )

  // Trust bar
  const trustItems = [
    { icon: 'zap', label: '10 min delivery', sub: 'Lightning fast' },
    { icon: 'leaf', label: 'Fresh quality', sub: 'Farm to door' },
    { icon: 'shield-check', label: 'Quality assured', sub: '100% guaranteed' },
    { icon: 'smartphone', label: 'Easy returns', sub: 'No questions asked' },
  ]
  const trustBar = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 mb-8' },
    el('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-4' },
      ...trustItems.map(t =>
        el('div', { class: 'flex items-center gap-3 p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark' },
          el('span', { class: 'w-10 h-10 rounded-xl bg-brand-tint flex items-center justify-center shrink-0' },
            icon(t.icon, 20, 'text-brand'),
          ),
          el('div', {},
            el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, t.label),
            el('div', { class: 'text-2xs text-muted' }, t.sub),
          ),
        ),
      ),
    ),
  )

  // Category links
  const catLinks = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 mb-8' },
    el('h4', { class: 'text-sm font-semibold text-ink dark:text-ink-dark mb-3' }, 'Top Categories'),
    el('div', { class: 'flex flex-wrap gap-2' },
      ...categories.slice(0, 12).map(c =>
        el('button', {
          class: 'px-3 py-1.5 rounded-full bg-surface dark:bg-surface-dark border border-line dark:border-line-dark text-xs font-medium text-ink dark:text-ink-dark hover:border-brand hover:text-brand transition-colors',
          onclick: () => navigate('#/category/' + c.slug),
        }, c.icon + ' ' + c.name),
      ),
    ),
  )

  // Bottom bar
  const bottom = el('div', { class: 'border-t border-line dark:border-line-dark' },
    el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4' },
      el('div', { class: 'flex items-center gap-2' },
        el('span', { class: 'text-xl' }, '🧺'),
        el('span', { class: 'font-heading font-bold text-sm text-ink dark:text-ink-dark' }, 'FreshBasket AI'),
        el('span', { class: 'text-2xs ai-text font-semibold' }, 'AI'),
      ),
      el('div', { class: 'text-2xs text-muted text-center sm:text-right' },
        '© 2026 FreshBasket AI. Mock demo — no real orders are placed.',
      ),
    ),
  )

  footer.appendChild(trustBar)
  footer.appendChild(banner)
  footer.appendChild(catLinks)
  footer.appendChild(bottom)
  renderIcons(footer)
  return footer
}
