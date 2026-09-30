import './styles/animations.css'
import { getState, subscribe, toggleTheme } from './store.js'
import { defineRoute, startRouter, navigate } from './router.js'
import { el, renderIcons, clearNode } from './utils/dom.js'

import { renderNavbar } from './components/navbar.js'
import { renderBottomNav } from './components/bottomNav.js'
import { renderFooter } from './components/footer.js'

import { renderHomePage } from './pages/home.js'
import { renderCategoryPage } from './pages/category.js'
import { renderProductPage } from './pages/product.js'
import { renderSearchPage } from './pages/search.js'
import { renderCheckoutPage } from './pages/checkout.js'
import { renderOrdersPage } from './pages/orders.js'
import { renderAccountPage } from './pages/account.js'
import { renderPlannerPage } from './pages/planner.js'

// ===== Theme =====
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const initialState = getState()
applyTheme(initialState.theme)

subscribe((state) => {
  applyTheme(state.theme)
})

// ===== Route definitions =====
defineRoute('/', (params) => mountPage(() => renderHomePage()))
defineRoute('/category/:slug', (params) => mountPage(() => renderCategoryPage(params)))
defineRoute('/product/:id', (params) => mountPage(() => renderProductPage(params)))
defineRoute('/search?q=', (params) => mountPage(() => renderSearchPage(params)))
defineRoute('/checkout', (params) => mountPage(() => renderCheckoutPage()))
defineRoute('/orders', (params) => mountPage(() => renderOrdersPage()))
defineRoute('/orders/:id', (params) => mountPage(() => renderOrdersPage(params)))
defineRoute('/account', (params) => mountPage(() => renderAccountPage()))
defineRoute('/planner', (params) => mountPage(() => renderPlannerPage()))

// ===== Layout =====
let appContainer = null
let pageContainer = null
let contentWrapper = null

function buildLayout() {
  appContainer = document.getElementById('app')
  clearNode(appContainer)
  appContainer.className = 'min-h-screen'

  // Navbar
  const navbar = renderNavbar()
  appContainer.appendChild(navbar)

  // Content wrapper
  contentWrapper = el('div', { id: 'content-wrapper', class: 'pb-16 lg:pb-0' })
  pageContainer = el('main', { id: 'page-container', role: 'main' })
  contentWrapper.appendChild(pageContainer)
  appContainer.appendChild(contentWrapper)

  // Footer
  const footer = renderFooter()
  contentWrapper.appendChild(footer)

  // Bottom nav (mobile)
  const bottomNav = renderBottomNav()
  appContainer.appendChild(bottomNav)

  renderIcons(appContainer)
}

function mountPage(renderFn) {
  if (!pageContainer) buildLayout()
  clearNode(pageContainer)
  const page = renderFn()
  if (page) pageContainer.appendChild(page)
  renderIcons(pageContainer)

  // Re-render navbar and bottom nav for active state
  const oldNav = document.getElementById('navbar')
  const newNav = renderNavbar()
  if (oldNav) oldNav.replaceWith(newNav)

  const oldBottom = appContainer.querySelector('nav[aria-label="Bottom navigation"]')
  const newBottom = renderBottomNav()
  if (oldBottom) oldBottom.replaceWith(newBottom)

  renderIcons(appContainer)

  // Scroll to top on page change
  window.scrollTo(0, 0)

  // Setup scroll animations
  setupScrollAnimations()
}

// ===== Scroll animations (IntersectionObserver) =====
function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up')
          entry.target.style.opacity = '1'
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
  )

  // Oberve sections and cards
  const elements = pageContainer.querySelectorAll('section, .scroll-snap-start')
  elements.forEach((el) => {
    el.style.opacity = '0'
    observer.observe(el)
  })
}

// ===== Start =====
startRouter((match) => {
  if (match.notFound) {
    if (!pageContainer) buildLayout()
    clearNode(pageContainer)
    pageContainer.appendChild(
      el('div', { class: 'max-w-content mx-auto px-4 py-20 text-center' },
        el('div', { class: 'text-6xl mb-4' }, '🤷'),
        el('h1', { class: 'font-heading text-2xl font-bold text-ink dark:text-ink-dark mb-2' }, 'Page not found'),
        el('p', { class: 'text-sm text-muted mb-6' }, 'This aisle doesn\'t exist yet.'),
        el('button', {
          class: 'px-6 py-3 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover transition-colors',
          onclick: () => navigate('#/'),
        }, 'Back to home'),
      )
    )
    renderIcons(pageContainer)
  } else {
    match.route.handler(match.params)
  }
})
