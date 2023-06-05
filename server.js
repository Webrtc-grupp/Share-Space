const path = require("path");
const express = require("express");
const http = require("http");
const socket = require("socket.io");
const { v1 } = require("uuid");

//Server objects
const app = express();
const server = http.createServer(app);

//Configuration
const PORT = 3000;
const socketServerOptions = {
  cors: true,
  origin: "*",
};

//Socket server
const io = socket(server, socketServerOptions);

//Express routing
app.use(express.static(path.join(__dirname, "public")));

app.get("/room", (req, res) => {
  const id = v1();
  res.send({ id: id });
});

//Event handlers socket server
io.on("connection", (socket) => {
  console.log(socket.id, "Connected");
  socket.emit("socketId", socket.id);

  socket.on("joinRoom", ({ username, roomId }) => {
    console.log("Joining room", username, roomId);
    socket.join(roomId);
    socket.username = username;

    io.to(roomId).emit(
      "participants",
      getParticipantsInRoom({ roomId, socket })
    );

    socket.emit("roomJoined", roomId);
  });

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
  socket.on("shareEnded", (payload) => {
    io.to(payload.target).emit("shareEnded", payload);
  });
  socket.on("viewing", (payload) => {
    socket.viewing = payload.viewing;
    console.log(payload);
    io.to(payload.target).emit("viewing", payload);
  });
  socket.on("username", (payload) => {
    const { username, roomId } = payload;
    socket.username = username;
    console.log("Socket after change username" + socket.username);
    io.to(payload.target).emit(
      "message",
      "Username Changed to" + payload.username
    );

    io.to(roomId).emit(
      "participants",
      getParticipantsInRoom({ roomId, socket })
    );
  });
  socket.on("error", (payload) => {
    socket.error = payload.error;
    io.to(payload.target).emit("error", payload);
  });
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if (id === room) return;
  console.log(id, " left room ", room);
  const socketIdsInRoom = [...io.sockets.adapter.rooms.get(room)];

  const participantsInRoom = [];

  const participantThatLeft = io.sockets.sockets.get(id);

  if (participantThatLeft.host) {
    io.to(room).emit(
      "hostLeft",
      `Host ${participantThatLeft.username} ended the session`
    );
    socketIdsInRoom.map((socketId) => {
      io.sockets.sockets.get(socketId).leave(room);
    });
  }

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

function getParticipantsInRoom({ roomId, socket }) {
  // console.log(
  //   "🚀 ~ file: server.js:118 ~ getParticipantsInRoom ~ roomId, socket:",
  //   roomId,
  //   socket
  // );
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

  return participantsInRoom;
}

//Server initialization
server.listen(PORT, () => {
  console.log("Running on port ", PORT);
});
