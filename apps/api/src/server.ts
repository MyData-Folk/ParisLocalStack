import http from "http";
import { config } from "./config.js";
import { createApp } from "./app.js";
import { createSocketServer } from "./socket.js";

const app = createApp();
const server = http.createServer(app);
const io = createSocketServer(server);

app.set("io", io);

server.listen(config.apiPort, () => {
  console.log(`API listening on port ${config.apiPort}`);
});
