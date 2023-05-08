const ws = new WebSocket("ws://localhost:3001")
ws.onmessage = function (msg) {
  if (msg.data === "reload") {
    location.reload()
  }
}
