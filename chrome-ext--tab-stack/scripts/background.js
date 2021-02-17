const openTabs = {};

class ClosedTab {
  static tabs = {};

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

  /* static closeForMe(tabId) {
    chrome.tabs.get(tabId, function (tab) {
      tabs[tab.id] = new ClosedTab(tab);
      chrome.tabs.remove(tabId);
    });
  } */

  static onRemoved(tabId) {
    const removedTab = openTabs[tabId];
    if (notNewTab(removedTab)) {
      this.tabs[tabId] = new ClosedTab(removedTab);
      console.log("closed: " + this.tabs[tabId].url);
    }
    this.closedBy = "user";
  }

  static openById(id) {
    this.tabs[id].resurrect();
    delete this.tabs[id];
  }

  resurrect() {
    const details = {
      active: true,
      index: this.index,
      openerTabId: this.openerTabId,
      pinned: this.pinned,
      url: this.url,
      windowId: this.windowId,
    };
    const id = this.id;
    return new Promise(function (resolve, reject) {
      chrome.tabs.create(details, function (tab) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        } else {
          delete ClosedTab.tabs[id];
          resolve(tab);
        }
      });
    });
  }
}

function notNewTab(tab) {
  return tab.title != "New Tab" || tab == null;
}

function updateOpenTabs() {
  chrome.tabs.query({}, function (tabs) {
    tabs = tabs.filter(notNewTab);
    for (const tab of tabs) {
      openTabs[tab.id] = tab;
    }
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
  //ClosedTab.onCreated(tabId);
  // if id in Closedtab.tabs keys => remove from closed tabs
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  //if (info.status === "complete") {
  updateOpenTabs();
  //}
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  ClosedTab.onRemoved(tabId);
  delete openTabs[tabId];
  updateOpenTabs();
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

updateOpenTabs();
