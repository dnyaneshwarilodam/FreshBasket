// Skeleton loader for product cards
import { el } from '../utils/dom.js'

export function renderSkeletonCard() {
  return el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-3' },
    el('div', { class: 'skeleton aspect-square mb-2 rounded-xl' }),
    el('div', { class: 'skeleton h-3 w-1/2 mb-1.5 rounded' }),
    el('div', { class: 'skeleton h-3 w-full mb-1.5 rounded' }),
    el('div', { class: 'skeleton h-3 w-2/3 mb-2 rounded' }),
    el('div', { class: 'flex justify-between' },
      el('div', { class: 'skeleton h-5 w-16 rounded' }),
      el('div', { class: 'skeleton h-8 w-16 rounded-xl' }),
    ),
  )
}

export function renderSkeletonRail(count = 6) {
  return Array.from({ length: count }, () => renderSkeletonCard())
}
