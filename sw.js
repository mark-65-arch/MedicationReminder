// Service Worker for Senior Medication App
// Provides offline functionality and PWA capabilities

const CACHE_NAME = 'senior-med-tracker-v15';
const urlsToCache = [
    './',
    './index.html',
    './styles.css?v=6',
    './script.js?v=8',
    './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app resources');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Force activation of new service worker
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('Serving from cache:', event.request.url);
                    return response;
                }
                
                // Otherwise fetch from network
                console.log('Fetching from network:', event.request.url);
                return fetch(event.request).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response as it can only be consumed once
                    const responseToCache = response.clone();
                    
                    // Add to cache for future use
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(error => {
                console.log('Fetch failed:', error);
                
                // Return offline page for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                
                // For other requests, just return error
                throw error;
            })
    );
});

// Handle background sync for future medication reminders
self.addEventListener('sync', event => {
    console.log('Background sync event:', event.tag);
    
    if (event.tag === 'medication-reminder') {
        event.waitUntil(
            // This would handle scheduled medication reminders
            handleMedicationReminder()
        );
    }
});

// Handle push notifications (for future enhancement)
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Time for your medication!',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231565C0"><path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2H4V6zm0 4h5v2H4v-2zm0 4h5v2H4v-2z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231565C0"><path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2H4V6zm0 4h5v2H4v-2zm0 4h5v2H4v-2z"/></svg>',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
            {
                action: 'taken',
                title: 'Mark as Taken',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232E7D32"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
            },
            {
                action: 'snooze',
                title: 'Remind Later',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF9800"><path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H3V9h18v11z"/></svg>'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Medication Reminder', options)
    );
});

// Handle notification click actions
self.addEventListener('notificationclick', event => {
    console.log('Notification click event:', event);
    
    event.notification.close();
    
    if (event.action === 'taken') {
        // Handle medication taken action
        event.waitUntil(
            handleMedicationTaken(event.notification.data)
        );
    } else if (event.action === 'snooze') {
        // Handle snooze action - reminder in 10 minutes
        event.waitUntil(
            handleMedicationSnooze(event.notification.data)
        );
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Helper functions for medication management
async function handleMedicationReminder() {
    try {
        // This would check for scheduled medications and show notifications
        console.log('Handling background medication reminder');
        
        // In a real implementation, this would:
        // 1. Check stored medication schedule
        // 2. Determine if any medications are due
        // 3. Show appropriate notifications
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error handling medication reminder:', error);
    }
}

async function handleMedicationTaken(medicationData) {
    try {
        // This would record that medication was taken
        console.log('Recording medication as taken:', medicationData);
        
        // In a real implementation, this would:
        // 1. Update local storage
        // 2. Record the action in history
        // 3. Cancel any pending reminder notifications
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error recording medication taken:', error);
    }
}

async function handleMedicationSnooze(medicationData) {
    try {
        // This would reschedule the notification
        console.log('Snoozing medication reminder:', medicationData);
        
        // In a real implementation, this would:
        // 1. Schedule a new notification in 10 minutes
        // 2. Cancel the current notification
        
        return Promise.resolve();
    } catch (error) {
        console.error('Error snoozing medication reminder:', error);
    }
}

// Handle errors
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker unhandled rejection:', event.reason);
    event.preventDefault();
});

console.log('Service Worker script loaded');
