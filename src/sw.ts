/// <reference lib="webworker" />
// Service Worker do PWA (injectManifest do vite-plugin-pwa).
// Mantém os handlers de push originais E adiciona cache versionado + estratégias.
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

// ── Atualização IMEDIATA: a versão nova assume na hora, sem ficar "esperando"
// abas fecharem. (Antes, uma correção só aparecia depois de fechar tudo — o
// usuário via a versão velha em cache.)
self.skipWaiting();
clientsClaim();

// ── Precache dos assets com hash (injetado no build, versionado a cada deploy)
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// ── Navegação → index.html precacheado. Offline nunca mostra tela branca:
// o shell carrega e cada tela exibe seu próprio estado (vazio/sem conexão).
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), {
  denylist: [/^\/sw\.js$/, /^\/manifest\.json$/, /\/[^/?]+\.[^/]+$/], // ignora arquivos com extensão
}));

// ── Supabase (REST/Functions): network-first. Fresco quando online; último
// visto quando offline. Exclui /auth e /realtime. Só GET é cacheado (workbox).
registerRoute(
  ({ url, request }) =>
    url.hostname.endsWith('.supabase.co') &&
    request.method === 'GET' &&
    (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/functions/')),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 300, purgeOnQuotaError: true }),
    ],
  }),
);

// ── Avatares / mídia (Storage e qualquer imagem): stale-while-revalidate.
registerRoute(
  ({ url, request }) => request.destination === 'image' || url.pathname.includes('/storage/v1/object/'),
  new StaleWhileRevalidate({
    cacheName: 'media-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 7 * 24 * 3600, purgeOnQuotaError: true }),
    ],
  }),
);

// ── Google Fonts.
registerRoute(({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts-css' }));
registerRoute(({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-files',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 31536000 }),
    ],
  }));

// ── Ciclo de vida: assume o controle imediatamente (novo deploy vale já).
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

// ══════════════════════════════════════════════════════════════════════
// Push notifications (migrado do sw.js original — comportamento intacto)
// ══════════════════════════════════════════════════════════════════════
const NOTIF_ICON = '/icons/icon-192.png';

self.addEventListener('push', (event: PushEvent) => {
  let data: {
    title: string; body: string; icon?: string; badge?: string; tag?: string; data?: { url?: string };
  } = {
    title: 'Aliança Kingdom',
    body: 'Você tem uma nova notificação',
    icon: NOTIF_ICON,
    badge: NOTIF_ICON,
    tag: 'notification',
    data: { url: '/' },
  };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch { /* payload não-JSON: usa o padrão */ }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon || NOTIF_ICON,
    badge: data.badge || NOTIF_ICON,
    tag: data.tag || 'notification',
    data: data.data || { url: '/' },
    // vibrate/actions são válidos em SW mas não estão no lib.dom types
    ...( { vibrate: [100, 50, 100], requireInteraction: true, actions: [
      { action: 'open', title: 'Ver' },
      { action: 'close', title: 'Fechar' },
    ] } as object),
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          (client as WindowClient).navigate(urlToOpen);
          return (client as WindowClient).focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    }),
  );
});
