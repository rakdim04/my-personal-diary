const CACHE_NAME = "my-personal-diary-v5";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.json"
];


/* =====================================================
   INSTALL
   ===================================================== */

self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(ASSETS);

            })

    );

});


/* =====================================================
   ACTIVATE
   ===================================================== */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys()
            .then(keys => {

                return Promise.all(

                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))

                );

            })
            .then(() => {

                return self.clients.claim();

            })

    );

});


/* =====================================================
   FETCH
   ===================================================== */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }


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
                )

                .then(cachedResponse => {

                    if (cachedResponse) {

                        return cachedResponse;

                    }


                    return caches.match(
                        "./index.html"
                    );

                });

            })

    );

});
