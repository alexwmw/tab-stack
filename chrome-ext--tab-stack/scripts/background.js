const openTabs = {};
const times = {};
var activeTabIds = [];
var lockedTabIds = [];
//const control = [17];
//const command = [91, 93, 224];
//const osCmds = navigator.platform == "MacIntel" ? command : control;
var tsClosed = false;
const status = {
  working: true,
  pending: false,
  //  disabled: false,
  paused: false,
};

var settings = {
  filterSelection: "All tabs",
  theme: "light",
  allow_closing: true,
  _time_min: 16,
  _time_sec: 0,
  reset_delay: 1,
  max_allowed: 3,
  timer_reset: "reset",
  auto_locking: "none",
  match_rules: [],
  not_match_rules: [],
  audible_lock: true,
  clear_on_quit: true,
  window_size: "small",
  max_stored: 25,
  prevent_dup: "url",
  paused: false,
  show_notifications: true,
};

const time = () => settings._time_min * 60 + settings._time_sec / 1;
const tabLocked = (tabId) => lockedTabIds.includes(parseInt(tabId));
const tabActive = (tabId) => activeTabIds.includes(parseInt(tabId));
const tabAudible = (tabId) => openTabs[tabId].audible;
const tabPinned = (tabId) => {
  try {
    return openTabs[tabId].pinned;
  } catch (e) {
    return false;
  }
};

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
          ClosedTab.remove(id);
        }
      });
    } else if (settings.prevent_dup == "title_host") {
      $.each(ClosedTab.tabs, function (id, tab) {
        if (
          tabUrl(tab).hostname == tabUrl(removedTab).hostname &&
          tab.title == removedTab.title
        ) {
          ClosedTab.remove(id);
        }
      });
    }
    if (removedTab) {
      this.tabs[tabId] = new ClosedTab(removedTab);
      this.tabs[tabId].closedByTs = closedByTs;
      keepClosedTabsBelowMax();
    }
    saveChanges();
  }

  static length = () => Object.keys(this.tabs).length;

  static includes(x) {
    return Object.keys(this.tabs).includes(x);
  }

  static remove(tabId) {
    delete ClosedTab.tabs[tabId];
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
            ClosedTab.remove(thisId);
            chrome.windows.update(tab.windowId, { focused: true });
            saveChanges();
            resolve(tab);
          }
        });
      });
    });
  }
}

function isAutoLockable(tab) {
  const rules =
    settings.auto_locking == "matches"
      ? settings.match_rules
      : settings.auto_locking == "non_matches"
      ? settings.not_match_rules
      : false;
  var isMatch = false;
  if (rules) {
    isMatch = rules.some((rule) =>
      settings.auto_locking == "matches"
        ? matchesRule(tab, rule)
        : !matchesRule(tab, rule)
    );
    //alert(`${tab.title} isAutoLockAble returns ${isMatch}`);
    return isMatch;
  }
}

function matchesRule(tabObj, ruleStr) {
  // return true if tab matches rule
  const tabURL = new URL(tabObj.url.toLowerCase());
  const ruleURL = ruleStr[0] == ":" ? false : new URL(ruleStr.trim());
  if (ruleURL) {
    //macth according to url string
  } else {
    // else match according to identifier
    const identifier = ruleStr.slice(1, ruleStr.substring(1).indexOf(":") + 1);
    const substr = ruleStr
      .substring(ruleStr.substring(1).indexOf(":") + 2)
      .trim()
      .toLowerCase();
    switch (identifier) {
      case "protocol":
        return tabURL.protocol.includes(substr);
      case "url":
        return tabObj.url.includes(substr);
      case "title":
        return tabObj.title.toLowerCase().includes(substr);
      case "hostname":
        return tabURL.hostname.includes(substr);
      default:
        return false;
    }
  }
  alert("tab stack: Bad formatted rule.\nCheck your rules in settings!");
  return false;
}

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
    if (parseInt(tabs.length) <= parseInt(settings.max_allowed)) {
      status.pending = true;
      if (settings.timer_reset == "reset") {
        setTimesOnStartup(Object.values(openTabs));
      }
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
    : //: status.disabled
    //? "Disabled. Enable automatic closing in settings."
    status.pending
    ? "Pending: Too few tabs open"
    : "Active";
  chrome.browserAction.setIcon({ path: iconPath });
  chrome.browserAction.setTitle({ title: title });
}

var everySecond = window.setInterval(function () {
  var tick =
    !status.paused &&
    //(!status.disabled || (status.disabled && settings.timer_reset == "continue")) &&
    (!status.pending || (status.pending && settings.timer_reset == "continue"));

  if (tick) {
    Object.keys(times).forEach((tabId) => {
      if (!Object.keys(openTabs).includes(tabId)) {
        delete times[tabId];
      } else if (
        !tabLocked(tabId) &&
        !tabPinned(tabId) &&
        !tabActive(tabId) &&
        times[tabId] > 0 &&
        (!tabAudible(tabId) || !settings.audible_lock)
      ) {
        times[tabId] = times[tabId] - 1;
      }

      if (times[tabId] == 0 && !status.pending) {
        chrome.tabs.remove(parseInt(tabId));
      }
    });
  }
}, 1000);

function saveChanges() {
  const tabsObj = settings.clear_on_quit ? {} : ClosedTab.tabs;
  chrome.storage.sync.set(
    {
      settings: settings,
      closedTabs: tabsObj,
    },
    function () {}
  );
}

function keepClosedTabsBelowMax() {
  const nClosedTabs = parseInt(Object.keys(ClosedTab.tabs).length);
  const max = parseInt(settings.max_stored);
  if (nClosedTabs > max) {
    const idByTime = Object.keys(ClosedTab.tabs).sort(function (id_a, id_b) {
      ClosedTab.tabs[id_a].timeClosed < ClosedTab.tabs[id_b].timeClosed;
    });
    for (var i = 0; i < nClosedTabs - max; i++) {
      delete ClosedTab.tabs[idByTime[0]];
    }
  }
}

function notification(tab) {
  const isLocked = lockedTabIds.includes(tab.id);
  const tString = isLocked ? "Tab Locked" : "Tab Unlocked";
  if (settings.show_notifications) {
    chrome.notifications.create({
      iconUrl: "../images/icon128.png",
      type: "basic",
      title: tString,
      message: `${tab.title}`,
    });
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
      sendResponse({});
      break;
    case "forget_closed_tab":
      ClosedTab.remove(obj.data);
      saveChanges();
      sendResponse({
        closedTabs: ClosedTab.tabs,
      });
      break;
    case "set_setting":
      settings[obj.key] = obj.value;
      resetTimers(obj.key);
      status.paused = settings.paused;
      //status.disabled = !settings.allow_closing;
      keepClosedTabsBelowMax();
      setPendingStatus();
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
      }, settings.timer_reset_delay * 1000);
    });
  });
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (info.status == "complete") {
    updateOpenTabs();
    setPendingStatus();
    /*if (isAutoLockable(tab)) {
      lockedTabIds.push(tab);
      notification(tab);
      chrome.browserAction.setBadgeText({ tabId: tab.id, text: "lock" });
    }
    if (lockedTabIds.includes(tab.id)) {
      chrome.browserAction.setBadgeText({ tabId: tab.id, text: "lock" });
    }*/
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  var tsClosed = times[tabId] <= 0;
  ClosedTab.onRemoved(tabId, tsClosed);
  delete times[tabId];
  delete openTabs[tabId];
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
                lockedTabIds.includes(tab.id)
                  ? lockedTabIds.pop(tab.id)
                  : lockedTabIds.push(tab.id);
                notification(tab);
                chrome.browserAction.setBadgeText({
                  tabId: tab.id,
                  text: tabLocked(tab.id) ? "lock" : "",
                });
              }
            );
          } else if (responseObject.confirmed) {
            // handled in search.js
          }
        }
      );
      break;
  }
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.storage.sync.get(["settings", "closedTabs"], function (result) {
  if (result["settings"]) {
    settings = result["settings"];
  }
  if (result["closedTabs"]) {
    Object.entries(result["closedTabs"]).map(function ([id, tab]) {
      ClosedTab.tabs[id] = new ClosedTab(tab);
    });
  }
  updateOpenTabs(setTimesOnStartup);
  setPendingStatus();
  Object.keys(openTabs).forEach((id) => {
    times[id] = time();
  });
});
chrome.browserAction.setBadgeBackgroundColor({ color: "#008080" });
