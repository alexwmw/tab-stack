class TabContainer {
  constructor() {
    this.tabs = {};
  }

  // Getters allow easy access to open / closed / locked tabs etc
  get openTabs() {
    return tabs.filter((tab) => !tab.closed);
  }

  get closedTabs() {
    return tabs.filter((tab) => tab.closed);
  }

  get lockedTabs() {
    return tabs.filter((tab) => tab.locked);
  }

  get activeTabs() {
    return tabs.filter((tab) => tab.active);
  }

  filtered(filterFunction) {
    return this.tabs.filter(filterFunction);
  }

  filterAndEach(filterFunction, eachFunction) {
    this.tabs.filter(filterFunction).forEach(eachFunction);
  }

  // Used to set the 'pending' status in the background
  // when the number of openTabs is below the minimal
  // required in settings
  withinPendingRange(min_value) {
    return this.openTabs.length < min_value;
  }

  // If no argument is given, resets all openTab timers
  resetTimers(filterFunction) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.resetTimer());
    } else {
      this.tabs.filter(filterFunction).forEach((tab) => tab.resetTimer());
    }
  }

  // Called in the background script once per second to update timers
  // If no argument is given, ticks all openTab timers
  tick(filterFunction) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.tick());
    } else {
      this.tabs.filter(filterFunction).forEach((tab) => tab.tick());
    }
  }

  addTab(openTab) {
    if (!openTab.closed) {
      this.tabs[tabId] = openTab;
    } else if (openTab.closed) {
      throw new TypeError("Closed tabs should not be added external to class");
    } else {
      throw new TypeError("Only openTab (tabStackTab) should be added");
    }
  }

  forget(tabId) {
    if (!tab.closed) {
      throw new TypeError("Only closed tabs can be forgotten");
    }
    delete this.tabs[tabId];
  }

  close(tabId, limit_value, duplicateFilter = function (tab) {}) {
    if (this.tabs[tabId].closed) {
      throw new TypeError("Only open tabs can be closed");
    }
    this.tabs[tabId] = new ClosedTab(this.tabs[tabId]);

    if (this.closedTabs.length > limit_value) {
      // remove oldest tab
    }
    this.tabs = this.tabs.filter(duplicateFilter);
  }
}
