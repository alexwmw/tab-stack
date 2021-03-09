class ClosedTab extends TabStackTab {
  constructor(
    tabObject,
    settings = tabObject.settings,
    matchesRule = tabObject.matchesRule
  ) {
    super(tabObject, settings, matchesRule);
    this.wasClosedByTs = tabObject.timeRemaining <= 0;
    this.closed = true;
    this.locked = false;
  }
}
