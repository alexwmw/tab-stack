class TabContainer {
  constructor(tabs = {}) {
    this.tabs = tabs;
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

  get audibleTabs() {
    return Object.values(this.tabs).filter((tab) => tab.audible);
  }

  contains(tabId) {
    return Object.keys(this.tabs).includes(tabId.toString());
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

  static restore(obj) {
    return new TabContainer(
      Object.values(obj.tabs)
        .filter((tab) => tab.closed)
        .forEach((tab) => (entries[tab.id + "c"] = tab))
    );
  }

  // Used to set the 'pending' status in the background
  // when the number of openTabs is below the minimal
  // required in settings
  withinPendingRange(min_value) {
    return this.openTabs.length < min_value;
  }

  // If no argument is given, resets all openTab timers
  resetTimers(filter) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.resetTimer());
    } else {
      Object.values(this.tabs)
        .filter(filter)
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

  // Replace one open tab with another, retaining the original ID
  // Useful for chrome.tabs.onUpdated
  updateOpenTab(tabId, chromeTab) {
    const tab = this.tabs[tabId];
    this.tabs[tabId] = new OpenTab(chromeTab, tab.settings, tab.matchRule);
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

  // Used if the user wants to delete a closed tab from tab history
  forget(tabId) {
    if (!this.tabs[tabId].closed) {
      throw new TypeError("Only closed tabs can be forgotten");
    }
    delete this.tabs[tabId];
  }

  close(tabId, limit_value, findDuplicates) {
    if (this.tabs[tabId].closed) {
      throw new TypeError("Only open tabs can be closed");
    }
    // replace the tab with a new ClosedTab
    this.tabs[tabId] = new ClosedTab(this.tabs[tabId]);

    if (this.closedTabs.length > limit_value) {
      console.log("TabContainer.close: max stored limit surpassed");
      // remove oldest tab
      console.log(
        `TabContainer.close: deleting ID ${
          this.closedTabs.reduce((oldestTab, tab) =>
            oldestTab.timeCreated < tab.timeCreated ? oldestTab : tab
          ).id
        }`
      );
      delete tabs[
        this.closedTabs.reduce((oldestTab, tab) =>
          oldestTab.timeCreated < tab.timeCreated ? oldestTab : tab
        ).id
      ];
    }
    // remove duplicates
    /*this.closedTabs
      .filter(findDuplicates)
      .map((tab) => tab.id)
      .forEach(
        function (tabId) {
          delete this.tabs[tabId];
        }.bind(this)
      );*/
  }
}
