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

// Default settings
var settings = {
  filterSelection: "All tabs",
  theme: "light",
  reset_delay: 1,
  time_allowed: 10,
  min_required: 3, // change to min_required in settings script
  timer_reset: "reset",
  auto_locking: "none",
  match_rules: [],
  not_match_rules: [],
  audible_lock: true,
  clear_on_quit: false,
  window_size: "small",
  max_stored: 25,
  prevent_dup: "url",
  paused: false,
  startup_notification: true, // Add to settings
  lock_notification: true, // Add to settings
  // getters
  get selected_match_rules() {
    return this.auto_locking != "none"
      ? this[this.auto_locking + "_rules"]
      : [];
  },
};

// Functions  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/*function changePendingStatus() {
  if (allTabs.withinPendingRange(settings.min_required)) {
    status.pending = true;
    if (settings.timer_reset == "reset") {
      allTabs.resetTimers();
    }
  } else {
    status.pending = false;
  }
}*/

function matchesRule(tabObj, ruleStr) {
  /*
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
  */
}

function duplicateFilter(tab) {
  return true;
}

const messageLookup = {
  startup: {
    title: "Tab Stack is closing tabs on your behalf",
    message: "To change settings, click the [ts] icon in Chrome.",
  },
};

function showNotification(string, messageLookup) {
  if (!messageLookup[string]) {
    throw new ReferenceError("Key not found in messageLookup");
  }
  if (settings[string + "_notification"]) {
    chrome.notifications.create({
      iconUrl: "../images/icon128.png",
      type: "basic",
      title: messageLookup[string].title,
      message: messageLookup[string].message,
    });
  }
}

//  Used in a tab's .lock( callback ) method
function displayAfterLock(tabId, locked, title) {
  if (settings.lock_notification) {
    chrome.notifications.create({
      iconUrl: "../images/icon128.png",
      type: "basic",
      title: locked ? "Tab Locked" : "Tab Unlocked",
      message: title,
    });
  }
  chrome.browserAction.setBadgeText({
    tabId: tabId.valueOf(),
    text: locked ? "lock" : "",
  });
}

// store the {key: value} in chrome storage
function store(obj, callback = () => {}) {
  chrome.storage.sync.set(obj, callback());
}

// Intervals - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
      (tab) => {
        tab.tick();
        console.log(
          `setInterval: tab ${tab.id} was ticked: ${tab.timeRemaining}`
        );
      }
    );
    allTabs.filterAndEach(
      (tab) => !tab.closed && tab.timeRemaining <= 0,
      (tab) => {
        chrome.tabs.remove(parseInt(tab.id));
        console.log(
          `setInterval: tab ${tab.id} reached zero and was removed`,
          tab
        );
      }
    );
  }
}, 1000);

// Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

chrome.tabs.onActivated.addListener(function (info) {
  // Get all active tabs in the current window and make not active
  chrome.windows.getCurrent(function (window) {
    allTabs.filterAndEach(
      (tab) => tab.windowId == window.id && tab.active,
      (tab) => {
        tab.active = false;
        console.log(`onActivated: tab ${tab.id} was made inactive`);
      }
    );
    // Then (if exists) make the openTab with id activeInfo.tabId active
    if (allTabs.contains(info.tabId)) {
      allTabs.tabs[info.tabId].active = true;
      allTabs.tabs[info.tabId].timeActive = Date.now();
      console.log(`onActivated: tab ${info.tabId} was made active`);
      if (settings.timer_reset == "reset") {
        allTabs.resetTimers((tab) => tab.id == info.tabId);
        console.log(`onActivated: tab ${info.tabId} timeRemaining was reset`);
      }
      console.log(`onActivated: the active tabs are:`, allTabs.activeTabs);
    }
  });
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  try {
    allTabs.close(tabId, settings.max_stored, duplicateFilter);
  } catch (e) {
    console.log(
      `onRemoved: tried allTabs.close(tabId ${tabId}) but got an error`
    );
    throw e;
  }
  //changePendingStatus();
  console.log("onRemoved: ", allTabs);
});

chrome.tabs.onUpdated.addListener(function (tabId, info, chromeTab) {
  allTabs.updateOpenTab(tabId, chromeTab);
  console.log(`onUpdated: tab ${tabId}`, info);
  //changePendingStatus();
  if (info.status == "complete") {
    // Only update UI if status is complete ??
  }
});

chrome.tabs.onCreated.addListener(function (chromeTab) {
  if (chromeTab.title != "New Tab") {
    allTabs.add(new OpenTab(chromeTab, settings, matchesRule));
    //changePendingStatus();
    console.log("onCreated: new Chrome tab added", allTabs);
  }
});

/*
chrome.storage.onChanged.addListener(function (changes, areaName) {
  for (var key in changes) {
    if (key == "settings") {
      settings = changes[key];
    } else if (key == "allTabs") {
      allTabs = changes[key];
    }
  }
});
*/

chrome.commands.onCommand.addListener(function (command) {
  switch (command) {
    case "lock-toggle":
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        function (chromeTabs) {
          console.log(`onCommand[${command}] with tab ${chromeTabs[0].id}`);
          allTabs.tabs[chromeTabs[0].id].lock(displayAfterLock);
        }
      );
      break;
  }
});

/* Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
chrome.storage.sync.clear(function () {});
*/

function finishStartup() {
  showNotification("startup", messageLookup);
  settings.time_allowed = 30;
  store({ settings: settings });
}

chrome.browserAction.setBadgeBackgroundColor({ color: "#008080" });

// Pull settings and closedTabs from storage
chrome.storage.sync.get(["settings", "closedTabs"], function (result) {
  if (result["settings"]) {
    settings = result["settings"];
    console.log("startup: Restored settings", settings);
  } else {
    console.log("startup: No settings to restore", settings);
  }
  if (result["closedTabs"] && !settings.clear_on_quit) {
    console.log("startup: Restored tabs", allTabs);
  } else {
    console.log("startup: No tabs were restored", allTabs);
  }
  store({ settings: settings });

  // Add any currently open tabs to allTabs if not New Tab
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((chromeTab) => {
      if (chromeTab.title != "New Tab") {
        allTabs.add(new OpenTab(chromeTab, settings, matchesRule));
      }
    });
    //changePendingStatus();
    console.log("startup: Chrome tabs added", allTabs);

    finishStartup();
  });
});
