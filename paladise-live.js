/* Live Paladise stats for the Palworld page. External file because the site's CSP forbids inline scripts;
   the data comes from demos.voxelbox.org (allowed by connect-src), which forwards to the public Paladise feed. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function fail() {
    $("pl-players").textContent = "See paladise.org";
    $("pl-players-sub").textContent = "Live details are on the Paladise site.";
    $("pl-top").textContent = "";
    $("pl-bases").textContent = "See paladise.org";
  }
  fetch("https://demos.voxelbox.org/api/paladise", { headers: { Accept: "application/json" }, cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      $("pl-players").textContent = d.server.online ? d.server.players + "/" + d.server.max + " online" : "Restarting";
      $("pl-players-sub").textContent = d.server.online ? "Cross-platform tamers playing right now" : "Daily restart, back in a few minutes";
      var ol = $("pl-top"); ol.textContent = "";
      (d.leaderboard.all_time || []).slice(0, 3).forEach(function (e) {
        var li = document.createElement("li"); li.textContent = e.name + ": " + e.hours + " h"; ol.appendChild(li);
      });
      if (!ol.children.length) { var li = document.createElement("li"); li.textContent = "Tracking has just started"; ol.appendChild(li); }
      var n = (d.bases || []).length;
      $("pl-bases").textContent = n ? n + " base" + (n === 1 ? "" : "s") + " shared" : "Be the first to share one";
    })
    .catch(fail);
})();
