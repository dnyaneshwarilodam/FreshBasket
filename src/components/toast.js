// Global toast system
import { uid } from '../utils/format.js'

let toastContainer = null

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none'
    toastContainer.setAttribute('aria-live', 'polite')
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

export function toast(message, type = 'info', duration = 3000) {
  const container = ensureContainer()
  const id = uid()

  const colors = {
    info: 'bg-surface dark:bg-surface-dark border-line dark:border-line-dark text-ink dark:text-ink-dark',
    success: 'bg-brand text-white border-brand',
    error: 'bg-hot text-white border-hot',
    warning: 'bg-accent text-ink border-accent',
  }

  const icons = {
    info: 'info',
    success: 'check-circle-2',
    error: 'x-circle',
    warning: 'alert-triangle',
  }

  const t = document.createElement('div')
  t.id = `toast-${id}`
  t.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lift border ${colors[type] || colors.info} animate-slide-in max-w-sm`
  t.innerHTML = `<i data-lucide="${icons[type] || icons.info}" class="w-5 h-5 shrink-0"></i><span class="text-sm font-medium flex-1">${message}</span>`
  container.appendChild(t)

  if (window.lucide) window.lucide.createIcons({ root: t })

  // Progress bar
  const bar = document.createElement('div')
  bar.className = 'absolute bottom-0 left-0 h-0.5 bg-current opacity-30 rounded-full'
  bar.style.cssText = `width:100%;transition:width ${duration}ms linear`
  t.style.position = 'relative'
  t.appendChild(bar)
  requestAnimationFrame(() => { bar.style.width = '0%' })

  setTimeout(() => {
    t.style.opacity = '0'
    t.style.transform = 'translateX(100px)'
    t.style.transition = 'all 0.3s ease'
    setTimeout(() => t.remove(), 300)
  }, duration)
}
