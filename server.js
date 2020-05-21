var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/public"))

var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

const clients = new Set();
var lastURL = "https://storage.googleapis.com/iroh/loadingvideo.mp4"
var lastTime = 0
var timeUpdated = Date.now();
var isPlaying = true

wss.on("connection", function(ws) {
  clients.add(ws);
  console.log(`new connection`);
  var timeSinceUpdate = Date.now() - timeUpdated;
  ws.send(lastURL)
  setTimeout(function () { ws.send('play') }, 100);
  setTimeout(function () { ws.send('pause') }, 200);
  setTimeout(function () { ws.send(parseFloat(lastTime) + (timeSinceUpdate / 1000.0) + 2) }, 1000);

  if (isPlaying) {
    setTimeout(function () { ws.send('play') }, 2000);
  }

  ws.on('message', function (message) {
    console.log(`message received: ${message}`);

    message = message.slice(0, 5000); // max message length will be 5kb

    if (isNaN(message)) {
      if (message == 'pause') {
        isPlaying = false
      } else if (message == 'play') {
        isPlaying = true
      } else if (message.startsWith("https://")) {
        lastURL = message;
        lastTime = 0;
        timeUpdated = Date.now();
        isPlaying = false
      }
      // not handled
    } else {
      lastTime = message;
      timeUpdated = Date.now();
    }

    for (let client of clients) {
      client.send(message);
    }
  });

  ws.on("close", function() {
    console.log(`connection closed`);
    clients.delete(ws);
  })
})
