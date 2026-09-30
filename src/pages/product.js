// Product detail — gallery, variants, price, ETA, accordions, AI panel, similar rail
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { getProductById, getRelatedProducts, products } from '../data/products.js'
import { renderProductCard } from '../components/productCard.js'
import { renderRail } from '../components/rail.js'
import { formatPrice, discountPercent, savings } from '../utils/format.js'
import { getState, addToCart, toggleWishlist, updateCartQty } from '../store.js'
import { toast } from '../components/toast.js'
import { flyToCart } from '../utils/flyToCart.js'

export function renderProductPage(params) {
  const product = getProductById(params.id)
  if (!product) {
    return el('div', { class: 'max-w-content mx-auto px-4 py-20 text-center' },
      el('div', { class: 'text-6xl mb-4' }, '🔍'),
      el('h1', { class: 'font-heading text-xl font-bold text-ink dark:text-ink-dark mb-2' }, 'Product not found'),
      el('button', {
        class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm',
        onclick: () => navigate('#/'),
      }, 'Back to home'),
    )
  }

  const state = getState()
  const inCart = state.cart[product.id]
  const inWishlist = state.wishlist.includes(product.id)
  const disc = discountPercent(product.price, product.mrp)
  const saveAmt = savings(product.price, product.mrp)
  const related = getRelatedProducts(product)

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  // Breadcrumbs
  page.appendChild(el('nav', { class: 'flex items-center gap-1.5 text-2xs text-muted mb-4', 'aria-label': 'Breadcrumb' },
    el('a', { href: '#/', class: 'hover:text-brand' }, 'Home'),
    el('span', {}, '/'),
    el('a', { href: '#/category/' + product.category, class: 'hover:text-brand' }, product.category),
    el('span', {}, '/'),
    el('span', { class: 'text-ink dark:text-ink-dark font-medium' }, sanitize(product.name)),
  ))

  // Main layout
  const main = el('div', { class: 'grid lg:grid-cols-2 gap-6 mb-8' })

  // ===== Left: Image gallery =====
  const imgSection = el('div', {})
  const imgWrap = el('div', {
    class: 'relative aspect-square rounded-3xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark flex items-center justify-center overflow-hidden',
  },
    el('span', { class: 'text-[120px] sm:text-[160px] transition-transform duration-300 hover:scale-110', id: 'product-main-img' }, product.image),
  )

  // Discount ribbon
  if (disc > 0) {
    imgWrap.appendChild(el('div', {
      class: 'absolute top-3 left-3 px-2 py-1 rounded-lg bg-hot text-white text-xs font-bold',
    }, disc + '% OFF'))
  }

  // Wishlist
  imgWrap.appendChild(el('button', {
    class: 'absolute top-3 right-3 w-10 h-10 rounded-full bg-surface/90 dark:bg-surface-dark/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform',
    onclick: () => {
      toggleWishlist(product.id)
      toast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'info')
    },
    'aria-label': 'Toggle wishlist',
  }, icon(inWishlist ? 'heart' : 'heart', 20, inWishlist ? 'text-hot fill-hot' : 'text-muted')))

  imgSection.appendChild(imgWrap)

  // Variant chips
  if (product.variants && product.variants.length > 1) {
    const variantRow = el('div', { class: 'flex gap-2 mt-3 flex-wrap' })
    product.variants.forEach((v, i) => {
      variantRow.appendChild(el('button', {
        class: `px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${i === 0 ? 'border-brand bg-brand-tint text-brand' : 'border-line dark:border-line-dark text-ink dark:text-ink-dark hover:border-brand'}`,
      }, sanitize(v)))
    })
    imgSection.appendChild(variantRow)
  }

  main.appendChild(imgSection)

  // ===== Right: Product info =====
  const info = el('div', {})

  // Brand + veg
  info.appendChild(el('div', { class: 'flex items-center gap-2 mb-2' },
    el('span', { class: 'w-4 h-4 rounded-sm border-2 flex items-center justify-center ' + (product.veg ? 'border-brand' : 'border-hot') },
      el('span', { class: 'w-1.5 h-1.5 rounded-full ' + (product.veg ? 'bg-brand' : 'bg-hot') }),
    ),
    el('span', { class: 'text-sm text-muted' }, sanitize(product.brand)),
  ))

  // Title
  info.appendChild(el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold text-ink dark:text-ink-dark mb-2' }, sanitize(product.name)))

  // Rating
  info.appendChild(el('div', { class: 'flex items-center gap-3 mb-4' },
    el('span', { class: 'flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-tint text-brand text-sm font-semibold' },
      icon('star', 14), el('span', {}, product.rating.toFixed(1)),
    ),
    el('span', { class: 'text-xs text-muted' }, product.reviews.toLocaleString() + ' reviews'),
    el('span', { class: 'flex items-center gap-0.5 px-2 py-1 rounded-lg bg-canvas dark:bg-surface-dark text-ink dark:text-ink-dark text-xs font-semibold' },
      icon('zap', 12, 'text-brand'), el('span', {}, product.deliveryMins + ' min'),
    ),
  ))

  // Price
  info.appendChild(el('div', { class: 'flex items-baseline gap-2 mb-4' },
    el('span', { class: 'text-2xl font-bold text-ink dark:text-ink-dark tabular-nums' }, formatPrice(product.price)),
    disc > 0 ? el('span', { class: 'text-base text-muted line-through tabular-nums' }, formatPrice(product.mrp)) : null,
    saveAmt > 0 ? el('span', { class: 'text-sm text-brand font-medium' }, 'Save ' + formatPrice(saveAmt)) : null,
  ))

  // Unit
  info.appendChild(el('div', { class: 'text-sm text-muted mb-4' }, sanitize(product.unit)))

  // ADD button / stepper
  const addWrap = el('div', { class: 'mb-6' })
  const addBtn = el('button', {
    class: 'w-full sm:w-auto px-8 py-3 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors flex items-center justify-center gap-2',
    onclick: () => {
      addToCart(product)
      const img = document.getElementById('product-main-img')
      if (img) flyToCart(img)
      toast(product.name + ' added to cart', 'success')
      // Re-render button
      const state = getState()
      if (state.cart[product.id]) {
        addWrap.innerHTML = ''
        addWrap.appendChild(renderStepper(product, state.cart[product.id]))
        renderIcons(addWrap)
      }
    },
  }, icon('plus', 18), el('span', {}, 'ADD TO CART'))
  addWrap.appendChild(addBtn)
  info.appendChild(addWrap)

  // Accordions
  const accordions = [
    { title: 'Description', content: product.name + ' by ' + product.brand + '. ' + (product.tags?.join(', ') || 'Quality product') + '. Delivery in ' + product.deliveryMins + ' minutes.' },
    { title: 'Nutrition (per 100g)', content: `Calories: ${product.nutrition.calories} kcal | Protein: ${product.nutrition.protein}g | Carbs: ${product.nutrition.carbs}g | Fat: ${product.nutrition.fat}g | Sugar: ${product.nutrition.sugar}g | Sodium: ${product.nutrition.sodium}mg` },
    { title: 'Shelf Life', content: 'Best consumed within 3-5 days of delivery. Store in a cool, dry place.' },
  ]

  for (const acc of accordions) {
    info.appendChild(buildAccordion(acc.title, acc.content))
  }

  main.appendChild(info)
  page.appendChild(main)

  // ===== AI Smart Insights panel =====
  page.appendChild(buildAIInsights(product))

  // ===== Similar products rail =====
  if (related.length > 0) {
    page.appendChild(renderRail('Similar products', related))
  }

  // ===== Sticky mobile ADD bar =====
  const stickyBar = el('div', {
    class: 'lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-surface dark:bg-surface-dark border-t border-line dark:border-line-dark p-3 flex items-center justify-between gap-3',
    id: 'sticky-add-bar',
  },
    el('div', {},
      el('div', { class: 'text-base font-bold text-ink dark:text-ink-dark tabular-nums' }, formatPrice(product.price)),
      el('div', { class: 'text-2xs text-muted' }, sanitize(product.unit)),
    ),
    el('button', {
      class: 'flex-1 max-w-[180px] py-2.5 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors',
      onclick: () => addBtn.click(),
    }, 'ADD TO CART'),
  )
  page.appendChild(stickyBar)

  renderIcons(page)
  return page
}

function renderStepper(product, cartItem) {
  const wrap = el('div', { class: 'flex items-center justify-between rounded-xl border-2 border-brand bg-surface dark:bg-surface-dark overflow-hidden', style: 'width:140px' })
  wrap.appendChild(el('button', {
    class: 'w-10 h-10 flex items-center justify-center text-brand hover:bg-brand-tint transition-colors',
    onclick: () => { updateCartQty(product.id, cartItem.qty - 1) },
  }, icon('minus', 16)))
  wrap.appendChild(el('span', { class: 'text-base font-bold text-brand w-8 text-center tabular-nums' }, String(cartItem.qty)))
  wrap.appendChild(el('button', {
    class: 'w-10 h-10 flex items-center justify-center text-brand hover:bg-brand-tint transition-colors',
    onclick: () => { updateCartQty(product.id, cartItem.qty + 1) },
  }, icon('plus', 16)))
  return wrap
}

function buildAccordion(title, content) {
  const wrap = el('div', { class: 'border-b border-line dark:border-line-dark' })
  const header = el('button', {
    class: 'flex items-center justify-between w-full py-3 text-left',
    onclick: () => {
      const body = wrap.querySelector('[data-acc-body]')
      const chev = wrap.querySelector('[data-acc-chevron]')
      body.classList.toggle('hidden')
      chev.classList.toggle('rotate-180')
    },
  },
    el('span', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, title),
    icon('chevron-down', 18, 'text-muted'),
  )
  header.querySelector('[data-lucide], svg')?.setAttribute('data-acc-chevron', '')
  const chevSpan = header.querySelector('span.inline-flex')
  if (chevSpan) chevSpan.setAttribute('data-acc-chevron', '')

  const body = el('div', { 'data-acc-body': '', class: 'hidden pb-3 text-sm text-muted leading-relaxed' }, sanitize(content))
  wrap.appendChild(header)
  wrap.appendChild(body)
  return wrap
}

function buildAIInsights(product) {
  const section = el('section', { class: 'mb-8' })
  const card = el('div', {
    class: 'relative rounded-3xl p-5 sm:p-6 overflow-hidden border-2 border-ai-violet/20',
    style: 'background: linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(37,99,235,0.05) 100%)',
  })

  // Sparkles
  for (let i = 0; i < 4; i++) {
    card.appendChild(el('span', {
      class: 'absolute text-ai-violet/30 animate-twinkle text-sm',
      style: `top:${10 + Math.random() * 70}%; left:${5 + Math.random() * 85}%; animation-delay:${Math.random() * 2}s`,
    }, '✨'))
  }

  const content = el('div', { class: 'relative z-10' })

  // Header
  content.appendChild(el('div', { class: 'flex items-center gap-2 mb-4' },
    el('span', { class: 'w-8 h-8 rounded-lg ai-gradient flex items-center justify-center' },
      (() => { const s = el('span'); s.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 text-white"></i>'; return s })(),
    ),
    el('h2', { class: 'font-heading text-base font-bold ai-text' }, 'Smart Insights'),
  ))

  // Health score ring (SVG)
  const scoreWrap = el('div', { class: 'flex items-center gap-4 mb-4' })
  const score = product.healthScore
  const circumference = 2 * Math.PI * 36
  const offset = circumference - (score / 100) * circumference
  const ringColor = score >= 80 ? '#0C831F' : score >= 50 ? '#F8CB46' : '#E23744'

  const svg = `
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#ECECEC" stroke-width="6"/>
      <circle cx="40" cy="40" r="36" fill="none" stroke="${ringColor}" stroke-width="6"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 40 40)"
        style="transition: stroke-dashoffset 1s ease-out"/>
      <text x="40" y="44" text-anchor="middle" font-size="20" font-weight="700" fill="${ringColor}">${score}</text>
      <text x="40" y="56" text-anchor="middle" font-size="8" fill="#6B7280">/ 100</text>
    </svg>
  `
  const ringWrap = el('span', { html: svg })
  scoreWrap.appendChild(ringWrap)

  const scoreInfo = el('div', {},
    el('div', { class: 'text-sm font-bold text-ink dark:text-ink-dark' }, 'Health Score'),
    el('div', { class: 'text-xs text-muted mt-0.5' },
      score >= 80 ? 'Excellent choice — nutrient-rich and wholesome' :
      score >= 50 ? 'Moderate — fine in moderation' :
      'Treat yourself — enjoy occasionally',
    ),
  )
  scoreWrap.appendChild(scoreInfo)
  content.appendChild(scoreWrap)

  // Nutrition highlights
  const n = product.nutrition
  const macros = [
    { label: 'Calories', value: n.calories + ' kcal', color: 'text-ink dark:text-ink-dark' },
    { label: 'Protein', value: n.protein + 'g', color: 'text-brand' },
    { label: 'Carbs', value: n.carbs + 'g', color: 'text-ai-blue' },
    { label: 'Fat', value: n.fat + 'g', color: 'text-hot' },
  ]
  const macroGrid = el('div', { class: 'grid grid-cols-4 gap-2 mb-4' })
  for (const m of macros) {
    macroGrid.appendChild(el('div', { class: 'text-center p-2 rounded-xl bg-surface dark:bg-surface-dark' },
      el('div', { class: 'text-xs font-bold ' + m.color }, m.value),
      el('div', { class: 'text-2xs text-muted' }, m.label),
    ))
  }
  content.appendChild(macroGrid)

  // Sugar/sodium warnings
  if (n.sugar > 20) {
    content.appendChild(el('div', { class: 'flex items-center gap-2 p-2.5 rounded-xl bg-hot/10 mb-2' },
      icon('alert-triangle', 16, 'text-hot'),
      el('span', { class: 'text-xs text-hot font-medium' }, 'High sugar content (' + n.sugar + 'g per 100g)'),
    ))
  }
  if (n.sodium > 500) {
    content.appendChild(el('div', { class: 'flex items-center gap-2 p-2.5 rounded-xl bg-hot/10 mb-4' },
      icon('alert-triangle', 16, 'text-hot'),
      el('span', { class: 'text-xs text-hot font-medium' }, 'High sodium (' + n.sodium + 'mg per 100g)'),
    ))
  }

  // Goes well with bundle
  content.appendChild(el('div', { class: 'p-3 rounded-xl bg-surface dark:bg-surface-dark' },
    el('div', { class: 'flex items-center gap-2 mb-2' },
      icon('link', 14, 'text-brand'),
      el('span', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, 'Goes well with'),
    ),
    el('div', { class: 'flex items-center justify-between' },
      el('div', { class: 'flex gap-2' },
        el('span', { class: 'w-8 h-8 rounded-lg bg-canvas dark:bg-surface-dark flex items-center justify-center text-lg' }, '🥛'),
        el('span', { class: 'w-8 h-8 rounded-lg bg-canvas dark:bg-surface-dark flex items-center justify-center text-lg' }, '🍞'),
      ),
      el('button', {
        class: 'px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors',
        onclick: () => {
          const milk = products.find(p => p.id === 13)
          const bread = products.find(p => p.id === 21)
          if (milk) addToCart(milk)
          if (bread) addToCart(bread)
          toast('Bundle added! Save ' + formatPrice(18), 'success')
        },
      }, 'Add bundle, save ' + formatPrice(18)),
    ),
  ))

  card.appendChild(content)
  section.appendChild(card)
  return section
}
