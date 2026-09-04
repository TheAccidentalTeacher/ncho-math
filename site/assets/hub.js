// Draws the hub from window.SITE_MODULES. The hub never hardcodes a module list.
(function () {
  var mods = window.SITE_MODULES || [];
  var list = document.getElementById("module-cards");
  if (!list) return;
  if (!mods.length) {
    list.innerHTML = "<li>No modules registered yet.</li>";
    return;
  }
  list.innerHTML = mods
    .map(function (m) {
      return (
        '<li><a href="' + m.href + '">' +
        "<h2>" + m.title + "</h2>" +
        "<p>" + (m.blurb || "") + "</p>" +
        (m.status ? '<span class="tag">' + m.status + "</span>" : "") +
        "</a></li>"
      );
    })
    .join("");
})();
