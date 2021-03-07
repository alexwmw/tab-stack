$(document).ready(function () {
  // Variables --------------------------------------------------------------
  var openTabs = {};
  var closedTabs = {};
  var lockedTabIds = [];
  const osCmds = navigator.platform == "MacIntel" ? [91, 93, 224] : [17];
  var scrollCount = 0;
  var largeWindow = false;

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

  function oldestToNewest(a, b) {
    return a.timeClosed - b.timeClosed;
  }

  function updateAllResults() {}

  // Table / Table Rows / Results

  function displayTabRows(objList) {
    for (tabsObj of objList) {
      const tbody = $("#results-tbody");
      const table = $("#results-table");
      var tabs = Object.values(tabsObj);
      if (tabsObj == closedTabs) {
        tabs = Object.values(closedTabs).sort(oldestToNewest);
      }
      tabs.reverse();
      tbody.detach();
      tbody.append(...tabs.map(createResultRow));
      table.append(tbody);
    }
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
    if (largeWindow) title.classList.add("ttextended");
    timer.innerText = "00:00";
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
    row.setAttribute("data-audible", tab.audible);
    row.setAttribute("data-pinned", tab.pinned);
    row.setAttribute("data-active", tab.active);
    row.setAttribute("data-url", tab.url);
    row.setAttribute("data-tabid", tab.id);
    row.setAttribute("data-closed", isClosed);
    return row;
  }

  function changeSelectedRowTo(resultRow) {
    $(".selected").removeClass("selected");
    resultRow.addClass("selected");
  }

  function addSelectedRow(resultRow) {
    resultRow.addClass("selected");
  }

  function noResults(bool) {
    $("#no-results").toggle(bool);
  }

  // Tagging ------------------------------------------------------------------------------------------------------------------------

  function applyTags(queryTagPairs) {
    for (pair of queryTagPairs) {
      queryAndTag(pair[0], pair[1]);
    }
  }

  function queryAndTag(queryObj, tagClass) {
    chrome.tabs.query(queryObj, function (tabs) {
      $(".result").each(function (index, result) {
        if (tabs.some((tab) => tab.id == tabIdOf(result))) {
          $(this).find(".tab-domain").toggleClass(tagClass);
        }
      });
    });
  }

  function hideTimers() {
    chrome.tabs.query({ active: true }, function (tabs) {
      $(".result").each(function (index, result) {
        if (tabs.some((tab) => tab.id == tabIdOf(result))) {
          $(this).find(".timer").hide();
        }
      });
    });
    chrome.tabs.query({ pinned: true }, function (tabs) {
      $(".result").each(function (index, result) {
        if (tabs.some((tab) => tab.id == tabIdOf(result))) {
          $(this).find(".timer").hide();
        }
      });
    });
    chrome.tabs.query({ audible: true }, function (tabs) {
      $(".result").each(function (index, result) {
        if (tabs.some((tab) => tab.id == tabIdOf(result))) {
          $(this).find(".timer").hide();
        }
      });
    });
  }

  // Filtering, Sorting & Matching -----------------------------------------------------------------------------------------------------------------

  function filterMatchCriteria(selector) {
    //.results rows
    $(selector).filter(function () {
      $(this).toggle(
        matchSelectCriteria(
          this,
          $("#search-filter").val(),
          matchSearchTerm(this, $("#searchbox").val().toLowerCase())
        )
      );
      noResults($(selector + ":visible").length == 0);
      if ($(selector + ":visible").length != 0) {
        changeSelectedRowTo($(selector + ":visible").first());
        $(".selected")[0].scrollIntoView();
      }
    });
  }

  function matchSearchTerm(result, value, otherCriteria = true) {
    return $(result).text().toLowerCase().indexOf(value) > -1 && otherCriteria;
  }

  function matchSelectCriteria(result, value, otherCriteria = true) {
    const isClosed = $(result).data("closed");
    const isClosedByTs = isClosed
      ? closedTabs[tabIdOf(result)].closedByTs
      : null;
    switch (value) {
      case "All tabs":
        return true && otherCriteria;
      case "Open tabs":
        return !isClosed && otherCriteria;
      case "Closed tabs":
        return isClosed && otherCriteria;
      case "Auto-closed":
        if (isClosed) {
          return isClosedByTs && otherCriteria;
        } else {
          return false;
        }
      case "Locked tabs":
        return lockedTabIds.includes(tabIdOf(result)) && otherCriteria;
      case "Unlocked tabs":
        return (
          !isClosed && !lockedTabIds.includes(tabIdOf(result)) && otherCriteria
        );
    }
  }

  function sortRows() {
    const tbody = $("#results-tbody");
    tbody.detach();

    //$("#results-table").append(tbody);
  }

  // Settings ------------------------------------------------------------------------------------------------------------------------------

  function setSearchFilterValue() {
    chrome.runtime.sendMessage(
      {
        msg: "get_setting",
        key: "filterSelection",
      }
      /*
      function (responseObject) {
        const value = responseObject.value;
        $("#search-filter").val(value);
      }
      */
    );
  }

  function setThemeValue() {
    chrome.runtime.sendMessage(
      {
        msg: "get_setting",
        key: "theme",
      }
      /*
      function (responseObject) {
        const value = responseObject.value;
        if (value == "dark") $("#theme-switch").trigger("click");
      }
      */
    );
  }

  function setExtendedValue() {
    chrome.runtime.sendMessage(
      {
        msg: "get_setting",
        key: "window_size",
      }
      /*
      function (responseObject) {
        const large = responseObject.value == "large";
        const icon = elementOfClasses("i", [
          "fas",
          large ? "fa-expand" : "fa-compress",
        ]);
        largeWindow = large;
        $("html").toggleClass("extended", large);
        //$("#extend-button").text(large ? " Shrink" : " Expand");
        //$("#extend-button").data("extended", large);
        $("#extend-button i").replaceWith(icon);
      }
      */
    );
  }

  function setPausedValue() {
    chrome.runtime.sendMessage(
      { msg: "get_setting", key: "paused" }
      /*
      function (responseObject) {
        const paused = responseObject.value;
        if (paused) $("#pause-button").trigger("click");
      }
      */
    );
  }

  function updateSettings() {
    setSearchFilterValue();
    setThemeValue();
    setExtendedValue();
    setPausedValue();
  }

  function changeStatus() {
    const icon = $(".footer-status i")[0];
    chrome.runtime.sendMessage(
      { msg: "get_status" }
      /*
      function (responseObject) {
        const status = responseObject.status;
        Object.entries(status).forEach(function ([key, value]) {
          $(icon).toggleClass(key, value);
        });
        $("#pause-button").toggle(!status.disabled);
      }
      */
    );
  }

  // Click events ----------------------------------------------------------------------------------------------------------------------------

  // When click on .result
  $(document).on("click", ".result:visible", function (evt) {
    // Check if cmd / ctrl is being pressed.
    // If so, do not trigger actions below.
    // Instead, appley .selected to the row
    const osKey = navigator.platform == "MacIntel" ? evt.metaKey : evt.ctrlKey;
    if (osKey) {
      $(this).toggleClass("selected");
    } else if (evt.shiftKey) {
      var first = $(".selected").last();
      var last = $(".selected").first();
      var below =
        $(".result:visible").index(this) > $(".result:visible").index(last);
      if (below) {
        $(".result:visible")
          .slice(
            $(".result:visible").index(last),
            $(".result:visible").index(this) + 1
          )
          .addClass("selected");
      } else {
        $(".result:visible")
          .slice(
            $(".result:visible").index(this),
            $(".result:visible").index(last)
          )
          .addClass("selected");
      }
    } else {
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
        chrome.runtime.sendMessage({ msg: "resurrect", tabId: id });
      }
    }
  });

  $("#settings-link").on("click", function (e) {
    e.stopPropagation;
    chrome.tabs.query({}, function (tabs) {
      var tabTo = null;
      tabs.forEach(function (tab) {
        if (tab.url.indexOf("/layouts/settings.html") > 0) {
          tabTo = tab;
        }
      });
      tabTo
        ? chrome.tabs.update(tabTo.id, { active: true })
        : chrome.tabs.create({ url: "/layouts/settings.html" });
      window.close();
    });
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
    /*e.stopPropagation();
    const closed = $(this).closest(".result").data("closed");
    const id = tabIdOf($(this).closest(".result")[0]);
    chrome.runtime.sendMessage({ msg: "tab_report", closed: closed, id: id });
    /*/
    e.stopPropagation();
    var result = $(this).closest(".result");
    var tabId = tabIdOf(result[0]);
    result.hide();
    if (openTabs[tabId]) {
      chrome.tabs.remove(tabId);
    }
    if (closedTabs[tabId]) {
      chrome.runtime.sendMessage(
        { msg: "forget_closed_tab", data: tabId }
        /*
        function (responseObject) {
          closedTabs = responseObject.closedTabs;
        }
        */
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
    $("#pause-button").text(paused ? " Paused" : " Active");
    $("#pause-button").prepend(paused ? pauseIcon : playIcon);
    $("#pause-button").data("paused", !paused);
    chrome.runtime.sendMessage({
      msg: "set_setting",
      key: "paused",
      value: paused,
    });
    changeStatus();
  });

  $("#extend-button").on("click", function (e) {
    e.preventDefault();
    var makeShortIcon = elementOfClasses("i", ["fas", "fa-expand"]);
    var makeLongIcon = elementOfClasses("i", ["fas", "fa-compress"]);
    var makeLarge = !$("html").hasClass("extended");
    $("html").toggleClass("extended", makeLarge);
    $(".tab-title").toggleClass("ttextended", makeLarge);
    //$(this).text(!makeLarge ? " Expand" : " Shrink");
    $(this)
      .find("i")
      .replaceWith(!makeLarge ? makeLongIcon : makeShortIcon);

    chrome.runtime.sendMessage({
      msg: "set_setting",
      key: "window_size",
      value: makeLarge ? "large" : "small",
    });
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
    if (code != 37 && code != 38 && code != 39 && code != 40 && code != 16) {
      filterMatchCriteria(".result");
    }
  });

  $(document).keyup(function (e) {
    if (e.keyCode == 16) {
      e.stopPropagation;
    }
  });

  // Keyup Up And Down Arrows -------------
  $(document).keydown(function (e) {
    var rowUp = (row) =>
      row.prevAll("tr:not([style*='display: none'])").first(":visible");
    var rowDown = (row) =>
      row.nextAll("tr:not([style*='display: none'])").first(":visible");
    var firstRow = () => $("tr:not([style*='display: none'])").first();
    var lastRow = () => $("tr:not([style*='display: none'])").last();
    var offTop = () => scrollCount == -1;
    var offBottom = () => scrollCount == 5;
    if ($(e.target).closest("#search-filter")[0]) {
      return;
    }
    switch (e.which) {
      // downKey
      case 40:
        var row = $(".selected").last();
        changeFunc = e.shiftKey ? addSelectedRow : changeSelectedRowTo;
        changeFunc(
          row[0] == lastRow()[0] && !e.shiftKey ? firstRow() : rowDown(row)
        );
        scrollCount = row[0] == firstRow()[0] ? 1 : scrollCount + 1;
        break;
      // upkey
      case 38:
        var row = $(".selected").first();
        changeFunc = e.shiftKey ? addSelectedRow : changeSelectedRowTo;

        changeFunc(
          row[$(".selected").length - 1] == firstRow()[0] && !e.shiftKey
            ? lastRow()
            : rowUp(row)
        );
        scrollCount = row[0] == lastRow[0] ? 3 : scrollCount - 1;
        if ($(".selected:visible").length == 0) {
          changeSelectedRowTo(lastRow());
        }
        break;
      // space, enter
      case 32:
        if ($("#search-filter").val().length == 0) {
          $(".selected").trigger("click");
        }
        break;
      case 13:
        $(".selected").trigger("click");
        break;
    }
    if (offTop()) {
      scrollCount++;
      $(".selected")[0].scrollIntoView();
    } else if (offBottom()) {
      scrollCount--;
      $(".selected")[$(".selected").length - 1].scrollIntoView(false);
    }
  });

  $(document).keydown(function (e) {
    if ($(e.target).closest("#search-filter")[0]) {
      return;
    }
    switch (e.which) {
      // downKey
      case 40:
      case 38:
        e.preventDefault();
    }
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

  chrome.commands.onCommand.addListener(function (command) {
    switch (command) {
      case "delete-selected":
        $(".selected .fa-times").trigger("click");
        break;
    }
  });

  // Intervals --------------------------------------------------------------------------------------------------------------------------------

  // every second
  window.setInterval(function x() {
    $('.result[data-closed="false"]').each(function (index, result) {
      const timer = $(result).find(".timer")[0];
      const tabId = tabIdOf(result);
      const addZero = (n) => (n < 10 ? "0" : "");
      chrome.runtime.sendMessage(
        { msg: "request_times", id: tabId }
        /*
        function (responseObject) {
          const time = responseObject.times;
          const mins = Math.floor(time / 60);
          const secs = time - mins * 60;
          timer.innerText = addZero(mins) + mins + ":" + addZero(secs) + secs;
        }
        */
      );
    });
  }, 1000);

  // Every minute
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
  }, 60000);

  /// MAIN ----------------------------------------------------------------------------------------------------------------------------------
  //updateSettings();
  //updateAllResults();
});
