var openTabs = [];
var closedTabs = [];

const NotNewTab = (tab) => tab.title != "New Tab";

function setTabsArrayOnStartup() {
  chrome.tabs.query({}, (tabs) => {
    openTabs = tabs.filter(NotNewTab);
  });
}

function updateTabsArray() {
  chrome.tabs.query({}, (tabs) => {
    openTabs = tabs.filter(NotNewTab);
  });
}

// Add Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.runtime.onMessage.addListener(function (obj, sender, sendResponse) {
  if (obj.msg == "request_tabs") {
    sendResponse({
      msg: "data sent from bg page",
      openTabData: openTabs,
      closedTabsData: closedTabs,
    });
  }
});

chrome.tabs.onCreated.addListener(function (tab) {
  updateTabsArray();
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  //if (info.status === "complete") {
  updateTabsArray();
  //}
});

chrome.tabs.onRemoved.addListener(function () {
  updateTabsArray();
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

setTabsArrayOnStartup();
