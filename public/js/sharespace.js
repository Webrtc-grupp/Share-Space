import {
  copyURL,
  openUserMeny,
  getStoredUsername,
  handleParticipants,
  handleIsHost,
  handleOffer,
  handleAnswer,
  handleCandidate,
} from "./utils.js";
export const socket = io();
export const STATE = {
  mySocketId: "",
  myUsername: "",
  participants: [],
  localStream: null,
  isHost: false,
};
//hämtar room id från url:en och skickar den till backend
const { id: roomId } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const username = document.getElementById("input-username");
const continueBtn = document.getElementById("button-continue");
const remember = document.getElementById("ask-again");
const userMenu = document.getElementById("userMenu");
const video = document.getElementById("video");
const shareButton = document.getElementById("share-btn");

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
    // {
    //   urls: "turn:a.relay.metered.ca:80?transport=tcp",
    //   username: "f6de8d4b9f7bd1de1408b8f3",
    //   credential: "FAZrFTuBsCxg3KxA",
    // },
    // {
    //   urls: "turn:a.relay.metered.ca:443",
    //   username: "f6de8d4b9f7bd1de1408b8f3",
    //   credential: "FAZrFTuBsCxg3KxA",
    // },
  ],
};
////////////////////////////////functions //////////////////////////////////

function joinRoom() {
  if (socket) {
    socket.emit("joinRoom", { username: STATE.myUsername, roomId });
  }
}



function init() {
  getStoredUsername();
  if (STATE.myUsername) {
    joinRoom();
  }
  if (roomId) {
    copyURL();
  }
}

async function shareScreen() {
  if (STATE.isHost) {
    await navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        STATE.localStream = stream;
        video.srcObject = STATE.localStream;
        STATE.participants.map((participant) => {
          if (participant.pc)
            STATE.localStream.getTracks().forEach((track) => {
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

function handleHostLeft(msg) {
  alert(msg);
  window.location.href = "index.html";
}

//EventListeners
shareButton.onclick = () => shareScreen();

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
socket.on("error", (error) => handleError(error));

init();
