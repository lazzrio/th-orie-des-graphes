/* Atelier d'exploration : parcours du mini wiki (file = largeur, pile = profondeur). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var S = null;

  function build() {
    var spec = GV.data.wiki, succ = {};
    Object.keys(spec.nodes).forEach(function (n) { succ[n] = []; });
    spec.edges.forEach(function (e) { succ[e[0]].push(e[1]); });
    var start = $("ex-start").value;
    var vus = {}; vus[start] = true;
    return { spec: spec, succ: succ, start: start, vus: vus, aExplorer: [start], explores: [], rows: [] };
  }

  function step() {
    if (!S.aExplorer.length) return;
    var pile = $("ex-mode").value === "pile";
    var s = pile ? S.aExplorer.pop() : S.aExplorer.shift();
    S.explores.push(s);
    var nouvelles = [];
    S.succ[s].forEach(function (t) {
      if (!S.vus[t]) { S.vus[t] = true; S.aExplorer.push(t); nouvelles.push(t); }
    });
    S.rows.push({ s: s, liens: S.succ[s].slice(), nouvelles: nouvelles, apres: S.aExplorer.slice() });
  }

  function refresh() {
    var colors = {}, order = {};
    S.aExplorer.forEach(function (n) { colors[n] = 3; });
    S.explores.forEach(function (n, i) { colors[n] = 1; order[n] = i + 1; });
    S.handle.setColors(colors);
    S.handle.setBadges(order);
    var done = !S.aExplorer.length;
    $("ex-next").disabled = done; $("ex-all").disabled = done;
    var pile = $("ex-mode").value === "pile";
    var nxt = done ? null : (pile ? S.aExplorer[S.aExplorer.length - 1] : S.aExplorer[0]);
    S.handle.setCur(nxt);
    var total = Object.keys(S.spec.nodes).length;
    $("ex-stats").innerHTML = "<div><b>" + S.explores.length + " / " + total + "</b>pages explorées</div><div><b>" + S.aExplorer.length + "</b>vues non explorées</div>";
    $("ex-verdict").innerHTML = done
      ? "Exploration terminée : " + S.explores.length + " page(s) accessible(s) depuis " + S.start +
        (S.explores.length < total ? ". <b>Jamais découvertes</b> : " + Object.keys(S.spec.nodes).filter(function (n) { return !S.vus[n]; }).join(", ") + " (aucun lien n'y mène depuis " + S.start + ")." : ". Toutes les pages sont atteintes.")
      : "Prochaine page explorée : <b>" + nxt + "</b> (" + (pile ? "la dernière ajoutée" : "la plus ancienne") + ").";
    var h = "";
    S.rows.forEach(function (r, i) {
      h += "<tr><td>" + (i + 1) + "</td><td><b>" + r.s + "</b> <span style='color:var(--muted)'>(liens : " + (r.liens.join(", ") || "aucun") + ")</span></td><td>" +
        (r.nouvelles.join(", ") || "—") + "</td><td>" + (r.apres.join(", ") || "(vide)") + "</td></tr>";
    });
    $("ex-table").querySelector("tbody").innerHTML = h;
  }

  function reset() {
    S = build();
    S.handle = GV.render($("ex-svg"), S.spec, {});
    refresh();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("ex-svg")) return;
    Object.keys(GV.data.wiki.nodes).forEach(function (n) {
      var o = document.createElement("option"); o.value = n; o.textContent = "Page " + n; $("ex-start").appendChild(o);
    });
    $("ex-start").value = "B";
    $("ex-start").addEventListener("change", reset);
    $("ex-mode").addEventListener("change", reset);
    $("ex-reset").addEventListener("click", reset);
    $("ex-next").addEventListener("click", function () { step(); refresh(); });
    $("ex-all").addEventListener("click", function () { while (S.aExplorer.length) step(); refresh(); });
    reset();
  });
})();
