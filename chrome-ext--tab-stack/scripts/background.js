var allTabs = {};

chrome.tabs.query({}, (tabs) => {
  allTabs = tabs;
  displayTabs();
});

function displayTabs() {
  document.body
    .appendChild(document.createElement("ul"))
    .append(...allTabs.map(createTabElement));
}

function createTabElement(tab) {
  const el = document.createElement("li");
  el.textContent = tab.id + ": " + tab.url;
  return el;
}

function sendMessage(msgArg, dataArg) {
  chrome.runtime.sendMessage({
    msg: msgArg,
    data: dataArg,
  });
}

chrome.tabs.onCreated.addListener(function (tab) {
  sendMessage("onCreated", tab);
});
