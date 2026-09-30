// Mock API service with clean boundaries for real API replacement
import { products, getProductById, getProductsByCategory } from '../data/products.js'
import { recipes, getRecipeById, getRecipeProducts } from '../data/recipes.js'
import { coupons, validateCoupon } from '../data/coupons.js'
import { uid } from '../utils/format.js'

function delay(min = 300, max = 800) {
  return new Promise(res => setTimeout(res, min + Math.random() * (max - min)))
}

export async function getProducts({ category, subCategory, sort, filters, page = 1, perPage = 20 } = {}) {
  await delay(200, 500)
  let list = [...products]

  if (category) list = list.filter(p => p.category === category)
  if (subCategory) list = list.filter(p => p.subCategory === subCategory)

  // Apply filters
  if (filters) {
    if (filters.veg) list = list.filter(p => p.veg)
    if (filters.nonVeg) list = list.filter(p => !p.veg)
    if (filters.organic) list = list.filter(p => p.tags?.includes('organic'))
    if (filters.vegan) list = list.filter(p => p.veg && !p.tags?.includes('dairy'))
    if (filters.glutenFree) list = list.filter(p => p.tags?.includes('gluten-free'))
    if (filters.sugarFree) list = list.filter(p => p.tags?.includes('sugar-free'))
    if (filters.minRating) list = list.filter(p => p.rating >= filters.minRating)
    if (filters.maxPrice) list = list.filter(p => p.price <= filters.maxPrice)
    if (filters.minPrice) list = list.filter(p => p.price >= filters.minPrice)
    if (filters.brand) list = list.filter(p => p.brand === filters.brand)
  }

  // Apply sorting
  if (sort === 'price-low') list.sort((a, b) => a.price - b.price)
  else if (sort === 'price-high') list.sort((a, b) => b.price - a.price)
  else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating)
  else if (sort === 'discount') list.sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp)
  else list.sort((a, b) => b.reviews - a.reviews) // popularity

  const start = (page - 1) * perPage
  const items = list.slice(start, start + perPage)
  const hasMore = start + perPage < list.length

  return { items, total: list.length, page, hasMore, isMock: true }
}

export async function getProduct(id) {
  await delay(200, 400)
  return { ...getProductById(id), isMock: true }
}

export async function searchProducts(q) {
  await delay(200, 500)
  if (!q || !q.trim()) return { items: [], isMock: true }
  const query = q.toLowerCase().trim()
  const results = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.brand.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query) ||
    p.subCategory?.toLowerCase().includes(query) ||
    p.tags?.some(t => t.includes(query))
  )
  return { items: results, isMock: true }
}

export async function getSuggestions(q) {
  await delay(50, 150)
  if (!q || !q.trim()) return { products: [], categories: [], isMock: true }
  const query = q.toLowerCase().trim()
  const productSuggestions = products
    .filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    .slice(0, 5)
  return { products: productSuggestions, isMock: true }
}

export async function getTrendingSearches() {
  return ['milk', 'paneer', 'banana', 'atta', 'chocolate', 'ice cream', 'chips', 'tea']
}

export async function placeOrder(payload) {
  await delay(500, 1000)
  const order = {
    id: 'FB' + Date.now().toString(36).toUpperCase(),
    ...payload,
    status: 'placed',
    placedAt: new Date().toISOString(),
    eta: 9,
    timeline: [
      { status: 'placed', label: 'Order Placed', time: new Date().toISOString(), done: true },
      { status: 'packing', label: 'Packing', time: null, done: false },
      { status: 'picked', label: 'Picked Up', time: null, done: false },
      { status: 'onway', label: 'On the Way', time: null, done: false },
      { status: 'delivered', label: 'Delivered', time: null, done: false },
    ],
    isMock: true,
  }
  return order
}

export async function getOrder(id) {
  await delay(200, 400)
  // In mock, return from store — but the caller handles that
  return { isMock: true }
}

export { coupons, validateCoupon, recipes, getRecipeById, getRecipeProducts }
