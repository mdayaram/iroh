/**
Before running:
> npm install ws
Then:
> node server.js
> open http://localhost:8080 in the browser
*/

const http = require('http');
const fs = require('fs');
const ws = new require('ws');

const wss = new ws.Server({ noServer: true });

const clients = new Set();

var lastURL = "https://face.zoomface.club/loadingvideo.m4v"
var lastTime = 0
var timeUpdated = Date.now();
var isPlaying = true

function accept(req, res) {

  if (req.url == '/wsclub' && req.headers.upgrade &&
    req.headers.upgrade.toLowerCase() == 'websocket' &&
    // can be Connection: keep-alive, Upgrade
    req.headers.connection.match(/\bupgrade\b/i)) {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
  } else { // page not found
    res.writeHead(404);
    res.end();
  }
}

function onSocketConnect(ws) {
  clients.add(ws);
  log(`new connection`);
  var timeSinceUpdate = Date.now() - timeUpdated;
  ws.send(lastURL)
  setTimeout(function () { ws.send('play') }, 100);
  setTimeout(function () { ws.send('pause') }, 200);
  setTimeout(function () { ws.send(parseFloat(lastTime) + (timeSinceUpdate / 1000.0) + 2) }, 1000);
  if (isPlaying) {
    setTimeout(function () { ws.send('play') }, 2000);
  }

  ws.on('message', function (message) {
    log(`message received: ${message}`);

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

  ws.on('close', function () {
    log(`connection closed`);
    clients.delete(ws);
  });
}

let log;
if (!module.parent) {
  log = console.log;
  http.createServer(accept).listen(8080);
} else {
  // to embed into javascript.info
  log = function () { };
  // log = console.log;
  exports.accept = accept;
}
