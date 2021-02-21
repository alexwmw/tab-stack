$(document).ready(function () {
  var openTabs = {};
  var closedTabs = {};
  var lockedTabIds = [];

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

  const tabIdOfResult = (result) => Number(result.getAttribute("data-tabid"));

  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );

  const isClosedTab = (tabObject) => tabObject.hasOwnProperty("isClosed");

  function displayTabRows(objList) {
    for (tabsObj of objList) {
      var tbody = $("#results-tbody");
      $("#results-tbody").detach();
      const tabs = Object.values(tabsObj);
      tbody.append(...tabs.map(createResultRow));
      $("#results-table").append(tbody);
      changeSelectedRowTo($(".result:visible").first());
    }
  }

  function emptyResultsTable() {
    var tbody = $("#results-tbody");
    $("#results-tbody").detach();
    tbody.empty();
    $("#results-table").append(tbody);
  }

  function createRowIcons(tab) {
    const icon0 = isClosedTab(tab)
      ? elementOfClass("td", "ts-icon")
      : elementOfClass("td", "lock-toggle");
    const icon1 = isClosedTab(tab)
      ? elementOfClass("td", "forget-x")
      : elementOfClass("td", "close-x");
    const appendage0 = isClosedTab(tab)
      ? ""
      : elementOfClasses("i", ["fas", "fa-lock"]);
    icon0.append(appendage0);
    icon1.append(elementOfClasses("i", ["fas", "fa-times"]));
    return [icon0, icon1];
  }

  function createResultRow(tab) {
    const isClosed = isClosedTab(tab);
    const isChrome = isChromeTab(tab);
    const parsedUrl = urlParse(tab.url);
    const row = elementOfClass("tr", "result");
    const globe = elementOfClasses("i", ["fas", "fa-globe"]);
    const favicon = elementOfClass("td", "td-favicon");
    const fav_img = element("img");
    const info = elementOfClass("td", "tab-info");
    const title = elementOfClass("span", "tab-title");
    const url = elementOfClass("span", "tab-domain");
    const icon0 = createRowIcons(tab)[0];
    const icon1 = createRowIcons(tab)[1];
    url.textContent = parsedUrl;
    title.textContent = tab.title;
    fav_img.setAttribute("src", tab.favIconUrl);
    favicon.append(!tab.favIconUrl && !isChrome ? globe : fav_img);
    title.append(element("br"));
    info.append(title, url);
    row.append(favicon, info, icon0, icon1);
    row.classList.add(lockedTabIds.includes(tab.id) ? "locked" : "unlocked");

    if (isChrome) {
      fav_img.setAttribute("src", "/images/blue-chrome-icon-2.jpg");
      url.textContent = "chrome://" + parsedUrl;
      if (!isClosed) {
        icon0.classList.add("cant-lock");
      }
    }
    if (isClosed) {
      url.classList.add("tag-closed");
    }
    row.setAttribute("data-closed", isClosed);
    row.setAttribute("data-url", tab.url);
    row.setAttribute("data-tabid", tab.id);
    return row;
  }

  function changeSelectedRowTo(selection) {
    $(".selected").removeClass("selected");
    selection.addClass("selected");
  }

  // Event handlers - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // request tabs
  function requestTabs() {
    chrome.runtime.sendMessage(
      { msg: "request_tabs" },
      function (responseObject) {
        openTabs = responseObject.openTabData;
        closedTabs = responseObject.closedTabsData;
        applyTags([
          [{ active: true }, "tag-active"],
          [{ currentWindow: false }, "tag-otherwindow"],
        ]);
        emptyResultsTable();
        displayTabRows([openTabs, closedTabs]);
      }
    );
  }
  requestTabs();

  function queryAndTag(queryObj, tagClass) {
    chrome.tabs.query(queryObj, function (tabs) {
      var ids = tabs.map((tab) => tab.id);
      $(".result").each(function (index, result) {
        if (ids.includes(tabIdOfResult(result))) {
          $(this).find(".tab-domain").toggleClass(tagClass);
        }
      });
    });
  }

  function applyTags(queryTagPairs) {
    for (pair of queryTagPairs) {
      queryAndTag(pair[0], pair[1]);
    }
  }

  chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    emptyResultsTable();
    requestTabs();
  });

  chrome.tabs.onRemoved.addListener(function (tabId) {
    var result = $(".result[data-tabid=" + tabId + "]");
    result.fadeOut();
    if (result.hasClass("selected")) {
      result.toggleClass("selected");
      result.next().toggleClass("selected");
    }
    emptyResultsTable();
    requestTabs();
  });

  // When click on .result
  $(document).on("click", ".result", function () {
    changeSelectedRowTo($(this));
    //Then Open link
    var id = tabIdOfResult(this);
    if (id in openTabs) {
      setTimeout(function () {
        // make tab active
        chrome.tabs.update(id, { active: true });
        // make window focused
        chrome.tabs.get(id, function (tab) {
          chrome.windows.update(tab.windowId, { focused: true });
        });
        requestTabs();
        self.close();
      }, 100);
    } else if (id in closedTabs) {
      chrome.runtime.sendMessage(
        { msg: "resurrect", tabId: id },
        function (responseObject) {}
      );
    }
  });

  // Toggle lock class on result rows
  function lock(result) {
    var tabId = tabIdOfResult(result);
    var isLocked = $(result).hasClass("locked");
    var newState = isLocked ? "unlocked" : "locked";
    addOrRemove(lockedTabIds, tabId);
    $(result).removeClass("locked unlocked");
    $(result).addClass(newState);
    /*chrome.tabs.sendMessage(
      tabId,
      { msg: newState, bool: !isLocked },
      function (responseObject) {
        $(result).removeClass("locked unlocked");
        $(result).addClass(newState);
      }
    );*/
  }

  function addOrRemove(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(item);
    }
  }

  $(document).on("click", ".result .lock-toggle i", function (e) {
    var result = $(this).closest(".result")[0];
    lock(result);
    e.stopPropagation();
  });

  // Close tab on x
  $(document).on("click", ".result .fa-times", function (e) {
    e.stopPropagation();
    var result = $(this).closest(".result");
    var tabInfo = result.find(".tab-title, .tab-domain");
    var tabId = tabIdOfResult(result[0]);
    result.fadeOut();
    tabInfo.animate({
      paddingLeft: 100,
      width: 118,
    });
    setTimeout(function () {
      chrome.tabs.remove(tabId);
    }, 300);

    if (result.hasClass("selected")) {
      result.toggleClass("selected");
      result.next().toggleClass("selected");
    }
  });

  // Filter results by search
  $("#searchbox").on("keyup", function () {
    var searchterm = "";
    // get the value currently in searchbox
    searchterm = $(this).val().toLowerCase();
    // Filter the results
    $(".result").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(searchterm) > -1);
    });
    //Re-set the selected result
    if ($(".selected").first().is(":hidden") || !$(".selected").length) {
      changeSelectedRowTo($(".result:visible").first());
    }
  });

  // Click Pause
  $("#pause-button").on("click", function (e) {
    e.preventDefault();
    var playIcon = elementOfClasses("i", ["fas", "fa-play"]);
    var pauseIcon = elementOfClasses("i", ["fas", "fa-pause"]);
    var paused = $("#pause-button").data("paused");
    $("#pause-button").text(paused ? " Continue" : " Pause");
    $("#pause-button").prepend(paused ? playIcon : pauseIcon);
    $("#pause-button").data("paused", !paused);
  });

  //Keyup Up And Down Arrows ------------->
  $(document).keyup(function (e) {
    if ($(e.target).closest("#search-filter")[0]) {
      return;
    }
    var element = $(".selected").first();
    var y = $("#results-area").scrollTop();
    // target one row up (-52) or down (52) or target no distance
    var targetY = $(element).is(".result:visible:nth-child(n+5)")
      ? 56
      : $(element).is(".result:visible:nth-last-child(n+5)")
      ? -56
      : 0;
    // downKey
    if (e.which == 40) {
      e.preventDefault();
      element = $(".selected").first();
      $(".result").removeClass("selected");
      element.nextAll(".result").not(":hidden").first().addClass("selected");
    }
    // upkey
    if (e.which == 38) {
      e.preventDefault();
      element = $(".selected").first();
      $(".result").removeClass("selected");
      element
        .prevAll(".result:visible")
        .not(":hidden")
        .first()
        .addClass("selected");
    }
    var lastRes = $(".result:visible").last();
    var firstRes = $(".result:visible").first();

    if (element.is(lastRes) && e.which == 40) {
      $(".result").removeClass("selected");
      firstRes.addClass("selected");
      targetY = $(".result:visible").length * -45;
    } else if (element.is(firstRes) && e.which == 38) {
      $(".result").removeClass("selected");
      lastRes.addClass("selected");
      targetY = $(".result:visible").length * 45;
    }
    //enter or space
    if (e.which == 32 || e.which == 13) {
      element.trigger("click");
    }
    $("#results-area").scrollTop(y + targetY);
  });

  //Search filter on change
  $("#search-filter").change(function () {
    $("#searchbox").focus();
  });
});
