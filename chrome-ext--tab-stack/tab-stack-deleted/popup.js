$(document).ready(function () {

  const tabObj = {
    "tab-monitor-link": "#tab-monitor",
    "tab-history-link": "#tab-history",
    "settings-tab-link": "#settings",
    "settings-link": "#settings",
  };

  // Ctrl & Tab Key -------------------------------------------------------------------

  $(document).keydown(function (e) {
    if (e.ctrlKey) {
      var nextTab = $(".selected").next(".tab").length
        ? $(".selected").next(".tab")
        : $(".tab").first();
      var prevTab = $(".selected").prev(".tab").length
        ? $(".selected").prev(".tab")
        : $(".tab").last();
    }
    if (e.ctrlKey && e.which == 9) {
      e.preventDefault();
      $(nextTab).trigger("click");
      $(nextTab).focus();
    }
    if (e.ctrlKey && e.shiftKey && e.which == 9) {
      e.preventDefault();
      $(prevTab).trigger("click");
      $(prevTab).focus();
    }
  });

  // Navigation Tabs: [tab stack] [tab monitor] [settings] [logo] -----------------------
  $(".tab").click(function () {
    var visiblePage = tabObj[$(this).attr("id")];
    $(".tab").removeClass("selected");
    $(this).addClass("selected");
    $(".tab-content").hide();
    $(visiblePage).show();
    if (visiblePage == "#settings") {
      $(".footer").hide();
    } else {
      $(".footer").show();
    }
  });
  $(".tab").keypress(function (e) {
    if (e.keyCode == 32) {
      e.preventDefault();
      $(this).trigger("click");
    }
  });
  $(".title").keypress(function (e) {
    if (e.keyCode == 32) {
      e.preventDefault();
      $(this).find("img").trigger("click");
    }
  });
});
