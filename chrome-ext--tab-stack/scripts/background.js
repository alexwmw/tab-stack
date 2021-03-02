const openTabs = {};
const times = {};
var activeTabIds = [];
var lockedTabIds = [];
var openTabOrder = [];
//const control = [17];
//const command = [91, 93, 224];
//const osCmds = navigator.platform == "MacIntel" ? command : control;
var tsClosed = false;
const status = {
  working: true,
  pending: false,
  disabled: false,
  paused: false,
};

var settings = {
  // Default settings
  filterSelection: "All tabs",
  theme: "light",
  allow_closing: true,
  _time_min: 16,
  _time_sec: 0,
  max_allowed: 3,
  reset_delay: 5,
  auto_locking: "none",
  match_rules: [],
  not_match_rules: [],
  audible_lock: true,
  clear_on_quit: true,
  window_size: "small",
  max_stored: 50,
  prevent_dup: "url",
  paused: false,
};

const time = () => settings._time_min * 60 + settings._time_sec / 1;
const tabLocked = (tabId) => lockedTabIds.includes(parseInt(tabId));
const tabActive = (tabId) => activeTabIds.includes(parseInt(tabId));
const tabAudible = (tabId) => openTabs[tabId].audible;
const tabPinned = (tabId) => openTabs[tabId].pinned;

class ClosedTab {
  static tabs = {};
  static closedOrder = [];
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
    this.closedByTs = false;
  }

  static onRemoved(tabId, closedByTs) {
    const removedTab = openTabs[tabId];
    const tabUrl = (tab) => new URL(tab.url);
    if (settings.prevent_dup == "url") {
      $.each(ClosedTab.tabs, function (id, tab) {
        if (tab.url == removedTab.url) {
          delete ClosedTab.tabs[id];
          ClosedTab.closedOrder.pop(id);
        }
      });
    } else if (settings.prevent_dup == "title_host") {
      $.each(ClosedTab.tabs, function (id, tab) {
        if (
          tabUrl(tab).hostname == tabUrl(removedTab).hostname &&
          tab.title == removedTab.title
        ) {
          delete ClosedTab.tabs[id];
          ClosedTab.closedOrder.pop(id);
        }
      });
    }
    ClosedTab.closedOrder.push(tabId);
    if (removedTab) {
      this.tabs[tabId] = new ClosedTab(removedTab);
      this.tabs[tabId].closedByTs = closedByTs;
      deleteOverMaxClosed();
    }
    saveChanges();
  }

  forget() {
    delete this.tabs[this.id];
    tabOrder.pop(this.id);
  }

  static length = () => Object.keys(this.tabs).length;

  static includes(x) {
    return Object.keys(this.tabs).includes(x);
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
            ClosedTab.closedOrder.pop(thisId);
            chrome.windows.update(tab.windowId, { focused: true });
            saveChanges();
            resolve(tab);
          }
        });
      });
    });
  }
}

const closedTabs = new Proxy(ClosedTab.tabs, {
  get: function (target, prop) {
    return target[prop];
  },
  set: function (target, prop, value) {
    target[prop] = value;
    saveChanges();
    return true;
  },
});

function resetTimers(key) {
  switch (key) {
    case "allow_closing":
      setTimesOnStartup(Object.values(openTabs));
      break;
    case "_time_min":
      setTimesOnStartup(Object.values(openTabs));
      break;
    case "_time_sec":
      setTimesOnStartup(Object.values(openTabs));
      break;
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

function setPendingStatus() {
  chrome.tabs.query({}, function (tabs) {
    if (tabs.length < settings.max_allowed + 1) {
      status.pending = true;
      setTimesOnStartup(Object.values(openTabs));
    } else {
      status.pending = false;
    }
    updateBroswerAction();
  });
}

function updateBroswerAction() {
  var iconPath = status.paused
    ? "../images/paused_icon.png"
    : "../images/icon128.png";
  var title = status.paused
    ? "Paused"
    : status.disabled
    ? "Disabled. Enable automatic closing in settings."
    : status.pending
    ? "Pending: Too few tabs open"
    : "Active";
  chrome.browserAction.setIcon({ path: iconPath });
  chrome.browserAction.setTitle({ title: title });
}

var everySecond = window.setInterval(function () {
  if (!status.pending && !status.paused && !status.disabled) {
    Object.keys(times).forEach((tabId) => {
      if (
        !tabLocked(tabId) &&
        !tabPinned(tabId) &&
        !tabActive(tabId) &&
        (!tabAudible(tabId) || !settings.audible_lock)
      ) {
        times[tabId] = times[tabId] - 1;
      }
      if (times[tabId] == 0) {
        chrome.tabs.remove(parseInt(tabId));
      }
    });
  }
}, 1000);

function saveChanges() {
  const tabsObj = settings.clear_on_quit ? {} : ClosedTab.tabs;
  const orderArr = settings.clear_on_quit ? [] : ClosedTab.closedOrder;
  chrome.storage.sync.set(
    {
      settings: settings,
      closedTabs: tabsObj,
      closedOrder: orderArr,
    },
    function () {}
  );
}

function deleteOverMaxClosed() {
  if (parseInt(settings.max_stored) < parseInt(ClosedTab.closedOrder.length)) {
    var difference =
      parseInt(ClosedTab.closedOrder.length) - parseInt(settings.max_stored);
    for (var i = 0; i < difference; i++) {
      var idToRemove = ClosedTab.closedOrder[0];
      delete ClosedTab.tabs[idToRemove];
      ClosedTab.closedOrder.shift();
    }
  }
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
        closedOrder: ClosedTab.closedOrder,
        openOrder: openTabOrder,
      });
      break;
    case "resurrect":
      ClosedTab.tabs[obj.tabId].resurrect();
      sendResponse({});
      ClosedTab.tabs;
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
      sendResponse({});
      break;
    case "forget_closed_tab":
      delete ClosedTab.tabs[obj.data];
      ClosedTab.closedOrder.pop(obj.data);
      saveChanges();
      sendResponse({
        closedTabs: ClosedTab.tabs,
        closedOrder: ClosedTab.closedOrder,
      });
      break;
    case "set_setting":
      settings[obj.key] = obj.value;
      resetTimers(obj.key);
      status.paused = settings.paused;
      status.disabled = !settings.allow_closing;
      deleteOverMaxClosed();
      saveChanges();
      updateBroswerAction();
      sendResponse({});
      break;
    case "get_setting":
      sendResponse({
        value: settings[obj.key],
      });
      break;
    case "get_all_settings":
      sendResponse({
        settings: settings,
      });
      break;
    case "request_times":
      sendResponse({
        times: times[obj.id],
      });
      break;
    case "get_status":
      sendResponse({
        status: status,
      });
      break;
    case "replace_closed_tabs":
      ClosedTab.tabs = obj.data;
      ClosedTab.closedOrder = [];
      saveChanges();
      break;
  }
});

chrome.tabs.onCreated.addListener(function (tab) {
  updateOpenTabs();
  times[tab.id] = time();
  setPendingStatus();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.query({ active: true }, function (tabs) {
    activeTabIds = [];
    tabs.forEach((tab) => {
      activeTabIds.push(tab.id);
      setTimeout(function () {
        if (tabActive(tab.id)) {
          times[tab.id] = time();
        }
      }, settings.reset_delay * 1000);
    });
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  updateOpenTabs();
  setPendingStatus();
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  ClosedTab.onRemoved(tabId, tsClosed);
  tsClosed = false;
  delete openTabs[tabId];
  delete times[tabId];
  lockedTabIds = lockedTabIds.filter((item) => item != tabId);
  activeTabIds = activeTabIds.filter((item) => item != tabId);
  updateOpenTabs();
  setPendingStatus();
});

chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "lock-toggle":
      chrome.runtime.sendMessage(
        { msg: "command_lock_toggle" },
        function (responseObject) {
          if (chrome.runtime.lastError) {
            chrome.tabs.query(
              { active: true, lastFocusedWindow: true },
              function (tabs) {
                const tab = tabs[0];
                if (lockedTabIds.includes(tab.id)) {
                  lockedTabIds.pop(tab.id);
                  chrome.notifications.create({
                    iconUrl: "../images/icon128.png",
                    type: "basic",
                    title: "Tab Unlocked",
                    message: `${tab.title}`,
                  });
                } else {
                  lockedTabIds.push(tab.id);
                  chrome.notifications.create({
                    iconUrl: "../images/icon128.png",
                    type: "basic",
                    title: "Tab Locked",
                    message: `${tab.title}`,
                  });
                }
              }
            );
          } else if (responseObject.confirmed) {
          }
        }
      );
      break;
  }
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.storage.sync.get(
  ["settings", "closedTabs", "closedOrder"],
  function (result) {
    if (result["settings"]) {
      settings = result["settings"];
    }
    if (result["closedTabs"]) {
      Object.entries(result["closedTabs"]).map(function ([id, tab]) {
        ClosedTab.tabs[id] = new ClosedTab(tab);
      });
    }
    if (result["closedOrder"]) {
      ClosedTab.closedOrder = result["closedOrder"];
    }
  }
);

updateOpenTabs(setTimesOnStartup);
setPendingStatus();
Object.keys(openTabs).forEach((id) => {
  times[id] = time();
});
