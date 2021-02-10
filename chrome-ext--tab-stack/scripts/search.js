$(document).ready(function () {
  // Vars
  var openTabs = [];
  var activeTab;

  // Element Creation
  const create = (str) => document.createElement(str);
  const createWithClass = (typ, clas) => {
    var elem = create(typ);
    elem.classList.add(clas);
    return elem;
  };
  const createWithClasses = (typ, cList) => {
    var elem = create(typ);
    $.each(cList, function (i, c) {
      elem.classList.add(c);
    });
    return elem;
  };

  // Booleans
  const NotNewTab = (tab) => tab.title != "New Tab";
  const isChromeTab = (tab) =>
    tab.url.substring(0, tab.url.indexOf(":")) == "chrome"
      ? tab.url.substring(0, tab.url.indexOf(":"))
      : false;

  // Chrome

  // Results table
  const displayTabs = () => {
    var tbody = $("#results-tbody");
    $("#results-tbody").detach();
    tbody.empty();
    tbody.append(...openTabs.map(createResultRow));
    $("#results-table").append(tbody);
    changeSelectedRowTo($(".result:visible").first());
  };
  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );
  const getOptions = (tab) => {
    const opt0 = createWithClass("td", "lock-toggle");
    const opt1 = create("td");
    $(opt0).data("locked", false);
    const lock_icon = $(opt0).data().locked ? "fa-lock" : "fa-unlock";
    opt0.append(createWithClasses("i", ["fa", lock_icon]));
    opt1.append(createWithClasses("i", ["fa", "fa-times"]));
    return [opt0, opt1];
  };

  const createResultRow = (tab) => {
    const chrome = isChromeTab(tab);
    const parsedUrl = urlParse(tab.url);
    const row = createWithClass("tr", "result");
    const globe = createWithClasses("i", ["fa", "fa-globe"]);
    const favicon = createWithClass("td", "td-favicon");
    const fav_img = create("img");
    const info = createWithClass("td", "tab-info");
    const title = createWithClass("span", "tab-title");
    const url = createWithClass("span", "tab-domain");
    const opt0 = getOptions(tab)[0];
    const opt1 = getOptions(tab)[1];
    url.textContent = (chrome ? "chrome://" : "") + parsedUrl;
    title.textContent = tab.title;
    fav_img.setAttribute(
      "src",
      chrome ? "/images/blue-chrome-icon-2.jpg" : tab.favIconUrl
    );
    favicon.append(!tab.favIconUrl && !chrome ? globe : fav_img);
    title.append(create("br"));
    info.append(title, url);
    row.append(favicon, info, opt0, opt1);
    row.setAttribute("data-url", tab.url);
    row.setAttribute("data-tabid", tab.id);
    return row;
  };

  const changeSelectedRowTo = (selection) => {
    $(".selected").removeClass("selected");
    selection.addClass("selected");
  };

  const getTabIdFromResult = (result) =>
    Number(result.getAttribute("data-tabid"));

  // Initialisation - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // getTabs
  chrome.tabs.query({}, (tabs) => {
    openTabs = tabs.filter(NotNewTab);
    displayTabs();
  });

  // label active tab
  chrome.tabs.query({ active: true }, function (tabs) {
    activeTab = tabs[0];
    var ids = tabs.map((tab) => tab.id);
    $(".result").each(function (index, result) {
      if (ids.includes(getTabIdFromResult(result))) {
        $(this).find(".tab-domain").toggleClass("tag-active");
        //$(this).find('.fa-times').removeClass('fa-times').addClass('fa-ban');
      }
    });
  });

  // Events - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  // When click on .result
  $(document).on("click", ".result", function () {
    changeSelectedRowTo($(this));
    //Then Open link
    var id = getTabIdFromResult(this);
    setTimeout(function () {
      chrome.tabs.update(id, { active: true });
      self.close();
    }, 100);
  });

  // When click on .result i
  $(document).on("click", ".result i", function (e) {
    e.stopPropagation();
  });

  // Toggle lock class on result rows
  $(document).on("click", ".result .lock-toggle i", function () {
    $(this).toggleClass("fa-lock");
    $(this).toggleClass("fa-unlock");
    $(this).closest(".result").toggleClass("locked");
  });

  // Close tab on x
  $(document).on("click", ".result .fa-times", function () {
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
    var playIcon = createWithClasses("i", ["fa", "fa-play"]);
    var pauseIcon = createWithClasses("i", ["fa", "fa-pause"]);
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
