class OpenTab extends TabStackTab {
  constructor(tab, container = tab.container, matchesRule = tab.matchesRule) {
    super(tab, container, matchesRule);
    this.closed = false;
    this.locked = this.autoLock(matchesRule);
    this.timeRemaining = container.settings.allowedTime;
  }

  static constructIf(tab, ifBool, container, matchesRule) {
    if (ifBool) {
      container[tab.id] = new OpenTab(tab, container, matchesRule);
    }
  }

  autoLock(matchesRule) {
    if (container.settings.selected_match_rules) {
      return container.settings.selected_match_rules.some((rule) =>
        container.settings.auto_locking == "matches"
          ? matchesRule(this, rule)
          : !matchesRule(this, rule)
      );
    }
  }
  
  lock(mustLock) {
    if (arguments.length == 0) {
      //toggle
      this.lock = !this.lock;
    } else if (arguments.length == 1) {
      //set by parameter
      this.lock = mustLock;
    }
  }

  resetTimer() {
    this.timeRemaining = container.settings.allowedTime;
  }

  tick(){
    this.timeRemaining = this.timeRemaining - 1;
  }

  close() {
    // check the container for existing (i.e. duplicate) closed tabs accoring to container.settings
    if (this.container.noDuplicatesOf(this)) {
      this.container = new ClosedTab(this);
    }
  }
}
