const CACHE_NAME = "my-personal-diary-v8-1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js"
];

/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(
          FILES_TO_CACHE
        );

      })

      .then(() => {

        return self.skipWaiting();

      })

  );

});

/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames
            .filter(
              name =>
                name !== CACHE_NAME
            )
            .map(
              name =>
                caches.delete(name)
            )

        );

      })

      .then(() => {

        return self.clients.claim();

      })

  );

});

/* =========================
   FETCH
========================= */

self.addEventListener("fetch", event => {

  /*
    Only handle GET requests.
  */

  if(event.request.method !== "GET"){

    return;

  }

  /*
    Don't interfere with Google
    Calendar / OAuth requests.
  */

  const url =
    new URL(event.request.url);

  if(
    url.origin !== self.location.origin
  ){

    return;

  }

  /*
    Network first for index.html.

    This is important because when
    you update your diary on GitHub,
    the new version can be downloaded.
  */

  if(
    event.request.destination === "document" ||
    url.pathname.endsWith("index.html")
  ){

    event.respondWith(

      fetch(event.request)

        .then(response => {

          const copy =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                copy
              );

            });

          return response;

        })

        .catch(() => {

          return caches.match(
            event.request
          );

        })

    );

    return;

  }

  /*
    Cache first for other local files.
  */

  event.respondWith(

    caches.match(event.request)

      .then(cached => {

        if(cached){

          return cached;

        }

        return fetch(event.request)
          .then(response => {

            if(
              response &&
              response.status === 200
            ){

              const copy =
                response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {

                  cache.put(
                    event.request,
                    copy
                  );

                });

            }

            return response;

          });

      })

  );

});
