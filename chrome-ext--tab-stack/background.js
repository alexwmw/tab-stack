var openTabs = {};
chrome.tabs.onCreated(function(tab) {
    openTab[tab.id] = new Date();
});

chrome.tabs.onRemoved(function(tab) {
    if (openTabs[tab.id]) {
        delete openTabs[tab.id]
    }
});