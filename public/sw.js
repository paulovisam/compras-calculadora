const CACHE = 'compras-shell-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isDevModule(url.pathname) || url.pathname === '/sw.js') return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (isAppAsset(url.pathname)) {
    event.respondWith(networkFirst(request))
  }
})

function isDevModule(pathname) {
  return (
    pathname.startsWith('/@') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/node_modules/')
  )
}

function isAppAsset(pathname) {
  return pathname.startsWith('/assets/') || pathname.startsWith('/icon') || pathname === '/manifest.webmanifest'
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {})
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      const shell = await cache.match('/')
      if (shell) return shell
    }
    return new Response('Sem conexão.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
