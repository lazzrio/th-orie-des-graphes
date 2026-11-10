/* Atelier d'exploration : parcours pas à pas (file = largeur, pile = profondeur) sur plusieurs graphes,
   avec mémorisation des parents (arborescence de parcours) et reconstruction d'un chemin. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var GRAPHES = {
    wiki: { nom: "Mini wiki (activité 6)", depart: "B", cible: "I" },
    ex7: { nom: "Exercice 7", depart: "C", cible: "I" },
    connexite: { nom: "connexite.txt (non orienté)", depart: "A", cible: "D" }
  };
  var S = null;

  function build() {
    var g = $("ex-graph").value, spec = GV.data[g], succ = {};
    Object.keys(spec.nodes).forEach(function (n) { succ[n] = []; });
    spec.edges.forEach(function (e) {
      succ[e[0]].push(e[1]);
      if (!spec.directed) succ[e[1]].push(e[0]);
    });
    Object.keys(succ).forEach(function (n) { succ[n].sort(); });   // successeurs dans l'ordre alphabétique
    var start = $("ex-start").value;
    var vus = {}; vus[start] = true;
    var parent = {}; parent[start] = null;
    return { g: g, spec: spec, succ: succ, start: start, vus: vus, parent: parent, aExplorer: [start], explores: [], rows: [] };
  }

  function step() {
    if (!S.aExplorer.length) return;
    var pile = $("ex-mode").value === "pile";
    var s = pile ? S.aExplorer.pop() : S.aExplorer.shift();
    S.explores.push(s);
    var nouvelles = [];
    S.succ[s].forEach(function (t) {
      if (!S.vus[t]) { S.vus[t] = true; S.parent[t] = s; S.aExplorer.push(t); nouvelles.push(t); }
    });
    S.rows.push({ s: s, liens: S.succ[s].slice(), nouvelles: nouvelles, apres: S.aExplorer.slice() });
  }

  function chemin(x) {
    if (!S.vus[x]) return null;
    var c = [];
    while (x != null) { c.unshift(x); x = S.parent[x]; }   // on remonte les parents jusqu'à la racine
    return c;
  }

  function refresh() {
    var hl = [];
    Object.keys(S.parent).forEach(function (n) { if (S.parent[n] != null) hl.push(S.parent[n] + "-" + n); });
    S.handle = GV.render($("ex-svg"), S.spec, { hl: $("ex-arbo").checked ? hl : [] });
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
    $("ex-stats").innerHTML = "<div><b>" + S.explores.length + " / " + total + "</b>sommets explorés</div><div><b>" + S.aExplorer.length + "</b>découverts non explorés</div>";
    $("ex-verdict").innerHTML = done
      ? "Exploration terminée : " + S.explores.length + " sommet(s) atteignable(s) depuis " + S.start +
        (S.explores.length < total ? ". <b>Jamais découverts</b> : " + Object.keys(S.spec.nodes).filter(function (n) { return !S.vus[n]; }).sort().join(", ") +
          (S.spec.directed ? " (aucun chemin n'y mène depuis " + S.start + ")." : " (autres composantes connexes).") : ". Tous les sommets sont atteints.")
      : "Prochain sommet exploré : <b>" + nxt + "</b> (" + (pile ? "le dernier ajouté" : "le plus ancien") + ").";
    var cible = $("ex-cible").value, c = chemin(cible);
    $("ex-chemin").innerHTML = cible === S.start ? "C'est le sommet de départ."
      : c ? "Chemin reconstruit avec les parents : <b>" + c.join(" → ") + "</b> (" + (c.length - 1) + " arc" + (c.length > 2 ? "s" : "") + ")."
      : done ? cible + " n'est pas atteignable depuis " + S.start + " : liste vide." : cible + " n'est pas encore découvert.";
    var noms = Object.keys(S.spec.nodes).sort();
    $("ex-parents").innerHTML = "<tr><th>Sommet</th>" + noms.map(function (n) { return "<th>" + n + "</th>"; }).join("") + "</tr><tr><th>Parent</th>" +
      noms.map(function (n) { return "<td>" + (n === S.start ? "aucun" : S.parent[n] || "—") + "</td>"; }).join("") + "</tr>";
    var h = "";
    S.rows.forEach(function (r, i) {
      h += "<tr><td>" + (i + 1) + "</td><td><b>" + r.s + "</b> <span style='color:var(--muted)'>(successeurs : " + (r.liens.join(", ") || "aucun") + ")</span></td><td>" +
        (r.nouvelles.join(", ") || "—") + "</td><td>" + (r.apres.join(", ") || "(vide)") + "</td></tr>";
    });
    $("ex-table").querySelector("tbody").innerHTML = h;
  }

  function reset() { S = build(); refresh(); }

  function remplirSommets() {
    var g = $("ex-graph").value, noms = Object.keys(GV.data[g].nodes).sort();
    ["ex-start", "ex-cible"].forEach(function (id) {
      $(id).innerHTML = noms.map(function (n) { return "<option value='" + n + "'>" + n + "</option>"; }).join("");
    });
    $("ex-start").value = GRAPHES[g].depart;
    $("ex-cible").value = GRAPHES[g].cible;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("ex-svg")) return;
    $("ex-graph").innerHTML = Object.keys(GRAPHES).map(function (k) { return "<option value='" + k + "'>" + GRAPHES[k].nom + "</option>"; }).join("");
    remplirSommets();
    $("ex-graph").addEventListener("change", function () { remplirSommets(); reset(); });
    $("ex-start").addEventListener("change", reset);
    $("ex-mode").addEventListener("change", reset);
    $("ex-reset").addEventListener("click", reset);
    $("ex-arbo").addEventListener("change", refresh);
    $("ex-cible").addEventListener("change", refresh);
    $("ex-next").addEventListener("click", function () { step(); refresh(); });
    $("ex-all").addEventListener("click", function () { while (S.aExplorer.length) step(); refresh(); });
    reset();
  });
})();
