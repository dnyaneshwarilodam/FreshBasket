// Mock AI service — all functions return isMock: true
// Clean boundaries so real APIs can replace them later
import { products } from '../data/products.js'

function delay(min = 400, max = 1200) {
  return new Promise(res => setTimeout(res, min + Math.random() * (max - min)))
}

const mockResponses = {
  biryani: {
    text: "Great choice! Here's everything you need for a weekend biryani for 4. I've put together the full ingredient list — you can add all 9 items to your cart in one tap. The rice and masala are the stars here, so I've picked the best-rated ones.",
    blocks: [
      { type: 'recipe', recipeId: 2, items: 9, total: 642 },
    ],
  },
  healthy: {
    text: "Here's a healthy lunchbox plan for kids that balances protein, fibre, and taste. I've selected whole-grain options and added fruit for natural sweetness. Everything is under ₹500 for the week!",
    blocks: [
      { type: 'products', productIds: [21, 45, 1, 14, 58], label: 'Lunchbox essentials' },
    ],
  },
  budget: {
    text: "Here's your ₹500 monthly essentials list, optimised for a household of 2. I've prioritised daily staples (milk, atta, oil) and added seasonal vegetables. The total comes to ₹487 — ₹13 under budget!",
    blocks: [
      { type: 'budget', total: 487, budget: 500, categories: [
        { name: 'Dairy', amount: 120, color: '#2563EB' },
        { name: 'Grains', amount: 150, color: '#F8CB46' },
        { name: 'Veg', amount: 80, color: '#0C831F' },
        { name: 'Oil & Masala', amount: 137, color: '#E23744' },
      ]},
    ],
  },
  paneer: {
    text: "With paneer, spinach, and cream, you can make Palak Paneer — a classic! Here's the recipe with all ingredients. You could also try Paneer Butter Masala if you have tomatoes. Want me to add the ingredients to your cart?",
    blocks: [
      { type: 'recipe', recipeId: 1, items: 8, total: 542 },
    ],
  },
  default: {
    text: "I'd love to help with that! Based on what you're looking for, here are some products I think you'll love. I can also plan meals, suggest healthier swaps, or build a weekly grocery list. What sounds good?",
    blocks: [
      { type: 'products', productIds: [13, 21, 34, 1, 61], label: 'Recommended for you' },
    ],
  },
}

function matchIntent(text) {
  const t = text.toLowerCase()
  if (t.includes('biryani') || t.includes('party') || t.includes('weekend')) return mockResponses.biryani
  if (t.includes('healthy') || t.includes('lunchbox') || t.includes('kids')) return mockResponses.healthy
  if (t.includes('budget') || t.includes('monthly') || t.includes('₹') || t.includes('essential')) return mockResponses.budget
  if (t.includes('paneer') || t.includes('spinach') || t.includes('cook')) return mockResponses.paneer
  return mockResponses.default
}

// Async generator that yields tokens + rich blocks
export async function* chat(messages, context = {}) {
  const lastMsg = messages[messages.length - 1]?.content || ''
  const response = matchIntent(lastMsg)

  await delay(400, 800)

  // Yield blocks first
  if (response.blocks) {
    for (const block of response.blocks) {
      yield { type: 'block', block }
    }
  }

  // Stream text token by token
  const tokens = response.text.split(' ')
  for (const token of tokens) {
    await delay(30, 80)
    yield { type: 'token', text: token + ' ' }
  }

  yield { type: 'done', isMock: true }
}

export async function recipeToCart(input) {
  await delay()
  return {
    items: [],
    total: 642,
    isMock: true,
  }
}

export async function suggestSubstitutes(productId) {
  await delay()
  const product = products.find(p => p.id === Number(productId))
  if (!product) return { substitutes: [], isMock: true }
  const substitutes = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 3)
  return { substitutes, isMock: true }
}

export async function suggestForgotten(cart) {
  await delay()
  const forgotten = [
    { id: 14, name: 'Eggs (Farm Fresh)', reason: 'A breakfast staple you buy weekly' },
    { id: 8, name: 'Coriander (Dhaniya)', reason: 'Goes with most Indian dishes' },
  ]
  return { items: forgotten, isMock: true }
}

export async function planBudget({ budget, people, diet }) {
  await delay()
  return {
    list: [
      { category: 'Dairy & Eggs', items: ['Milk', 'Curd', 'Eggs'], total: 180 },
      { category: 'Grains & Pulses', items: ['Atta', 'Rice', 'Dal'], total: 350 },
      { category: 'Vegetables', items: ['Onion', 'Tomato', 'Potato', 'Spinach'], total: 130 },
      { category: 'Oil & Masala', items: ['Cooking Oil', 'Garam Masala'], total: 220 },
    ],
    total: 880,
    savings: 120,
    isMock: true,
  }
}

export async function predictRestock(history) {
  await delay()
  return [
    { id: 13, name: 'Amul Taaza Toned Milk', daysLeft: 2, emoji: '🥛' },
    { id: 21, name: 'Whole Wheat Bread', daysLeft: 3, emoji: '🍞' },
  ]
}

export async function parseNaturalQuery(text) {
  await delay(200, 500)
  const t = text.toLowerCase()
  const parsed = { original: text, filters: {} }

  // Price extraction
  const priceMatch = t.match(/under\s*₹?\s*(\d+)/)
  if (priceMatch) parsed.filters.maxPrice = Number(priceMatch[1])

  const minPriceMatch = t.match(/above\s*₹?\s*(\d+)/)
  if (minPriceMatch) parsed.filters.minPrice = Number(minPriceMatch[1])

  // Protein
  if (t.includes('protein') || t.includes('high protein')) {
    parsed.filters.minProtein = 10
    parsed.label = 'protein ≥ 10g'
  }

  // Diet
  if (t.includes('veg')) parsed.filters.veg = true
  if (t.includes('non-veg') || t.includes('non veg')) parsed.filters.nonVeg = true
  if (t.includes('vegan')) parsed.filters.vegan = true
  if (t.includes('gluten')) parsed.filters.glutenFree = true
  if (t.includes('sugar free') || t.includes('sugar-free')) parsed.filters.sugarFree = true

  // Healthy
  if (t.includes('healthy')) parsed.filters.minHealthScore = 70

  parsed.isMock = true
  return parsed
}
