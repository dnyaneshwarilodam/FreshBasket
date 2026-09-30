// Location modal — search, use current location, saved addresses, map placeholder
import { getState, addSavedAddress, setAddress } from '../store.js'
import { el, icon, renderIcons, clearNode } from '../utils/dom.js'
import { toast } from './toast.js'

let modalEl = null

export function openLocationModal() {
  if (modalEl) modalEl.remove()

  const state = getState()

  modalEl = el('div', {
    class: 'fixed inset-0 z-[60] flex items-end sm:items-center justify-center',
    'aria-modal': 'true',
    role: 'dialog',
    'aria-label': 'Set delivery location',
  })

  const overlay = el('div', {
    class: 'absolute inset-0 bg-black/50 animate-fade-up',
    onclick: () => closeLocationModal(),
  })

  const panel = el('div', {
    class: 'relative w-full sm:max-w-md bg-surface dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl shadow-lift animate-slide-up sm:animate-fade-up max-h-[85vh] overflow-y-auto',
  })

  // Header
  panel.appendChild(el('div', { class: 'sticky top-0 bg-surface dark:bg-surface-dark px-5 pt-5 pb-3 border-b border-line dark:border-line-dark z-10' },
    el('div', { class: 'flex items-center justify-between mb-3' },
      el('h2', { class: 'font-heading text-lg font-bold text-ink dark:text-ink-dark' }, 'Delivery Location'),
      el('button', {
        class: 'p-2 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors',
        onclick: () => closeLocationModal(),
        'aria-label': 'Close',
      }, icon('x', 20, 'text-ink dark:text-ink-dark')),
    ),
    // Search input
    el('div', { class: 'relative' },
      el('span', { class: 'absolute left-3 top-1/2 -translate-y-1/2 text-muted' }, icon('map-pin', 18)),
      el('input', {
        type: 'text',
        placeholder: 'Search for area, street name...',
        class: 'w-full h-11 pl-10 pr-4 rounded-xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark text-sm text-ink dark:text-ink-dark placeholder:text-muted focus:outline-none focus:border-brand',
        id: 'location-search',
      }),
    ),
  ))

  // Use current location
  panel.appendChild(el('div', { class: 'px-5 py-3' },
    el('button', {
      class: 'w-full flex items-center gap-3 p-3 rounded-xl bg-brand-tint hover:bg-brand-tint transition-colors',
      onclick: () => {
        const addr = { label: 'Current Location', line1: 'Koramangala 5th Block', line2: 'Bengaluru, KA', pincode: '560095' }
        addSavedAddress(addr)
        toast('Location set to ' + addr.label, 'success')
        closeLocationModal()
      },
    },
      el('span', { class: 'w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shrink-0' }, icon('navigation', 20)),
      el('span', { class: 'text-left' },
        el('div', { class: 'text-sm font-semibold text-brand' }, 'Use current location'),
        el('div', { class: 'text-2xs text-muted' }, 'Using GPS'),
      ),
    ),
  ))

  // Saved addresses
  if (state.savedAddresses.length > 0) {
    panel.appendChild(el('div', { class: 'px-5 pb-2' },
      el('h3', { class: 'text-2xs font-semibold text-muted uppercase tracking-wide mb-2' }, 'Saved Addresses'),
    ))
    for (const addr of state.savedAddresses) {
      panel.appendChild(el('div', { class: 'px-5' },
        el('button', {
          class: 'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-canvas dark:hover:bg-surface-dark transition-colors text-left',
          onclick: () => {
            setAddress(addr)
            toast('Delivery location updated', 'success')
            closeLocationModal()
          },
        },
          el('span', { class: 'w-10 h-10 rounded-xl bg-canvas dark:bg-surface-dark flex items-center justify-center shrink-0' },
            icon('home', 18, 'text-muted'),
          ),
          el('span', { class: 'text-left flex-1' },
            el('div', { class: 'text-sm font-semibold text-ink dark:text-ink-dark' }, sanitize(addr.label)),
            el('div', { class: 'text-2xs text-muted' }, sanitize(addr.line1 + ', ' + addr.pincode)),
          ),
        ),
      ))
    }
  }

  // Map placeholder
  panel.appendChild(el('div', { class: 'px-5 py-4' },
    el('div', {
      class: 'relative h-40 rounded-2xl bg-canvas dark:bg-surface-dark border border-line dark:border-line-dark overflow-hidden flex items-center justify-center',
    },
      el('div', { class: 'text-center' },
        el('div', { class: 'text-4xl mb-2' }, '🗺️'),
        el('div', { class: 'text-xs text-muted' }, 'Map placeholder'),
      ),
      el('span', { class: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl animate-pulse-dot' }, '📍'),
    ),
  ))

  modalEl.appendChild(overlay)
  modalEl.appendChild(panel)
  document.body.appendChild(modalEl)
  renderIcons(modalEl)

  // Focus trap
  const searchInput = panel.querySelector('#location-search')
  searchInput?.focus()

  const trapHandler = (e) => {
    if (e.key === 'Escape') closeLocationModal()
  }
  document.addEventListener('keydown', trapHandler)
  modalEl._cleanup = () => document.removeEventListener('keydown', trapHandler)
}

export function closeLocationModal() {
  if (modalEl) {
    if (modalEl._cleanup) modalEl._cleanup()
    modalEl.style.opacity = '0'
    modalEl.style.transition = 'opacity 0.2s'
    setTimeout(() => {
      modalEl?.remove()
      modalEl = null
    }, 200)
  }
}
