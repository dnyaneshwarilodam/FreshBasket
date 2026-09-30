// Tiny pub/sub store with localStorage persistence

const STORAGE_KEY = 'freshbasket_state_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) { /* ignore */ }
}

const defaultState = {
  theme: 'light',
  cart: {},          // { productId: { id, qty, ...product } }
  wishlist: [],      // [productId]
  address: null,     // { label, line1, line2, city, pincode }
  savedAddresses: [],
  user: null,        // { phone, name }
  chatHistory: [],   // [{ role, content, blocks }]
  aiPrefs: {
    diet: 'omnivore',
    allergies: [],
    household: 2,
    monthlyBudget: 5000,
  },
  orders: [],
  recentSearches: [],
  buyItAgain: [],
}

let state = { ...defaultState, ...loadState() }
const listeners = new Set()

export function getState() {
  return state
}

export function setState(patch) {
  state = { ...state, ...patch }
  saveState(state)
  listeners.forEach(fn => fn(state))
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ===== Cart helpers =====

export function addToCart(product, qty = 1) {
  const cart = { ...state.cart }
  const existing = cart[product.id]
  if (existing) {
    cart[product.id] = { ...existing, qty: existing.qty + qty }
  } else {
    cart[product.id] = {
      id: product.id,
      qty,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      unit: product.unit,
      brand: product.brand,
      veg: product.veg,
    }
  }
  setState({ cart })
}

export function updateCartQty(productId, qty) {
  const cart = { ...state.cart }
  if (qty <= 0) {
    delete cart[productId]
  } else {
    cart[productId] = { ...cart[productId], qty }
  }
  setState({ cart })
}

export function removeFromCart(productId) {
  const cart = { ...state.cart }
  delete cart[productId]
  setState({ cart })
}

export function clearCart() {
  setState({ cart: {} })
}

export function getCartItems() {
  return Object.values(state.cart)
}

export function getCartCount() {
  return Object.values(state.cart).reduce((sum, item) => sum + item.qty, 0)
}

export function getCartTotal() {
  return Object.values(state.cart).reduce((sum, item) => sum + item.price * item.qty, 0)
}

export function getCartMrpTotal() {
  return Object.values(state.cart).reduce((sum, item) => sum + (item.mrp || item.price) * item.qty, 0)
}

export function toggleWishlist(productId) {
  const wishlist = state.wishlist.includes(productId)
    ? state.wishlist.filter(id => id !== productId)
    : [...state.wishlist, productId]
  setState({ wishlist })
}

// ===== Address =====

export function setAddress(addr) {
  setState({ address: addr })
}

export function addSavedAddress(addr) {
  setState({ savedAddresses: [...state.savedAddresses, addr], address: addr })
}

// ===== User =====

export function setUser(user) {
  setState({ user })
}

export function logout() {
  setState({ user: null })
}

// ===== Theme =====

export function toggleTheme() {
  setState({ theme: state.theme === 'light' ? 'dark' : 'light' })
}

// ===== AI Prefs =====

export function setAiPrefs(prefs) {
  setState({ aiPrefs: { ...state.aiPrefs, ...prefs } })
}

// ===== Chat =====

export function addChatMessage(msg) {
  setState({ chatHistory: [...state.chatHistory, msg] })
}

export function clearChat() {
  setState({ chatHistory: [] })
}

// ===== Orders =====

export function addOrder(order) {
  setState({ orders: [order, ...state.orders] })
}

// ===== Searches =====

export function addRecentSearch(q) {
  const recentSearches = [q, ...state.recentSearches.filter(s => s !== q)].slice(0, 8)
  setState({ recentSearches })
}
