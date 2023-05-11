export function copyURL() {
  const copyURLElement = document.getElementById("copy-link");
  const copyURLMessage = document.getElementById("copyMessage");
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

function test() {
  console.log("asdasdad");
}

module.exports = { test };
