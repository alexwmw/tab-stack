$(document).ready(function () {
  // Variables --------------------------------------------------------------
  var openTabs = {};
  var closedTabs = {};
  var lockedTabIds = [];
  var settings = {};

  // Constant = () =>  ------------------------------------------------------

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

  const tabIdOf = (result) => Number(result.getAttribute("data-tabid"));

  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );

  const isClosedTab = (tabObject) => tabObject.hasOwnProperty("isClosed");

  const addOrRemove = (array, item) => {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(item);
    }
  };

  // Functions ----------------------------------------------------------------------

  function updateAllResults() {
    chrome.runtime.sendMessage(
      { msg: "request_tabs" },
      function (responseObject) {
        openTabs = responseObject.openTabData;
        closedTabs = responseObject.closedTabsData;
        lockedTabIds = responseObject.lockedTabIdsData;
        applyTags([
          [{ active: true }, "tag-active"],
          [{ pinned: true }, "tag-pinned"],
        ]);
        emptyResultsTable();
        displayTabRows([openTabs, closedTabs]);
        lockIfLocked(".result");
        filterMatchCriteria(".result");
      }
    );
  }

  // Table / Table Rows / Results

  function displayTabRows(objList) {
    for (tabsObj of objList) {
      const tbody = $("#results-tbody");
      const table = $("#results-table");
      const tabs = Object.values(tabsObj).reverse();
      tbody.detach();
      tbody.append(...tabs.map(createResultRow));
      table.append(tbody);
    }
  }

  function emptyResultsTable() {
    const tbody = $("#results-tbody");
    tbody.detach();
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

    icon0.append(
      isClosedTab(tab)
        ? ""
        : elementOfClasses("i", [
            "fas",
            "fa-lock",
            tab.audible ? "fa-volume-up" : null,
          ])
    );
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
    const timer = elementOfClass("div", "timer");
    const icon0 = createRowIcons(tab)[0];
    const icon1 = createRowIcons(tab)[1];
    url.textContent = parsedUrl;
    title.textContent = tab.title;
    timer.innerText = " ";
    fav_img.setAttribute("src", tab.favIconUrl);
    favicon.append(!tab.favIconUrl && !isChrome ? globe : fav_img);
    info.append(title, url);
    info.prepend(timer);
    row.append(favicon, info, icon0, icon1);
    row.classList.add(lockedTabIds.includes(tab.id) ? "locked" : "unlocked");
    if (isChrome) {
      fav_img.setAttribute("src", "/images/blue-chrome-icon-2.jpg");
      url.textContent = "chrome://" + parsedUrl;
      //if (!isClosed) {
      //  icon0.classList.add("cant-lock");
      //}
    }
    if (isClosed) {
      url.classList;
      const closedTag = elementOfClass("span", "closed-tag");
      const timeInMins = Math.round(
        (parseInt(Date.now()) - tab.timeClosed) / 100000
      );
      const timeStr =
        timeInMins < 60
          ? timeInMins + " min ago"
          : Math.round(timeInMins / 60) + " hrs ago";
      $(closedTag).text("closed " + timeStr);
      $(url).prepend(closedTag);
    }
    setAttributes(row, {
      "data-audible": tab.audible,
      "data-pinned": tab.pinned,
      "data-active": tab.active,
      "data-url": tab.url,
      "data-tabid": tab.id,
      "data-closed": isClosed,
    });

    return row;
  }

  function setAttributes(element, obj) {
    Object.entries(obj).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  function changeSelectedRowTo(resultRow) {
    $(".selected").removeClass("selected");
    resultRow.addClass("selected");
  }

  function noResults(bool) {
    $("#no-results").toggle(bool);
  }

  // Locking ----------------------------

  // Toggle lock class on result rows
  function lock(resultRow) {
    const tabId = tabIdOf(resultRow);
    const newState = $(resultRow).hasClass("locked") ? "unlocked" : "locked";
    $(resultRow).removeClass("locked unlocked").addClass(newState);
    chrome.runtime.sendMessage(
      {
        msg: "request_locked_tabs",
      },
      function (responseObject) {
        lockedTabIds = responseObject.data;
        addOrRemove(lockedTabIds, tabId);
        chrome.runtime.sendMessage({
          msg: "tab_locked",
          data: lockedTabIds,
          id: tabId,
        });
      }
    );
  }

  // Apply lock to locked rows
  function lockIfLocked(selector) {
    $.each($(selector), (index, element) => {
      const tabId = tabIdOf(element);
      if (lockedTabIds.includes(tabId)) {
        $(element).removeClass("unlocked").addClass("locked");
      }
    });
  }

  // Tagging ------------------------------------------------------------------------------------------------------------------------

  function queryAndTag(queryObj, tagClass) {
    chrome.tabs.query(queryObj, function (tabs) {
      $(".result").each(function (index, result) {
        if (tabs.some((tab) => tab.id == tabIdOf(result))) {
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

  // Filtering & Matching -----------------------------------------------------------------------------------------------------------------

  function filterMatchCriteria(selector) {
    $(selector).filter(function () {
      $(this).toggle(
        matchSelectCriteria(
          this,
          $("#search-filter").val(),
          matchSearchTerm(this, $("#searchbox").val().toLowerCase())
        )
      );
      changeSelectedRowTo($(selector + ":visible").first());
      noResults($(selector + ":visible").length == 0);
    });
  }

  function matchSearchTerm(result, value, otherCriteria = true) {
    return $(result).text().toLowerCase().indexOf(value) > -1 && otherCriteria;
  }

  function matchSelectCriteria(result, value, otherCriteria = true) {
    const isClosed = $(result).data("closed");
    switch (value) {
      case "All tabs":
        return true && otherCriteria;
      case "Open tabs":
        return !isClosed && otherCriteria;
      case "Closed tabs":
        return isClosed && otherCriteria;
      case "Locked tabs":
        return lockedTabIds.includes(tabIdOf(result)) && otherCriteria;
      case "Unlocked tabs":
        return (
          !isClosed && !lockedTabIds.includes(tabIdOf(result)) && otherCriteria
        );
    }
  }

  // Settings ------------------------------------------------------------------------------------------------------------------------------

  function setSearchFilterValue() {
    chrome.runtime.sendMessage(
      {
        msg: "get_setting",
        key: "filterSelection",
      },
      function (responseObject) {
        const value = responseObject.value;
        $("#search-filter").val(value);
      }
    );
  }

  function setThemeValue() {
    chrome.runtime.sendMessage(
      {
        msg: "get_setting",
        key: "theme",
      },
      function (responseObject) {
        const value = responseObject.value;
        if (value == "dark") $("#theme-switch").trigger("click");
      }
    );
  }

  function updateSettings() {
    setSearchFilterValue();
    setThemeValue();
  }

  // Click events ----------------------------------------------------------------------------------------------------------------------------

  // When click on .result
  $(document).on("click", ".result", function () {
    changeSelectedRowTo($(this));
    //Then Open link
    var id = tabIdOf(this);
    if (id in openTabs) {
      setTimeout(function () {
        // make tab active
        chrome.tabs.update(id, { active: true });
        // make window focused
        chrome.tabs.get(id, function (tab) {
          chrome.windows.update(tab.windowId, { focused: true });
        });
        updateAllResults();
        self.close();
      }, 100);
    } else if (id in closedTabs) {
      chrome.runtime.sendMessage(
        { msg: "resurrect", tabId: id },
        function (responseObject) {}
      );
    }
  });

  // When click on lock icon
  $(document).on("click", ".result .lock-toggle i", function (e) {
    var result = $(this).closest(".result")[0];
    e.stopPropagation();
    lock(result);
    setTimeout(function () {
      filterMatchCriteria(".result");
    }, 100);
  });

  // Close tab on x
  $(document).on("click", ".result .fa-times", function (e) {
    e.stopPropagation();
    var result = $(this).closest(".result");
    var tabInfo = result.find(".tab-title, .tab-domain");
    var tabId = tabIdOf(result[0]);
    result.fadeOut();
    tabInfo.animate({
      paddingLeft: 100,
      width: 118,
    });
    setTimeout(function () {
      chrome.tabs.remove(tabId);
    }, 300);
    if ($(result).data("closed")) {
      chrome.runtime.sendMessage(
        { msg: "forget_closed_tab", data: tabId },
        function (responseObject) {
          //closedTabs = responseObject.closedTabs;
        }
      );
    }
    if (result.hasClass("selected")) {
      result.toggleClass("selected");
      result.next(":visible").toggleClass("selected");
    }
  });

  $(document).on("mouseenter", ".result td:nth-child(3)", function (e) {
    $(this).find("i").removeClass("fa-volume-up");
  });

  $(document).on("mouseleave", ".result td:nth-child(3)", function (e) {
    const isAudible = $(this).closest(".result").data("audible");
    if (isAudible) {
      $(this).find("i").addClass("fa-volume-up");
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

  $("#extend-button").on("click", function (e) {
    var makeShortIcon = elementOfClasses("i", ["fas", "fa-angle-up"]);
    var makeLongIcon = elementOfClasses("i", ["fas", "fa-angle-down"]);
    var extended = $(this).data("extended");
    e.preventDefault();
    $("html").toggleClass("extended");
    $(".tab-title").toggleClass("ttextended");
    $(this).text(extended ? " Expand" : " Shrink");
    $(this).prepend(extended ? makeLongIcon : makeShortIcon);
    $(this).data("extended", !extended);
  });

  //Click theme switch
  $("#theme-switch").on("click", function (e) {
    e.preventDefault();
    $(this).find("i").toggleClass("fa-sun fa-moon");
    $("body").toggleClass("dark");
    const theme = $("body").first().hasClass("dark") ? "dark" : "light";
    chrome.runtime.sendMessage({
      msg: "set_setting",
      key: "theme",
      value: theme,
    });
  });

  // Key & Change  events --------------------------------------------------------------------------------------------------------------------

  var prevVal;
  // Filter results by dropdown
  $("#search-filter").change(function () {
    const val = $(this).val();
    if (val == "-> Open history ->") {
      chrome.tabs.create({ url: "chrome://history" });
      $(this).val(prevVal);
    } else {
      filterMatchCriteria(".result");
      $("#searchbox").focus();
      chrome.runtime.sendMessage({
        msg: "set_setting",
        key: "filterSelection",
        value: val,
      });
      prevVal = val;
    }
  });

  // Filter results by search box
  $("#searchbox").on("keyup", function (e) {
    var code = e.keyCode || e.which;
    if (code != 37 && code != 38 && code != 39 && code != 40) {
      filterMatchCriteria(".result");
    }
  });

  // Keyup Up And Down Arrows -------------
  $(document).keyup(function (e) {
    var row = $(".selected").first();
    var rowUp = row.prevAll("tr").first(":visible");
    var rowDown = row.nextAll("tr").first(":visible");
    var firstRow = $("tr:visible").first();
    var lastRow = $("tr:visible").last();

    if ($(e.target).closest("#search-filter")[0]) {
      return;
    }
    switch (e.which) {
      // downKey
      case 40:
        e.preventDefault();
        filterMatchCriteria(".result");
        changeSelectedRowTo(row[0] == lastRow[0] ? firstRow : rowDown);
        break;
      // upkey
      case 38:
        e.preventDefault();
        filterMatchCriteria(".result");
        changeSelectedRowTo(row[0] == firstRow[0] ? lastRow : rowUp);
        break;
      // space, enter
      case 13:
      case 32:
        element.trigger("click");
        break;
    }
  });

  // Scroll into view
  $(document).keyup(function (e) {
    $(".selected")[0].scrollIntoView(false);
  });

  // Shortcuts
  $(document).keyup(function (e) {});

  // Shortcuts
  $(document).keyup(function (e) {});

  // Chrome Listeners --------------------------------------------------------------------------------------------------------------------------

  chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    updateAllResults();
  });

  chrome.tabs.onRemoved.addListener(function (tabId) {
    var result = $(".result[data-tabid=" + tabId + "]");
    result.fadeOut();
    if (result.hasClass("selected")) {
      result.toggleClass("selected");
      result.next().toggleClass("selected");
    }
    updateAllResults();
  });

  // Intervals --------------------------------------------------------------------------------------------------------------------------------

  window.setInterval(function () {
    $('.result[data-closed="false"]').each(function (index, result) {
      const timer = $(result).find(".timer")[0];
      const tabId = tabIdOf(result);
      chrome.runtime.sendMessage(
        { msg: "request_times", id: tabId },
        function (responseObject) {
          const time = responseObject.times;
          const mins = Math.floor(time / 60);
          const secs = time - mins * 60;
          timer.innerText = mins + ":" + secs;
        }
      );
    });
  }, 1000);

  window.setInterval(function () {
    $('.result[data-closed="true"]').each(function (index, element) {
      var tab = closedTabs[tabIdOf(element)];
      const timeInMins = Math.round(
        (parseInt(Date.now()) - tab.timeClosed) / 100000
      );
      const timeStr =
        timeInMins < 60
          ? timeInMins + " min ago"
          : Math.round(timeInMins / 60) + " hrs ago";
      $(element)
        .find(".closed-tag")
        .text("closed " + timeStr);
    });

    /// call your function here
  }, 60000);

  /// MAIN ----------------------------------------------------------------------------------------------------------------------------------
  updateSettings();
  updateAllResults();
});
