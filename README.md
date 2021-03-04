<img src="./chrome-ext--tab-stack/images/title.png" width="20%">

A Chrome extension that arranges your tabs into groups, closes tabs you don't need and makes it easy to restore closed tabs.

You can view and install it from <a href="https://chrome.google.com/webstore/detail/tab-stack/agjealbfpkdojoonkdjchophopohpaco">the chrome webstore</a>.

**Note:** I plan to do some significant refactoring and commenting of the code, but taking a break from this for the time being to focus on other projects.

# Description [Version 1.0] #

Tab Stack is a tab management tool designed to save you from tab overload. Tab Stack closes tabs you haven't used in a while and allows you to quickly search for and (re)open any tab.

- Set a time limit and Tab Stack will close any tab that's been open too long 
- Quickly search both open-and closed tabs
- Keyboard-centric design makes it quick and easy to manage tabs
  - Open the tab search with a keyboard shortcut
  - Press tab to access search filter
  - Lock any tab to prevent it closing, any time, via keyboard shortcut 
- Clean, detailed interface makes it easy to keep track of your tabs
- Exemptions for pinned tabs and tabs playing audio
- Badge icons and notifications let you know when a tab is locked
- Highly configurable; light and dark themes!

**Coming next**
- Set rules to auto-lock tabs based on URL or tab title
- Bug fix: Selecting multiple tab search results (with shift or ctrl/cmd) and pressing the lock shortcut currently appears to lock but does not work. Recommended to only lock one tab at a time via the lock icon or lock shortcut


# How To Use #

Simply set a time in the settings and Tab Stack will do the rest. Any tabs that have been open too long will be removed by Tab Stack. If you find that you want to re-open a closed tab, simply click the Tab Stack icon or use the assigned shortcut to open search, and find the closed tab. Click the search entry or hit enter to open the tab.

Active tabs, pinned tabs and tabs playing audio are protected from being closed automatically. Whenever a tab becomes active, it's times is reset. Users have the option to adjust the amount of time a tab needs to be active before the timer is reset in settings.

To prevent any tab from being automatically closed, you can lock any tab either by clicking it's lock icon in the search window, or entering the lock shortcut while the tab is active in it's window. 

Users have the option to be notified when a tab is locked (currently only when using the shortcut - this will come in handy at a later stage when "auto-locking" is implemented.) If the currently active tab is locked, the word **lock** will appear on the Tab Stack browser icon.

To see how much time any tab has remaining, hover over it's search result and the time wil appear in the upper left corner.

If you prefer to only see open tabs, closed tabs, or auto-closed tabs in the search, use the filter in the dearch popup. The filter settings will be remembered next time you open the pop-up.

# Screenshots #

<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.58.04.png" width="45%">
<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.57.30.png" width="45%">


<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.57.54.png" width="45%">
<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.58.17.png" width="45%">
