const openTabs = {};
var lockedTabIds = [];

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
    }
    this.closedBy = "user";
  }

  forget() {
    delete ClosedTab.tabs[this.id];
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
  });
}

// Add Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.runtime.onMessage.addListener(function (obj, sender, sendResponse) {
  switch (obj.msg) {
    case "request_tabs":
      sendResponse({
        msg: "data sent from bg page",
        openTabData: openTabs,
        closedTabsData: ClosedTab.tabs,
        lockedTabIdsData: lockedTabIds,
      });
      break;
    case "resurrect":
      ClosedTab.tabs[obj.tabId].resurrect();
      sendResponse({});
      break;
    case "request_locked_tabs":
      sendResponse({
        msg: "lockedTabIds",
        data: lockedTabIds,
      });
      break;
    case "tab_locked":
      lockedTabIds = obj.data;
      chrome.runtime.sendMessage({
        msg: "tab_locked",
        data: lockedTabIds,
      });
      break;
    case "forget_closed_tab":
      delete ClosedTab.tabs[obj.data];
      //sendResponse({
      //  closedTabs: ClosedTab.tabs,
      //});
      chrome.runtime.sendMessage({
        msg: "tab_forgotten",
        data: ClosedTab.tabs,
      });
  }
});

chrome.tabs.onCreated.addListener(function (tab) {
  updateOpenTabs();
  //ClosedTab.onCreated(tabId);
  // if id in Closedtab.tabs keys => remove from closed tabs
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  console.log;
  updateOpenTabs();

  //}
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  ClosedTab.onRemoved(tabId);
  delete openTabs[tabId];
  lockedTabIds = lockedTabIds.filter((item) => item != tabId);
  updateOpenTabs();
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

updateOpenTabs();
