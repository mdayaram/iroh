# setup
`cd server`
`node server.js`

This'll broadcast the websocket server on localhost:8080/wsclub. You'll want to set up a proxy server (like nginx) to broadcast it over HTTPS.

Change the `wss://` URLs in guest.html and club.html to point to your domain.