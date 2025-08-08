/**
 * Service Worker for Angular Timers PWA
 * Handles caching, background sync, and push notifications
 */

// Configuration
const CACHE_NAME = 'angular-timers-v1';
const ASSETS_CACHE_NAME = 'angular-timers-assets-v1';
const DATA_CACHE_NAME = 'angular-timers-data-v1';

// Pre-cached assets (will be populated during build)
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/assets/icons/icon-72x72.png',
  '/assets/icons/icon-96x96.png',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-144x144.png',
  '/assets/icons/icon-152x152.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-384x384.png',
  '/assets/icons/icon-512x512.png'
];

// API endpoints to cache
const DATA_ENDPOINTS = [
  '/api/timer-states',
  '/api/settings',
  '/api/history'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== ASSETS_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Clients claim');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (DATA_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // Handle asset requests
  if (ASSETS.includes(url.pathname) || url.origin !== self.location.origin) {
    event.respondWith(handleAssetRequest(request));
    return;
  }

  // For everything else, try network first, then cache
  event.respondWith(handleNetworkFirst(request));
});

// Handle data requests with cache-then-network strategy
async function handleDataRequest(request) {
  try {
    // Try to fetch from network
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cache = await caches.open(DATA_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return error response
    return new Response(JSON.stringify({ error: 'Network error and no cached data' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle asset requests with cache-first strategy
async function handleAssetRequest(request) {
  try {
    // Try cache first
    const cache = await caches.open(ASSETS_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response for future requests
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return error
    return new Response('Asset not available', { status: 404 });
  }
}

// Handle requests with network-first strategy
async function handleNetworkFirst(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(ASSETS_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cache = await caches.open(ASSETS_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return error
    return new Response('Content not available', { status: 404 });
  }
}

// Background Sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    event.waitUntil(syncTimerData());
  }
});

// Sync timer data with server
async function syncTimerData() {
  try {
    // Get timer states from localStorage
    const timerStates = localStorage.getItem('timer-states');
    
    if (timerStates) {
      // Send to server
      await fetch('/api/timer-states', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: timerStates
      });
      
      console.log('[Service Worker] Timer states synced successfully');
    }
  } catch (error) {
    console.error('[Service Worker] Failed to sync timer states:', error);
    // Re-throw to retry sync
    throw error;
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Timer Update';
    const options = {
      body: data.body || 'Your timer has completed',
      icon: data.icon || '/assets/icons/icon-192x192.png',
      badge: data.badge || '/assets/icons/icon-72x72.png',
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200],
      tag: 'timer-notification',
      renotify: true,
      actions: [
        {
          action: 'dismiss',
          title: 'Dismiss'
        },
        {
          action: 'view',
          title: 'View Timer'
        }
      ],
      data: data.data || {}
    };
    
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  
  if (action === 'dismiss') {
    event.notification.close();
    return;
  }
  
  event.notification.close();
  
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window first
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open new one
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Message event - handle communication from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicSync', (event) => {
    if (event.tag === 'timer-periodic-sync') {
      event.waitUntil(syncTimerData());
    }
  });
}

// Enhanced timer completion notification
async function showTimerNotification(timerType, message) {
  const title = `${timerType} Timer Completed`;
  const options = {
    body: message || 'Your timer has finished!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    tag: 'timer-completion',
    renotify: true,
    timestamp: Date.now(),
    actions: [
      {
        action: 'dismiss',
        title: 'Dismiss'
      },
      {
        action: 'view',
        title: 'View Timer'
      }
    ],
    data: {
      timerType: timerType,
      completedAt: Date.now()
    }
  };
  
  return self.registration.showNotification(title, options);
}

// Background timer monitoring
let backgroundTimerInterval = null;

// Start background timer monitoring
function startBackgroundTimerMonitoring() {
  if (backgroundTimerInterval) return;
  
  backgroundTimerInterval = setInterval(async () => {
    try {
      // Check timer states from localStorage
      const timerStates = await getTimerStatesFromStorage();
      if (timerStates) {
        await checkForCompletedTimers(timerStates);
      }
    } catch (error) {
      console.error('[Service Worker] Background timer monitoring error:', error);
    }
  }, 1000); // Check every second
}

// Stop background timer monitoring
function stopBackgroundTimerMonitoring() {
  if (backgroundTimerInterval) {
    clearInterval(backgroundTimerInterval);
    backgroundTimerInterval = null;
  }
}

// Get timer states from storage
async function getTimerStatesFromStorage() {
  try {
    // In service worker, we need to communicate with the main thread to get localStorage
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to get timer states
      clients[0].postMessage({ type: 'GET_TIMER_STATES' });
    }
    return null; // Will be handled by message response
  } catch (error) {
    console.error('[Service Worker] Failed to get timer states:', error);
    return null;
  }
}

// Check for completed timers
async function checkForCompletedTimers(timerStates) {
  const currentTime = Date.now();
  const timeElapsed = currentTime - timerStates.timestamp;
  
  // Check countdown timer
  if (timerStates.countdown && timerStates.countdown.isRunning) {
    const newTimeRemaining = Math.max(0, timerStates.countdown.timeRemaining - timeElapsed);
    if (newTimeRemaining === 0 && timerStates.countdown.timeRemaining > 0) {
      await showTimerNotification('Countdown', 'Your countdown timer has finished!');
    }
  }
  
  // Check interval timer
  if (timerStates.interval && timerStates.interval.isRunning && !timerStates.interval.isCompleted) {
    const newTimeRemaining = Math.max(0, timerStates.interval.timeRemaining - timeElapsed);
    if (newTimeRemaining === 0) {
      await showTimerNotification('Interval', 'Interval phase completed!');
    }
  }
  
  // Check pomodoro timer
  if (timerStates.pomodoro && timerStates.pomodoro.isRunning && !timerStates.pomodoro.isCompleted) {
    const newTimeRemaining = Math.max(0, timerStates.pomodoro.timeRemaining - timeElapsed);
    if (newTimeRemaining === 0) {
      const sessionType = timerStates.pomodoro.currentSessionType || 'work';
      await showTimerNotification('Pomodoro', `${sessionType} session completed!`);
    }
  }
}

// Handle visibility change messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'TAB_HIDDEN') {
    startBackgroundTimerMonitoring();
  } else if (event.data && event.data.type === 'TAB_VISIBLE') {
    stopBackgroundTimerMonitoring();
  } else if (event.data && event.data.type === 'TIMER_STATES') {
    // Received timer states from main thread
    checkForCompletedTimers(event.data.states);
  }
});