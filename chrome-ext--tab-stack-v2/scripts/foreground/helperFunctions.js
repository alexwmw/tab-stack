const element = (type) => document.createElement(type);

const elementOfClass = (typ, clas) => {
  var elem = element(typ);
  elem.classList.add(clas);
  return elem;
};

const elementOfClasses = (typ, cList) => {
  var elem = element(typ);
  $.each(cList, function (i, c) {
    elem.classList.add(c);
  });
  return elem;
};

const isChromeTab = (tab) =>
  tab.url.substring(0, tab.url.indexOf(":")) == "chrome"
    ? tab.url.substring(0, tab.url.indexOf(":"))
    : false;

const getFromStorage = (keyStr, target, callback = false) =>
  chrome.storage.sync.get(
    [keyStr],
    callback
      ? callback(result)
      : function (result) {
          target = result[keyStr];
        }
  );

const setInStorage = (keyEntryObj, callback = false) =>
  chrome.storage.sync.set(keyEntryObj, callback ? callback() : function () {});
