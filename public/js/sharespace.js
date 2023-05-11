const socket = io();
const STATE = {
  mySocketId: "",
  myUsername: "",
  participants: [],
  localStream: null,
};
//hämtar room id från url:en och skickar den till backend
const { id: roomId } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const username = document.getElementById("input-username");
const continueBtn = document.getElementById("button-continue");
const remember = document.getElementById("ask-again");
const modal = document.getElementById("modal");
const userMenu = document.getElementById("userMenu");
const copyURLElement = document.getElementById("copy-link");
const copyURLMessage = document.getElementById("copyMessage");
const shareButton = document.getElementById("share-btn");
const video = document.getElementById("video");

function getStoredUsername() {
  try {
    const storedName = localStorage.getItem("_SP_username");
    STATE.myUsername = storedName;
    if (STATE.myUsername) {
      modal.classList.remove("OPEN");
      modal.classList.add("CLOSED");
    }
  } catch (error) {
    return false;
  }
}

function copyURL() {
  const url = window.location.href;

  copyURLElement.innerHTML = url;

  copyURLElement.onclick = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        copyURLMessage.innerHTML = "URL copied to clipboard 😍";
        setTimeout(() => {
          copyURLMessage.innerHTML = "Click to copy link";
        }, 2000);
      })
      .catch((error) => {
        copyURLMessage.innerHTML = error;
        setTimeout(() => {
          copyURLMessage.innerHTML = "Click to copy link";
        }, 2000);
      });
  };
}

function openUserMeny() {
  modal.classList.remove("CLOSED");
  modal.classList.add("OPEN");
}

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

function handleParticipants(participants) {
  console.log(
    "🚀 ~ file: sharespace.js:77 ~ handleParticipants ~ participants:",
    participants
  );

  //Lägg till nya - ej dubbletter
  participants.forEach((participant) => {
    console.log(participant);
    const findParticipants = STATE.participants.find(
      (part) => part.socketId === participant.socketId
    );

    if (findParticipants) return;
    console.log("Adding participant: " + participant.username);
    STATE.participants.push(participant);
  });

  //Ta bort döda medlemmar
  STATE.participants = STATE.participants.filter((participant) => {
    const match = participants.find(
      (part) => part.socketId === participant.socketId
    );
    if (match) return match;
    return;
  });

  //Uppdatera visuella element
  updateParticipantsList(participants);
}

function updateParticipantsList(participants) {
  const parentDiv = document.getElementById("participants");
  parentDiv.innerHTML = "";

  participants.forEach((participant) => {
    const participantContainer = document.createElement("div");
    participantContainer.classList.add("container-flex-row");
    participantContainer.classList.add("participant");

    const usernameEl = document.createElement("p");
    const hostEl = document.createElement("p");

    hostEl.classList.add("hostEl");

    usernameEl.innerHTML = participant.username;
    hostEl.innerHTML = "Host";

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerHTML = "👨‍⚕️";

    participantContainer.appendChild(avatar);
    participantContainer.appendChild(usernameEl);
    if (participant.isHost) participantContainer.appendChild(hostEl);
    parentDiv.appendChild(participantContainer);
  });
}

function handleIsHost(isHost) {
  console.log(
    "🚀 ~ file: sharespace.js:131 ~ handleIsHosted ~ isHost:",
    isHost
  );

  if (isHost) {
    STATE.isHost = isHost;
    shareButton.classList.remove("HIDDEN");
  }
}

async function shareScreen() {
  if (STATE.isHost) {
    await navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then((stream) => {
        localStream = stream;
        video.srcObject = localStream;
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

init();

socket.on("socketId", (id) => {
  STATE.mySocketId = id;
});

socket.on("isHost", (isHost) => handleIsHost(isHost));

socket.on("participants", (participants) => handleParticipants(participants));

socket.on("hostLeft", (msg) => handleHostLeft(msg));
