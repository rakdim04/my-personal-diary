const CACHE = "my-personal-diary-v11";

const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js"
];

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE)
        .then(cache =>
          cache.addAll(CORE)
        )
        .then(() =>
          self.skipWaiting()
        )

    );

  }
);


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
                key => key !== CACHE
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


self.addEventListener(
  "fetch",
  event => {

    if(
      event.request.method !== "GET"
    ){
      return;
    }

    const url =
      new URL(
        event.request.url
      );


    if(
      url.origin === location.origin
    ){

      event.respondWith(

        fetch(
          event.request
        )

        .then(
          response => {

            const copy =
              response.clone();

            caches
              .open(CACHE)
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
              event.request
            )
        )

      );

    }

  }
);
