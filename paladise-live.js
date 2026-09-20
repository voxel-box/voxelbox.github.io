/* Live Paladise stats for voxelbox.org (Palworld page and Servers page). External file because the site's CSP
   forbids inline scripts; data comes from demos.voxelbox.org (allowed by connect-src), which forwards to the
   public Paladise feed. Every element is optional, so this is safe to load on any page. */
(function () {
  "use strict";
  var FEED = "https://demos.voxelbox.org/api/paladise";
  var $ = function (id) { return document.getElementById(id); };
  function set(id, text) { var e = $(id); if (e) e.textContent = text; }
  function plural(n) { return n + " player" + (n === 1 ? "" : "s"); }

  function apply(d) {
    var s = d.server, n = (d.bases || []).length;
    window.__paladiseLive = { players: s.online ? s.players : null };
    set("pl-players", s.online ? s.players + "/" + s.max + " online" : "Restarting");
    set("pl-players-sub", s.online ? "Cross-platform tamers playing right now" : "Daily restart, back in a few minutes");
    var ol = $("pl-top");
    if (ol) {
      ol.textContent = "";
      (d.leaderboard.all_time || []).slice(0, 3).forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.name + ": " + e.hours + " h"; ol.appendChild(li);
      });
      if (!ol.children.length) { var li = document.createElement("li"); li.textContent = "Tracking has just started"; ol.appendChild(li); }
    }
    set("pl-bases", n ? n + " base" + (n === 1 ? "" : "s") + " shared" : "Be the first to share one");
    // the site's own status API has no player count for this server; fill it in
    if (s.online) document.querySelectorAll('[data-server-players="palworld"]').forEach(function (el) { el.textContent = plural(s.players); });
  }
  function fail() {
    set("pl-players", "See paladise.org");
    set("pl-players-sub", "Live details are on the Paladise site.");
    var ol = $("pl-top"); if (ol) ol.textContent = "";
    set("pl-bases", "See paladise.org");
  }
  function load() {
    fetch(FEED, { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(apply).catch(fail);
  }
  load();
  setInterval(load, 60000);
})();
