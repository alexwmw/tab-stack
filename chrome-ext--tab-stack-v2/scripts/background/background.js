/**
 * A container for tabStackTab descended objects (openTab, closedTab)
 * representing all open and closed tabs
 */
const allTabs = new TabContainer();

/**
 *
 */
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

// Settings  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

var _settings = {};

var defaultSettings = {
  filterSelection: "All tabs",
  theme: "light",
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
};

/**
 * The settingsHandler saves to chrome.storage.sync on every 'set'.
 * An event listener updates local settings on every change.
 */
const settingsHandler = {
  get: function (obj, property) {
    if (property == "allowedTime") {
      return obj._time_min * 60 + obj._time_sec / 1;
    }
    if (property == "selected_match_rules") {
      return obj.auto_locking != "none"
        ? // Check in setting that this is the right value
          obj[obj.auto_locking + "_rules"]
        : false;
    }
    return obj[property];
  },
  set: function (obj, property, value) {
    if (property == "_time_min" || property == "_time_sec") {
      allTabs.resetTimers();
    }
    // Save to sync storage on every 'set'
    chrome.storage.sync.set({ settings: obj });
  },
};

const settings = new Proxy(_settings, settingsHandler);

// Functions  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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

// Intervals - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

window.setInterval(function () {
  const statusAllowsTicking =
    !status.paused &&
    (!status.pending ||
      (status.pending && _settings.timer_reset == "continue"));
  if (statusAllowsTicking) {
    /*allTabs.filterAndEach(
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
    );*/
  }
}, 1000);

// Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.storage.onChanged.addListener(function (changes, areaName) {
  for (var key in changes) {
    if (key == "settings") {
      _settings = changes[key];
    } else if (key == "allTabs") {
      allTabs = changes[key];
    }
  }
});

chrome.tabs.onCreated.addListener(function (chromeTab) {
  if (chromeTab.title != "New Tab") {
    allTabs.add(new OpenTab(chromeTab, _settings, matchesRule));
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
    allTabs.replaceOpenTab(tabId, new OpenTab(chromeTab, _settings, matchesRule));
    changePendingStatus();
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  allTabs.close(tabId, _settings.max_stored, duplicateFilter);
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

// Pull settings and closedTabs from storage
chrome.storage.sync.get(["settings"], function (result) {
  if (result["settings"]) {
    _settings = result["settings"];
  } else {
    _settings = defaultSettings;
  }
  if (result["allTabs"] && !settings.clear_on_quit) {
    allTabs.tabs = result["allTabs"].restoreClosedTabs();
  }

  // Add any currently open tabs to allTabs if not New Tab
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) =>
      OpenTab.constructIf(tab, tab.title != "new Tab", allTabs, matchesRule)
    );
    changePendingStatus();
    if (settings.startup_notification) {
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
