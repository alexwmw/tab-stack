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

  lock(finish, bool) {
    if (arguments.length == 1 && typeof arguments[0] == "function") {
      // toggle
      this.lock = !this.lock;
      finish(this);
    } else if (arguments.length == 2) {
      // set by parameter
      this.lock = bool;
      finish(this.id, this.locked, this.title);
    }
    // callback with procedure for notifications & browser icon
  }

  resetTimer() {
    this.timeRemaining = settings.time_allowed;
  }

  tick() {
    this.timeRemaining = this.timeRemaining - 1;
  }
}
