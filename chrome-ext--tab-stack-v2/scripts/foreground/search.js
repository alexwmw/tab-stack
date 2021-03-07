$(document).ready(function () {
  // Variables --------------------------------------------------------------

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



  // Functions ----------------------------------------------------------------------



  // Settings ------------------------------------------------------------------------------------------------------------------------------


  // Click events --------------------------------------------------------------------------------------------------------------------------

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
