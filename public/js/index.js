const makeRoom = document.getElementById("make-room-btn");

async function getRoom() {
  const response = await fetch("/room");
  const { id } = await response.json();
  if (!id) return console.error("No id provided by server");

  window.location.href = `sharespace.html?id=${id}`;
}

const canShare = navigator.mediaDevices.getDisplayMedia ? true : false;

if (!canShare) alert("Your device does not support screen sharing.");
if (!canShare) makeRoom.disabled = true;

makeRoom.onclick = () => getRoom();
