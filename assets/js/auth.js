(function () {
  "use strict";

  var AUTH = "bladeos.auth";
  var USER = "123456";
  var PASS = "123456";

  function pageName() {
    var file = location.pathname.split("/").filter(Boolean).pop() || "index.html";
    var known = { login: 1, demo: 1, product: 1, pricing: 1, "white-label": 1, index: 1 };
    if (file.indexOf(".") === -1) {
      if (known[file]) return file + ".html";
      return "index.html";
    }
    return file;
  }

  function safeNext(value) {
    if (!value || /^(https?:|\/\/)/i.test(value)) return "index.html";
    if (!/^(index|product|pricing|white-label|demo)\.html([?#].*)?$/.test(value)) return "index.html";
    return value;
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-sign-out]");
    if (!link) return;
    event.preventDefault();
    localStorage.removeItem(AUTH);
    location.href = "login.html";
  });

  if (pageName() === "login.html") {
    document.addEventListener("DOMContentLoaded", function () {
      var form = document.querySelector("[data-login]");
      if (!form) return;
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var error = document.querySelector("[data-login-error]");
        if (String(data.get("username") || "") === USER && String(data.get("password") || "") === PASS) {
          localStorage.setItem(AUTH, "ok");
          location.href = safeNext(new URLSearchParams(location.search).get("next"));
          return;
        }
        if (error) error.textContent = "That username or password does not match the demo login.";
      });
    });
    return;
  }

  if (localStorage.getItem(AUTH) !== "ok") {
    var next = pageName() + location.search + location.hash;
    location.replace("login.html?next=" + encodeURIComponent(next));
  }
})();
