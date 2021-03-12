class OpenTab extends TabStackTab {
  constructor(tab, settings = tab.settings, matchesRule = tab.matchesRule) {
    super(tab, settings, matchesRule);
    this.closed = false;
    this.locked = this.autoLock(matchesRule);
    this.timeRemaining = settings.time_allowed;
  }

  autoLock(matchesRule) {
    return settings.auto_locking == "none"
      ? false
      : settings.selected_match_rules.some((rule) =>
          settings.auto_locking == "matches"
            ? matchesRule(this, rule)
            : !matchesRule(this, rule)
        );
  }

  lock(displayFunc, bool) {
    this.locked = arguments.length == 2 ? bool : !this.locked;
    console.log(`openTab.lock: tab ${this.id} is ${this.locked ? 'locked' : 'unlocked'}`)
    displayFunc(this)
  }

  resetTimer() {
    this.timeRemaining = settings.time_allowed;
  }

  tick() {
    this.timeRemaining = this.timeRemaining - 1;
  }
}
