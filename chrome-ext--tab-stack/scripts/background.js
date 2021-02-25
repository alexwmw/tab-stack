const openTabs = {};
const times = {};
var activeTabIds = [];
var lockedTabIds = [];

var settings = {
  filterSelection: "All tabs",
  theme: "light",
  allow_closing: true,
  audio_keep_open: true,
  _time_min: 15,
  _time_sec: 0,
  max_allowed: 5,
  reset_time: 1,
  rules: "",
  clear_on_quit: true,
  max_stored: 100,
  prevent_dup: "url",
  paused: false,
};

const time = () => settings._time_min * 60 + settings._time_sec;

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
    this.timeClosed = parseInt(Date.now());
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

function updateOpenTabs(callback = false) {
  chrome.tabs.query({}, function (tabs) {
    console.log("Background: openTabs updated");
    tabs = tabs.filter(notNewTab);
    for (const tab of tabs) {
      openTabs[tab.id] = tab;
    }
    if (callback) {
      callback(tabs);
    }
  });
}

function setTimesOnStartup(tabs) {
  tabs.forEach((tab) => {
    times[tab.id] = time();
  });
}

var everySecond = window.setInterval(function () {
  Object.keys(times).forEach((tabId) => {
    if (
      Object.keys(openTabs).includes(tabId) &&
      lockedTabIds.indexOf(parseInt(tabId)) < 0 &&
      activeTabIds.indexOf(parseInt(tabId)) < 0 &&
      !openTabs[tabId].audible &&
      !openTabs[tabId].pinned
    ) {
      times[tabId] = times[tabId] - 1;
    }
    if (
      Object.keys(openTabs).includes(tabId) &&
      activeTabIds.indexOf(parseInt(tabId)) >= 0
    ) {
      console.log(tabId + " is active");
      times[tabId] = time();
    }
    if (
      Object.keys(openTabs).includes(tabId) &&
      lockedTabIds.indexOf(parseInt(tabId)) >= 0
    ) {
      console.log(tabId + " is locked");
    }
    console.log(tabId + ": " + times[tabId]);
  });
  Object.keys(times).forEach((tabId) => {
    if (times[tabId] == 0) {
      chrome.tabs.remove(parseInt(tabId));
    }
  });
}, 1000);

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
      times[obj.id] = time();
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
    case "set_setting":
      settings[obj.key] = obj.value;
      break;
    case "get_setting":
      sendResponse({
        value: settings[obj.key],
      });
      break;
    case "request_times":
      sendResponse({
        times: times[obj.id],
      });
      break;
  }
});

chrome.tabs.onCreated.addListener(function (tab) {
  updateOpenTabs();
  times[tab.id] = time();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({ active: true }, function (tabs) {
    activeTabIds = [];
    console.log("ATIs blank");
    tabs.forEach((tab) => activeTabIds.push(tab.id));
    console.log("ATIs =" + JSON.stringify(activeTabIds));
    times[activeInfo.tabId] = time();
  });
});

function onStartUp() {}

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  updateOpenTabs();
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  ClosedTab.onRemoved(tabId);
  delete openTabs[tabId];
  delete times[tabId];
  lockedTabIds = lockedTabIds.filter((item) => item != tabId);
  activeTabIds = activeTabIds.filter((item) => item != tabId);
  updateOpenTabs();
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

updateOpenTabs(setTimesOnStartup);
Object.keys(openTabs).forEach((id) => {
  times[id] = time();
});
