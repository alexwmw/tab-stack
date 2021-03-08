class TabContainer {
  tabs = {};

  constructor() {
    this.tabs = {};
  }

  filteredArray(filterFunction) {
    return Object.values(this.tabs).filter(filterFunction);
  }

  filteredObj(filterFunction) {
    const entries = {};
    Object.values(this.tabs)
      .filter(filterFunction)
      .forEach((tab) => (entries[tab.id] = tab));
    return entries;
  }

  restoreClosedTabs() {
    const entries = {};
    Object.values(this.tabs)
      .filter((tab) => tab.closed)
      .forEach((tab) => (entries[tab.id + "c"] = tab));
    return entries;
  }

  filterAndEach(filterFunction, eachFunction) {
    Object.values(this.tabs).filter(filterFunction).forEach(eachFunction);
  }

  // Getters allow easy access to open / closed / locked tabs etc
  get openTabs() {
    return Object.values(this.tabs).filter((tab) => !tab.closed);
  }

  get closedTabs() {
    return Object.values(this.tabs).filter((tab) => tab.closed);
  }

  get lockedTabs() {
    return Object.values(this.tabs).filter((tab) => tab.locked);
  }

  get activeTabs() {
    return Object.values(this.tabs).filter((tab) => tab.active);
  }

  get pinnedTabs() {
    return Object.values(this.tabs).filter((tab) => tab.pinned);
  }

  get audibledTabs() {
    return Object.values(this.tabs).filter((tab) => tab.audible);
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
      Object.values(this.tabs)
        .filter(filterFunction)
        .forEach((tab) => tab.resetTimer());
    }
  }

  // Called in the background script once per second to update timers
  // If no argument is given, ticks all openTab timers
  tick(filterFunction) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.tick());
    } else {
      this.filterAndEach(filterFunction, (tab) => tab.tick());
    }
  }

  // Add Chrome tabs to the tab container (when they are opened in Chrome)
  add(openTab) {
    if (!openTab.closed) {
      this.tabs[openTab.id] = openTab;
    } else if (openTab.closed) {
      throw new TypeError("Closed tabs should not be added external to class");
    } else {
      throw new TypeError("Only openTab (tabStackTab) should be added");
    }
  }

  // replace one open tab with another, retaining the original ID
  replaceOpenTab(tabId, newOpenTab) {
    if (!newOpenTab.closed && !this.tabs[tabId].closed) {
      this.tabs[tabId] = newOpenTab;
    } else if (newOpenTab.closed) {
      throw new TypeError("Closed tabs should not be added external to class");
    } else if (this.tabs[tabId].closed) {
      throw new TypeError(
        "Do not use this method to replace Closed tabs. Use .resurrect() instead."
      );
    }
  }

  // replace a closed tab with a new open tab
  resurrect(tabId, keyValues, callback = false) {
    if (this.tabs[tabId].closed) {
      delete this.tabs[tabId];
      const container = this;
      chrome.tabs.create({}, function (tab) {
        container.add(
          new OpenTab(tab, keyValues.settings, keyValues.matchRule)
        );
      });
      if (callback) {
        callback();
      }
    } else if (!tabs[tabId].closed) {
      ("You cannot use .resurrect() with open tabs.");
    }
  }

  // Used if the user wants to delete a closed tab for tab history
  forget(tabId) {
    if (!this.tabs[tabId].closed) {
      throw new TypeError("Only closed tabs can be forgotten");
    }
    delete this.tabs[tabId];
  }

  close(tabId, settings, duplicateFilter) {
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
