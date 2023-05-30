import {
  copyURL,
  openUserMeny,
  getStoredUsername,
  handleParticipants,
  handleIsHost,
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleParticipantViewing,
  toggleFullScreen,
  handleFullscreenChange,
  copyByBtn,
  leaveRoom,
  handleContinue,
  joinRoom,
  shareScreen,
  stopSharing,
  showSidePanel,
  hideSidePanel,
  handleHostLeft,
  handleJoinedRoom,
} from "./utils.js";

//Variables
export const socket = io();
export const STATE = {
  mySocketId: "",
  myUsername: "",
  participants: [],
  localStream: null,
  isHost: false,
  sidePanel: false,
  isScreensharing: false,
  fullscreen: false,
  joinedRoom: false,
};

export const servers = {
  iceServers: [
    {
      urls: "stun:a.relay.metered.ca:80",
    },
    {
      urls: "turn:a.relay.metered.ca:80",
      username: "f6de8d4b9f7bd1de1408b8f3",
      credential: "FAZrFTuBsCxg3KxA",
    },
  ],
};

//DOM elements
const leaveRoomBtn = document.getElementById("leave-room");
const continueBtn = document.getElementById("button-continue");
export const username = document.getElementById("input-username");
export const remember = document.getElementById("ask-again");
export const video = document.getElementById("video");
export const shareButton = document.getElementById("share-btn");
export const sidePanel = document.getElementById("side-panel");
export const sidePanelBtn = document.getElementById("side-panel-btn");
export const panelheader = document.getElementById("panel-header");
export const panelPart = document.getElementById("participants");
export const modal = document.getElementById("modal");
export const url = window.location.href;
export const copyURLElement = document.getElementById("copy-link");
export const copyURLMessage = document.getElementById("copyMessage");
export const copyBtn = document.getElementById("copy-btn");

//Functions

function handleStopScreenShare(socketId) {
  if (STATE.isHost) {
    video.srcObject = null;
    shareButton.innerHTML = "Share Screen";
    STATE.isScreensharing = false;
  }
  if (socketId) {
    socket.emit("shareEnded", { target: socketId });
  }
}

function handleShareEnded() {
  console.log("Share Ended");
  const target = STATE.participants.find(
    (participant) => participant.isHost
  ).socketId;
  socket.emit("viewing", { target, sender: STATE.mySocketId, viewing: false });
  video.srcObject = null;
  video.controls = false;
}

function init() {
  getStoredUsername();
  copyURLElement.innerHTML = url;
  if (STATE.myUsername) {
    joinRoom();
  }
}

//EventListeners
leaveRoomBtn.onclick = () => leaveRoom();

shareButton.onclick = () => {
  if (!STATE.isScreensharing) {
    shareScreen();
    return;
  }
  stopSharing();
};

continueBtn.onclick = handleContinue;

copyURLElement.onclick = copyURL;

copyBtn.onclick = copyByBtn;

sidePanelBtn.onclick = () => {
  if (!STATE.sidePanel) return showSidePanel();
  hideSidePanel();
};

video.onclick = toggleFullScreen;

document.addEventListener("fullscreenchange", (e) => handleFullscreenChange(e));

//Socket listeners
socket.on("socketId", (id) => {
  STATE.mySocketId = id;
});
socket.on("roomJoined", (roomJoinedId) => handleJoinedRoom(roomJoinedId));
socket.on("isHost", (isHost) => handleIsHost(isHost));
socket.on("participants", (participants) => handleParticipants(participants));
socket.on("hostLeft", (msg) => handleHostLeft(msg));
socket.on("offer", (offer) => handleOffer(offer));
socket.on("answer", (answer) => handleAnswer(answer));
socket.on("candidate", (candidate) => handleCandidate(candidate));
socket.on("shareEnded", () => handleShareEnded());
socket.on("viewing", (payload) => handleParticipantViewing(payload));
socket.on("error", (error) => handleError(error));

//Initial operations
init();
