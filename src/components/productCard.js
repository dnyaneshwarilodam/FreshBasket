// Product card — discount ribbon, 9-min badge, veg dot, wishlist, stepper morph, fly-to-cart
import { getState, addToCart, updateCartQty, toggleWishlist } from '../store.js'
import { navigate } from '../router.js'
import { el, icon, renderIcons, sanitize } from '../utils/dom.js'
import { formatPrice, discountPercent, savings } from '../utils/format.js'
import { flyToCart } from '../utils/flyToCart.js'
import { toast } from './toast.js'

export function renderProductCard(product) {
  const state = getState()
  const inCart = state.cart[product.id]
  const inWishlist = state.wishlist.includes(product.id)
  const disc = discountPercent(product.price, product.mrp)
  const saveAmt = savings(product.price, product.mrp)

  const card = el('div', {
    class: 'group relative bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-3 cursor-pointer hover:shadow-card-hover hover:border-brand/30 transition-all duration-300 hover:-translate-y-1',
    'data-product-id': product.id,
  })

  // Image area
  const imgWrap = el('div', {
    class: 'relative aspect-square mb-2 rounded-xl bg-canvas dark:bg-surface-dark flex items-center justify-center overflow-hidden',
    onclick: (e) => { e.stopPropagation(); navigate('#/product/' + product.id) },
  },
    el('span', { class: 'text-5xl sm:text-6xl transition-transform duration-300 group-hover:scale-110' }, product.image),
  )

  // Discount ribbon
  if (disc > 0) {
    imgWrap.appendChild(el('div', {
      class: 'absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-hot text-white text-2xs font-bold',
    }, disc + '% OFF'))
  }

  // 9 min badge
  imgWrap.appendChild(el('div', {
    class: 'absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface/90 dark:bg-surface-dark/90 backdrop-blur text-2xs font-semibold text-ink dark:text-ink-dark',
  },
    icon('zap', 10, 'text-brand'), el('span', {}, product.deliveryMins + ' MINS'),
  ))

  // Wishlist heart
  const heartBtn = el('button', {
    class: 'absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/90 dark:bg-surface-dark/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform',
    onclick: (e) => {
      e.stopPropagation()
      toggleWishlist(product.id)
      heartBtn.classList.add('animate-bounce-once')
      setTimeout(() => heartBtn.classList.remove('animate-bounce-once'), 500)
      toast(inWishlist ? 'Removed from wishlist' : 'Added to wishlist', 'info')
      rerenderHeart(heartBtn, product.id)
    },
    'aria-label': 'Toggle wishlist',
  }, icon(inWishlist ? 'heart' : 'heart', 16, inWishlist ? 'text-hot fill-hot' : 'text-muted'))

  imgWrap.appendChild(heartBtn)
  card.appendChild(imgWrap)

  // Product info
  const info = el('div', { class: 'space-y-1' })

  // Veg dot + brand
  info.appendChild(el('div', { class: 'flex items-center gap-1' },
    el('span', { class: 'w-3 h-3 rounded-sm border-2 flex items-center justify-center shrink-0 ' + (product.veg ? 'border-brand' : 'border-hot') },
      el('span', { class: 'w-1 h-1 rounded-full ' + (product.veg ? 'bg-brand' : 'bg-hot') }),
    ),
    el('span', { class: 'text-2xs text-muted truncate' }, sanitize(product.brand)),
  ))

  // Title (2-line)
  info.appendChild(el('h3', {
    class: 'text-sm font-medium text-ink dark:text-ink-dark leading-tight line-clamp-2 min-h-[2.5rem]',
    onclick: () => navigate('#/product/' + product.id),
  }, sanitize(product.name)))

  // Unit/variant
  info.appendChild(el('div', { class: 'text-2xs text-muted' }, sanitize(product.unit)))

  // Rating
  info.appendChild(el('div', { class: 'flex items-center gap-1' },
    el('span', { class: 'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-tint text-brand text-2xs font-semibold' },
      icon('star', 10), el('span', {}, product.rating.toFixed(1)),
    ),
    el('span', { class: 'text-2xs text-muted' }, product.reviews > 999 ? (product.reviews / 1000).toFixed(1) + 'k' : product.reviews + ' reviews'),
  ))

  // Price + ADD button
  const priceRow = el('div', { class: 'flex items-center justify-between pt-1' })
  const priceWrap = el('div', { class: 'flex flex-col' },
    el('div', { class: 'flex items-baseline gap-1' },
      el('span', { class: 'text-base font-bold text-ink dark:text-ink-dark tabular-nums' }, formatPrice(product.price)),
      disc > 0 ? el('span', { class: 'text-2xs text-muted line-through tabular-nums' }, formatPrice(product.mrp)) : null,
    ),
    saveAmt > 0 ? el('div', { class: 'text-2xs text-brand font-medium' }, 'Save ' + formatPrice(saveAmt)) : null,
  )
  priceRow.appendChild(priceWrap)

  // ADD / Stepper
  const addWrap = el('div', { class: 'shrink-0', 'data-add-wrap': product.id })
  priceRow.appendChild(addWrap)

  renderAddControl(addWrap, product, inCart)

  info.appendChild(priceRow)
  card.appendChild(info)

  renderIcons(card)
  return card
}

function renderAddControl(wrap, product, inCart) {
  wrap.innerHTML = ''
  if (inCart) {
    // Stepper
    const stepper = el('div', {
      class: 'flex items-center justify-between rounded-xl border-2 border-brand bg-surface dark:bg-surface-dark overflow-hidden transition-all',
      style: 'width:88px',
    })
    stepper.appendChild(el('button', {
      class: 'w-7 h-8 flex items-center justify-center text-brand hover:bg-brand-tint transition-colors',
      onclick: (e) => { e.stopPropagation(); updateCartQty(product.id, inCart.qty - 1) },
      'aria-label': 'Decrease',
    }, (() => { const s = el('span'); s.innerHTML = '<i data-lucide="minus" style="width:14px;height:14px"></i>'; return s })() ))
    stepper.appendChild(el('span', { class: 'text-sm font-bold text-brand w-6 text-center tabular-nums' }, String(inCart.qty)))
    stepper.appendChild(el('button', {
      class: 'w-7 h-8 flex items-center justify-center text-brand hover:bg-brand-tint transition-colors',
      onclick: (e) => { e.stopPropagation(); updateCartQty(product.id, inCart.qty + 1) },
      'aria-label': 'Increase',
    }, (() => { const s = el('span'); s.innerHTML = '<i data-lucide="plus" style="width:14px;height:14px"></i>'; return s })() ))
    wrap.appendChild(stepper)
  } else {
    // ADD button
    const btn = el('button', {
      class: 'flex items-center justify-center gap-1 px-3 py-2 rounded-xl border-2 border-brand text-brand font-bold text-xs hover:bg-brand hover:text-white transition-all',
      onclick: (e) => {
        e.stopPropagation()
        addToCart(product)
        // Fly to cart
        const card = e.target.closest('[data-product-id]')
        const img = card?.querySelector('span.text-5xl')
        if (img) flyToCart(img)
        toast(product.name + ' added to cart', 'success')
        // Re-render this control
        const state = getState()
        renderAddControl(wrap, product, state.cart[product.id])
        renderIcons(wrap)
      },
    }, 'ADD')
    wrap.appendChild(btn)
  }
  renderIcons(wrap)
}

function rerenderHeart(heartBtn, productId) {
  const state = getState()
  const inWishlist = state.wishlist.includes(productId)
  heartBtn.innerHTML = ''
  heartBtn.appendChild(icon(inWishlist ? 'heart' : 'heart', 16, inWishlist ? 'text-hot fill-hot' : 'text-muted'))
  renderIcons(heartBtn)
}
