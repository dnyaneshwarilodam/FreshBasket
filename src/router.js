// Hash-based router with route matching

const routes = []
let currentMatch = null
let onChangeFn = null

export function defineRoute(pattern, handler) {
  routes.push({ pattern, regex: pathToRegex(pattern), keys: getKeys(pattern), handler })
}

function pathToRegex(pattern) {
  const re = pattern
    .replace(/\/:([^/]+)/g, '/([^/]+)')
    .replace(/\?q=$/, '?q=([^&]*)')
  return new RegExp('^' + re + '$')
}

function getKeys(pattern) {
  const keys = []
  const re = /:(\w+)/g
  let m
  while ((m = re.exec(pattern)) !== null) keys.push(m[1])
  if (pattern.includes('?q=')) keys.push('q')
  return keys
}

function parseHash() {
  let hash = window.location.hash.slice(1) || '/'
  if (hash.startsWith('/')) hash = hash
  else hash = '/' + hash
  return hash
}

export function navigate(path) {
  window.location.hash = path
}

export function startRouter(onChange) {
  onChangeFn = onChange
  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}

function handleRoute() {
  const hash = parseHash()
  let matched = false

  for (const route of routes) {
    const match = route.regex.exec(hash)
    if (match) {
      const params = {}
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1] || '')
      })
      currentMatch = { path: hash, params, route }
      onChangeFn(currentMatch)
      matched = true
      break
    }
  }

  if (!matched) {
    currentMatch = { path: hash, params: {}, route: null, notFound: true }
    onChangeFn(currentMatch)
  }

  window.scrollTo(0, 0)
}

export function getCurrentRoute() {
  return currentMatch
}
