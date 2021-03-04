<img src="./chrome-ext--tab-stack/images/title.png" width="20%">

A Chrome extension that arranges your tabs into groups, closes tabs you don't need and makes it easy to restore closed tabs.

You can view and install it from <a href="https://chrome.google.com/webstore/detail/tab-stack/agjealbfpkdojoonkdjchophopohpaco">the chrome webstore</a>.

**Note:** I plan to do some significant refactoring and commenting of the code, as well as adding additional features; however I am taking a break from this for the time being to focus on other projects.

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

### Coming next ###
- **Auto lock**: Set rules to auto-lock tabs based on URL or tab title
- **Bug fix**: Selecting multiple tab search results (with shift or ctrl/cmd) and pressing the lock shortcut currently appears to lock but does not work. It is recommended to only lock one tab at a time via the lock icon or lock shortcut


# How To Use #

Simply set a time in the settings and Tab Stack will do the rest. Any tabs that have been open too long will be removed by Tab Stack. 

If you find that you want to re-open a closed tab, simply click the Tab Stack icon or use the assigned shortcut to open search, and find the closed tab. Click the search entry or hit enter to open the tab. 

Active tabs, pinned tabs and tabs playing audio are protected from being closed automatically. Whenever a tab becomes active, its timer is reset. Users have the option to adjust the amount of time a tab needs to be active before the timer is reset in settings.

Tabs will only begin automatically closing once more tabs are open than the minimum requirement set by the user. This is set to 3 tabs by default. 

### Locking ###

To prevent any tab from being automatically closed, you can lock any tab either by clicking its lock icon in the search window, or entering the lock shortcut while the tab is active in its window. 

Users have the option to be notified when a tab is locked (currently only when using the lock keyboard shortcut however this feature will come in handy at a later stage when "auto-locking" is implemented.) If the currently active tab is locked, the word **lock** will appear on the Tab Stack browser icon.

### The search popup ###

The search window can be opened at any time either by clicking the Tab Stack browser icon, or typing the assigned keyboard shortcut. Here, you can search for any tab by typing in the search bar. Results will be filtered on key press; no need to press enter. 

If you prefer to only see open tabs, closed tabs, or auto-closed tabs in the search, use the filter in the search popup. The filter settings will be remembered next time you open the pop-up.

To see how much time an open (unlocked) tab has remaining, hover over its search result and the time will appear in the upper left corner.

Use the up and down keys to navigate the search results.

Multiple results can be operated on at once. Highlight multiple rows by pressing the up/down key with shift key held down, or with ctrl (cmd on Mac) held down and clicking multiple results. Press enter to open the (closed) tabs, or use the delete shortcut (ctrl + del / cmd (+ fn) + del) to close (the open) or forget (the closed) tabs. (NB: It is **not** recommended to use the lock keyboard shortcut while multiple tabs are selected. Bug fix coming!)

A few settings can be changed from the footer of the search window: theme, window size and 'pause', which pauses the application. 

A status icon in the bottom right of the search window footer indicates whether the applicaition is 'pending' (not enough tabs open) (yellow), 'active' (green) or paused (grey).

# Screenshots #

<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.58.04.png" >
<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.57.30.png" >


<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.57.54.png" >
<img src="./chrome-ext--tab-stack/images/screenshots/Screenshot%202021-02-27%20at%2016.58.17.png" >
