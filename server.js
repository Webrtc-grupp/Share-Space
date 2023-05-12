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

    if (socketIdsInRoom.length === 1) {
      socket.host = true;
      socket.emit("isHost", true);
    }

    const participantsInRoom = [];

    socketIdsInRoom.forEach((id) => {
      const participant = { socketId: id, isHost: false };
      const participantSocket = io.sockets.sockets.get(id);

      if (participantSocket.username) {
        participant.username = participantSocket.username;
        if (participantSocket.host) participant.isHost = true;
        participantsInRoom.push(participant);
      }
    });

    io.to(roomId).emit("participants", participantsInRoom);

    socket.on("offer", (payload) => {
      io.to(payload.target).emit("offer", payload);
      console.log(payload);
    });
    socket.on("answer", (payload) => {
      io.to(payload.target).emit("answer", payload);
    });
    socket.on("candidate", (payload) => {
      io.to(payload.target).emit("candidate", payload);
    });
  });
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if (id === room) return;
  console.log(id, " left room ", room);
  const socketIdsInRoom = [...io.sockets.adapter.rooms.get(room)];

  const participantsInRoom = [];

  const participantThatLeft = io.sockets.sockets.get(id);

  if (participantThatLeft.host)
    io.to(room).emit(
      "hostLeft",
      `Host ${participantThatLeft.username} ended the session`
    );

  socketIdsInRoom.forEach((id) => {
    const participant = { socketId: id, isHost: false };
    const participantSocket = io.sockets.sockets.get(id);

    if (participantSocket.username) {
      participant.username = participantSocket.username;
      if (participantSocket.host) participant.isHost = true;
      participantsInRoom.push(participant);
    }
  });

  if (socketIdsInRoom.length === 0) return;
  console.log(
    "🚀 ~ file: server.js:58 ~ io.of ~ socketsStillInRoom:",
    socketIdsInRoom
  );
  io.to(room).emit("participants", participantsInRoom);
});

server.listen(PORT, () => {
  console.log("Running on port ", PORT);
});
