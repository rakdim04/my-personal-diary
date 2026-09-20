const CACHE_NAME = "my-personal-diary-v10-1";

const STATIC_FILES = [
  "./manifest.json"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(
          cache =>
            cache.addAll(
              STATIC_FILES
            )
        )
        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()
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
                    caches.delete(
                      key
                    )
                )

            )

        )
        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      HTML is NETWORK FIRST.

      This is deliberately different from
      the old service worker.

      GitHub Pages must deliver the newest
      index.html instead of an old cached copy.
    */

    if(
      request.mode === "navigate" ||
      request.destination === "document"
    ){

      event.respondWith(

        fetch(
          request,
          {
            cache:"no-store"
          }
        )
        .then(
          response => {

            if(
              response &&
              response.ok
            ){

              const copy =
                response.clone();

              caches
                .open(CACHE_NAME)
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                );

            }

            return response;

          }
        )
        .catch(
          () =>
            caches
              .match(request)
              .then(
                cached =>
                  cached ||
                  caches.match(
                    "./index.html"
                  )
              )
        )

      );

      return;

    }


    /*
      Non-HTML files:
      cache first, then network.
    */

    event.respondWith(

      caches
        .match(request)
        .then(
          cached => {

            if(cached)
              return cached;


            return fetch(
              request
            )
            .then(
              response => {

                if(
                  response &&
                  response.ok
                ){

                  const copy =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(
                      cache =>
                        cache.put(
                          request,
                          copy
                        )
                    );

                }

                return response;

              }
            );

          }
        )

    );

  }
);
