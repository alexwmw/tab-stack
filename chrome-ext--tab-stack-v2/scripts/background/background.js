const status = {
  working: true,
  pending: false,
  _paused: false,
  set paused(value) {
    chrome.browserAction.setIcon({
      path: value ? "../images/paused_icon.png" : "../images/icon128.png",
    });
    this._paused = value;
  },
  get paused() {
    return this._paused;
  },
};

const allTabs = new TabContainer();

var settings = {
  filterSelection: "All tabs",
  theme: "light",
  _allow_closing: true,
  _time_min: 16,
  _time_sec: 0,
  reset_delay: 1,
  min_required: 3, // change to min_required in settings script
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

function changePendingStatus() {
  if (allTabs.withinPendingRange(settings.min_required)) {
    status.pending = true;
    if (settings.timer_reset == "reset") {
      allTabs.resetTimers();
    }
  } else {
    status.pending = false;
  }
}

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
  const tabsObj = settings.clear_on_quit ? {} : allTabs.closedTabs;
  chrome.storage.sync.set(
    {
      settings: settings,
      closedTabs: tabsObj,
    },
    function () {}
  );
}

function displayAfterLock(tab) {
  if (settings.lock_notification) {
    chrome.notifications.create({
      iconUrl: "../images/icon128.png",
      type: "basic",
      title: tab.locked ? "Tab Locked" : "Tab Unlocked",
      message: tab.title,
    });
  }
  chrome.browserAction.setBadgeText({
    tabId: tab.id,
    text: tab.locked ? "lock" : "",
  });
}

// Add Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.runtime.onMessage.addListener(function (obj, sender, sendResponse) {
  switch (obj.msg) {
  }
});

chrome.tabs.onCreated.addListener(function (chromeTab) {
  if (chromeTab.title != "New Tab") {
    allTabs.addTab(new OpenTab(chromeTab, settings, matchesRule));
  }
  changePendingStatus();
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  allTabs.openTabs[activeInfo.tabId].active = true;
  allTabs.filterAndEach(
    (tab) => tab.id != activeInfo.tabId,
    (tab) => (tab.active = false)
  );
});

chrome.tabs.onUpdated.addListener(function (tabId, info, chromeTab) {
  if (info.status == "complete") {
    allTabs.openTabs[tabId] = new OpenTab(chromeTab, settings, matchesRule);
    changePendingStatus();
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  allTabs.close(tabId, settings.max_stored, duplicateFilter);
  changePendingStatus();
});

chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "lock-toggle":
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (chromeTabs) {
          allTabs.activeTabs[chromeTabs[0].id].lock(displayAfterLock);
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
  }
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) =>
      OpenTab.constructIf(tab, tab.title != "new Tab", allTabs, matchesRule)
    );
    changePendingStatus();
    if (settings.show_notifications) {
      chrome.notifications.create({
        iconUrl: "../images/icon128.png",
        type: "basic",
        title: "Tab Stack is closing tabs on your behalf",
        message: `To change settings, click the [ts] icon in Chrome.`,
      });
    }
  });
});
chrome.browserAction.setBadgeBackgroundColor({ color: "#008080" });
