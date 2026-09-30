// Checkout — stepper: Address, Slot, Payment, Review + success screen
import { el, icon, renderIcons, sanitize, clearNode } from '../utils/dom.js'
import { navigate } from '../router.js'
import { getCartItems, getCartTotal, getCartMrpTotal, clearCart, addOrder, getState, addSavedAddress } from '../store.js'
import { placeOrder } from '../services/api.js'
import { formatPrice, uid } from '../utils/format.js'
import { toast } from '../components/toast.js'
import { fireConfetti } from '../utils/confetti.js'

export function renderCheckoutPage() {
  const items = getCartItems()
  const total = getCartTotal()
  const mrpTotal = getCartMrpTotal()
  const savings = mrpTotal - total
  const deliveryFee = total >= 199 ? 0 : 25
  const finalTotal = total + deliveryFee

  // If cart empty, show message
  if (items.length === 0) {
    return el('div', { class: 'max-w-content mx-auto px-4 py-20 text-center' },
      el('div', { class: 'text-6xl mb-4' }, '🧺'),
      el('h1', { class: 'font-heading text-xl font-bold text-ink dark:text-ink-dark mb-2' }, 'Your cart is empty'),
      el('p', { class: 'text-sm text-muted mb-6' }, 'Add some items before checking out.'),
      el('button', {
        class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm',
        onclick: () => navigate('#/'),
      }, 'Start shopping'),
    )
  }

  let step = 0 // 0: Address, 1: Slot, 2: Payment, 3: Review
  const steps = ['Address', 'Slot', 'Payment', 'Review']

  const page = el('div', { class: 'max-w-content mx-auto px-4 lg:px-6 py-4', id: 'checkout-page' })

  // Title
  page.appendChild(el('h1', { class: 'font-heading text-xl sm:text-2xl font-bold text-ink dark:text-ink-dark mb-4' }, 'Checkout'))

  // Stepper indicator
  const stepper = el('div', { class: 'flex items-center gap-2 mb-6' })
  steps.forEach((label, i) => {
    if (i > 0) stepper.appendChild(el('div', { class: `flex-1 h-0.5 ${i <= step ? 'bg-brand' : 'bg-line dark:bg-line-dark'}` }))
    stepper.appendChild(el('div', { class: 'flex items-center gap-2' },
      el('span', {
        class: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-brand text-white' : 'bg-canvas dark:bg-surface-dark text-muted border border-line dark:border-line-dark'}`,
      }, i < step ? '✓' : String(i + 1)),
      el('span', { class: `text-xs font-medium hidden sm:inline ${i <= step ? 'text-ink dark:text-ink-dark' : 'text-muted'}` }, label),
    ))
  })
  page.appendChild(stepper)

  // Content area
  const content = el('div', { id: 'checkout-content', class: 'grid lg:grid-cols-3 gap-6' })
  page.appendChild(content)

  // Summary sidebar (sticky on desktop)
  const summary = el('div', { class: 'lg:col-span-1 order-last lg:order-last' })
  const summaryCard = el('div', { class: 'lg:sticky lg:top-20 bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
  summaryCard.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Order Summary'))
  const itemsList = el('div', { class: 'space-y-2 mb-3 max-h-48 overflow-y-auto' })
  for (const item of items) {
    itemsList.appendChild(el('div', { class: 'flex items-center justify-between text-xs' },
      el('div', { class: 'flex items-center gap-2 min-w-0' },
        el('span', { class: 'text-lg shrink-0' }, item.image),
        el('span', { class: 'truncate text-ink dark:text-ink-dark' }, item.qty + '× ' + sanitize(item.name)),
      ),
      el('span', { class: 'font-medium tabular-nums text-ink dark:text-ink-dark shrink-0' }, formatPrice(item.price * item.qty)),
    ))
  }
  summaryCard.appendChild(itemsList)

  const billLines = [
    { label: 'Item total', value: formatPrice(mrpTotal) },
    { label: 'Product discount', value: '-' + formatPrice(savings), isBrand: true },
    { label: 'Delivery fee', value: deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee), isBrand: deliveryFee === 0 },
  ]
  for (const line of billLines) {
    summaryCard.appendChild(el('div', { class: 'flex justify-between text-xs mb-1' },
      el('span', { class: 'text-muted' }, line.label),
      el('span', { class: `tabular-nums ${line.isBrand ? 'text-brand font-medium' : 'text-ink dark:text-ink-dark'}` }, line.value),
    ))
  }
  summaryCard.appendChild(el('div', { class: 'flex justify-between text-sm font-bold pt-2 border-t border-line dark:border-line-dark' },
    el('span', { class: 'text-ink dark:text-ink-dark' }, 'To Pay'),
    el('span', { class: 'tabular-nums text-ink dark:text-ink-dark' }, formatPrice(finalTotal)),
  ))
  summary.appendChild(summaryCard)
  page.appendChild(summary)

  // Step content
  const stepContent = el('div', { class: 'lg:col-span-2', id: 'step-content' })
  content.appendChild(stepContent)
  content.appendChild(summary)

  renderStep()

  function renderStep() {
    clearNode(stepContent)
    if (step === 0) stepContent.appendChild(renderAddressStep())
    else if (step === 1) stepContent.appendChild(renderSlotStep())
    else if (step === 2) stepContent.appendChild(renderPaymentStep())
    else if (step === 3) stepContent.appendChild(renderReviewStep())
    renderIcons(stepContent)
  }

  function renderAddressStep() {
    const state = getState()
    const wrap = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
    wrap.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Delivery Address'))

    // Saved addresses
    if (state.savedAddresses.length > 0) {
      for (const addr of state.savedAddresses) {
        wrap.appendChild(el('div', { class: 'flex items-center gap-3 p-3 rounded-xl border border-line dark:border-line-dark mb-2 cursor-pointer hover:border-brand' },
          icon('home', 18, 'text-brand'),
          el('div', { class: 'flex-1' },
            el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, sanitize(addr.label)),
            el('div', { class: 'text-xs text-muted' }, sanitize(addr.line1 + ', ' + addr.pincode)),
          ),
          icon('check-circle-2', 18, 'text-brand'),
        ))
      }
    }

    // Form
    wrap.appendChild(el('div', { class: 'mt-4' },
      el('p', { class: 'text-sm font-semibold text-ink dark:text-ink-dark mb-3' }, 'Add new address'),
    ))

    const form = el('div', { class: 'space-y-3' })
    const inputs = {}
    for (const [key, label, type] of [['label', 'Address Label (Home/Work)', 'text'], ['line1', 'Flat / House No, Building', 'text'], ['line2', 'Area, Landmark', 'text'], ['pincode', 'Pincode', 'text']]) {
      const inp = el('input', {
        type: type,
        placeholder: label,
        class: 'w-full h-11 px-4 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand',
      })
      inputs[key] = inp
      form.appendChild(inp)
    }

    wrap.appendChild(form)

    wrap.appendChild(el('button', {
      class: 'w-full mt-4 h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors',
      onclick: () => {
        if (!inputs.label.value.trim() || !inputs.line1.value.trim() || !inputs.pincode.value.trim()) {
          toast('Please fill all address fields', 'warning')
          return
        }
        addSavedAddress({
          label: inputs.label.value,
          line1: inputs.line1.value,
          line2: inputs.line2.value,
          pincode: inputs.pincode.value,
        })
        step = 1
        renderStep()
      },
    }, 'Continue to Slot →'))

    return wrap
  }

  function renderSlotStep() {
    const wrap = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
    wrap.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Delivery Slot'))

    const slots = [
      { type: 'instant', label: 'Instant Delivery', sub: 'In 9 minutes', icon: 'zap', recommended: true },
      { type: 'scheduled', label: 'Scheduled Delivery', sub: 'Choose a time slot', icon: 'clock' },
    ]

    let selectedSlot = 'instant'

    for (const slot of slots) {
      const card = el('div', {
        class: `flex items-center gap-3 p-4 rounded-xl border-2 mb-2 cursor-pointer transition-colors ${slot.recommended ? 'border-brand bg-brand-tint' : 'border-line dark:border-line-dark hover:border-brand'}`,
        onclick: () => {
          selectedSlot = slot.type
          document.querySelectorAll('[data-slot-card]').forEach(c => {
            c.classList.remove('border-brand', 'bg-brand-tint')
            c.classList.add('border-line', 'dark:border-line-dark')
          })
          card.classList.add('border-brand', 'bg-brand-tint')
          card.classList.remove('border-line', 'dark:border-line-dark')
        },
        'data-slot-card': slot.type,
      },
        icon(slot.icon, 22, slot.recommended ? 'text-brand' : 'text-muted'),
        el('div', { class: 'flex-1' },
          el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, slot.label),
          el('div', { class: 'text-xs text-muted' }, slot.sub),
        ),
        slot.recommended ? el('span', { class: 'px-2 py-0.5 rounded-full bg-brand text-white text-2xs font-bold' }, 'RECOMMENDED') : null,
      )
      wrap.appendChild(card)
    }

    wrap.appendChild(el('button', {
      class: 'w-full mt-4 h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors',
      onclick: () => { step = 2; renderStep() },
    }, 'Continue to Payment →'))

    return wrap
  }

  function renderPaymentStep() {
    const wrap = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
    wrap.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Payment Method'))

    const methods = [
      { type: 'upi', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: 'smartphone' },
      { type: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: 'credit-card' },
      { type: 'wallet', label: 'Wallet', sub: 'Paytm, Amazon Pay', icon: 'wallet' },
      { type: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: 'banknote' },
    ]

    let selectedMethod = 'upi'

    for (const method of methods) {
      const card = el('div', {
        class: `flex items-center gap-3 p-4 rounded-xl border-2 mb-2 cursor-pointer transition-colors ${method.type === selectedMethod ? 'border-brand bg-brand-tint' : 'border-line dark:border-line-dark hover:border-brand'}`,
        onclick: () => {
          selectedMethod = method.type
          document.querySelectorAll('[data-payment-card]').forEach(c => {
            c.classList.remove('border-brand', 'bg-brand-tint')
            c.classList.add('border-line', 'dark:border-line-dark')
          })
          card.classList.add('border-brand', 'bg-brand-tint')
          card.classList.remove('border-line', 'dark:border-line-dark')
        },
        'data-payment-card': method.type,
      },
        icon(method.icon, 22, method.type === selectedMethod ? 'text-brand' : 'text-muted'),
        el('div', { class: 'flex-1' },
          el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, method.label),
          el('div', { class: 'text-xs text-muted' }, method.sub),
        ),
        el('span', { class: `w-5 h-5 rounded-full border-2 ${method.type === selectedMethod ? 'border-brand bg-brand' : 'border-line dark:border-line-dark'}` }),
      )
      wrap.appendChild(card)
    }

    wrap.appendChild(el('button', {
      class: 'w-full mt-4 h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors',
      onclick: () => { step = 3; renderStep() },
    }, 'Review Order →'))

    return wrap
  }

  function renderReviewStep() {
    const wrap = el('div', { class: 'bg-surface dark:bg-surface-dark rounded-2xl border border-line dark:border-line-dark p-4' })
    wrap.appendChild(el('h3', { class: 'font-heading text-sm font-bold text-ink dark:text-ink-dark mb-3' }, 'Review & Place Order'))

    // Items
    for (const item of items) {
      wrap.appendChild(el('div', { class: 'flex items-center justify-between py-2 border-b border-line dark:border-line-dark text-sm' },
        el('div', { class: 'flex items-center gap-2' },
          el('span', { class: 'text-lg' }, item.image),
          el('span', { class: 'text-ink dark:text-ink-dark' }, item.qty + '× ' + sanitize(item.name)),
        ),
        el('span', { class: 'font-medium tabular-nums' }, formatPrice(item.price * item.qty)),
      ))
    }

    wrap.appendChild(el('div', { class: 'flex justify-between pt-3 mt-2' },
      el('span', { class: 'text-sm font-bold text-ink dark:text-ink-dark' }, 'Total'),
      el('span', { class: 'text-sm font-bold tabular-nums text-ink dark:text-ink-dark' }, formatPrice(finalTotal)),
    ))

    wrap.appendChild(el('button', {
      class: 'w-full mt-4 h-12 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover transition-colors',
      onclick: async () => {
        wrap.appendChild(el('div', { class: 'text-center py-4' },
          el('div', { class: 'inline-block w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin' }),
          el('span', { class: 'text-sm text-muted ml-2' }, 'Placing order...'),
        ))
        const order = await placeOrder({ items, total: finalTotal })
        addOrder(order)
        clearCart()
        showSuccessScreen(order)
      },
    }, 'Place Order — ' + formatPrice(finalTotal)))

    return wrap
  }

  function showSuccessScreen(order) {
    clearNode(page)
    page.appendChild(el('div', { class: 'max-w-md mx-auto text-center py-12' },
      // Animated checkmark
      el('div', { class: 'mb-6' },
        (() => {
          const svgWrap = el('span')
          svgWrap.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#0C831F" stroke-width="4"
                stroke-dasharray="226" stroke-dashoffset="0" stroke-linecap="round"
                style="animation: drawCheck 0.6s ease-out forwards"/>
              <path d="M 24 40 L 36 52 L 56 28" fill="none" stroke="#0C831F" stroke-width="5"
                stroke-linecap="round" stroke-linejoin="round"
                stroke-dasharray="150" stroke-dashoffset="150"
                style="animation: drawCheck 0.4s ease-out 0.3s forwards"/>
            </svg>
          `
          return svgWrap
        })(),
      ),
      el('h1', { class: 'font-heading text-2xl font-bold text-ink dark:text-ink-dark mb-2' }, 'Order Placed!'),
      el('p', { class: 'text-sm text-muted mb-1' }, 'Sit tight, your groceries are zooming over ⚡'),
      el('p', { class: 'text-sm text-muted mb-6' }, 'Order ID: ' + order.id),

      // ETA countdown
      el('div', { class: 'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-tint mb-6' },
        icon('zap', 18, 'text-brand'),
        el('span', { class: 'text-sm font-bold text-brand' }, 'ETA: ' + order.eta + ' minutes'),
      ),

      el('div', { class: 'flex gap-3 justify-center' },
        el('button', {
          class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors',
          onclick: () => navigate('#/orders/' + order.id),
        }, 'Track Order'),
        el('button', {
          class: 'px-6 py-3 rounded-xl bg-canvas dark:bg-surface-dark text-ink dark:text-ink-dark font-semibold text-sm',
          onclick: () => navigate('#/'),
        }, 'Continue Shopping'),
      ),
    ))
    renderIcons(page)
    fireConfetti()
  }

  renderIcons(page)
  return page
}
