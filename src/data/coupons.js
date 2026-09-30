export const coupons = [
  {
    code: 'FRESH40',
    title: 'Flat 40% off',
    subtitle: 'On fruits & vegetables',
    minOrder: 99,
    maxDiscount: 100,
    color: '#E8F5EA',
    darkColor: '#1a2e1d',
    textColor: '#0C831F',
  },
  {
    code: 'AI100',
    title: '₹100 off',
    subtitle: 'On orders above ₹499',
    minOrder: 499,
    maxDiscount: 100,
    color: '#EDE9FE',
    darkColor: '#1e1530',
    textColor: '#7C3AED',
  },
  {
    code: 'FREEDEL',
    title: 'Free delivery',
    subtitle: 'On all orders today',
    minOrder: 199,
    maxDiscount: 40,
    color: '#FFF8E1',
    darkColor: '#2d2810',
    textColor: '#F8CB46',
  },
]

export function validateCoupon(code, cartTotal) {
  const coupon = coupons.find(c => c.code === code.toUpperCase())
  if (!coupon) return { valid: false, message: 'Invalid coupon code' }
  if (cartTotal < coupon.minOrder) return { valid: false, message: `Minimum order ₹${coupon.minOrder} required` }
  return { valid: true, coupon, discount: Math.min(coupon.maxDiscount, cartTotal * 0.4) }
}
