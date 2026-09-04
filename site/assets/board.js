/* ============================================================================
   board.js — draws the 6th/7th grade coverage board from window.MATH_STANDARDS.

   The page never hardcodes a standard. Everything here comes from the generated
   data file, which comes from the frozen official code table. Add coverage by
   editing tools/coverage.json and re-running the generator.
   ========================================================================= */
(function () {
  "use strict";

  var DATA = window.MATH_STANDARDS;
  var board = document.getElementById("board");
  if (!board) return;

  if (!DATA || !DATA.rows || !DATA.rows.length) {
    board.innerHTML =
      '<div class="board-row"><div class="t">No standards data loaded. ' +
      "Run <code>node tools/build-standards.mjs</code>.</div></div>";
    return;
  }

  var rows = DATA.rows;
  var STATUS = {
    done: { label: "done", cls: "done" },
    wip:  { label: "building", cls: "open" },
    todo: { label: "not started", cls: "" }
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------------------------------------------------- the summary tiles */
  function drawStats() {
    var el = document.getElementById("board-stats");
    if (!el) return;
    var g6 = rows.filter(function (r) { return r.grade === 6; });
    var g7 = rows.filter(function (r) { return r.grade === 7; });
    var done = function (a) { return a.filter(function (r) { return r.status === "done"; }).length; };
    var cells = [
      { n: done(rows) + "/" + rows.length, l: "standards covered<br>the whole proof of concept",
        cls: done(rows) === rows.length ? "" : "amber" },
      { n: done(g6) + "/" + g6.length, l: "grade 6<br>ratios, negatives, expressions, area, data",
        cls: done(g6) === g6.length ? "" : "amber" },
      { n: done(g7) + "/" + g7.length, l: "grade 7<br>proportions, operations, angles, probability",
        cls: done(g7) === g7.length ? "" : "amber" },
      { n: String(rows.filter(function (r) { return r.parts.length; }).length), l: "have lettered sub-parts<br>each one is its own teaching point", cls: "" }
    ];
    el.innerHTML = cells.map(function (c) {
      return '<div><div class="stat-n ' + c.cls + '">' + c.n + "</div>" +
             '<div class="stat-l">' + c.l + "</div></div>";
    }).join("");

    var pct = Math.round((done(rows) / rows.length) * 100);
    var meter = document.getElementById("board-meter");
    if (meter) meter.style.width = pct + "%";
    var prog = document.getElementById("board-progress");
    if (prog) {
      prog.textContent = pct + "% complete · " + done(rows) + " done · " +
        rows.filter(function (r) { return r.status === "wip"; }).length + " building · " +
        rows.filter(function (r) { return r.status === "todo"; }).length + " to go" +
        "  —  codes frozen " + DATA.frozen;
    }
  }

  /* ------------------------------------------------- the grouped standard list */
  function drawBoard(filter) {
    var shown = rows.filter(function (r) {
      if (filter === "g6") return r.grade === 6;
      if (filter === "g7") return r.grade === 7;
      if (filter === "todo") return r.status === "todo";
      if (filter === "done") return r.status === "done";
      return true;
    });

    if (!shown.length) {
      board.innerHTML = '<div class="board-row"><div class="t">Nothing in this view yet.</div></div>';
      return;
    }

    // group by grade then domain — the way a teacher looks at a scope and sequence
    var groups = [];
    var index = {};
    shown.forEach(function (r) {
      var key = r.grade + "." + r.domain;
      if (!index[key]) {
        index[key] = { grade: r.grade, domain: r.domain, name: r.domainName, items: [] };
        groups.push(index[key]);
      }
      index[key].items.push(r);
    });

    board.innerHTML = groups.map(function (g) {
      var doneN = g.items.filter(function (r) { return r.status === "done"; }).length;
      var head =
        '<div class="board-h">' +
          "<span>Grade " + g.grade + " · " + esc(g.name) + "</span>" +
          '<span class="n">' + g.domain + " · " + doneN + " of " + g.items.length + " covered</span>" +
        "</div>";
      var body = g.items.map(function (r) {
        var st = STATUS[r.status] || STATUS.todo;
        var partHtml = r.parts.length
          ? '<div style="margin-top:6px;color:var(--pencil);font-size:14.5px">' +
              r.parts.map(function (p) {
                return "<div><span class=\"mono\" style=\"font-size:12px\">" + esc(p.code) +
                       "</span> &nbsp;" + esc(p.text.slice(0, 150)) +
                       (p.text.length > 150 ? "…" : "") + "</div>";
              }).join("") +
            "</div>"
          : "";
        return '<div class="board-row" data-status="' + r.status + '">' +
                 '<div class="c">' + esc(r.code) + "</div>" +
                 '<div class="t">' + esc(r.text) + partHtml +
                   (r.note ? '<div style="margin-top:6px"><span class="mono" style="font-size:12.5px;color:var(--pencil)">' + esc(r.note) + "</span></div>" : "") +
                 "</div>" +
                 '<div class="s">' + (st.cls ? '<span class="tag ' + st.cls + '">' + st.label + "</span>"
                                             : '<span class="mono" style="font-size:11.5px;color:var(--pencil)">' + st.label + "</span>") + "</div>" +
               "</div>";
      }).join("");
      return '<div class="board-group">' + head + body + "</div>";
    }).join("");
  }

  /* ------------------------------------------------------------- filters */
  var controls = document.getElementById("board-controls");
  if (controls) {
    controls.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      Array.prototype.forEach.call(
        controls.querySelectorAll("button[data-filter]"),
        function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      drawBoard(btn.getAttribute("data-filter"));
    });
  }

  drawStats();
  drawBoard("all");
})();
