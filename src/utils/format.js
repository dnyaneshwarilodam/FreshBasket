export function formatPrice(n) {
  return '₹' + Number(n).toFixed(0)
}

export function formatPriceDecimal(n) {
  return '₹' + Number(n).toFixed(2)
}

export function discountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0
  return Math.round(((mrp - price) / mrp) * 100)
}

export function savings(price, mrp) {
  if (!mrp || mrp <= price) return 0
  return Math.round(mrp - price)
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural || singular + 's')
}

export function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(n)
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
