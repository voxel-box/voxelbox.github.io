/* VOXELBOX service worker — receives site notifications (web push). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Voxelbox", {
    body: d.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: d.url || "https://voxelbox.org/" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "https://voxelbox.org/";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((tabs) => {
    for (const t of tabs) { if (t.url === url && "focus" in t) return t.focus(); }
    return clients.openWindow(url);
  }));
});
