// Category tile with hover scale + tilt
import { navigate } from '../router.js'
import { el, sanitize } from '../utils/dom.js'

export function renderCategoryTile(category) {
  const tile = el('button', {
    class: 'group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 hover:scale-105 hover:-rotate-2',
    onclick: () => navigate('#/category/' + category.slug),
    'aria-label': category.name,
  })

  const iconWrap = el('div', {
    class: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-transform duration-300 group-hover:scale-110',
    style: 'background-color: var(--surface-bg, ' + category.color + ')',
  }, category.icon)

  // Use inline style for dark mode
  const darkBg = category.darkColor || category.color
  iconWrap.classList.add('dark:bg-surface-dark')

  tile.appendChild(iconWrap)
  tile.appendChild(el('span', { class: 'text-2xs sm:text-xs font-medium text-ink dark:text-ink-dark text-center leading-tight' }, sanitize(category.name)))

  return tile
}
