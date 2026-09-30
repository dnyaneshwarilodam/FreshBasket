// Search page — instant results, fuzzy match highlights, NL banner, voice search
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { products } from '../data/products.js'
import { categories } from '../data/categories.js'
import { renderProductCard } from '../components/productCard.js'
import { formatPrice } from '../utils/format.js'
import { parseNaturalQuery } from '../services/ai.js'
import { addRecentSearch, getState } from '../store.js'
import { isSpeechSupported, startListening } from '../services/speech.js'
import { toast } from '../components/toast.js'

export function renderSearchPage(params) {
  const query = params.q || ''
  addRecentSearch(query)

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  // Search bar
  const searchWrap = el('div', { class: 'relative mb-4' })
  const input = el('input', {
    type: 'text',
    id: 'search-page-input',
    value: query,
    placeholder: 'Search for products...',
    class: 'w-full h-12 pl-12 pr-12 rounded-xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand',
    oninput: (e) => updateResults(e.target.value),
    onkeydown: (e) => {
      if (e.key === 'Enter') {
        navigate('#/search?q=' + encodeURIComponent(e.target.value))
      }
    },
  })
  searchWrap.appendChild(el('span', { class: 'absolute left-3 top-1/2 -translate-y-1/2 text-muted' }, icon('search', 20)))

  // Voice search button
  const voiceBtn = el('button', {
    class: 'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-canvas dark:hover:bg-surface-dark transition-colors',
    onclick: () => openVoiceSearch(input),
    'aria-label': 'Voice search',
  }, icon('mic', 20, 'text-ai-violet'))
  searchWrap.appendChild(voiceBtn)

  searchWrap.appendChild(input)
  page.appendChild(searchWrap)

  // NL banner
  const nlBanner = el('div', { id: 'nl-banner', class: 'hidden mb-4' })
  page.appendChild(nlBanner)

  // Results
  const resultsWrap = el('div', { id: 'search-results' })
  page.appendChild(resultsWrap)

  // Initial results
  updateResults(query)

  async function updateResults(q) {
    if (!q.trim()) {
      clearNode(resultsWrap)
      resultsWrap.appendChild(renderEmptyState())
      return
    }

    // Parse natural language query
    const parsed = await parseNaturalQuery(q)

    // Show NL banner if filters detected
    if (parsed.filters && Object.keys(parsed.filters).length > 0) {
      nlBanner.classList.remove('hidden')
      clearNode(nlBanner)
      nlBanner.appendChild(el('div', { class: 'flex items-center gap-2 flex-wrap p-3 rounded-xl bg-ai-violet/5 border border-ai-violet/20' },
        icon('sparkles', 16, 'text-ai-violet'),
        el('span', { class: 'text-sm font-medium ai-text' }, 'Understood as:'),
        ...renderFilterChips(parsed.filters, nlBanner),
      ))
    } else {
      nlBanner.classList.add('hidden')
    }

    // Filter products
    const query = q.toLowerCase().trim()
    let results = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.subCategory?.toLowerCase().includes(query) ||
      p.tags?.some(t => t.includes(query))
    )

    // Apply NL filters
    if (parsed.filters.maxPrice) results = results.filter(p => p.price <= parsed.filters.maxPrice)
    if (parsed.filters.minPrice) results = results.filter(p => p.price >= parsed.filters.minPrice)
    if (parsed.filters.veg) results = results.filter(p => p.veg)
    if (parsed.filters.nonVeg) results = results.filter(p => !p.veg)
    if (parsed.filters.vegan) results = results.filter(p => p.veg && !p.tags?.includes('dairy'))
    if (parsed.filters.sugarFree) results = results.filter(p => p.tags?.includes('sugar-free'))
    if (parsed.filters.glutenFree) results = results.filter(p => p.tags?.includes('gluten-free'))
    if (parsed.filters.minHealthScore) results = results.filter(p => p.healthScore >= parsed.filters.minHealthScore)

    clearNode(resultsWrap)

    if (results.length === 0) {
      resultsWrap.appendChild(el('div', { class: 'text-center py-16' },
        el('div', { class: 'text-5xl mb-3' }, '🔍'),
        el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark mb-1' }, 'No results for "' + sanitize(q) + '"'),
        el('p', { class: 'text-sm text-muted mb-4' }, 'Try a different search or ask AI!'),
        el('button', {
          class: 'px-4 py-2 rounded-xl ai-gradient text-white font-semibold text-sm',
          onclick: () => navigate('#/planner'),
        }, icon('sparkles', 14), el('span', { class: 'ml-1' }, 'Ask AI')),
      ))
    } else {
      // Result count
      resultsWrap.appendChild(el('p', { class: 'text-sm text-muted mb-3' },
        results.length + ' product' + (results.length !== 1 ? 's' : '') + ' found',
      ))
      // Grid with highlighted matches
      const grid = el('div', { class: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' })
      for (const product of results) {
        grid.appendChild(renderProductCard(product))
      }
      resultsWrap.appendChild(grid)
    }
    renderIcons(resultsWrap)
  }

  function renderFilterChips(filters, banner) {
    const chips = []
    for (const [key, val] of Object.entries(filters)) {
      if (!val) continue
      const label = key === 'maxPrice' ? 'price ≤ ' + formatPrice(val) :
                    key === 'minPrice' ? 'price ≥ ' + formatPrice(val) :
                    key === 'veg' ? 'vegetarian' :
                    key === 'nonVeg' ? 'non-veg' :
                    key === 'vegan' ? 'vegan' :
                    key === 'sugarFree' ? 'sugar-free' :
                    key === 'glutenFree' ? 'gluten-free' :
                    key === 'minHealthScore' ? 'health ≥ ' + val :
                    key === 'minProtein' ? 'protein ≥ ' + val + 'g' : key
      const chip = el('span', {
        class: 'flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface dark:bg-surface-dark border border-ai-violet/20 text-xs font-medium text-ink dark:text-ink-dark',
      },
        el('span', {}, sanitize(label)),
        el('button', {
          class: 'text-muted hover:text-hot',
          onclick: () => { chip.remove() },
          'aria-label': 'Remove filter',
        }, icon('x', 12)),
      )
      chips.push(chip)
    }
    return chips
  }

  function renderEmptyState() {
    const state = getState()
    const trending = ['milk', 'paneer', 'banana', 'atta', 'chocolate', 'ice cream']

    const wrap = el('div', { class: 'py-8' })
    if (state.recentSearches.length > 0) {
      wrap.appendChild(el('div', { class: 'mb-6' },
        el('h3', { class: 'text-sm font-semibold text-ink dark:text-ink-dark mb-2' }, 'Recent searches'),
        el('div', { class: 'flex flex-wrap gap-2' },
          ...state.recentSearches.map(s =>
            el('button', {
              class: 'px-3 py-1.5 rounded-full bg-canvas dark:bg-surface-dark text-xs font-medium text-ink dark:text-ink-dark hover:bg-brand-tint transition-colors',
              onclick: () => { input.value = s; updateResults(s) },
            }, sanitize(s)),
          ),
        ),
      ))
    }

    wrap.appendChild(el('div', {},
      el('h3', { class: 'text-sm font-semibold text-ink dark:text-ink-dark mb-2' }, 'Trending searches'),
      el('div', { class: 'flex flex-wrap gap-2' },
        ...trending.map(s =>
          el('button', {
            class: 'px-3 py-1.5 rounded-full bg-canvas dark:bg-surface-dark text-xs font-medium text-ink dark:text-ink-dark hover:bg-brand-tint transition-colors',
            onclick: () => { input.value = s; updateResults(s); navigate('#/search?q=' + encodeURIComponent(s)) },
          }, sanitize(s)),
        ),
      ),
    ))

    return wrap
  }

  renderIcons(page)
  return page
}

function openVoiceSearch(input) {
  if (!isSpeechSupported()) {
    toast('Voice search not supported on this device', 'warning')
    return
  }

  const modal = el('div', {
    class: 'fixed inset-0 z-[60] flex items-center justify-center',
    'aria-modal': 'true',
    role: 'dialog',
    'aria-label': 'Voice search',
  })
  const overlay = el('div', { class: 'absolute inset-0 bg-black/60' })
  const panel = el('div', { class: 'relative bg-surface dark:bg-surface-dark rounded-3xl p-8 m-4 text-center max-w-sm w-full' })

  panel.appendChild(el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark mb-2' }, 'Listening...'))
  panel.appendChild(el('p', { class: 'text-sm text-muted mb-6' }, 'Speak your search query'))

  // Pulsing rings
  const ringWrap = el('div', { class: 'relative w-24 h-24 mx-auto mb-6' })
  ringWrap.appendChild(el('div', { class: 'absolute inset-0 rounded-full bg-ai-violet/20 animate-ring-pulse' }))
  ringWrap.appendChild(el('div', { class: 'absolute inset-0 rounded-full bg-ai-violet/30 animate-ring-pulse', style: 'animation-delay:0.5s' }))
  ringWrap.appendChild(el('div', { class: 'absolute inset-4 rounded-full ai-gradient flex items-center justify-center' }, icon('mic', 28, 'text-white')))

  // Waveform bars
  const waveWrap = el('div', { class: 'flex items-center justify-center gap-1 h-8 mb-4' })
  for (let i = 0; i < 12; i++) {
    waveWrap.appendChild(el('div', {
      class: 'w-1 rounded-full bg-ai-violet animate-waveform',
      style: `height:100%; animation-delay:${i * 0.08}s`,
    }))
  }
  ringWrap.appendChild(waveWrap)
  panel.appendChild(ringWrap)

  // Status text
  const status = el('div', { id: 'voice-status', class: 'text-sm text-muted mb-4' }, 'Tap the mic and start speaking')
  panel.appendChild(status)

  // Close button
  panel.appendChild(el('button', {
    class: 'px-6 py-2.5 rounded-xl bg-canvas dark:bg-surface-dark text-ink dark:text-ink-dark font-semibold text-sm',
    onclick: () => modal.remove(),
  }, 'Cancel'))

  modal.appendChild(overlay)
  modal.appendChild(panel)
  document.body.appendChild(modal)
  renderIcons(modal)

  overlay.addEventListener('click', () => modal.remove())

  // Start listening
  const recognition = startListening(
    (transcript, isFinal) => {
      status.textContent = transcript
      if (isFinal) {
        input.value = transcript
        navigate('#/search?q=' + encodeURIComponent(transcript))
        modal.remove()
      }
    },
    () => { status.textContent = 'Tap the mic and start speaking' },
    (err) => { status.textContent = 'Could not hear you. Try again.' }
  )
}
