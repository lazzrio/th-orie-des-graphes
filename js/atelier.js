/* Atelier de coloration : exécute pas à pas l'algorithme séquentiel (ordre naturel, degré décroissant, DSATUR, ordre manuel). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var S = null; // état courant

  function sub(id) { var m = /^([A-Za-z]+)(\d+)$/.exec(id); return m ? m[1] + "<sub>" + m[2] + "</sub>" : id; }
  function name(spec, id) { return (spec.labels && spec.labels[id]) || (spec.sub ? sub(id) : id); }

  function build(key) {
    var spec = GV.data[key];
    var ids = Object.keys(spec.nodes), nb = {};
    ids.forEach(function (i) { nb[i] = []; });
    spec.edges.forEach(function (e) {
      if (e[0] === e[1]) return;
      if (nb[e[0]].indexOf(e[1]) < 0) nb[e[0]].push(e[1]);
      if (nb[e[1]].indexOf(e[0]) < 0) nb[e[1]].push(e[0]);
    });
    return { key: key, spec: spec, ids: ids, nb: nb, color: {}, step: 0, order: [], log: [] };
  }

  function chi(st) { // recherche exhaustive (petits graphes)
    var ids = st.ids.slice().sort(function (a, b) { return st.nb[b].length - st.nb[a].length; });
    var col = {};
    function ok(v, c) { return st.nb[v].every(function (u) { return col[u] !== c; }); }
    function bt(i, k) {
      if (i === ids.length) return true;
      var v = ids[i];
      for (var c = 0; c < k; c++) {
        if (!ok(v, c)) continue;
        col[v] = c;
        if (bt(i + 1, k)) return true;
        delete col[v];
      }
      return false;
    }
    for (var k = 1; k <= ids.length; k++) { col = {}; if (bt(0, k)) return k; }
    return ids.length;
  }

  function planOrder() {
    var mode = $("at-mode").value, ids = S.ids.slice();
    if (mode === "degre" || mode === "wp") {
      ids = ids.map(function (v, i) { return [v, i]; }).sort(function (a, b) {
        return S.nb[b[0]].length - S.nb[a[0]].length || a[1] - b[1];
      }).map(function (x) { return x[0]; });
    }
    S.order = (mode === "naturel" || mode === "degre" || mode === "wp") ? ids : [];
    S.wpSeq = null;
    if (mode === "wp") {  // Welsh-Powell : une couleur à la fois, remplie au maximum
      S.wpSeq = [];
      var tmp = {}, restants = ids.length, c = 0;
      while (restants > 0) {
        var first = true;
        ids.forEach(function (v) {
          if (tmp[v] == null && S.nb[v].every(function (u) { return tmp[u] !== c; })) {
            tmp[v] = c; S.wpSeq.push({ v: v, c: c, first: first }); restants--; first = false;
          }
        });
        c++;
      }
    }
  }

  function pickDsatur() {
    var best = null, bs = -1, bd = -1;
    S.ids.forEach(function (v) {
      if (S.color[v] != null) return;
      var seen = {}, n = 0;
      S.nb[v].forEach(function (u) { if (S.color[u] != null && !seen[S.color[u]]) { seen[S.color[u]] = 1; n++; } });
      var d = S.nb[v].length;
      if (n > bs || (n === bs && d > bd)) { best = v; bs = n; bd = d; }
    });
    return best;
  }

  function colorVertexWP(e) {
    S.color[e.v] = e.c; S.step++;
    S.log.push((e.first ? "<i>Nouvelle couleur " + (e.c + 1) + "</i> — " : "") + "<b>" + name(S.spec, e.v) + "</b> (deg " + S.nb[e.v].length +
      ") : aucun voisin dans la couleur " + (e.c + 1) + " → reçoit la couleur <b>" + (e.c + 1) + "</b>");
  }

  function colorVertex(v) {
    if (S.wpSeq) { colorVertexWP(S.wpSeq[S.step]); return; }
    var used = [];
    S.nb[v].forEach(function (u) { if (S.color[u] != null && used.indexOf(S.color[u]) < 0) used.push(S.color[u]); });
    used.sort(function (a, b) { return a - b; });
    var c = 0; while (used.indexOf(c) >= 0) c++;
    S.color[v] = c; S.step++;
    var nbc = S.nb[v].filter(function (u) { return S.color[u] != null && u !== v; }).map(function (u) { return name(S.spec, u) + "→" + (S.color[u] + 1); });
    S.log.push("<b>" + name(S.spec, v) + "</b> (deg " + S.nb[v].length + ") : voisins déjà colorés " + (nbc.length ? "{" + nbc.join(", ") + "}" : "aucun") +
      " → couleurs interdites {" + used.map(function (x) { return x + 1; }).join(", ") + "} → plus petite libre = <b>" + (c + 1) + "</b>");
    return c;
  }

  function nextVertex() {
    var mode = $("at-mode").value;
    if (mode === "wp") return S.wpSeq[S.step] ? S.wpSeq[S.step].v : null;
    if (mode === "dsatur") return pickDsatur();
    if (mode === "manuel") return null;
    return S.order[S.step] || null;
  }

  function refresh() {
    S.handle.setColors(S.color);
    var mode = $("at-mode").value, done = S.step >= S.ids.length;
    $("at-next").disabled = done || mode === "manuel";
    $("at-all").disabled = done || mode === "manuel";
    var nxt = !done ? nextVertex() : null;
    S.handle.setCur(nxt);
    var h = "";
    if (mode === "wp") h = "Welsh-Powell : sommets triés par degré décroissant (" + S.order.map(function (v) { return name(S.spec, v); }).join(", ") + "). On remplit une couleur au maximum, puis on passe à la suivante.";
    else if (mode === "naturel" || mode === "degre") h = "Ordre de traitement : " + S.order.map(function (v) { return name(S.spec, v); }).join(" → ");
    else if (mode === "dsatur") h = "DSATUR : à chaque étape on choisit le sommet non coloré dont les voisins portent le plus de couleurs différentes (égalité : plus grand degré).";
    else h = "Mode manuel : cliquez sur les sommets dans l'ordre de votre choix, chacun reçoit la plus petite couleur libre.";
    var lg = S.log.map(function (l, i) { return "<div" + (i === S.log.length - 1 && !done ? " class='now'" : "") + ">" + (i + 1) + ". " + l + "</div>"; }).join("");
    $("at-log").innerHTML = "<div style='color:var(--muted)'>" + h + "</div>" + lg;
    $("at-log").scrollTop = 1e6;
    var used = 0; S.ids.forEach(function (v) { if (S.color[v] != null) used = Math.max(used, S.color[v] + 1); });
    var leg = ""; for (var i = 0; i < used; i++) leg += "<span><i style='background:var(--c" + (i % 6) + "f);border-color:var(--c" + (i % 6) + "s)'></i>couleur " + (i + 1) + "</span>";
    $("at-legend").innerHTML = leg;
    var stat = "<div><b>" + S.step + " / " + S.ids.length + "</b>sommets colorés</div><div><b>" + used + "</b>couleurs utilisées</div>";
    if (done) {
      if (S.chi == null) S.chi = chi(S);
      stat += "<div><b>" + S.chi + "</b>χ(G) (recherche exhaustive)</div>";
      var msg = used === S.chi ? "✅ Coloration optimale : " + used + " couleur(s) = χ(G)." : "⚠️ Coloration propre mais <b>non optimale</b> : " + used + " couleurs alors que χ(G) = " + S.chi + ".";
      $("at-verdict").innerHTML = msg;
    } else $("at-verdict").innerHTML = "";
    $("at-stats").innerHTML = stat;
  }

  function reset() {
    S = build($("at-graph").value);
    planOrder();
    S.handle = GV.render($("at-svg"), S.spec, { onNode: onNode });
    refresh();
  }

  function onNode(v) {
    if ($("at-mode").value !== "manuel" || S.color[v] != null) return;
    colorVertex(v); refresh();
  }

  function step() {
    var v = nextVertex(); if (!v) return;
    colorVertex(v); refresh();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("at-svg")) return;
    $("at-graph").addEventListener("change", reset);
    $("at-mode").addEventListener("change", reset);
    $("at-reset").addEventListener("click", reset);
    $("at-next").addEventListener("click", step);
    $("at-all").addEventListener("click", function () { while (S.step < S.ids.length && nextVertex()) { colorVertex(nextVertex()); } refresh(); });
    reset();
  });
})();
