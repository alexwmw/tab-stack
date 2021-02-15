var originalTitle = document.title;

function setLock(isLock) {
  var str = isLock ? "🔒" : "";
  document.title = str + originalTitle;
}

chrome.runtime.onMessage.addListener(function (obj, sender, sendResponse) {
  sendResponse({ title: originalTitle, newState: obj.msg });
  setLock(obj.bool);
});
