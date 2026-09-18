const CACHE_NAME = "my-personal-diary-v8-2";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js"
];

/* INSTALL */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      )
      .then(
        cache =>
          cache.addAll(
            CORE_FILES
          )
      )
      .then(
        () =>
          self.skipWaiting()
      )

    );

  }
);

/* ACTIVATE */

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

/* FETCH */

self.addEventListener(
  "fetch",
  event => {

    if(
      event.request.method !==
      "GET"
    ){
      return;
    }

    const url=
      new URL(
        event.request.url
      );

    /* Only handle our own GitHub Pages files */

    if(
      url.origin !==
      self.location.origin
    ){
      return;
    }

    /*
    HTML:
    Network first.
    This helps ensure that your
    latest GitHub version appears.
    */

    if(
      event.request.mode ===
      "navigate" ||

      event.request.destination ===
      "document"
    ){

      event.respondWith(

        fetch(
          event.request
        )
        .then(
          response => {

            const copy=
              response.clone();

            caches.open(
              CACHE_NAME
            )
            .then(
              cache =>
                cache.put(
                  event.request,
                  copy
                )
            );

            return response;

          }
        )
        .catch(
          () =>
            caches.match(
              "./index.html"
            )
        )

      );

      return;
    }

    /*
    Other local files:
    Cache first, then network.
    */

    event.respondWith(

      caches.match(
        event.request
      )
      .then(
        cached => {

          if(cached){
            return cached;
          }

          return fetch(
            event.request
          )
          .then(
            response => {

              if(
                response &&
                response.ok
              ){

                const copy=
                  response.clone();

                caches.open(
                  CACHE_NAME
                )
                .then(
                  cache =>
                    cache.put(
                      event.request,
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
