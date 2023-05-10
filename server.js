const path = require("path");
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { v1 } = require("uuid");

const app = express();
const server = http.createServer(app);

const PORT = 3000;
const socketServerOptions = {
  cors: true,
  origin: "*",
};

const io = socket(server, socketServerOptions);

app.use(express.static(path.join(__dirname, "public")));
app.get("/room", (req, res) => {
  const id = v1();
  res.send({ id: id });
});

io.on("connection", (socket) => {
  console.log(socket.id, "Connected");
  socket.emit("socketId", socket.id);

  //////////////////////////////////////  joinRoom ///////////////////////////////////////

  socket.on("joinRoom", ({ username, roomId }) => {
    //HÄR SKALL VI LÄGGA TILL ATT USENAME SKICKAS MED
    socket.join(roomId);
    socket.username = username;

    const socketIdsInRoom = [...socket.adapter.rooms.get(roomId)];

    const membersInRoom = [];

    socketIdsInRoom.forEach(id => {
      const member = { socketId: id };
      const memberSocket = io.sockets.sockets.get(id);
      
      if (memberSocket.username) {
        member.username = memberSocket.username;
        membersInRoom.push(member);
      }
      
    })

    io.to(roomId).emit("members", membersInRoom);
  });
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if (id === room) return;
  console.log(id, " left room ", room);
  const socketsStillInRoom = [...io.sockets.adapter.rooms.get(room)];

  if (socketsStillInRoom.length === 0) return;
  console.log(
    "🚀 ~ file: server.js:58 ~ io.of ~ socketsStillInRoom:",
    socketsStillInRoom
  );
  io.to(room).emit("members", socketsStillInRoom);
});

server.listen(PORT, () => {
  console.log("Running on port ", PORT);
});
