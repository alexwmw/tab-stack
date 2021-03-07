class TabStackTab {
  constructor(tab, container, matchesRule = function (tab, rule) {}) {
    //Chrome tab properties
    this.active = tab.active;
    this.audible = tab.audible;
    this.favIconUrl = tab.favIconUrl;
    this.groupId = tab.groupId;
    this.id = tab.id;
    this.incognito = tab.incognito;
    this.index = tab.index;
    this.mutedInfo = tab.mutedInfo;
    this.openerTabId = tab.openerTabId;
    this.pinned = tab.pinned;
    this.sessionId = tab.sessionId;
    this.status = tab.status;
    this.title = tab.title;
    this.url = tab.url;
    this.windowId = tab.windowId;

    //Copy references to parameter objects
    this.container = container;
    this.matchesRule - matchesRule;

    //Tab Stack variables
    this.timeCreated = parseInt(Date.now());
    this.timeActive = parseInt(Date.now());
  }
}
