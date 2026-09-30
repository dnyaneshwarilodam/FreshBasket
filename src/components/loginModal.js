// Login modal — phone + OTP UI (mock)
import { getState, setUser, addSavedAddress } from '../store.js'
import { el, icon, renderIcons, clearNode } from '../utils/dom.js'
import { toast } from './toast.js'

let modalEl = null
let step = 'phone' // 'phone' | 'otp'

export function openLoginModal() {
  if (modalEl) modalEl.remove()
  step = 'phone'

  modalEl = el('div', {
    class: 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center',
    'aria-modal': 'true',
    role: 'dialog',
    'aria-label': 'Login',
  })

  const overlay = el('div', {
    class: 'absolute inset-0 bg-black/50 animate-fade-up',
    onclick: () => closeLoginModal(),
  })

  const panel = el('div', {
    class: 'relative w-full sm:max-w-sm bg-surface dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-lift animate-slide-up sm:animate-fade-up p-6',
    id: 'login-panel',
  })

  renderPanel(panel)
  modalEl.appendChild(overlay)
  modalEl.appendChild(panel)
  document.body.appendChild(modalEl)
  renderIcons(modalEl)

  const handler = (e) => { if (e.key === 'Escape') closeLoginModal() }
  document.addEventListener('keydown', handler)
  modalEl._cleanup = () => document.removeEventListener('keydown', handler)
}

function renderPanel(panel) {
  clearNode(panel)

  panel.appendChild(el('div', { class: 'flex items-center justify-between mb-6' },
    el('h2', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark' },
      step === 'phone' ? 'Login or Sign up' : 'Verify OTP',
    ),
    el('button', {
      class: 'p-2 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors',
      onclick: () => closeLoginModal(),
      'aria-label': 'Close',
    }, icon('x', 20, 'text-ink dark:text-ink-dark')),
  ))

  if (step === 'phone') {
    panel.appendChild(el('div', { class: 'flex flex-col items-center mb-6' },
      el('div', { class: 'text-5xl mb-3' }, '🧺'),
      el('p', { class: 'text-sm text-muted text-center' },
        'Get groceries delivered in 10 minutes. Login to save your cart, addresses, and AI preferences.',
      ),
    ))

    panel.appendChild(el('div', { class: 'mb-4' },
      el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Phone Number'),
      el('div', { class: 'flex items-center gap-2' },
        el('span', { class: 'px-3 py-3 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm font-semibold text-ink dark:text-ink-dark' }, '+91'),
        el('input', {
          type: 'tel',
          id: 'phone-input',
          placeholder: 'Enter mobile number',
          maxlength: '10',
          class: 'flex-1 h-12 px-4 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand',
        }),
      ),
    ))

    panel.appendChild(el('button', {
      class: 'w-full h-12 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors mb-3',
      onclick: () => {
        const input = document.getElementById('phone-input')
        const phone = input?.value.trim()
        if (!phone || phone.length < 10) {
          toast('Please enter a valid 10-digit number', 'warning')
          return
        }
        step = 'otp'
        renderPanel(panel)
        renderIcons(panel)
      },
    }, 'Continue'))

    panel.appendChild(el('p', { class: 'text-2xs text-muted text-center' },
      'By continuing, you agree to our Terms & Privacy Policy. This is a mock login.',
    ))
  } else {
    panel.appendChild(el('div', { class: 'flex flex-col items-center mb-6' },
      el('div', { class: 'text-4xl mb-3' }, '📱'),
      el('p', { class: 'text-sm text-muted text-center' },
        'We sent an OTP to +91 ' + (document.getElementById('phone-input')?.value || 'XXXXXXXXXX') + '. Use any 4 digits to login.',
      ),
    ))

    panel.appendChild(el('div', { class: 'mb-4' },
      el('label', { class: 'block text-2xs font-semibold text-muted uppercase tracking-wide mb-1.5' }, 'Enter OTP'),
      el('input', {
        type: 'text',
        id: 'otp-input',
        placeholder: '• • • •',
        maxlength: '4',
        class: 'w-full h-12 px-4 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-center text-lg tracking-[0.5em] font-bold text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand',
      }),
    ))

    panel.appendChild(el('button', {
      class: 'w-full h-12 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors mb-3',
      onclick: () => {
        const otp = document.getElementById('otp-input')?.value.trim()
        if (!otp || otp.length < 4) {
          toast('Please enter a 4-digit OTP', 'warning')
          return
        }
        const phone = document.getElementById('phone-input')?.value || '9999999999'
        setUser({ phone: '+91' + phone, name: 'Guest User' })
        toast('Welcome to FreshBasket AI!', 'success')
        closeLoginModal()
      },
    }, 'Verify & Login'))

    panel.appendChild(el('button', {
      class: 'w-full text-xs text-brand font-medium hover:underline',
      onclick: () => { step = 'phone'; renderPanel(panel); renderIcons(panel) },
    }, '← Change number'))
  }

  renderIcons(panel)
}

export function closeLoginModal() {
  if (modalEl) {
    if (modalEl._cleanup) modalEl._cleanup()
    modalEl.style.opacity = '0'
    modalEl.style.transition = 'opacity 0.2s'
    setTimeout(() => { modalEl?.remove(); modalEl = null }, 200)
  }
}
