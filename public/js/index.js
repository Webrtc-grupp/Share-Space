const makeRoom = document.getElementById("make-room-btn");
const wrapper = document.getElementById("wrapper");
const startWrapper = document.getElementById("start-wrapper");
const spinnerWrapper = document.getElementById("spinner-wrapper");
const spinLoader = document.getElementById("loader");

function backHome() {
  const msgSuccess = document.getElementById("roomMadeComfirmation");
  msgSuccess.remove();
  startWrapper.classList.remove("HIDDEN");
  startWrapper.classList.add("OPEN");
  spinnerWrapper.classList.remove("OPEN");
  spinnerWrapper.classList.add("HIDDEN");
}

async function getRoom() {
  const response = await fetch("/room");
  const { id } = await response.json();
  if (!id) return console.error("No id provided by server");

  if (id) {
    startWrapper.classList.remove("OPEN");
    startWrapper.classList.add("HIDDEN");
    spinnerWrapper.classList.remove("HIDDEN");
    spinnerWrapper.classList.add("OPEN");
    const roomMadeComfirmation = document.createElement("p");
    roomMadeComfirmation.id = "roomMadeComfirmation";
    roomMadeComfirmation.innerHTML =
      "Room created successfully! Going to room please wait...";
    wrapper.appendChild(roomMadeComfirmation);

    setTimeout(function () {
      window.location.href = `sharespace.html?id=${id}`;
      document.querySelector("body").onbeforeunload = backHome();
    }, 3000);
  }
}

const canShare = navigator.mediaDevices.getDisplayMedia ? true : false;

if (!canShare) alert("Your device does not support screen sharing.");
if (!canShare) makeRoom.disabled = true;

makeRoom.onclick = () => getRoom();
