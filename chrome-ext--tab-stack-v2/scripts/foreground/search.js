$(document).ready(function () {
  // Variables --------------------------------------------------------------

  var allTabs = new TabContainer();

  chrome.storage.sync.get(["allTabs"], function (result) {
    allTabs = result.allTabs;
  });

  function updateAfterLoad(result) {
    allTabs = result["allTabs"];
    updateResults();
  }

  function updateResults() {}

  getFromStorage("allTabs", updateAfterLoad);

  // Click events --------------------------------------------------------------------------------------------------------------------------

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
  $(document).on("click", ".result .lock-toggle i", function (e) {});

  // Close tab on x
  $(document).on("click", ".result .fa-times", function (e) {});

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
  });

  //Click theme switch
  $("#theme-switch").on("click", function (e) {
    e.preventDefault();
    $(this).find("i").toggleClass("fa-sun fa-moon");
    $("body").toggleClass("dark");
  });

  // Key & Change  events --------------------------------------------------------------------------------------------------------------------

  // Filter results by dropdown
  $("#search-filter").change(function () {
    const val = $(this).val();
    if (val == "-> Open history ->") {
      chrome.tabs.create({ url: "chrome://history" });
      $(this).val(prevVal);
    } else {
      filterMatchCriteria(".result");
      $("#searchbox").focus();
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

  // Chrome Listeners --------------------------------------------------------------------------------------------------------------------------

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
