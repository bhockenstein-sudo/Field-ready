const CACHE = "field-ready-v2";

// App shell + CDN scripts cached for offline use
const PRECACHE = [
  "./index.html",
  "./manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                             .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  // The app page itself: NETWORK FIRST so updates show when online,
  // falling back to the cached copy when offline.
  var isPage = req.mode === "navigate"
    || url.pathname.endsWith("/")
    || url.pathname.endsWith("index.html");

  if(isPage){
    e.respondWith(
      fetch(req).then(function(resp){
        var clone = resp.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", clone); });
        return resp;
      }).catch(function(){
        return caches.match("./index.html").then(function(r){ return r || caches.match(req); });
      })
    );
    return;
  }

  // Everything else (scripts, manifest, icon): cache first, then network.
  e.respondWith(
    caches.match(req).then(function(cached){
      return cached || fetch(req).then(function(resp){
        if(resp && resp.status === 200){
          var clone = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(req, clone); });
        }
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
