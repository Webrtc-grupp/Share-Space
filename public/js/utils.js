import {
  STATE,
  remember,
  servers,
  socket,
  username,
  copyURLElement,
  copyURLMessage,
  copyBtn,
  url,
  shareButton,
  sidePanel,
  sidePanelBtn,
  panelheader,
  panelPart,
} from "./sharespace.js";

//Variables

const { id: roomId } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//Functions
export function getStoredUsername() {
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

export function openUserMeny() {
  modal.classList.remove("CLOSED");
  modal.classList.add("OPEN");
  username.value = STATE.myUsername;
  const saved = localStorage.getItem("_SP_username");
  remember.checked = saved ? true : false;
}

export function toggleFullScreen() {
  console.log("Toggle Full Screen");
  const video = document.getElementById("video");
  if (!video) return;
  if (STATE.fullscreen) document.exitFullscreen();
  video
    .requestFullscreen({ navigationUI: "show" })
    .then(() => (STATE.fullscreen = true));
}

export function handleFullscreenChange(e) {
  console.log("🚀 ~ file: utils.js:41 ~ handleFullscreenChange ~ e:", e);
}

export function handleParticipants(participants) {
  console.log(
    "🚀 ~ file: sharespace.js:77 ~ handleParticipants ~ participants:",
    participants
  );

  //Lägg till nya - ej dubbletter
  participants.forEach((participant) => {
    console.log(participant);
    const participantMatch = STATE.participants.find(
      (part) => part.socketId === participant.socketId
    );

    if (participantMatch) {
      console.log(participant.username);
      if (participantMatch.username === participant.username) return;
      if (participantMatch.username !== participant.username) {
        participantMatch.username = participant.username;
        return;
      }
    }
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
  updateParticipantsList(STATE.participants);
  createPcParticipant();
  console.log(STATE);
}

function updateParticipantsList(participants) {
  const parentDiv = document.getElementById("participants");
  parentDiv.innerHTML = "";

  participants.forEach((participant) => {
    console.log(
      "🚀 ~ file: utils.js:105 ~ participants.forEach ~ participant:",
      participant
    );
    const participantContainer = document.createElement("div");
    participantContainer.classList.add("container-flex-row");
    participantContainer.classList.add("participant");
    participantContainer.id = participant.socketId;

    const usernameEl = document.createElement("p");
    const hostEl = document.createElement("p");

    hostEl.classList.add("hostEl");

    usernameEl.innerHTML = participant.username;
    hostEl.innerHTML = "Host";

    const avatar = document.createElement("div");
    avatar.classList.add("avatar");
    avatar.innerHTML = "👨‍⚕️";

    const eye = document.createElement("div");
    if (!participant.viewing) eye.classList.add("HIDDEN");
    eye.classList.add("eye");
    eye.innerHTML = "Viewing";

    if (participantContainer.id === STATE.mySocketId) {
      participantContainer.classList.add("me");
      participantContainer.onclick = () => openUserMeny();
    }

    participantContainer.appendChild(avatar);
    participantContainer.appendChild(usernameEl);
    participantContainer.appendChild(eye);
    if (participant.isHost) participantContainer.appendChild(hostEl);
    parentDiv.appendChild(participantContainer);
  });
}

function createPcParticipant() {
  STATE.participants.map((participant) => {
    if (participant.pc) return;
    if (participant.socketId === STATE.mySocketId) return;
    if (STATE.isHost) return createParticipantPeerConnection(participant);
    if (participant.isHost) return createParticipantPeerConnection(participant);
  });
}

function createParticipantPeerConnection(participant) {
  participant.pc = new RTCPeerConnection(servers);
  // participant.pc = peerConnection;
  if (STATE.localStream) {
    STATE.localStream.getTracks().forEach((track) => {
      participant.pc.addTrack(track, STATE.localStream);
    });
  }

  participant.pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("candidate", {
        target: participant.socketId,
        sender: STATE.mySocketId,
        candidate: event.candidate,
      });
    }
  };

  participant.pc.onnegotiationneeded = (event) => {
    console.log(
      "🚀 ~ file: utils.js:139 ~ createParticipantPeerConnection ~ event:",
      event
    );
    if (STATE.isHost) createPartOffer(participant);
  };

  if (STATE.isHost) createPartOffer(participant);

  participant.pc.ontrack = (event) => {
    console.log(
      "🚀 ~ file: utils.js:130 ~ peerConnection.ontrack ~ event:",
      event
    );
    console.log(
      "🚀 ~ file: utils.js:160 ~ createParticipantPeerConnection ~ event.streams[0]:",
      event.streams[0]
    );
    if (event.streams[0].active) {
      document.getElementById("video").srcObject = event.streams[0];
      const video = document.getElementById("video");
      video.style.backgroundColor = "white";
      setTimeout(() => {
        if (video.readyState === 4) {
          socket.emit("viewing", {
            target: participant.socketId,
            sender: STATE.mySocketId,
            viewing: true,
          });
        }
      }, 3000);
    }
  };

  participant.pc.oniceconnectionstatechange = function (event) {
    console.log("event", event);
    if (event.srcElement.connectionState === "failed") {
      socket.emit("error", {
        target: participant.socketId,
        msg: "WebRTC connection failed",
      });
      // Display an alert when WebRTC fails
      alert("WebRTC connection failed!");
    }
  };
  console.log(participant.pc);
}

function createPartOffer(participant) {
  participant.pc
    .createOffer()
    .then(async (offer) => {
      await participant.pc.setLocalDescription(offer);
    })
    .then(() => {
      const payload = {
        target: participant.socketId,
        sender: STATE.mySocketId,
        offer: participant.pc.localDescription,
      };
      socket.emit("offer", payload);
    })
    .catch((error) => {
      console.error(error);
    });
}

export function handleIsHost(isHost) {
  const shareButton = document.getElementById("share-btn");
  const info = document.getElementById("info");
  console.log(
    "🚀 ~ file: sharespace.js:131 ~ handleIsHosted ~ isHost:",
    isHost
  );

  if (isHost) {
    STATE.isHost = isHost;
    info?.classList.add("HIDDEN");
    shareButton.classList.remove("HIDDEN");
  }
}

export async function handleOffer({ offer, sender }) {
  //offer borde se ut {target: id för den som skall ta emot offer, offer, sender: id för den som skickade offer}
  console.log(
    "🚀 ~ file: utils.js:117 ~ handleOffer ~ offer, sender:",
    offer,
    sender
  );

  try {
    const pc = findTargetPC(sender);

    await pc
      .setRemoteDescription(offer)
      .then(async () => {
        const answer = pc.createAnswer();
        await pc.setLocalDescription(answer).then(() => {
          const payload = {
            target: sender,
            answer: pc.localDescription,
            sender: STATE.mySocketId,
          };
          socket.emit("answer", payload);
        });
      })
      .catch((err) => console.error(err));
  } catch (error) {
    console.log(error);
  }
}

export async function handleAnswer({ sender, answer }) {
  //answer borde se ut {target: id för den som skall ta emot answer, answer, sender: id för den som skickade answer}
  console.log(
    "🚀 ~ file: utils.js:148 ~ handleAnswer ~ sender, answer:",
    sender,
    answer
  );

  try {
    const pc = findTargetPC(sender);
    await pc
      .setRemoteDescription(answer)
      .then(() => console.log("Answer set as RemoteDescription"))
      .catch((err) => console.error(err));
  } catch (error) {
    console.error(error);
  }
}

export async function handleCandidate({ candidate, sender }) {
  //candidate borde se ut {target: id för den som skall ta emot candidate, candidate, sender: id för den som skickade candidate}
  console.log(
    "🚀 ~ file: utils.js:163 ~ handleCandidate ~ candidate, sender:",
    candidate,
    sender
  );
  try {
    const pc = findTargetPC(sender);
    await pc.addIceCandidate(candidate);
  } catch (error) {
    console.error(error);
  }
}

function findTargetPC(target) {
  console.log("🚀 ~ file: utils.js:251 ~ findTargetPC ~ target:", target);
  console.log("🚀 ~ file: utils.js:252 ~ findTargetPC ~ STATE:", STATE);
  const match = STATE.participants.find(
    (participant) => participant.socketId === target
  );
  if (match.pc) return match.pc;
  console.log("Could not find participant PC");
}

export function handleParticipantViewing({ sender, viewing }) {
  console.log(
    "🚀 ~ file: utils.js:271 ~ handleParticipantViewing ~ sender, viewing:",
    sender,
    viewing
  );

  const participantContainer = document.getElementById(sender);
  // const eyeElement = participantContainer.children.find(child =>
  // child.classList.contains(className));
  const eyeElement = participantContainer.querySelector(".eye");
  if (viewing && eyeElement) {
    STATE.participants.find((part) => part.socketId === sender).viewing = true;
    eyeElement.classList.remove("HIDDEN");
    eyeElement.classList.add("OPEN");
    return;
  }
  if (!viewing && eyeElement) {
    STATE.participants.find((part) => part.socketId === sender).viewing = false;
    eyeElement.classList.add("HIDDEN");
    eyeElement.classList.remove("OPEN");

    return;
  }
}

export function copyURL() {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      copyURLMessage.innerHTML = "URL copied to clipboard 😍";
      setTimeout(() => {
        copyURLMessage.innerHTML =
          " Click the link to copy and share it";
      }, 2000);
    })
    .catch((error) => {
      copyURLMessage.innerHTML = error;
      setTimeout(() => {
        copyURLMessage.innerHTML =
          "Click the link to copy and share it";
      }, 2000);
    });
}

export function copyByBtn() {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      copyBtn.innerHTML = "URL copied to clipboard 😍";
      setTimeout(() => {
        copyBtn.innerHTML =
          " Click the link to copy and share it";
      }, 2000);
    })
    .catch((error) => {
      copyBtn.innerHTML = error;
      setTimeout(() => {
        copyBtn.innerHTML =
          " Click the link to copy and share it";
      }, 2000);
    });
}

export function leaveRoom() {
  window.location.href = "index.html";
}

export function handleError(error) {
  alert(error.msg);
}

export function joinRoom() {
  if (socket) {
    socket.emit("joinRoom", { username: STATE.myUsername, roomId });
  }
}

export function handleContinue() {
  const value = username.value;
  const dontaskagain = remember.checked;

  if (value !== "" && value !== " " && !STATE.joinedRoom) {
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
    return;
  } else if (value !== "" && value !== " " && STATE.joinedRoom) {
    STATE.myUsername = value;
    updateUsername(STATE.myUsername);
    modal.classList.remove("OPEN");
    modal.classList.add("CLOSED");

    if (dontaskagain) {
      localStorage.setItem("_SP_username", STATE.myUsername);
    }
    if (!dontaskagain) {
      localStorage.removeItem("_SP_username");
    }
    console.log(STATE);
    return;
  }
  alert("please enter your name");
}

export async function shareScreen() {
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
              track.addEventListener("removetrack", () => {
                handleStopScreenShare(participant.socketId);
              });
              participant.pc.addTrack(track, STATE.localStream);
            });

          console.log(
            "🚀 ~ file: sharespace.js:101 ~ STATE.participants.map ~ participant:",
            participant
          );
        });
        setInterval(() => {
          if (video.readyState === 2) stopSharing();
        }, 2000);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

export function stopSharing() {
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

export function showSidePanel() {
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

export function hideSidePanel() {
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

export function handleHostLeft(msg) {
  alert(msg);
  window.location.href = "index.html";
}

function updateUsername(newUsername) {
  if (socket && newUsername && STATE.mySocketId) {
    socket.emit("username", {
      username: newUsername,
      roomId,
    });
  }
}

export function handleJoinedRoom(roomJoinedId) {
  if (roomId === roomJoinedId) {
    STATE.joinedRoom = true;
  }
}
