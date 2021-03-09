class OpenTab extends TabStackTab {
  constructor(tab, settings = tab.settings, matchesRule = tab.matchesRule) {
    super(tab, settings, matchesRule);
    this.closed = false;
    this.locked = this.autoLock(matchesRule);
    this.timeRemaining = settings.allowedTime;
  }

  static constructIf(tab, ifBool, matchesRule) {
    if (ifBool) {
      return new OpenTab(tab, settings, matchesRule);
    }
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

  lock(bool, finish) {
    if (arguments.length == 1 && typeof arguments[0] == "function" ) {
      // toggle
      this.lock = !this.lock;
    } else if (arguments.length == 2) {
      // set by parameter
      this.lock = bool;
    }
    // callback with procedure for notifications & browser icon
    finish(this);
  }

  resetTimer() {
    this.timeRemaining = settings.allowed_time;
  }

  tick() {
    this.timeRemaining = this.timeRemaining - 1;
  }
}
