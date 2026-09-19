const CACHE_NAME = "my-personal-diary-v8-5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];


/* INSTALL */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(FILES_TO_CACHE)
        )
        .then(() =>
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

      caches
        .keys()
        .then(keys =>

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
        .then(() =>
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
      event.request.method !== "GET"
    ){
      return;
    }


    event.respondWith(

      caches
        .match(event.request)
        .then(cached => {

          if(cached){
            return cached;
          }


          return fetch(
            event.request
          )
          .then(response => {

            const copy=
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache =>
                cache.put(
                  event.request,
                  copy
                )
              );

            return response;

          })
          .catch(
            () =>
              caches.match(
                "./index.html"
              )
          );

        })

    );

  }
);
