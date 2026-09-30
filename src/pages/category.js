// Category listing — breadcrumbs, sub-category rail, toolbar, product grid
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { categories, subCategories } from '../data/categories.js'
import { getProductsByCategory } from '../data/products.js'
import { renderProductCard } from '../components/productCard.js'
import { renderSkeletonCard } from '../components/skeleton.js'
import { formatPrice } from '../utils/format.js'

export function renderCategoryPage(params) {
  const slug = params.slug || 'fruits-veg'
  const category = categories.find(c => c.slug === slug)
  const subs = subCategories[slug] || []
  const allProducts = getProductsByCategory(slug)

  let activeSub = 'all'
  let sortBy = 'popular'
  let filters = {}
  let visibleCount = 12

  const page = el('div', { id: 'category-page' })

  // Breadcrumbs
  page.appendChild(el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 pt-4' },
    el('nav', { class: 'flex items-center gap-1.5 text-2xs text-muted', 'aria-label': 'Breadcrumb' },
      el('a', { href: '#/', class: 'hover:text-brand' }, 'Home'),
      el('span', {}, '/'),
      el('span', { class: 'text-ink dark:text-ink-dark font-medium' }, category?.name || slug),
    ),
    el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold text-ink dark:text-ink-dark mt-2 mb-4' }, category?.name || 'Category'),
  ))

  // Two-pane layout
  const layout = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 pb-6 flex gap-4' })

  // Left rail (sub-categories) — desktop
  if (subs.length > 0) {
    const leftRail = el('aside', { class: 'hidden lg:block w-56 shrink-0' })
    const railWrap = el('div', { class: 'sticky top-20 space-y-1', id: 'subcat-rail' })
    railWrap.appendChild(renderSubItem('all', 'All', true))
    subs.forEach(sub => railWrap.appendChild(renderSubItem(sub, sub, false)))
    leftRail.appendChild(railWrap)
    layout.appendChild(leftRail)
  }

  // Right content
  const right = el('div', { class: 'flex-1 min-w-0' })

  // Toolbar
  right.appendChild(buildToolbar())

  // Product grid
  const grid = el('div', { id: 'cat-grid', class: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' })
  right.appendChild(grid)

  // Load more / infinite scroll sentinel
  const sentinel = el('div', { id: 'cat-sentinel', class: 'h-10' })
  right.appendChild(sentinel)

  layout.appendChild(right)
  page.appendChild(layout)

  // Render initial products
  renderGrid()

  // Infinite scroll
  setTimeout(() => {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < allProducts.length) {
        visibleCount += 8
        renderGrid()
      }
    }, { rootMargin: '100px' })
    obs.observe(sentinel)
  }, 100)

  function renderSubItem(key, label, isActive) {
    const item = el('button', {
      class: `flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${isActive ? 'bg-brand-tint text-brand font-semibold' : 'text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-surface-dark'}`,
      onclick: () => {
        activeSub = key
        visibleCount = 12
        // Update active states
        document.querySelectorAll('#subcat-rail button').forEach(b => {
          b.classList.remove('bg-brand-tint', 'text-brand', 'font-semibold')
          b.classList.add('text-ink', 'dark:text-ink-dark', 'hover:bg-canvas', 'dark:hover:bg-surface-dark')
        })
        item.classList.add('bg-brand-tint', 'text-brand', 'font-semibold')
        item.classList.remove('text-ink', 'dark:text-ink-dark', 'hover:bg-canvas', 'dark:hover:bg-surface-dark')
        renderGrid()
      },
    },
      el('span', { class: `w-1 h-4 rounded-full ${isActive ? 'bg-brand' : 'bg-transparent'}` }),
      el('span', {}, sanitize(label)),
    )
    return item
  }

  function buildToolbar() {
    const toolbar = el('div', { class: 'flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar' })

    // Sort dropdown
    const sortSelect = el('select', {
      class: 'shrink-0 h-9 px-3 rounded-lg bg-surface dark:bg-surface-dark border border-line dark:border-line-dark text-xs font-medium text-ink dark:text-ink-dark focus:outline-none focus:border-brand',
      onchange: (e) => { sortBy = e.target.value; renderGrid() },
    })
    for (const [val, label] of [['popular', 'Popular'], ['price-low', 'Price: Low to High'], ['price-high', 'Price: High to Low'], ['rating', 'Rating'], ['discount', 'Discount']]) {
      sortSelect.appendChild(el('option', { value: val }, label))
    }
    toolbar.appendChild(sortSelect)

    // Filter chips
    const filterChips = [
      { key: 'veg', label: 'Veg' },
      { key: 'organic', label: 'Organic' },
      { key: 'minRating', label: 'Rating 4+', value: 4 },
      { key: 'sugarFree', label: 'Sugar-free' },
      { key: 'glutenFree', label: 'Gluten-free' },
    ]
    for (const chip of filterChips) {
      const btn = el('button', {
        class: 'shrink-0 px-3 py-1.5 rounded-full border border-line dark:border-line-dark text-xs font-medium text-ink dark:text-ink-dark hover:border-brand hover:text-brand transition-colors',
        onclick: () => {
          if (chip.key === 'minRating') {
            filters[chip.key] = filters[chip.key] ? undefined : chip.value
          } else {
            filters[chip.key] = !filters[chip.key]
          }
          btn.classList.toggle('bg-brand')
          btn.classList.toggle('text-white')
          btn.classList.toggle('border-brand')
          renderGrid()
        },
      }, chip.label)
      toolbar.appendChild(btn)
    }

    // Smart Pick AI toggle
    const smartPick = el('button', {
      class: 'shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-ai-violet/30 text-xs font-medium ai-text hover:bg-ai-violet/10 transition-colors',
      onclick: () => {
        smartPick.classList.toggle('ai-gradient')
        smartPick.classList.toggle('text-white')
        if (smartPick.classList.contains('text-white')) {
          // Smart pick: sort by health score
          sortBy = 'health'
        } else {
          sortBy = 'popular'
        }
        renderGrid()
      },
      title: 'AI picks the healthiest options for you',
    },
      icon('sparkles', 12),
      el('span', {}, 'Smart Pick'),
    )
    toolbar.appendChild(smartPick)

    return toolbar
  }

  function renderGrid() {
    clearNode(grid)

    let list = [...allProducts]
    if (activeSub !== 'all') list = list.filter(p => p.subCategory === activeSub)
    if (filters.veg) list = list.filter(p => p.veg)
    if (filters.organic) list = list.filter(p => p.tags?.includes('organic'))
    if (filters.sugarFree) list = list.filter(p => p.tags?.includes('sugar-free'))
    if (filters.glutenFree) list = list.filter(p => p.tags?.includes('gluten-free'))
    if (filters.minRating) list = list.filter(p => p.rating >= filters.minRating)

    // Sort
    if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    else if (sortBy === 'discount') list.sort((a, b) => discountPct(b) - discountPct(a))
    else if (sortBy === 'health') list.sort((a, b) => b.healthScore - a.healthScore)

    const toShow = list.slice(0, visibleCount)

    if (toShow.length === 0) {
      grid.appendChild(el('div', { class: 'col-span-full text-center py-16' },
        el('div', { class: 'text-5xl mb-3' }, '🔍'),
        el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark mb-1' }, 'No products found'),
        el('p', { class: 'text-sm text-muted' }, 'Try changing filters or check back later.'),
      ))
      return
    }

    // Show skeletons first
    for (let i = 0; i < Math.min(4, toShow.length); i++) {
      grid.appendChild(renderSkeletonCard())
    }

    // Replace with real cards after a brief delay
    setTimeout(() => {
      clearNode(grid)
      for (const product of toShow) {
        grid.appendChild(renderProductCard(product))
      }
      renderIcons(grid)
    }, 200)
  }

  renderIcons(page)
  return page
}

function discountPct(p) {
  if (!p.mrp || p.mrp <= p.price) return 0
  return Math.round(((p.mrp - p.price) / p.mrp) * 100)
}
