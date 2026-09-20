const CACHE_NAME = "my-personal-diary-v9";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js"
];

/* ==============================
   INSTALL
============================== */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      ).then(
        cache =>
          cache.addAll(
            FILES
          )
      )

    );

    self.skipWaiting();
  }
);

/* ==============================
   ACTIVATE
============================== */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(
          keys =>
            Promise.all(

              keys
                .filter(
                  key =>
                    key !== CACHE_NAME
                )
                .map(
                  key =>
                    caches.delete(key)
                )

            )
        )

    );

    self.clients.claim();
  }
);

/* ==============================
   FETCH
============================== */

self.addEventListener(
  "fetch",
  event => {

    /*
      Only handle GET requests.
    */

    if(
      event.request.method !== "GET"
    ){
      return;
    }

    event.respondWith(

      fetch(
        event.request
      )
      .then(
        response => {

          /*
            Save the newest version
            in cache.
          */

          if(
            response &&
            response.status === 200
          ){

            const copy =
              response.clone();

            caches.open(
              CACHE_NAME
            ).then(
              cache =>
                cache.put(
                  event.request,
                  copy
                )
            );
          }

          return response;
        }
      )
      .catch(
        () =>
          caches.match(
            event.request
          )
      )

    );

  }
);
