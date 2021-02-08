$(document).ready(function () {
  // Vars
  var openTabs = [];

  // Funcs
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

  const notNewTab = (tab) => tab.title != "New Tab";

  const displayTabs = () => {
    document
      .getElementById("results-tbody")
      .append(...openTabs.map(createTabElement));
    ChangeSelectedTo($(".result:visible").first());
  };

  const isChromeTab = (tab) =>
    tab.url.substring(0, tab.url.indexOf(":")) == "chrome"
      ? tab.url.substring(0, tab.url.indexOf(":"))
      : false;

  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );

  const createTabElement = (tab) => {
    const row = createWithClass("tr", "result");
    const chrome = isChromeTab(tab);
    const parsedUrl = urlParse(tab.url);
    const globe = createWithClasses("i", ["fa", "fa-globe"]);
    const fav = create("td");
    const fav_img = create("img");
    const info = create("td");
    const title = createWithClass("span", "tab-title");
    const br = create("br");
    const url = createWithClass("span", "tab-domain");
    const opt1 = createWithClass("td", "lock-toggle");
    const opt1_i = createWithClasses("i", ["fa", "fa-unlock", "fa-lg"]);
    const opt2 = create("td");
    const opt2_i = createWithClasses("i", ["fa", "fa-times"]);
    url.textContent = (chrome ? "chrome://" : "") + parsedUrl;
    title.textContent = tab.title;
    fav_img.setAttribute(
      "src",
      chrome ? "/images/blue-chrome-icon-2.jpg" : tab.favIconUrl
    );
    fav.append(!tab.favIconUrl && !chrome ? globe : fav_img);
    title.append(br);
    info.append(title, url);
    opt1.append(opt1_i);
    opt2.append(opt2_i);
    row.append(fav, info, opt1, opt2);
    row.setAttribute("data-url", tab.url);
    row.setAttribute("data-tabid", tab.id);

    return row;
  };

  // Chrome
  chrome.tabs.query({}, (tabs) => {
    openTabs = tabs.filter(notNewTab);
    displayTabs();
  });

  // Result Selection & Actions - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  function ChangeSelectedTo(selection) {
    $(".selected").removeClass("selected");
    selection.addClass("selected");
  }

  // When click on .result
  $(document).on("click", ".result", function () {
    ChangeSelectedTo($(this));
    //Then Open link
    var id = Number(this.getAttribute("data-tabid"));
    chrome.tabs.update(id, { active: true });
  });

  // Toggle lock class on result rows
  $(document).on("click", ".result .lock-toggle i", function () {
    $(this).toggleClass("fa-lock");
    $(this).toggleClass("fa-unlock");
    $(this).closest(".result").toggleClass("locked");
  });

  // Searching & Filtering - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
      ChangeSelectedTo($(".result:visible").first());
    }
  });

  //Key Up And Down -------------> 
  //      Scroll almost working. Some issue with number of scrolls aded when not all results are visible
  $(document).keyup(function (e) {
    var element = $(".selected").first();
    var y = $('#results-area').scrollTop();
    var targetY = $(element).is(".result:visible:nth-child(n+7)")
      ? 45
      : $(element).is(".result:visible:nth-last-child(n+7)")
      ? -45
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
    $('#results-area').scrollTop(y+targetY);
  });
});
