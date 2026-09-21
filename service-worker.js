const CACHE_NAME =
  "my-personal-diary-v10-2";

const OLD_CACHE_PREFIX =
  "my-personal-diary-";


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  event => {

    /*
      Do not cache index.html here.

      The previous version could keep an old
      broken index.html alive.

      v10.2 deliberately gets the latest
      index.html from GitHub Pages.
    */

    event.waitUntil(
      self.skipWaiting()
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

      caches.keys()
        .then(
          keys => {

            return Promise.all(

              keys.map(
                key => {

                  if(
                    key.startsWith(
                      OLD_CACHE_PREFIX
                    ) &&
                    key!==CACHE_NAME
                  ){

                    return caches.delete(
                      key
                    );

                  }

                  return null;

                }
              )

            );

          }
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

    const request=
      event.request;


    /*
      Navigation / HTML:
      NETWORK FIRST.

      This is the important part for
      GitHub Pages updates.
    */

    if(
      request.mode==="navigate" ||
      request.destination==="document"
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

              const copy=
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
        )
        .catch(
          async () => {

            const cached=
              await caches.match(
                request
              );

            if(cached)
              return cached;


            /*
              Last-resort fallback.
            */

            return caches.match(
              "./index.html"
            );

          }
        )

      );

      return;

    }


    /*
      Other assets:
      NETWORK FIRST, with cache fallback.
    */

    event.respondWith(

      fetch(
        request
      )
      .then(
        response => {

          if(
            response &&
            response.ok
          ){

            const copy=
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
      )
      .catch(
        () =>
          caches.match(
            request
          )
      )

    );

  }
);
