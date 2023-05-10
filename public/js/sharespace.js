const socket = io();
const STATE = {
  mySocketId: "",
  myUsername: "",
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

function openUserMeny() {
  modal.classList.remove("CLOSED");
  modal.classList.add("OPEN");
}

function joinRoom() {
  if (socket) {
    socket.emit("joinRoom", {username: STATE.myUsername, roomId});
  }
}

function init() {
  getStoredUsername();
  if (STATE.myUsername) {
    joinRoom();
  }
}

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

socket.on("members", (members) => {console.log(members);});