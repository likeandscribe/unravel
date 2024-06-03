import { Frame } from "./frames";

const socket = new WebSocket(
  "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos",
);

socket.addEventListener("message", (e) => {
  if (!(e.data instanceof Buffer)) {
    throw new Error("Unexpected non-buffer frame");
  }

  console.log(Frame.fromBytes(new Uint8Array(e.data)).body);
});

socket.addEventListener("error", (event) => {
  console.error(
    new Error(`Websocket error: ${event.message}`, { cause: event.error }),
  );
  process.exit(1);
});

socket.addEventListener("close", (event) => {
  console.error(new Error(`Websocket closed: ${event.code}`));
  process.exit(1);
});

Bun.serve({
  fetch(req) {
    return new Response("Bun!");
  },
  port: 8080,
});
