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
  get: function (obj, property, receiver) {

    return obj.property;
  },
  set: function (obj, property, receiver, value) {
    if (property == "_time_min" || property == "_time_sec") {
      allTabs.resetTimers();
    }
    obj[property] = value;
    // Save to sync storage on every 'set'
    chrome.storage.sync.set({ settings: obj });
  },
};

var settings = new Proxy({}, settingsHandler);

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

function allowedTime(settings) {
  return settings._time_min * 60 + settings._time_sec / 1;
}

function selected_match_rules(settings) {
  return settings.auto_locking != "none" // Check in setting that this is the right value
    ? settings[settings.auto_locking + "_rules"]
    : false;
}


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

//  Used in a tab's .lock( callback ) method
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

function setting(key) {
  return settings.key;
}

function duplicateFilter(tab) {
  return true;
}

// Intervals - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

window.setInterval(function () {
  const statusAllowsTicking =
    !status.paused &&
    (!status.pending ||
      (status.pending && settings.timer_reset == "continue"));
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
}, 1000); /*
chrome.tabs.onCreated.addListener(function (chromeTab) {
  if (chromeTab.title != "New Tab") {
    allTabs.add(new OpenTab(chromeTab, settings, matchesRule));
  }
  //changePendingStatus();
});
*/ /*
chrome.tabs.onActivated.addListener(function (activeInfo) {
  allTabs.openTabs[activeInfo.tabId].active = true;
  allTabs.filterAndEach(
    (tab) => tab.id != activeInfo.tabId,
    (tab) => (tab.active = false)
  );
});
*/ /*
chrome.tabs.onUpdated.addListener(function (tabId, info, chromeTab) {
  if (info.status == "complete") {
    allTabs.replaceOpenTab(
      tabId,
      new OpenTab(chromeTab, settings, matchesRule)
    );
    //changePendingStatus();
  }
});
*/ /*
chrome.tabs.onRemoved.addListener(function (tabId) {
  allTabs.close(tabId, settings.limit_value, duplicateFilter);
  //changePendingStatus();
});
*/ /*
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
*/

// Listeners - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
function stringify(obj) {
  return JSON.stringify(obj);
}

function logAllTabs() {
  console.log("alltabs: " + stringify(Object.keys(allTabs.tabs)));
}

// Main  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


//chrome.storage.sync.clear(function(){})


// Pull settings and closedTabs from storage
chrome.storage.sync.get(["settings"], function (result) {
  if (result["settings"]) {
    console.log(result["settings"]);
    settings = result["settings"];
  } else {
    console.log("using default settings");
    settings = defaultSettings;
    chrome.storage.sync.set({ settings: settings });
  }
  if (result["allTabs"] && !settings.clear_on_quit) {
    allTabs.tabs = result["allTabs"].restoreClosedTabs();
  }
  logAllTabs();

  // Add any currently open tabs to allTabs if not New Tab
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) =>
      allTabs.add(
        OpenTab.constructIf(tab, tab.title != "new Tab", allTabs, matchesRule)
      )
    );
    logAllTabs();
    console.log(settings.startup_notification)
    console.log(selected_match_rules(settings))

    //changePendingStatus();
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
