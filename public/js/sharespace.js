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
};
const { id: roomId } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
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
export const username = document.getElementById("input-username");
export const remember = document.getElementById("ask-again");
const continueBtn = document.getElementById("button-continue");
const userMenu = document.getElementById("userMenu");
const video = document.getElementById("video");
const shareButton = document.getElementById("share-btn");
const sidePanel = document.getElementById("side-panel");
const sidePanelBtn = document.getElementById("side-panel-btn");
const panelheader = document.getElementById("panel-header");
const panelPart = document.getElementById("participants");

//Functions
function joinRoom() {
  if (socket) {
    socket.emit("joinRoom", { username: STATE.myUsername, roomId });
  }
}

async function shareScreen() {
  if (STATE.isHost) {
    await navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        STATE.localStream = stream;
        video.srcObject = STATE.localStream;
        STATE.isScreensharing = true;
        shareButton.innerHTML = "Stop sharing";
        STATE.participants.map((participant) => {
          if (participant.pc)
            STATE.localStream.getTracks().forEach((track) => {
              track.addEventListener("ended", () =>
                handleStopScreenShare(participant.socketId)
              );
              participant.pc.addTrack(track, STATE.localStream);
            });

          console.log(
            "🚀 ~ file: sharespace.js:101 ~ STATE.participants.map ~ participant:",
            participant
          );
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

function stopSharing() {
  if (STATE.localStream) {
    STATE.localStream.getTracks()[0].stop();
    console.log(STATE.localStream.getTracks()[0]);
    STATE.localStream = null;
    video.srcObject = null;
    shareButton.innerHTML = "Share Screen";

    STATE.participants.map((participant) => {
      socket.emit("shareEnded", { target: participant.socketId });
    });
  }
  STATE.isScreensharing = false;
}

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

function handleHostLeft(msg) {
  alert(msg);
  window.location.href = "index.html";
}

function showSidePanel() {
  sidePanel.classList.remove("CLOSED");
  sidePanel.classList.add("OPEN");
  sidePanelBtn.classList.remove("CLOSED");
  sidePanelBtn.classList.add("OPEN");
  panelheader.classList.remove("CLOSED");
  panelheader.classList.add("OPEN");
  panelPart.classList.remove("CLOSED");
  panelPart.classList.add("OPEN");
  STATE.sidePanel = true;
}

function hideSidePanel() {
  sidePanel.classList.remove("OPEN");
  sidePanel.classList.add("CLOSED");
  sidePanelBtn.classList.remove("OPEN");
  sidePanelBtn.classList.add("CLOSED");
  panelheader.classList.remove("OPEN");
  panelheader.classList.add("CLOSED");
  panelPart.classList.remove("OPEN");
  panelPart.classList.add("CLOSED");
  STATE.sidePanel = false;
}

function handleError(error) {
  alert(error.msg);
}

function init() {
  getStoredUsername();
  if (STATE.myUsername) {
    joinRoom();
  }
}

//EventListeners
sidePanelBtn.onclick = () => {
  if (STATE.sidePanel) {
    hideSidePanel();
  } else {
    showSidePanel();
  }
};

shareButton.onclick = () => {
  if (!STATE.isScreensharing) {
    shareScreen();
    return;
  }
  stopSharing();
};

continueBtn.onclick = () => {
  const value = username.value;
  const dontaskagain = remember.checked;

  if (value !== "" && value !== " ") {
    STATE.myUsername = value;

    modal.classList.remove("OPEN");
    modal.classList.add("CLOSED");
    joinRoom();

    if (dontaskagain) {
      localStorage.setItem("_SP_username", STATE.myUsername);
    }
    if (!dontaskagain) {
      localStorage.removeItem("_SP_username");
    }
    console.log(STATE);
  } else {
    alert("please enter your name");
  }
};

userMenu.onclick = () => openUserMeny();
video.onclick = () => toggleFullScreen();
document.addEventListener("fullscreenchange", (e) => handleFullscreenChange(e));

//Socket listeners
socket.on("socketId", (id) => {
  STATE.mySocketId = id;
});
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
