class ClosedTab extends TabStackTab {
  constructor(openTab) {
    super(
      openTab,
      (container = openTab.container),
      (matchesRule = openTab.matchesRule)
    );
    this.wasClosedByTs = openTab.timeRemaining <= 0;
    this.closed = true;
    this.locked = false;
  }

  resurrect() {
    //turn from a closedTab back into an openTab
    container[this.id] = new OpenTab(this);
  }
}
