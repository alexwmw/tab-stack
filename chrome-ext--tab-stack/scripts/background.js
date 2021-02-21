const openTabs = {};

function logTabLengths() {
  console.log("open tabs: " + Object.keys(openTabs).length);
  console.log("closed tabs: " + Object.keys(ClosedTab.tabs).length);
}

class ClosedTab {
  constructor(tab) {
    this.id = tab.id;
    this.favIconUrl = tab.favIconUrl;
    this.groupId = tab.groupId;
    this.index = tab.index;
    this.mutedInfo = tab.mutedInfo;
    this.openerTabId = tab.openerTabId;
    this.pinned = tab.pinned;
    this.sessionId = tab.sessionId;
    this.title = tab.title;
    this.url = tab.url;
    this.windowId = tab.windowId;
    this.isClosed = true;
  }

  static tabs = {};

  static onRemoved(tabId) {
    const removedTab = openTabs[tabId];
    if (removedTab) {
      this.tabs[tabId] = new ClosedTab(removedTab);
      console.log("Added to ClosedTab.tabs: " + this.tabs[tabId].url);
      logTabLengths();
    }
    this.closedBy = "user";
  }
  resurrect() {
    const details = {
      active: true,
      index: this.index,
      openerTabId: this.openerTabId,
      pinned: this.pinned,
      url: this.url,
    };
    const thisId = this.id;
    const thisWindowId = this.windowId;
    chrome.windows.get(this.windowId, function (window) {
      if (window) {
        details["windowId"] = thisWindowId;
      }
      return new Promise(function (resolve, reject) {
        chrome.tabs.create(details, function (tab) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            delete ClosedTab.tabs[thisId];
            chrome.windows.update(tab.windowId, { focused: true });
            resolve(tab);
          }
        });
      });
    });
  }
}

function notNewTab(tab) {
  return tab.title != "New Tab";
}

function updateOpenTabs() {
  chrome.tabs.query({}, function (tabs) {
    console.log("Background: openTabs updated");
    tabs = tabs.filter(notNewTab);
    for (const tab of tabs) {
      openTabs[tab.id] = tab;
    }
    logTabLengths();
  });
}

// Add Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.runtime.onMessage.addListener(function (obj, sender, sendResponse) {
  if (obj.msg == "request_tabs") {
    sendResponse({
      msg: "data sent from bg page",
      openTabData: openTabs,
      closedTabsData: ClosedTab.tabs,
    });
  } else if (obj.msg == "resurrect") {
    ClosedTab.tabs[obj.tabId].resurrect();
    sendResponse({});
  }
});

chrome.tabs.onCreated.addListener(function (tab) {
  updateOpenTabs();
  logTabLengths();
  //ClosedTab.onCreated(tabId);
  // if id in Closedtab.tabs keys => remove from closed tabs
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  console.log;
  //if (info.status === "complete") {
  updateOpenTabs();
  logTabLengths();
  //}
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  ClosedTab.onRemoved(tabId);
  delete openTabs[tabId];
  updateOpenTabs();
  logTabLengths();
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

updateOpenTabs();
