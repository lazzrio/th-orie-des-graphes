/* Atelier Dijkstra : exécution pas à pas (tableau M / dp / P), arborescence des plus courts chemins,
   comparaison avec un BFS qui marque à la première découverte. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var INF = Infinity;
  var GRAPHES = {
    dij: { nom: "Exercice 9 (orienté)", depart: "B", cible: "F" },
    dijbfs: { nom: "Contre-exemple du BFS (orienté)", depart: "A", cible: "D" },
    dijg3: { nom: "Réseau non orienté (7 sommets)", depart: "S", cible: "T" }
  };
  var S = null;

  function sub(n) { return n; }

  function adjacence(spec) {
    var succ = {};
    Object.keys(spec.nodes).forEach(function (n) { succ[n] = []; });
    spec.edges.forEach(function (e) {
      var w = e[2] && e[2].w != null ? e[2].w : 1;
      succ[e[0]].push({ to: e[1], w: w });
      if (!spec.directed && e[0] !== e[1]) succ[e[1]].push({ to: e[0], w: w });
    });
    return succ;
  }

  function fmt(d) { return d === INF ? "∞" : String(d); }

  function build() {
    var g = $("dj-graph").value, spec = GV.data[g], ids = Object.keys(spec.nodes).sort();
    var s0 = $("dj-start").value;
    var st = { g: g, spec: spec, ids: ids, succ: adjacence(spec), s0: s0, M: {}, dp: {}, P: {}, etape: 0, rows: [], log: [], fini: false, smin: null };
    ids.forEach(function (n) { st.dp[n] = INF; st.P[n] = null; st.M[n] = false; });
    st.dp[s0] = 0;
    st.rows.push(snap(st, null, []));
    st.log.push("Étape 0 : d<sub>p</sub>(" + s0 + ") = 0, tous les autres sommets à ∞. Aucun sommet marqué.");
    return st;
  }

  function snap(st, smin, changes) {
    return { etape: st.etape, smin: smin, M: Object.assign({}, st.M), dp: Object.assign({}, st.dp), P: Object.assign({}, st.P), ch: changes.slice() };
  }

  function step(st) {
    if (st.fini) return;
    var smin = null;
    st.ids.forEach(function (n) { if (!st.M[n] && st.dp[n] < INF && (smin === null || st.dp[n] < st.dp[smin])) smin = n; });
    if (smin === null) { st.fini = true; return; }
    st.M[smin] = true; st.etape++; st.smin = smin;
    var changes = [], txt = [];
    st.succ[smin].forEach(function (a) {
      if (st.M[a.to]) { txt.push(a.to + " est marqué : ignoré"); return; }
      var nd = st.dp[smin] + a.w;
      if (nd < st.dp[a.to]) {
        txt.push(a.to + " : " + st.dp[smin] + " + " + a.w + " = " + nd + " &lt; " + fmt(st.dp[a.to]) + " → <b>" + nd + "</b> (parent " + smin + ")");
        st.dp[a.to] = nd; st.P[a.to] = smin; changes.push(a.to);
      } else txt.push(a.to + " : " + st.dp[smin] + " + " + a.w + " = " + nd + " ≥ " + fmt(st.dp[a.to]) + " : pas de mise à jour");
    });
    st.log.push("Étape " + st.etape + " : on marque <b>" + smin + "</b> (d<sub>p</sub> = " + st.dp[smin] + "). " + (txt.length ? txt.join(" ; ") + "." : "Aucun successeur."));
    st.rows.push(snap(st, smin, changes));
    var reste = st.ids.some(function (n) { return !st.M[n] && st.dp[n] < INF; });
    if (!reste) st.fini = true;
  }

  function cheminVers(st, x) {
    if (st.dp[x] === INF) return null;
    var c = [];
    for (var y = x; y != null; y = st.P[y]) c.unshift(y);
    return c;
  }

  function complet(g, s0) { // exécution complète, sans affichage
    var save = { g: $("dj-graph").value, s: $("dj-start").value };
    var spec = GV.data[g];
    var st = { g: g, spec: spec, ids: Object.keys(spec.nodes).sort(), succ: adjacence(spec), s0: s0, M: {}, dp: {}, P: {}, etape: 0, rows: [], log: [], fini: false };
    st.ids.forEach(function (n) { st.dp[n] = INF; st.P[n] = null; st.M[n] = false; });
    st.dp[s0] = 0;
    var guard = 0;
    while (!st.fini && guard++ < 1000) step(st);
    return st;
  }

  function bfs(st, t) { // BFS classique : on marque à la première découverte
    var parent = {}; parent[st.s0] = null;
    var file = [st.s0];
    while (file.length) {
      var s = file.shift();
      if (s === t) break;
      st.succ[s].forEach(function (a) { if (!(a.to in parent)) { parent[a.to] = s; file.push(a.to); } });
    }
    if (!(t in parent)) return null;
    var c = []; for (var y = t; y != null; y = parent[y]) c.unshift(y);
    return c;
  }

  function poids(st, c) {
    var tot = 0;
    for (var i = 0; i + 1 < c.length; i++) {
      var w = null;
      st.succ[c[i]].forEach(function (a) { if (a.to === c[i + 1] && (w === null || a.w < w)) w = a.w; });
      tot += w;
    }
    return tot;
  }

  function refresh() {
    var last = S.rows[S.rows.length - 1];
    var hl = [];
    if ($("dj-arbo").checked) Object.keys(S.P).forEach(function (n) { if (S.P[n] != null) hl.push(S.P[n] + "-" + n); });
    S.handle = GV.render($("dj-svg"), S.spec, { hl: hl });
    var colors = {}, badges = {};
    S.ids.forEach(function (n) {
      if (S.M[n]) colors[n] = 1; else if (S.dp[n] < INF) colors[n] = 3;
      if (S.dp[n] < INF) badges[n] = S.dp[n];
    });
    S.handle.setColors(colors);
    S.handle.setBadges(badges);
    var nxt = null;
    if (!S.fini) S.ids.forEach(function (n) { if (!S.M[n] && S.dp[n] < INF && (nxt === null || S.dp[n] < S.dp[nxt])) nxt = n; });
    S.handle.setCur(nxt);
    $("dj-next").disabled = S.fini; $("dj-all").disabled = S.fini;
    var marq = S.ids.filter(function (n) { return S.M[n]; }).length;
    $("dj-stats").innerHTML = "<div><b>" + marq + " / " + S.ids.length + "</b>sommets marqués</div><div><b>" + S.etape + "</b>étapes</div>";
    $("dj-verdict").innerHTML = S.fini
      ? "Terminé : " + marq + " sommet(s) atteint(s) depuis " + S.s0 + (marq < S.ids.length ? " (les autres sont inaccessibles, distance ∞)." : ".")
      : "Prochain sommet marqué : <b>" + nxt + "</b> (plus petite distance provisoire non marquée : " + S.dp[nxt] + ").";
    // tableau
    var h = "<tr><th>Étape</th>" + S.ids.map(function (n) { return "<th>" + sub(n) + "</th>"; }).join("") + "</tr>";
    S.rows.forEach(function (r) {
      h += "<tr><th>" + r.etape + "</th>" + S.ids.map(function (n) {
        var cls = [];
        if (r.M[n]) cls.push("mk"); if (r.ch.indexOf(n) >= 0) cls.push("one");
        if (r.smin === n) cls.push("sm");
        return "<td class='" + cls.join(" ") + "'>" + fmt(r.dp[n]) + (r.P[n] != null ? " <span class='pp2'>" + r.P[n] + "</span>" : "") + "</td>";
      }).join("") + "</tr>";
    });
    $("dj-table").innerHTML = h;
    $("dj-log").innerHTML = S.log.map(function (l, i) { return "<div" + (i === S.log.length - 1 && !S.fini ? " class='now'" : "") + ">" + l + "</div>"; }).join("");
    $("dj-log").scrollTop = 1e6;
    // chemins
    var out = "";
    if (S.fini) {
      S.ids.forEach(function (n) {
        if (n === S.s0) return;
        var c = cheminVers(S, n);
        out += "<div>" + n + " : " + (c ? c.join(" → ") + " (longueur " + S.dp[n] + ")" : "inaccessible") + "</div>";
      });
    }
    $("dj-chemins").innerHTML = out || "<span style='color:var(--muted)'>Les chemins s'affichent à la fin de l'exécution.</span>";
  }

  function comparer() {
    var t = $("dj-cible").value, ref = complet(S.g, S.s0);
    var cb = bfs(ref, t), cd = cheminVers(ref, t);
    if (!cd) { $("dj-bfs").innerHTML = "<b>" + t + "</b> n'est pas accessible depuis " + S.s0 + "."; return; }
    var pb = poids(ref, cb), pd = ref.dp[t];
    $("dj-bfs").innerHTML = "<div><b>BFS</b> (marque à la 1<sup>re</sup> découverte) : " + cb.join(" → ") + " — " + (cb.length - 1) + " arc(s), longueur pondérée <b>" + pb + "</b></div>" +
      "<div><b>Dijkstra</b> : " + cd.join(" → ") + " — " + (cd.length - 1) + " arc(s), longueur pondérée <b>" + pd + "</b></div>" +
      "<div style='margin-top:6px;font-weight:600'>" + (pb === pd ? "Même longueur pondérée ici." : "Le BFS se trompe de " + (pb - pd) + " : il a le moins d'arcs mais pas le plus léger.") + "</div>";
  }

  function remplirSelects() {
    var spec = GV.data[$("dj-graph").value], ids = Object.keys(spec.nodes).sort();
    ["dj-start", "dj-cible"].forEach(function (id) {
      var s = $(id); s.innerHTML = "";
      ids.forEach(function (n) { var o = document.createElement("option"); o.value = n; o.textContent = "Sommet " + n; s.appendChild(o); });
    });
    var d = GRAPHES[$("dj-graph").value];
    $("dj-start").value = d.depart; $("dj-cible").value = d.cible;
  }

  function reset() {
    S = build();
    $("dj-bfs").innerHTML = "<span style='color:var(--muted)'>Choisis une cible puis « Comparer avec le BFS ».</span>";
    refresh();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("dj-svg")) return;
    Object.keys(GRAPHES).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = GRAPHES[k].nom; $("dj-graph").appendChild(o);
    });
    remplirSelects();
    $("dj-graph").addEventListener("change", function () { remplirSelects(); reset(); });
    $("dj-start").addEventListener("change", reset);
    $("dj-reset").addEventListener("click", reset);
    $("dj-arbo").addEventListener("change", refresh);
    $("dj-next").addEventListener("click", function () { step(S); refresh(); });
    $("dj-all").addEventListener("click", function () { var g = 0; while (!S.fini && g++ < 1000) step(S); refresh(); });
    $("dj-cmp").addEventListener("click", comparer);
    reset();
  });
})();
