$(document).ready(function () {
  // Element Creation

  // Settings

  function sendValToBG(
    element,
    key = element.getAttribute("id"),
    value = element.value.toLowerCase()
  ) {
    if ($(element).is(":checkbox")) {
      value = element.checked;
    }
    chrome.runtime.sendMessage(
      {
        msg: "set_setting",
        key: key,
        value: value,
      },
      function () {
        $("#saved-notification").show();
        $("#saved-notification").fadeOut(2000);
        return true;
      }
    );
  }

  // Load from background

  function setValue(id, value, type = $("#" + id).attr("type")) {
    const selector = "#" + id;
    //alert(JSON.stringify(id+", "+value+", "+type));
    switch (type) {
      case "button":
        var element = $("#" + value + "-mode")[0];
        applyTheme(element);
        $(element).parent().children().removeClass("selected");
        $(element).addClass("selected");
        break;
      case "number":
        $(selector).val(value);
        break;
      case "checkbox":
        $(selector).prop("checked", value);
        break;
      case "textarea":
        const txt = document.getElementById(id);
        $(txt).val(value.join("\n"));
        break;
      case "select":
        $(selector).val(value);
        break;
    }
    if (id == "auto_locking") {
      $("#" + id + "_" + value).attr("checked", true);
    }
  }

  chrome.runtime.sendMessage(
    { msg: "get_all_settings" },
    function (responseObject) {
      var settings = responseObject.settings;
      Object.entries(settings).forEach(([id, value]) => {
        setValue(id, value);
      });
      /*
      if (!$("#allow_closing").prop("checked")) {
        $(".cb-close-tabs-dependent")
          .find("td, input, button")
          .prop("disabled", true)
          .toggleClass("grey", true);
      }*/
    }
  );

  // Select theme:
  $("#dark-mode, #light-mode, #system-mode").data("type", "button");

  function applyTheme(element) {
    var id = $(element).attr("id");
    switch (id) {
      case "dark-mode":
        $("html").addClass("dark");
        break;
      case "light-mode":
        $("html").removeClass("dark");
        break;
      case "system-mode":
        // get system preference
        if (bool) {
          $("html").addClass("dark");
        } else {
          $("html").removeClass("dark");
        }
        break;
    }
  }

  $(".theme-switch").on("click", function () {
    applyTheme(this);
    sendValToBG(this, "theme");
  });

  // Toggle OR
  $(document).on("click", '.or-switch input[type="button"]', function (e) {
    $(e.target).parent().children().removeClass("selected");
    $(e.target).addClass("selected");
  });

  /* Allow automatic closing of tabs:
  $("#allow_closing").on("click", function () {
    $(".cb-close-tabs-dependent")
      .find("td, input, button")
      .prop("disabled", !$(this).is(":checked"))
      .toggleClass("grey", !$(this).is(":checked"));
  });*/

  //Automatic locking
  $("input[name='auto_locking']").on("change", function () {
    if ($(this).is(":checked")) {
      sendValToBG(this, this.getAttribute("name"));
    }
  });

  // MODALS ------------------------------------------

  //match rule 1
  $("#save-match-list").on("click", function (e) {
    const txt = document.getElementById("match_rules");
    const matchRules = $(txt).val().split("\n");
    sendValToBG(txt, txt.getAttribute("id"), matchRules);
  });

  //match rule 2
  $("#save-not-match-list").on("click", function (e) {
    const txt = document.getElementById("not_match_rules");
    const matchRules = $(txt).val().split("\n");
    sendValToBG(txt, txt.getAttribute("id"), matchRules);
  });

  //Buttons & Clicks ---------------------------------------------------------------------------------------

  $("#close-settings").on("click", function () {
    window.close();
  });

  $("#match-list-button").click(function () {
    $("#edit-match-list-link").trigger("click");
    // Load textarea with match_rules
  });

  $("#not-match-list-button").click(function () {
    $("#edit-not-match-list-link").trigger("click");
    // Load textarea with not_match_rules
  });

  $("#chromeExt").on("click", function () {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // Delete closed tabs
  $("#clear-tabs").on("click", function () {
    if (window.confirm("Are you sure you want to delete closed tab history?")) {
      chrome.runtime.sendMessage({ msg: "replace_closed_tabs", data: {} });
      alert("Closed tabs deleted");
    }
  });

  $(".match-rules-button").on("click", function () {
    $(this).parent().find(".match-rules").slideToggle();
    $(this).parent().find(".textarea-area").slideToggle();
    $(this)
      .find("i")
      .toggleClass("fa-plus-square")
      .toggleClass("fa-minus-square");
  });

  // Validation ------------------------------------------------------------------------------------

  //.send-value-to-bg
  $(".send-value-to-bg").change(function () {
    if (this.type == "number") {
      if (validate(this)) {
        sendValToBG(this);
      }
    } else {
      sendValToBG(this);
    }
  });

  function validate(inp) {
    var min = parseInt(inp.getAttribute("min"));
    var max = parseInt(inp.getAttribute("max"));
    var value = parseInt(inp.value);
    if ($("#_time_min").val() == 0 && $("#_time_sec").val() < 10) {
      alert(`Total time cannot be less than 10 seconds`);
      $("#_time_sec").val(59);
      setTimeout(() => {
        $("#_time_min").val(0);
        $(inp).blur();
      }, 100);
      $(inp).focus();
      return true;
    }
    if (value >= min && value <= max) {
      return true;
    } else if (inp.value == "") {
      $(inp).focus();
      inp.value = min;
      return false;
    } else {
      alert(
        `Value outside of permitted range.\n` +
          `Please enter a value between ${min} and ${max}.`
      );
      $(inp).focus();
      inp.value = min;
      return false;
    }
  }

  //Keyboard Shortcut Settings input -------------------------------------------------------------------

  var osCmd = navigator.platform == "MacIntel" ? "Command" : "Control";

  chrome.commands.getAll(function (commands) {
    commands.forEach((com) => {
      switch (com.name) {
        case "_execute_browser_action":
          $("#sc1").text(com.shortcut);
          break;
        case "lock-toggle":
          $("#sc2").text(com.shortcut);
          $("#sc4").text(com.shortcut);
          break;
        case "delete-selected":
          $("#sc3").text(com.shortcut);

          break;
      }
    });
  }); /*.*.com/";
  var urls = [url1, url2, url3, url4a, url4b, url5, url6, url7];

  $.each(urls, function (index, urlStr) {
    if (urlStr.toLowerCase().indexOf("//") == -1) {
      urlStr = "https://" + urlStr;
    }
    var newline = "\n";
    var u = new URL(urlStr);
    var ustring = [
      "URL: " + u,
      "Host: " + u.host,
      "Hostname: " + u.hostname,
      "Protocol: " + u.protocol,
      "Pathname: " + u.pathname,
      "\n",
    ].join("\n");
    console.log(ustring);
  });
  */

  // MAIN -----------------------------------------------------------------

  /*
  var url1 = "chrome://extensions";
  var url2 = "www.google.com/watch*";
  var url3 = "https://www.*.com/*";
  var url4a = "* /watch";
  var url4b = "*.* /watch";
  var url5 = "*.google.*";
  var url6 = "www.*.com/";
  var url7 = "*/
});
