$(document).ready(function () {
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

  // Settings
  //  These can be refactored as many functions are essentially the same

  function sendValToBG(
    element,
    key = element.getAttribute("id"),
    value = element.value.toLowerCase()
  ) {
    //alert(key + ": " + element.value.toLowerCase());
    chrome.runtime.sendMessage({
      msg: "set_setting",
      key: key,
      value: value,
    });
  }

  function sendCheckToBG(
    element,
    key = element.getAttribute("id"),
    value = element.checked
  ) {
    //alert(key + ": " + element.checked);
    chrome.runtime.sendMessage({
      msg: "set_setting",
      key: key,
      value: value,
    });
  }

  function invalidAlert(element) {
    element.value = "";
    alert("Please enter a valid input");
  }

  // Select theme:
  $("#dark-mode, #light-mode, #system-mode").data("type", "button");

  $("#dark-mode").on("click", function () {
    $("html").addClass("dark");
    sendValToBG(this, "theme");
  });
  $("#light-mode").on("click", function () {
    $("html").removeClass("dark");
    sendValToBG(this, "theme");
  });
  $("#system-mode").on("click", function () {
    // get system preference
    if (true) {
      $("html").addClass("dark");
    } else {
      $("html").removeClass("dark");
    }
    sendValToBG(this, "theme");
  });

  // Toggle OR
  $(document).on("click", '.or-switch input[type="button"]', function (e) {
    $(e.target).parent().children().removeClass("selected");
    $(e.target).addClass("selected");
  });

  // Allow automatic closing of tabs:
  $("#allow_closing").data("typ", "checkbox");
  $("#allow_closing").on("click", function () {
    $(".cb-close-tabs-dependent")
      .find("td, input, button")
      .prop("disabled", !$(this).is(":checked"))
      .toggleClass("grey", !$(this).is(":checked"));
  });
  $("#allow_closing").on("change", function () {
    sendCheckToBG(this);
  });

  $("input").on("change", function () {
    if ($(this).val() == "") {
      $(this).css("border", "solid 1px red");
    } else {
      $(this).css("border", "solid 1px var(--table-border)");
    }
  });

  // Close tabs after: _time_min _time_sec
  $("#_time_min, #_time_sec").data("typ", "number");
  $("#_time_min").on("change", function () {
    sendValToBG(this);
  });
  $("#_time_min").keyup(function () {
    this.value < 0 || this.value > 180 ? invalidAlert(this) : null;
  });
  $("#_time_sec").on("change", function () {
    sendValToBG(this);
  });
  $("#_time_sec").keyup(function () {
    this.value < 0 || this.value > 59 ? invalidAlert(this) : null;
  });

  //Start closing tabs when more than:
  $("#max_allowed").data("typ", "number");
  $("#max_allowed").on("change", function () {
    sendValToBG(this);
  });
  $("#max_allowed").keyup(function () {
    this.value < 1 || this.value > 99 ? invalidAlert(this) : null;
  });

  //To reset a tab's timer, the tab must be active for:
  $("#reset_delay").data("typ", "number");
  $("#reset_delay").on("change", function () {
    sendValToBG(this);
  });
  $("#reset_delay").keyup(function () {
    this.value < 0 || this.value > 99 ? invalidAlert(this) : null;
  });

  //Automatic locking
  $("input[name='auto_locking']").on("change", function () {
    if ($(this).is(":checked")) {
      sendValToBG(this, this.getAttribute("name"));
    }
  });

  //match rule 1
  $("match_rules").data("typ", "textarea");
  $("#save-match-list").on("click", function (e) {
    const txt = document.getElementById("match_rules");
    const matchRules = $(txt).val().split("\n");
    sendValToBG(txt, txt.getAttribute("id"), matchRules);
  });

  //match rule 2
  $("not_match_rules").data("typ", "textarea");
  $("#save-not-match-list").on("click", function (e) {
    const txt = document.getElementById("not_match_rules");
    const matchRules = $(txt).val().split("\n");
    sendValToBG(txt, txt.getAttribute("id"), matchRules);
  });

  //Prevent closing of tabs playing audio
  $("#audible_lock").data("typ", "checkbox");
  $("#audible_lock").on("change", function () {
    sendCheckToBG(this);
  });

  //Clear closed tabs on quit
  $("#clear_on_quit").data("typ", "checkbox");
  $("#clear_on_quit").on("change", function () {
    sendCheckToBG(this);
  });

  //Search popup window size
  $("#window_size").data("typ", "option");
  $("#window_size").on("change", function () {
    sendValToBG(this);
  });

  //Maximum number of closed tabs to store
  $("#max_stored").on("change", function () {
    sendValToBG(this);
  });
  $("#max_stored").data("typ", "number");
  $("#max_stored").keyup(function () {
    this.value < 1 || this.value > 300 ? invalidAlert(this) : null;
  });
  //Prevent duplicate closed tabs:
  $("#prevent_dup").data("typ", "option");
  $("#prevent_dup").on("change", function () {
    sendValToBG(this);
  });

  //Buttons ---------------------------------------------------------------------------------------

  $("#close-settings").on("click", function () {
    if (window.history.length == 1) {
      window.close();
    } else {
      window.history.back();
    }
  });

  $("#match-list-button").click(function () {
    $("#edit-match-list-link").trigger("click");
    // Load textarea with match_rules
  });

  $("#not-match-list-button").click(function () {
    $("#edit-not-match-list-link").trigger("click");
    // Load textarea with not_match_rules
  });

  //Keyboard Shortcut Settings input -------------------------------------------------------------------

  var osCmd = navigator.platform == "MacIntel" ? "Command" : "Control";

  $("#sc1").text(`${osCmd} + Shift + S`);
  $("#sc2").text(`${osCmd} + Shift + L`);
  $("#sc3").text(`${osCmd} + Backspace`);
  $("#sc4").text(`${osCmd} + L`);
  $("#sc5").text(`${osCmd} + O`);
  $("#sc6").text(`${osCmd} + C`);
  $("#sc7").text(`${osCmd} + A`);

  $("#chromeExt").on("click", function () {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // Load from background

  function setValue(id, value, type = $("#" + id).attr("type")) {
    const selector = "#" + id;
    //alert(JSON.stringify(id+", "+value+", "+type));
    switch (type) {
      case "button":
        $("#" + value + "-mode").trigger("click");
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
    if(id == 'auto_locking'){
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
    }
  );

  // MAIN -----------------------------------------------------------------
});
