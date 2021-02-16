$(document).ready(function () {
  var openTabs = [];
  var closedTabs = [];
  var activeTab;
  var lockedTabs = [];

  const element = (str) => document.createElement(str);

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

  const getTabIdFromResult = (result) =>
    Number(result.getAttribute("data-tabid"));

  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );

  function displayTabRows() {
    var tbody = $("#results-tbody");
    $("#results-tbody").detach();
    tbody.empty();
    tbody.append(...openTabs.map(createResultRow));
    $("#results-table").append(tbody);
    //$(".tab-title").each(function () {
    //  $(this).text(function (index, text) {
    //    return text.replace("o", "0");
    //  });
    //});
    changeSelectedRowTo($(".result:visible").first());
  }

  function createRowIcons(tab) {
    const icon0 = elementOfClass("td", "lock-toggle");
    const icon1 = element("td");
    icon0.append(elementOfClasses("i", ["fa", "fa-lock"]));
    icon1.append(elementOfClasses("i", ["fa", "fa-times"]));
    return [icon0, icon1];
  }

  function createResultRow(tab) {
    const chrome = isChromeTab(tab);
    const parsedUrl = urlParse(tab.url);
    const row = elementOfClass("tr", "result");
    const globe = elementOfClasses("i", ["fa", "fa-globe"]);
    const favicon = elementOfClass("td", "td-favicon");
    const fav_img = element("img");
    const info = elementOfClass("td", "tab-info");
    const title = elementOfClass("span", "tab-title");
    const url = elementOfClass("span", "tab-domain");
    const icon0 = createRowIcons(tab)[0];
    const icon1 = createRowIcons(tab)[1];
    url.textContent = (chrome ? "chrome://" : "") + parsedUrl;
    title.textContent = tab.title;
    fav_img.setAttribute("src", tab.favIconUrl);
    favicon.append(!tab.favIconUrl && !chrome ? globe : fav_img);
    title.append(element("br"));
    info.append(title, url);
    row.append(favicon, info, icon0, icon1);
    row.classList.add(lockedTabs.includes(tab.id) ? "locked" : "unlocked");

    if (chrome) {
      fav_img.setAttribute("src", "/images/blue-chrome-icon-2.jpg");
      icon0.classList.remove("lock-toggle");
      icon0.classList.add("cant-lock");
    }
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
        getActiveTabs();
        displayTabRows();
      }
    );
  }
  requestTabs();

  // label active tab
  function getActiveTabs() {
    chrome.tabs.query({ active: true }, function (tabs) {
      activeTab = tabs[0];
      var ids = tabs.map((tab) => tab.id);
      $(".result").each(function (index, result) {
        if (ids.includes(getTabIdFromResult(result))) {
          $(this).find(".tab-domain").toggleClass("tag-active");
        }
      });
    });
  }

  chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
    requestTabs();
    displayTabRows();
  });

  // When click on .result
  $(document).on("click", ".result", function () {
    changeSelectedRowTo($(this));
    //Then Open link
    var id = getTabIdFromResult(this);
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
  });

  // Toggle lock class on result rows
  function lock(result) {
    var tabId = getTabIdFromResult(result);
    var isLocked = $(result).hasClass("locked");
    var newState = isLocked ? "unlocked" : "locked";
    addOrRemove(lockedTabs, tabId);
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
    var tabId = getTabIdFromResult(result[0]);
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
  var searchterm = "";
  $("#searchbox").on("keyup", function () {
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
    var playIcon = elementOfClasses("i", ["fa", "fa-play"]);
    var pauseIcon = elementOfClasses("i", ["fa", "fa-pause"]);
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
