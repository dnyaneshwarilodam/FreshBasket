// Cart drawer — right on desktop, bottom sheet on mobile
import { getState, subscribe, getCartItems, getCartCount, getCartTotal, getCartMrpTotal, updateCartQty, removeFromCart, clearCart } from '../store.js'
import { navigate } from '../router.js'
import { el, icon, renderIcons, clearNode, sanitize } from '../utils/dom.js'
import { formatPrice, discountPercent } from '../utils/format.js'
import { toast } from './toast.js'
import { validateCoupon } from '../data/coupons.js'

let drawerEl = null
let lastRemoved = null

export function openCartDrawer() {
  if (drawerEl) { closeCartDrawer(); return }

  renderDrawer()
  subscribe(() => { if (drawerEl) renderCartContent() })
}

export function closeCartDrawer() {
  if (drawerEl) {
    drawerEl.style.opacity = '0'
    drawerEl.querySelector('[data-drawer-panel]')?.classList.add('translate-x-full')
    setTimeout(() => { drawerEl?.remove(); drawerEl = null }, 300)
  }
}

function renderDrawer() {
  drawerEl = el('div', {
    class: 'fixed inset-0 z-[55]',
    'aria-modal': 'true',
    role: 'dialog',
    'aria-label': 'Shopping cart',
  })

  const overlay = el('div', {
    class: 'absolute inset-0 bg-black/50 transition-opacity',
    onclick: () => closeCartDrawer(),
  })

  const panel = el('div', {
    'data-drawer-panel': '',
    class: 'absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-surface dark:bg-surface-dark shadow-lift flex flex-col transition-transform duration-300 lg:animate-slide-right max-h-screen',
  })

  drawerEl.appendChild(overlay)
  drawerEl.appendChild(panel)
  document.body.appendChild(drawerEl)

  renderCartContent()

  const handler = (e) => { if (e.key === 'Escape') closeCartDrawer() }
  document.addEventListener('keydown', handler)
  drawerEl._cleanup = () => document.removeEventListener('keydown', handler)
}

function renderCartContent() {
  if (!drawerEl) return
  const panel = drawerEl.querySelector('[data-drawer-panel]')
  clearNode(panel)

  const items = getCartItems()
  const count = getCartCount()
  const total = getCartTotal()
  const mrpTotal = getCartMrpTotal()
  const savings = mrpTotal - total
  const state = getState()

  // Header
  panel.appendChild(el('div', { class: 'flex items-center justify-between p-4 border-b border-line dark:border-line-dark shrink-0' },
    el('div', {},
      el('h2', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark' }, 'Your Basket'),
      el('p', { class: 'text-2xs text-muted' }, count + ' item' + (count !== 1 ? 's' : '')),
    ),
    el('button', {
      class: 'p-2 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors',
      onclick: () => closeCartDrawer(),
      'aria-label': 'Close cart',
    }, icon('x', 20, 'text-ink dark:text-ink-dark')),
  ))

  if (items.length === 0) {
    // Empty state
    panel.appendChild(el('div', { class: 'flex-1 flex flex-col items-center justify-center p-8 text-center' },
      el('div', { class: 'text-6xl mb-4' }, '🧺'),
      el('h3', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark mb-1' }, 'Your basket is feeling light'),
      el('p', { class: 'text-sm text-muted mb-6' }, 'Add some groceries to get started'),
      el('button', {
        class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors',
        onclick: () => { closeCartDrawer(); navigate('#/') },
      }, 'Start shopping'),
    ))
    renderIcons(panel)
    return
  }

  // ETA banner
  panel.appendChild(el('div', { class: 'px-4 py-2 bg-brand-tint shrink-0' },
    el('div', { class: 'flex items-center gap-2 text-sm text-brand font-medium' },
      icon('zap', 16), el('span', {}, 'Delivery in 9 minutes'),
    ),
  ))

  // Free delivery progress
  const FREE_DELIVERY_THRESHOLD = 199
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total)
  const pct = Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100)

  const progressWrap = el('div', { class: 'px-4 py-3 border-b border-line dark:border-line-dark shrink-0' })
  if (remaining > 0) {
    progressWrap.appendChild(el('p', { class: 'text-2xs text-muted mb-1.5' },
      'Add ' + el('span', { class: 'font-bold text-brand' }, formatPrice(remaining)).outerHTML + ' more for FREE delivery',
    ))
  } else {
    progressWrap.appendChild(el('p', { class: 'text-2xs font-semibold text-brand mb-1.5' }, '🎉 You\'ve unlocked FREE delivery!'))
  }
  const barBg = el('div', { class: 'h-2 rounded-full bg-canvas dark:bg-surface-dark overflow-hidden' })
  const barFill = el('div', {
    class: 'h-full rounded-full bg-brand transition-all duration-500',
    style: `width:${pct}%`,
  })
  barBg.appendChild(barFill)
  progressWrap.appendChild(barBg)
  panel.appendChild(progressWrap)

  // Items
  const itemsWrap = el('div', { class: 'flex-1 overflow-y-auto p-4 space-y-3' })
  for (const item of items) {
    itemsWrap.appendChild(renderCartItem(item))
  }
  panel.appendChild(itemsWrap)

  // Coupon input
  const couponWrap = el('div', { class: 'px-4 py-3 border-t border-line dark:border-line-dark shrink-0' })
  const couponRow = el('div', { class: 'flex gap-2' })
  const couponInput = el('input', {
    type: 'text',
    id: 'coupon-input',
    placeholder: 'Enter coupon code',
    class: 'flex-1 h-10 px-3 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand',
  })
  const couponBtn = el('button', {
    class: 'px-4 py-2 rounded-xl bg-ink dark:bg-ink-dark text-surface dark:text-surface-dark text-sm font-semibold hover:opacity-90 transition-opacity',
    onclick: () => {
      const code = couponInput.value.trim()
      if (!code) return
      const result = validateCoupon(code, total)
      if (result.valid) {
        toast('Coupon ' + code + ' applied! You saved ' + formatPrice(result.discount), 'success')
        drawerEl._discount = result.discount
        renderCartContent()
      } else {
        toast(result.message, 'error')
      }
    },
  }, 'Apply')
  couponRow.appendChild(couponInput)
  couponRow.appendChild(couponBtn)
  couponWrap.appendChild(couponRow)

  // Try coupon chips
  const chipRow = el('div', { class: 'flex gap-2 mt-2 flex-wrap' })
  for (const c of ['FRESH40', 'AI100', 'FREEDEL']) {
    chipRow.appendChild(el('button', {
      class: 'px-2.5 py-1 rounded-full border border-dashed border-brand text-2xs font-semibold text-brand hover:bg-brand-tint transition-colors',
      onclick: () => { couponInput.value = c; couponBtn.click() },
    }, c))
  }
  couponWrap.appendChild(chipRow)
  panel.appendChild(couponWrap)

  // Bill details
  const discount = drawerEl._discount || 0
  const deliveryFee = total >= FREE_DELIVERY_THRESHOLD ? 0 : 25
  const finalTotal = total - discount + deliveryFee

  const billWrap = el('div', { class: 'px-4 py-3 border-t border-line dark:border-line-dark shrink-0 space-y-1.5' })
  billWrap.appendChild(el('div', { class: 'flex justify-between text-xs text-muted' },
    el('span', {}, 'Item total (' + count + ')'), el('span', { class: 'tabular-nums' }, formatPrice(mrpTotal)),
  ))
  if (savings > 0) {
    billWrap.appendChild(el('div', { class: 'flex justify-between text-xs text-brand font-medium' },
      el('span', {}, 'Product discount'), el('span', { class: 'tabular-nums' }, '-' + formatPrice(savings)),
    ))
  }
  billWrap.appendChild(el('div', { class: 'flex justify-between text-xs text-muted' },
    el('span', {}, 'Delivery fee'),
    el('span', { class: 'tabular-nums ' + (deliveryFee === 0 ? 'text-brand font-medium' : '') },
      deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)),
  ))
  if (discount > 0) {
    billWrap.appendChild(el('div', { class: 'flex justify-between text-xs text-brand font-medium' },
      el('span', {}, 'Coupon discount'), el('span', { class: 'tabular-nums' }, '-' + formatPrice(discount)),
    ))
  }
  billWrap.appendChild(el('div', { class: 'flex justify-between text-sm font-bold text-ink dark:text-ink-dark pt-1.5 border-t border-line dark:border-line-dark' },
    el('span', {}, 'To Pay'), el('span', { class: 'tabular-nums', id: 'cart-total-display' }, formatPrice(finalTotal)),
  ))
  panel.appendChild(billWrap)

  // CTA
  panel.appendChild(el('div', { class: 'p-4 shrink-0' },
    el('button', {
      class: 'w-full h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors flex items-center justify-center gap-2',
      onclick: () => {
        closeCartDrawer()
        navigate('#/checkout')
      },
    },
      el('span', {}, 'Proceed to Pay ' + formatPrice(finalTotal)),
      icon('arrow-right', 18),
    ),
  ))

  renderIcons(panel)
}

function renderCartItem(item) {
  const disc = discountPercent(item.price, item.mrp)

  const row = el('div', { class: 'flex gap-3 p-3 rounded-2xl bg-canvas dark:bg-surface-dark', 'data-cart-item': item.id },
    el('span', { class: 'text-3xl shrink-0' }, item.image),
    el('div', { class: 'flex-1 min-w-0' },
      el('div', { class: 'flex items-start justify-between gap-2' },
        el('div', { class: 'flex-1 min-w-0' },
          el('div', { class: 'flex items-center gap-1' },
            el('span', { class: 'w-3 h-3 rounded-full border-2 ' + (item.veg ? 'border-brand' : 'border-hot') },
              el('span', { class: 'block w-1 h-1 rounded-full ' + (item.veg ? 'bg-brand' : 'bg-hot') + ' m-auto mt-[2px]' }),
            ),
            el('span', { class: 'text-2xs text-muted' }, sanitize(item.brand)),
          ),
          el('h4', { class: 'text-sm font-medium text-ink dark:text-ink-dark truncate mt-0.5' }, sanitize(item.name)),
          el('div', { class: 'text-2xs text-muted' }, sanitize(item.unit)),
        ),
        el('button', {
          class: 'p-1.5 rounded-lg hover:bg-line dark:hover:bg-line-dark transition-colors shrink-0',
          onclick: () => {
            lastRemoved = { item: { ...item }, qty: item.qty }
            removeFromCart(item.id)
            toast(item.name + ' removed', 'info')
            // Undo toast
            setTimeout(() => {
              // Show undo via a special toast
            }, 100)
          },
          'aria-label': 'Remove ' + item.name,
        }, icon('trash-2', 16, 'text-muted')),
      ),
      el('div', { class: 'flex items-center justify-between mt-2' },
        el('div', { class: 'flex items-baseline gap-1.5' },
          el('span', { class: 'text-sm font-bold text-ink dark:text-ink-dark tabular-nums' }, formatPrice(item.price)),
          disc > 0 ? el('span', { class: 'text-2xs text-muted line-through tabular-nums' }, formatPrice(item.mrp)) : null,
        ),
        // Stepper
        el('div', { class: 'flex items-center gap-2 rounded-xl border-2 border-brand' },
          el('button', {
            class: 'w-7 h-7 flex items-center justify-center text-brand hover:bg-brand-tint rounded-l-lg transition-colors',
            onclick: () => updateCartQty(item.id, item.qty - 1),
            'aria-label': 'Decrease quantity',
          }, icon('minus', 14)),
          el('span', { class: 'text-sm font-bold text-brand w-6 text-center tabular-nums' }, String(item.qty)),
          el('button', {
            class: 'w-7 h-7 flex items-center justify-center text-brand hover:bg-brand-tint rounded-r-lg transition-colors',
            onclick: () => updateCartQty(item.id, item.qty + 1),
            'aria-label': 'Increase quantity',
          }, icon('plus', 14)),
        ),
      ),
    ),
  )
  return row
}
