// Home page — hero carousel, service strip, AI spotlight, category grid, rails, coupons, recipes
import { el, icon, renderIcons, sanitize } from '../utils/dom.js'
import { navigate } from '../router.js'
import { banners, trustBar } from '../data/banners.js'
import { categories } from '../data/categories.js'
import { products } from '../data/products.js'
import { recipes, getRecipeProducts } from '../data/recipes.js'
import { coupons } from '../data/coupons.js'
import { renderCategoryTile } from '../components/categoryTile.js'
import { renderRail } from '../components/rail.js'
import { renderProductCard } from '../components/productCard.js'
import { formatPrice } from '../utils/format.js'
import { addToCart, getState } from '../store.js'
import { toast } from '../components/toast.js'

export function renderHomePage() {
  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4' })

  // ===== Hero Carousel =====
  page.appendChild(buildHeroCarousel())

  // ===== Service strip =====
  page.appendChild(buildServiceStrip())

  // ===== AI Spotlight =====
  page.appendChild(buildAISpotlight())

  // ===== Category grid =====
  page.appendChild(buildCategoryGrid())

  // ===== Buy it again rail =====
  const buyItAgain = products.slice(10, 16)
  page.appendChild(renderRail('Buy it again', buyItAgain, { subtitle: 'AI-personalised' }))

  // ===== Coupon cards =====
  page.appendChild(buildCouponCards())

  // ===== Product rails =====
  const trending = products.filter(p => p.tags?.includes('bestseller')).slice(0, 10)
  page.appendChild(renderRail('Trending near you', trending))

  const fresh = products.filter(p => p.category === 'fruits-veg').slice(0, 10)
  page.appendChild(renderRail('Fresh & seasonal', fresh))

  const dairy = products.filter(p => p.category === 'dairy-eggs').slice(0, 10)
  page.appendChild(renderRail('Bestsellers in dairy', dairy))

  const under99 = products.filter(p => p.price < 99).slice(0, 10)
  page.appendChild(renderRail('Under ₹99', under99))

  // ===== Recipes to Cart =====
  page.appendChild(buildRecipesSection())

  // ===== Brand marquee =====
  page.appendChild(buildBrandMarquee())

  renderIcons(page)
  return page
}

// ===== Hero Carousel =====
function buildHeroCarousel() {
  const section = el('section', { class: 'mb-6' })
  const wrap = el('div', { class: 'relative rounded-3xl overflow-hidden h-44 sm:h-56 lg:h-64', id: 'hero-carousel' })

  const track = el('div', { class: 'flex h-full transition-transform duration-500', id: 'hero-track' })
  banners.forEach((banner, i) => {
    const slide = el('div', { class: 'min-w-full h-full relative flex items-center justify-between px-6 sm:px-10', style: 'background:' + banner.bg })
    // Floating emojis
    banner.emojis.forEach((emoji, j) => {
      const float = el('span', {
        class: 'absolute text-3xl sm:text-4xl lg:text-5xl opacity-80 animate-twinkle',
        style: `top:${15 + j * 18}%; right:${8 + j * 12}%; animation-delay:${j * 0.3}s`,
      }, emoji)
      slide.appendChild(float)
    })
    slide.appendChild(el('div', { class: 'relative z-10 max-w-[60%]' },
      el('h2', { class: 'font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold text-white mb-1' }, sanitize(banner.title)),
      el('p', { class: 'text-xs sm:text-sm text-white/90 mb-3' }, sanitize(banner.subtitle)),
      el('button', {
        class: 'px-4 py-2 rounded-xl bg-white text-ink font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity',
        onclick: () => navigate(banner.link),
      }, sanitize(banner.cta)),
    ))
    track.appendChild(slide)
  })
  wrap.appendChild(track)

  // Dots
  const dots = el('div', { class: 'absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5' })
  banners.forEach((_, i) => {
    dots.appendChild(el('button', {
      class: 'w-2 h-2 rounded-full transition-all ' + (i === 0 ? 'bg-white w-6' : 'bg-white/40'),
      'data-hero-dot': i,
      onclick: () => goToSlide(i),
      'aria-label': 'Go to slide ' + (i + 1),
    }))
  })
  wrap.appendChild(dots)

  section.appendChild(wrap)

  let currentSlide = 0
  let autoTimer = null

  function goToSlide(i) {
    currentSlide = i
    track.style.transform = `translateX(-${i * 100}%)`
    dots.querySelectorAll('[data-hero-dot]').forEach((dot, di) => {
      dot.className = 'w-2 h-2 rounded-full transition-all ' + (di === i ? 'bg-white w-6' : 'bg-white/40')
    })
  }

  function startAuto() {
    autoTimer = setInterval(() => goToSlide((currentSlide + 1) % banners.length), 4000)
  }
  function stopAuto() { clearInterval(autoTimer) }

  startAuto()
  wrap.addEventListener('mouseenter', stopAuto)
  wrap.addEventListener('mouseleave', startAuto)

  // Swipe support
  let touchStart = 0
  wrap.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; stopAuto() }, { passive: true })
  wrap.addEventListener('touchend', (e) => {
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) goToSlide(diff > 0 ? (currentSlide + 1) % banners.length : (currentSlide - 1 + banners.length) % banners.length)
    startAuto()
  }, { passive: true })

  return section
}

// ===== Service strip =====
function buildServiceStrip() {
  const services = [
    { icon: '🛒', label: 'Groceries', color: 'bg-brand-tint' },
    { icon: '💊', label: 'Pharmacy', color: 'bg-red-50' },
    { icon: '🐾', label: 'Pet Care', color: 'bg-orange-50' },
    { icon: '📱', label: 'Electronics', color: 'bg-blue-50' },
  ]
  return el('section', { class: 'mb-6' },
    el('div', { class: 'flex gap-3 overflow-x-auto no-scrollbar' },
      ...services.map(s =>
        el('button', {
          class: 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-line dark:border-line-dark shrink-0 hover:shadow-card transition-shadow',
        },
          el('span', { class: 'text-xl' }, s.icon),
          el('span', { class: 'text-sm font-medium text-ink dark:text-ink-dark' }, s.label),
        ),
      ),
    ),
  )
}

// ===== AI Spotlight =====
function buildAISpotlight() {
  const section = el('section', { class: 'mb-6' })
  const card = el('div', {
    class: 'relative rounded-3xl p-6 sm:p-8 overflow-hidden',
    style: 'background: linear-gradient(135deg, #7C3AED 0%, #6d28d9 40%, #2563EB 100%)',
  })

  // Aurora blobs
  card.appendChild(el('div', { class: 'absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-50 animate-aurora', style: 'background:#a78bfa' }))
  card.appendChild(el('div', { class: 'absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-40 animate-aurora', style: 'background:#60a5fa;animation-delay:2s' }))

  // Sparkles
  for (let i = 0; i < 6; i++) {
    card.appendChild(el('span', {
      class: 'absolute text-white/60 animate-twinkle text-lg',
      style: `top:${10 + Math.random() * 70}%; left:${5 + Math.random() * 85}%; animation-delay:${Math.random() * 2}s`,
    }, '✨'))
  }

  const content = el('div', { class: 'relative z-10' },
    el('div', { class: 'flex items-center gap-2 mb-3' },
      el('span', { class: 'w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center' },
        (() => { const s = el('span'); s.innerHTML = '<i data-lucide="sparkles" class="w-4 h-4 text-white"></i>'; return s })(),
      ),
      el('span', { class: 'text-sm font-semibold text-white' }, 'AI Spotlight'),
    ),
    el('h2', { class: 'font-heading text-xl sm:text-2xl font-extrabold text-white mb-1' }, 'Tell us what you\'re craving.'),
    el('p', { class: 'text-sm text-white/90 mb-4' }, 'We\'ll fill your cart.'),
  )

  // Input
  const inputRow = el('div', { class: 'flex gap-2 mb-3' })
  const input = el('input', {
    type: 'text',
    id: 'ai-spotlight-input',
    placeholder: 'e.g. Weekend biryani for 4',
    class: 'flex-1 h-11 px-4 rounded-xl bg-white/95 text-ink placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-white',
  })
  const submitBtn = el('button', {
    class: 'px-4 py-2.5 rounded-xl bg-white text-ai-violet font-semibold text-sm hover:opacity-90 transition-opacity shrink-0',
    onclick: () => {
      const q = input.value.trim()
      if (q) {
        navigate('#/planner')
        // Pre-fill will be handled by planner page
        setTimeout(() => {
          const plannerInput = document.getElementById('planner-input')
          if (plannerInput) plannerInput.value = q
        }, 100)
      } else {
        navigate('#/planner')
      }
    },
  }, 'Ask AI')
  inputRow.appendChild(input)
  inputRow.appendChild(submitBtn)
  content.appendChild(inputRow)

  // Example chips
  const chips = el('div', { class: 'flex flex-wrap gap-2' })
  for (const chip of ['Weekend biryani for 4', 'Healthy lunchbox for kids', '₹500 monthly essentials']) {
    chips.appendChild(el('button', {
      class: 'px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-medium hover:bg-white/25 transition-colors backdrop-blur',
      onclick: () => { input.value = chip; submitBtn.click() },
    }, sanitize(chip)))
  }
  content.appendChild(chips)

  card.appendChild(content)
  section.appendChild(card)
  return section
}

// ===== Category grid =====
function buildCategoryGrid() {
  const section = el('section', { class: 'mb-6' })
  section.appendChild(el('h2', { class: 'font-heading text-lg sm:text-xl font-bold text-ink dark:text-ink-dark mb-3' }, 'Shop by category'))
  const grid = el('div', { class: 'grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3' })
  categories.forEach(c => grid.appendChild(renderCategoryTile(c)))
  section.appendChild(grid)
  return section
}

// ===== Coupon cards =====
function buildCouponCards() {
  const section = el('section', { class: 'mb-6' })
  section.appendChild(el('h2', { class: 'font-heading text-lg sm:text-xl font-bold text-ink dark:text-ink-dark mb-3' }, 'Offers for you'))
  const grid = el('div', { class: 'grid grid-cols-1 sm:grid-cols-3 gap-3' })
  for (const c of coupons) {
    const card = el('div', {
      class: 'relative rounded-2xl border-2 border-dashed p-4 overflow-hidden',
      style: `border-color:${c.textColor}`,
    },
      el('div', { class: 'flex items-center justify-between' },
        el('div', {},
          el('div', { class: 'text-base font-bold', style: `color:${c.textColor}` }, sanitize(c.title)),
          el('div', { class: 'text-xs text-muted' }, sanitize(c.subtitle)),
          el('div', { class: 'text-2xs text-muted mt-1' }, 'Min order: ' + formatPrice(c.minOrder)),
        ),
        el('button', {
          class: 'px-3 py-1.5 rounded-lg text-2xs font-bold border-2 transition-colors',
          style: `border-color:${c.textColor};color:${c.textColor}`,
          onclick: () => {
            navigator.clipboard?.writeText(c.code).then(() => toast('Code ' + c.code + ' copied!', 'success')).catch(() => toast('Code: ' + c.code, 'info'))
          },
        }, 'COPY ' + c.code),
      ),
    )
    grid.appendChild(card)
  }
  section.appendChild(grid)
  return section
}

// ===== Recipes to Cart =====
function buildRecipesSection() {
  const section = el('section', { class: 'mb-6' })
  section.appendChild(el('div', { class: 'flex items-center justify-between mb-3' },
    el('h2', { class: 'font-heading text-lg sm:text-xl font-bold text-ink dark:text-ink-dark' }, 'Recipes to Cart'),
    el('span', { class: 'text-2xs text-muted' }, 'Add all ingredients in one tap'),
  ))

  const grid = el('div', { class: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' })
  for (const recipe of recipes.slice(0, 6)) {
    const recipeProducts = getRecipeProducts(recipe)
    const total = recipeProducts.reduce((sum, p) => sum + p.price, 0)

    const card = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4 hover:shadow-card-hover transition-shadow' },
      el('div', { class: 'flex items-start gap-3 mb-3' },
        el('span', { class: 'text-4xl' }, recipe.image),
        el('div', { class: 'flex-1' },
          el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark' }, sanitize(recipe.name)),
          el('div', { class: 'flex items-center gap-2 text-2xs text-muted mt-0.5' },
            el('span', {}, recipe.cookTime),
            el('span', {}, '•'),
            el('span', {}, recipe.servings + ' servings'),
            el('span', {}, '•'),
            el('span', {}, recipe.difficulty),
          ),
          el('p', { class: 'text-2xs text-muted mt-1 line-clamp-2' }, sanitize(recipe.description)),
        ),
      ),
      el('div', { class: 'flex items-center justify-between' },
        el('div', { class: 'flex -space-x-2' },
          ...recipeProducts.slice(0, 5).map(p =>
            el('span', { class: 'w-7 h-7 rounded-full bg-canvas dark:bg-surface-dark border-2 border-surface dark:border-surface-dark flex items-center justify-center text-sm' }, p.image),
          ),
          recipeProducts.length > 5 ? el('span', { class: 'w-7 h-7 rounded-full bg-canvas dark:bg-surface-dark border-2 border-surface dark:border-surface-dark flex items-center justify-center text-2xs font-bold text-muted' }, '+' + (recipeProducts.length - 5)) : null,
        ),
        el('button', {
          class: 'px-3 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors',
          onclick: () => {
            recipeProducts.forEach(p => addToCart(p))
            toast(recipe.name + ' — ' + recipeProducts.length + ' items added! ' + formatPrice(total), 'success')
          },
        }, 'Add all (' + formatPrice(total) + ')'),
      ),
    )
    grid.appendChild(card)
  }
  section.appendChild(grid)
  return section
}

// ===== Brand marquee =====
function buildBrandMarquee() {
  const brands = ['Amul', 'Britannia', 'Nestle', 'Tata', 'Haldiram\'s', 'Lay\'s', 'Coca-Cola', 'Pepsi', 'Kellogg\'s', 'Quaker', 'MDH', 'Everest', 'Aashirvaad', 'India Gate', 'Pampers', 'Pedigree']
  const doubled = [...brands, ...brands]

  return el('section', { class: 'mb-6 overflow-hidden' },
    el('div', { class: 'flex gap-8 animate-marquee whitespace-nowrap py-3' },
      ...doubled.map(b =>
        el('span', { class: 'text-lg font-heading font-bold text-muted/50 shrink-0' }, sanitize(b)),
      ),
    ),
  )
}
