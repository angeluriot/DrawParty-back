const express = require("express");
const http = require("http");
const cors = require("cors");
const port = 3001;

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

const { Server } = require("socket.io");
const io = new Server(server, { cors: corsOptions });

const users = [];

app.use(cors(corsOptions));

io.on("connection", (socket) => {
  console.log("a user connected");
  users.push({ id: socket.id, socket: socket });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    users.pop(users.indexOf(socket.id));
  });

  socket.on("message", (msg) => {
    console.log("message: " + msg);
    for (const client of users)
      if (client.id != socket.id) client.socket.emit("broadcastMessage", msg);
  });
});

server.listen(port, () => {});
