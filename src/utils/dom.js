// DOM helpers: create elements, sanitize text, delegate events

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'class') {
      node.className = val
    } else if (key === 'dataset') {
      for (const [dk, dv] of Object.entries(val)) {
        node.dataset[dk] = dv
      }
    } else if (key.startsWith('on') && typeof val === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), val)
    } else if (key === 'html') {
      node.innerHTML = val
    } else if (val !== null && val !== undefined && val !== false) {
      node.setAttribute(key, val === true ? '' : val)
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    if (typeof child === 'string' || typeof child === 'number') {
      node.appendChild(document.createTextNode(String(child)))
    } else {
      node.appendChild(child)
    }
  }
  return node
}

export function sanitize(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function $(selector, parent = document) {
  return parent.querySelector(selector)
}

export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector))
}

export function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, (e) => {
    const target = e.target.closest(selector)
    if (target && parent.contains(target)) {
      handler(e, target)
    }
  })
}

export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
  return node
}

export function mountNode(parent, child) {
  clearNode(parent)
  parent.appendChild(child)
  return parent
}

export function icon(name, size = 20, extraClass = '') {
  const span = document.createElement('span')
  span.className = `inline-flex items-center justify-center ${extraClass}`
  span.innerHTML = `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`
  return span
}

export function renderIcons(parent = document) {
  if (window.lucide) window.lucide.createIcons({ root: parent })
}
