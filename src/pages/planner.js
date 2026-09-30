// Smart Basket Planner — budget slider, household, diet, generates list, add all
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { getState, setAiPrefs, addToCart } from '../store.js'
import { planBudget } from '../services/ai.js'
import { products } from '../data/products.js'
import { formatPrice } from '../utils/format.js'
import { toast } from '../components/toast.js'
import { renderProductCard } from '../components/productCard.js'
import { renderRail } from '../components/rail.js'

export function renderPlannerPage() {
  const state = getState()
  let budget = state.aiPrefs.monthlyBudget
  let people = state.aiPrefs.household
  let diet = state.aiPrefs.diet
  let planResult = null
  let loading = false

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4', id: 'planner-page' })

  // Header
  page.appendChild(el('div', { class: 'mb-6' },
    el('div', { class: 'flex items-center gap-2 mb-2' },
      el('span', { class: 'w-8 h-8 rounded-lg ai-gradient flex items-center justify-center' },
        (() => { const s = el('span'); s.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 text-white"></i>'; return s })(),
      ),
      el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold ai-text' }, 'Smart Basket Planner'),
    ),
    el('p', { class: 'text-sm text-muted' }, 'Tell us your budget and preferences. AI builds your monthly grocery list.'),
  ))

  // Input card
  const inputCard = el('div', {
    class: 'relative rounded-3xl p-5 sm:p-6 mb-6 overflow-hidden border-2 border-ai-violet/20',
    style: 'background: linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(37,99,235,0.05) 100%)',
  })

  // Sparkles
  for (let i = 0; i < 5; i++) {
    inputCard.appendChild(el('span', {
      class: 'absolute text-ai-violet/20 animate-twinkle text-sm',
      style: `top:${10 + Math.random() * 70}%; left:${5 + Math.random() * 85}%; animation-delay:${Math.random() * 2}s`,
    }, '✨'))
  }

  const inputContent = el('div', { class: 'relative z-10' })

  // Budget slider
  inputContent.appendChild(el('div', { class: 'mb-4' },
    el('label', { class: 'block text-sm font-semibold text-ink dark:text-ink-dark mb-2' },
      'Monthly Budget: ',
      el('span', { class: 'ai-text font-bold', id: 'budget-display' }, formatPrice(budget)),
    ),
    el('input', {
      type: 'range',
      min: '500',
      max: '10000',
      step: '100',
      value: budget,
      class: 'w-full accent-ai-violet',
      oninput: (e) => { budget = Number(e.target.value); document.getElementById('budget-display').textContent = formatPrice(budget) },
    }),
  ))

  // Household size
  inputContent.appendChild(el('div', { class: 'mb-4' },
    el('label', { class: 'block text-sm font-semibold text-ink dark:text-ink-dark mb-2' }, 'Household Size'),
    el('div', { class: 'flex items-center gap-2' },
      el('button', {
        class: 'w-9 h-9 rounded-lg border border-line dark:border-line-dark flex items-center justify-center text-ink dark:text-ink-dark hover:border-brand',
        onclick: () => { people = Math.max(1, people - 1); updatePeople() },
      }, '−'),
      el('span', { class: 'text-base font-bold w-10 text-center', id: 'people-val' }, String(people)),
      el('button', {
        class: 'w-9 h-9 rounded-lg border border-line dark:border-line-dark flex items-center justify-center text-ink dark:text-ink-dark hover:border-brand',
        onclick: () => { people = Math.min(12, people + 1); updatePeople() },
      }, '+'),
    ),
  ))

  // Diet
  inputContent.appendChild(el('div', { class: 'mb-4' },
    el('label', { class: 'block text-sm font-semibold text-ink dark:text-ink-dark mb-2' }, 'Diet Preference'),
    el('div', { class: 'flex gap-2' },
      ...['omnivore', 'vegetarian', 'vegan'].map(d =>
        el('button', {
          class: `px-4 py-2 rounded-full text-sm font-medium transition-colors ${diet === d ? 'ai-gradient text-white' : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark border border-line dark:border-line-dark'}`,
          onclick: () => { diet = d; updateDiet() },
          'data-diet': d,
        }, d),
      ),
    ),
  ))

  // Generate button
  inputContent.appendChild(el('button', {
    class: 'w-full h-12 rounded-xl ai-gradient text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2',
    id: 'generate-btn',
    onclick: () => generatePlan(),
  },
    icon('sparkles', 18),
    el('span', {}, 'Generate Smart Basket'),
  ))

  inputCard.appendChild(inputContent)
  page.appendChild(inputCard)

  // Results area
  const results = el('div', { id: 'planner-results' })
  page.appendChild(results)

  // Free AI input field (from AI Spotlight)
  const aiInput = el('input', {
    type: 'text',
    id: 'planner-input',
    placeholder: 'Or describe what you need...',
    class: 'hidden',
  })
  page.appendChild(aiInput)

  function updatePeople() {
    const el = document.getElementById('people-val')
    if (el) el.textContent = String(people)
    setAiPrefs({ household: people })
  }

  function updateDiet() {
    document.querySelectorAll('[data-diet]').forEach(b => {
      b.className = `px-4 py-2 rounded-full text-sm font-medium transition-colors ${b.dataset.diet === diet ? 'ai-gradient text-white' : 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark border border-line dark:border-line-dark'}`
    })
    setAiPrefs({ diet })
  }

  async function generatePlan() {
    const btn = document.getElementById('generate-btn')
    btn.disabled = true
    btn.innerHTML = ''
    btn.appendChild(el('div', { class: 'w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' }))
    btn.appendChild(el('span', {}, 'AI is planning your basket...'))

    clearNode(results)
    results.appendChild(renderLoadingState())

    const result = await planBudget({ budget, people, diet })
    planResult = result

    clearNode(results)
    results.appendChild(renderPlanResult(result))

    btn.disabled = false
    btn.innerHTML = ''
    btn.appendChild(icon('sparkles', 18))
    btn.appendChild(el('span', {}, 'Regenerate'))
    renderIcons(btn)
  }

  function renderLoadingState() {
    return el('div', { class: 'space-y-3' },
      ...[1, 2, 3].map(() =>
        el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' },
          el('div', { class: 'skeleton h-4 w-1/3 mb-3 rounded' }),
          el('div', { class: 'skeleton h-8 w-full rounded' }),
        ),
      ),
    )
  }

  function renderPlanResult(result) {
    const wrap = el('div', {})

    // Summary
    wrap.appendChild(el('div', { class: 'flex items-center justify-between p-4 rounded-2xl bg-brand-tint mb-4' },
      el('div', {},
        el('div', { class: 'text-sm font-bold text-brand' }, 'Your Smart Basket is ready!'),
        el('div', { class: 'text-xs text-muted' }, 'Optimised for ' + people + ' people, ' + diet + ' diet'),
      ),
      el('div', { class: 'text-right' },
        el('div', { class: 'text-lg font-bold text-brand tabular-nums' }, formatPrice(result.total)),
        el('div', { class: 'text-2xs text-muted' }, 'You save ' + formatPrice(result.savings)),
      ),
    ))

    // Budget donut (SVG)
    const colors = ['#0C831F', '#F8CB46', '#E23744', '#2563EB']
    let cumulative = 0
    const total = result.total
    const donutSegments = result.categories.map((cat, i) => {
      const pct = cat.total / total
      const dasharray = `${pct * 100} ${100 - pct * 100}`
      const dashoffset = -cumulative * 100
      cumulative += pct
      return { ...cat, color: colors[i % colors.length], dasharray, dashoffset }
    })

    const donutSvg = `
      <svg width="120" height="120" viewBox="0 0 36 36">
        ${donutSegments.map(s => `<circle cx="18" cy="18" r="15.915" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-dasharray="${s.dasharray}" stroke-dashoffset="${s.dashoffset}"/>`).join('')}
        <text x="18" y="17" text-anchor="middle" font-size="4" font-weight="700" fill="#1C1C1F">${formatPrice(total)}</text>
        <text x="18" y="22" text-anchor="middle" font-size="2.5" fill="#6B7280">total</text>
      </svg>
    `

    const donutCard = el('div', { class: 'flex items-center gap-4 p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark mb-4' },
      el('span', { html: donutSvg }),
      el('div', { class: 'flex-1 space-y-1' },
        ...donutSegments.map(s =>
          el('div', { class: 'flex items-center gap-2' },
            el('span', { class: 'w-3 h-3 rounded-full', style: `background:${s.color}` }),
            el('span', { class: 'text-xs text-ink dark:text-ink-dark flex-1' }, sanitize(s.category)),
            el('span', { class: 'text-xs font-medium tabular-nums' }, formatPrice(s.total)),
          ),
        ),
      ),
    )
    wrap.appendChild(donutCard)

    // Category sections with products
    for (const cat of result.categories) {
      const catProducts = pickProductsForCategory(cat.category, cat.items, diet)
      if (catProducts.length > 0) {
        wrap.appendChild(renderRail(cat.category, catProducts))
      }
    }

    // Add all to cart
    wrap.appendChild(el('div', { class: 'sticky bottom-20 lg:bottom-4 z-30 mt-4' },
      el('button', {
        class: 'w-full h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 shadow-lift',
        onclick: () => {
          const allProducts = []
          for (const cat of result.categories) {
            allProducts.push(...pickProductsForCategory(cat.category, cat.items, diet))
          }
          allProducts.forEach(p => addToCart(p))
          toast(allProducts.length + ' items added to cart! ' + formatPrice(result.total), 'success')
          navigate('#/checkout')
        },
      },
        icon('shopping-basket', 18),
        el('span', {}, 'Add All to Cart — ' + formatPrice(result.total)),
      ),
    ))

    return wrap
  }

  renderIcons(page)
  return page
}

function pickProductsForCategory(categoryName, itemNames, diet) {
  const catMap = {
    'Dairy & Eggs': 'dairy-eggs',
    'Grains & Pulses': 'atta-rice-dal',
    'Vegetables': 'fruits-veg',
    'Oil & Masala': 'oils-masala',
  }
  const catSlug = catMap[categoryName]
  let list = products.filter(p => p.category === catSlug)
  if (diet === 'vegetarian' || diet === 'vegan') list = list.filter(p => p.veg)
  if (diet === 'vegan') list = list.filter(p => !p.tags?.includes('dairy'))

  // Try to match item names
  const matched = []
  for (const name of itemNames) {
    const found = list.find(p => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase()))
    if (found && !matched.includes(found)) matched.push(found)
  }
  // Fill remaining
  for (const p of list) {
    if (matched.length >= 4) break
    if (!matched.includes(p)) matched.push(p)
  }
  return matched.slice(0, 5)
}
