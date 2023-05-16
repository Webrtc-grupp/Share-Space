import { STATE, servers, socket } from "./sharespace.js";
const modal = document.getElementById("modal");

export function copyURL() {
  const url = window.location.href;
  const copyURLElement = document.getElementById("copy-link");
  const copyURLMessage = document.getElementById("copyMessage");
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
}

export function handleParticipants(participants) {
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
  createPcParticipant();
  console.log(STATE);
}

function updateParticipantsList(participants) {
  const parentDiv = document.getElementById("participants");
  parentDiv.innerHTML = "";

  participants.forEach((participant) => {
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
    eye.classList.add("HIDDEN");
    eye.classList.add("eye");
    eye.innerHTML = "👁";

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
    if (event.streams[0]) {
      document.getElementById("video").srcObject = event.streams[0];
      socket.emit("viewing", {
        target: participant.socketId,
        sender: STATE.mySocketId,
        viewing: true,
      });
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
  console.log(
    "🚀 ~ file: sharespace.js:131 ~ handleIsHosted ~ isHost:",
    isHost
  );

  if (isHost) {
    STATE.isHost = isHost;
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
    eyeElement.classList.remove("HIDDEN");
    eyeElement.classList.add("OPEN");
    return;
  }
  if (!viewing && eyeElement) {
    eyeElement.classList.add("HIDDEN");
    eyeElement.classList.remove("OPEN");

    return;
  }
}
