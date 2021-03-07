class ClosedTab extends TabStackTab {
  constructor(openTab) {
    super(
      openTab,
      (settings = openTab.settings),
      (matchesRule = openTab.matchesRule)
    );
    this.wasClosedByTs = openTab.timeRemaining <= 0;
    this.closed = true;
    this.locked = false;
  }
}
