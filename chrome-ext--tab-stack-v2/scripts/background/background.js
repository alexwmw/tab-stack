const status = {
  working: true,
  pending: false,
  paused: false,
};

var settings = {};

const allTabs = new TabContainer(settings);

settings = {
  filterSelection: "All tabs",
  theme: "light",
  _allow_closing: true,
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
  startup_notification: true, // Add to settings
  lock_notification: true, // Add to settings

  get allowedTime() {
    return this._time_min * 60 + this._time_sec / 1;
  },

  get selected_match_rules() {
    return this.auto_locking != "none"
      ? // Check in setting that this is the right value
        this[this.auto_locking + "_rules"]
      : false;
  },

  get allow_closing() {
    return _allow_closing;
  },

  set allow_closing(value) {
    allTabs.resetTimers();
    _allow_closing = value;
  },

  get time_min() {
    return _time_min;
  },

  set time_min(value) {
    allTabs.resetTimers();
    _time_min = value;
  },

  get time_sec() {
    return _time_sec;
  },

  set time_sec(value) {
    allTabs.resetTimers();
    _time_sec = value;
  },
};

function matchesRule(tabObj, ruleStr) {
  // return true if tab matches rule
  const tabURL = new URL(tabObj.url.toLowerCase());
  const ruleURL = ruleStr[0] == ":" ? false : new URL(ruleStr.trim());
  if (ruleURL) {
    //match according to url string
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

function allChromeTsabsToTsTabs(callback = false) {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) =>
      OpenTab.constructIf(tab, tab.title != "new Tab", allTabs, matchesRule)
    );
    if (callback) {
      callback(tabs);
    }
  });
}

function setPendingStatus() {
  if (allTabs.withinPendingRange()) {
    status.pending = true;
    if (settings.timer_reset == "reset") {
      allTabs.resetTimers();
    }
  } else {
    status.pending = false;
  }
  updateBrowserAction();
}

function updateBrowserAction() {
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

window.setInterval(function () {
  const statusAllowsTicking =
    !status.paused &&
    (!status.pending || (status.pending && settings.timer_reset == "continue"));
  if (statusAllowsTicking) {
    allTabs.filterAndEach(
      (tab) =>
        !tab.closed &&
        !tab.locked &&
        !tab.pinned &&
        !tab.active &&
        !tab.audible &&
        tab.timeRemaining > 0,
      (tab) => tab.tick()
    );

    allTabs.filterAndEach(
      (tab) => !tab.closed && tab.timeRemaining <= 0,
      (tab) => chrome.tabs.remove(parseInt(tab.id))
    );
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

function lockNotification(tab) {
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
    case "tab_report":
      const object = obj.closed ? ClosedTab.tabs : openTabs;
      const tab = object[obj.id];
      const report = [
        "Type: " + (obj.closed ? "closed" : "open"),
        "Title: " + tab.title,
        "Url: " + tab.url,
        !obj.closed
          ? "Time created: " + times[obj.id]
          : "Time remaining): " + tab.timeClosed,
      ];
      alert(report.join("\n"));
      break;
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
      updateBrowserAction();
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
  OpenTab.constructIf(tab, tab.title != "New Tab", allTabs, matchesRule);
  setPendingStatus();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  allTabs.openTabs[activeInfo.tabId].active = true;
  allTabs.filterAndEach(
    (tab) => tab.id != activeInfo.tabId,
    (tab) => (tab.active = false)
  );
});

chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
  if (info.status == "complete" && tab.title != "New Tab") {
    allTabs.openTabs[tabId] = tab;
    setPendingStatus();
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  allTabs.openTabs[tabId].close();
  setPendingStatus();
});

chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "lock-toggle":
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (tabs) {
          allTabs.openTabs[tabs[0].id].lock();
          lockNotification(tab);
          chrome.browserAction.setBadgeText({
            tabId: tab.id,
            text: allTabs.openTabs[tab.id].locked ? "lock" : "",
          });
        }
      );
  }
});

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.storage.sync.get(["settings", "closedTabs"], function (result) {
  if (result["settings"]) {
    settings = result["settings"];
  }
  if (result["closedTabs"]) {
    Object.entries(result["closedTabs"]).map(function ([id, tab]) {
      allTabs.tabs[id] = new ClosedTab(tab);
    });
  }
  allChromeTabsToTsTabs(setTimesOnStartup);
  setPendingStatus();
  if (settings.show_notifications) {
    chrome.notifications.create({
      iconUrl: "../images/icon128.png",
      type: "basic",
      title: "Tab Stack is closing tabs on your behalf",
      message: `To change settings, click the [ts] icon in Chrome.`,
    });
  }
});
chrome.browserAction.setBadgeBackgroundColor({ color: "#008080" });
