$(document).ready(function () {
  var closedTabs = {};
  // [tab stack] History Page ---------------------------------------------------------------------

  // common
  const element = (type) => document.createElement(type);
  // common
  const elementOfClass = (typ, clas) => {
    var elem = element(typ);
    elem.classList.add(clas);
    return elem;
  };
  // common
  const elementOfClasses = (typ, cList) => {
    var elem = element(typ);
    $.each(cList, function (i, c) {
      elem.classList.add(c);
    });
    return elem;
  };
  // common
  const isChromeTab = (tab) =>
    tab.url.substring(0, tab.url.indexOf(":")) == "chrome"
      ? tab.url.substring(0, tab.url.indexOf(":"))
      : false;

  // common
  const tabIdOfResult = (result) => Number(result.getAttribute("data-tabid"));
  // common
  const urlOfResult = (result) => Number(result.getAttribute("data-url"));
  // common
  const urlParse = (url) =>
    url.substring(
      url.lastIndexOf("//") + 2,
      url.indexOf("/", url.lastIndexOf("//") + 2)
    );
  // common
  const isClosedTab = (tabObject) => tabObject.hasOwnProperty("isClosed");

  // -- could be common
  function createResultRow(tab) {
    var row = elementOfClass("tr", "result");
    row.setAttribute("data-url", tab.url);
    row.setAttribute("data-tabid", tab.id);
    const td = element("td");
    for (i = 0; i < 5; i++) {
      row.appendChild(td.cloneNode());
    }
    row = addRowDetails(row, tab.id);
    return row;
  }

  function addRowDetails(row, id) {
    const tab = closedTabs[id];
    const isChrome = isChromeTab(tab);
    const parsedUrl = urlParse(tab.url);
    const globe = elementOfClasses("i", ["fas", "fa-globe"]);
    const faviconImg = elementOfClass("img", "favicon");
    const titleSpan = elementOfClass("span", "tab-title");
    const domainSpan = elementOfClass("span", "tab-domain");
    titleSpan.textContent = tab.title;
    if (isChrome) {
      faviconImg.setAttribute("src", "/images/blue-chrome-icon-2.jpg");
      domainSpan.textContent = "chrome://" + parsedUrl;
    } else {
      domainSpan.textContent = parsedUrl;
      faviconImg.setAttribute("src", tab.favIconUrl);
    }
    $(row)
      .find("td:nth-child(2)")
      .append(!tab.favIconUrl && !isChrome ? globe : faviconImg);
    $(row).find("td:nth-child(3)").append(titleSpan);
    $(row).find("td:nth-child(3)").append(domainSpan);
    return row;
  }

  // common
  function emptyResultsTable() {
    var tbody = $("#results-tbody");
    $("#results-tbody").detach();
    tbody.empty();
    $("#results-table").append(tbody);
  }

  function applyTdChildren() {
    $("#results-table td:nth-child(1)").append("<input type='checkbox' />");
    $("#results-table td:nth-child(4)").append("69 minutes");
    $("#results-table td:nth-child(5)").append(
      "<i class='fas fa-trash'></i><i class='fas fa-info-circle tab-info-button'></i>"
    );
    $(".tab-info-button").on("click", function () {
      $("#tab-info-link").trigger("click");
    });
    $(".copy-btn").on("click", function () {
      $(this).siblings(".copied").slideDown();
      setTimeout(() => {
        $(this).siblings(".copied").slideUp();
      }, 4000);
    });
  }

  // common
  function displayTabRows(objList) {
    for (tabsObj of objList) {
      var tbody = $("#results-tbody");
      $("#results-tbody").detach();
      const tabs = Object.values(tabsObj);
      tbody.append(...tabs.map(createResultRow));
      $("#results-table").append(tbody);
      applyTdChildren();
      //changeSelectedRowTo($(".result:visible").first());
    }
  }

  function requestTabs() {
    chrome.runtime.sendMessage(
      { msg: "request_tabs" },
      function (responseObject) {
        //openTabs = responseObject.openTabData;
        closedTabs = responseObject.closedTabsData;
        /*applyTags([
          [{ active: true }, "tag-active"],
          [{ currentWindow: false }, "tag-otherwindow"],
        ]);*/
        emptyResultsTable();
        displayTabRows([closedTabs]);
      }
    );
  }
  requestTabs();

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
    $(document).on("click", ".tab-title", function () {
      //changeSelectedRowTo($(this));
      //Then Open link
      var result = $(this).closest('.result')[0];
      var id = tabIdOfResult(result);
      /*
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
      } else 
      */
      if (id in closedTabs) {
        chrome.runtime.sendMessage(
          { msg: "resurrect", tabId: id },
          function (responseObject) {}
        );
      }
    });
});
