class TabContainer {
  constructor(settings) {
    this.tabs = {};
    this.settings = settings;
  }

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

  noDuplicatesOf(tab) {
    switch (this.settings.prevent_dup) {
      case "url":
        return false;
      case "title_host":
        return false;
      case "allow":
        return true;
    }
  }

  filtered(filterFunction){
    return this.tabs.filter(filterFunction);
  }

  filterAndEach(filterFunction,eachFunction){
    this.tabs.filter(filterFunction).forEach(eachFunction)
  }

  withinPendingRange(){
    return this.openTabs.length <= settings.max_allowed
  }

  resetTimers(filterFunction) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.resetTimer());
    } else {
      this.tabs.filter(filterFunction).forEach((tab) => tab.resetTimer());
    }
  }

  tick(filterFunction) {
    if (arguments.length == 0) {
      this.openTabs.forEach((tab) => tab.tick());
    } else {
      this.tabs.filter(filterFunction).forEach((tab) => tab.tick());
    }
  }

  remove = (tabId) =>
    this.tabs[tabId].isClosed
      ? delete this.tabs[tabId]
      : this.tabs[tabId].close();
}
