/* Rendu SVG des graphes et des diagrammes de classes + jeux de données des figures. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function norm(x, y) { var l = Math.hypot(x, y) || 1; return [x / l, y / l]; }

  /* ---------- graphes ---------- */
  function render(host, spec, opts) {
    opts = opts || {};
    var R = spec.r || 17, W = spec.w, H = spec.h, id = ++uid;
    host.innerHTML = "";
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "gsvg", role: "img", "aria-label": spec.alt || "graphe" }, host);
    var defs = el("defs", {}, svg);
    ["", "hot"].forEach(function (h) {
      var m = el("marker", { id: "ah" + h + id, viewBox: "0 0 10 10", refX: "9.5", refY: "5", markerWidth: "8", markerHeight: "8", orient: "auto" }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", "class": "ar" + (h ? " hot" : "") }, m);
    });
    var hotE = {}, hotN = {};
    (opts.hl || spec.hl || []).forEach(function (p) { hotE[p] = hotE[p.split("-").reverse().join("-")] = true; });
    (opts.hln || spec.hln || []).forEach(function (n) { hotN[n] = true; });
    var colors = opts.colors || spec.colors || {};
    var badgeTxt = {};
    if (opts.order) { colors = {}; opts.order.forEach(function (n, i) { colors[n] = 1; badgeTxt[n] = String(i + 1); }); }
    var pos = spec.nodes, directed = !!spec.directed;

    // regroupement des arêtes entre une même paire de sommets
    var groups = {};
    spec.edges.forEach(function (e, i) {
      var key = [e[0], e[1]].sort().join("|");
      (groups[key] = groups[key] || []).push(i);
    });
    var loopCount = {};
    var edgeEls = [];
    spec.edges.forEach(function (e, i) {
      var a = e[0], b = e[1], o = e[2] || {};
      var A = pos[a], B = pos[b];
      var hot = hotE[a + "-" + b] || o.hot;
      var cls = "e" + (hot ? " hot" : "") + (o.dash ? " dash" : "");
      var mk = directed ? "url(#ah" + (hot ? "hot" : "") + id + ")" : null;
      var d, lx, ly;
      if (a === b) {
        var k = loopCount[a] = (loopCount[a] || 0) + 1;
        var th = ((o.angle != null ? o.angle : (spec.loops && spec.loops[a] != null ? spec.loops[a] : -90)) + (k - 1) * 40) * Math.PI / 180;
        var rr = R + 34 + (k - 1) * 8;
        var P = function (ang, rad) { return [A[0] + rad * Math.cos(ang), A[1] + rad * Math.sin(ang)]; };
        var p0 = P(th - 0.42, R), p3 = P(th + 0.42, R), c1 = P(th - 0.62, rr), c2 = P(th + 0.62, rr);
        d = "M" + p0 + " C" + c1 + " " + c2 + " " + p3;
        var lp = P(th, R + 26 + (k - 1) * 8); lx = lp[0]; ly = lp[1];
      } else {
        var g = groups[[a, b].sort().join("|")];
        var idx = g.indexOf(i), n = g.length;
        var dx = B[0] - A[0], dy = B[1] - A[1], u = norm(dx, dy), nv = [-u[1], u[0]];
        var off = 0;
        if (o.c != null) off = 2 * o.c;
        else if (n > 1) {
          // sens canonique (a<b) : un arc a>b a une normale opposée, on inverse le décalage
          off = (a < b ? 1 : -1) * ((idx - (n - 1) / 2) * 34);
        }
        if (Math.abs(off) < 0.01) {
          var s = [A[0] + u[0] * R, A[1] + u[1] * R], t = [B[0] - u[0] * R, B[1] - u[1] * R];
          d = "M" + s + " L" + t; lx = (s[0] + t[0]) / 2; ly = (s[1] + t[1]) / 2;
        } else {
          var mid = [(A[0] + B[0]) / 2 + nv[0] * off, (A[1] + B[1]) / 2 + nv[1] * off];
          var ua = norm(mid[0] - A[0], mid[1] - A[1]), ub = norm(mid[0] - B[0], mid[1] - B[1]);
          var s2 = [A[0] + ua[0] * R, A[1] + ua[1] * R], t2 = [B[0] + ub[0] * R, B[1] + ub[1] * R];
          d = "M" + s2 + " Q" + mid + " " + t2;
          lx = 0.25 * s2[0] + 0.5 * mid[0] + 0.25 * t2[0]; ly = 0.25 * s2[1] + 0.5 * mid[1] + 0.25 * t2[1];
        }
      }
      var path = el("path", { d: d, "class": cls }, svg);
      if (mk) path.setAttribute("marker-end", mk);
      if (o.l) { var t = el("text", { x: lx, y: ly + 4, "class": "lb" }, svg); t.textContent = o.l; }
      edgeEls.push({ el: path, a: a, b: b });
    });

    var nodeEls = {};
    Object.keys(pos).forEach(function (nm) {
      var p = pos[nm];
      var g = el("g", { "class": "nd" + (colors[nm] != null ? " c" + (colors[nm] % 6) : "") + (hotN[nm] ? " hot" : ""), "data-id": nm }, svg);
      el("circle", { cx: p[0], cy: p[1], r: R }, g);
      var t = el("text", { x: p[0], y: p[1] }, g);
      var lab = (spec.labels && spec.labels[nm]) || nm;
      var m = spec.sub && /^([A-Za-z]+)(\d+)$/.exec(lab);
      if (m) {
        t.appendChild(document.createTextNode(m[1]));
        var ts = el("tspan", { dy: "4", "font-size": "9" }, t); ts.textContent = m[2];
      } else t.textContent = lab;
      if (opts.onNode) { g.classList.add("clk"); g.addEventListener("click", function () { opts.onNode(nm); }); }
      var bd = el("g", { "class": "bd" + (colors[nm] != null && colors[nm] >= 0 ? "" : " off") }, g);
      el("circle", { cx: p[0] + R * 0.78, cy: p[1] - R * 0.78, r: 7 }, bd);
      var bt = el("text", { x: p[0] + R * 0.78, y: p[1] - R * 0.78 }, bd);
      bt.textContent = badgeTxt[nm] != null ? badgeTxt[nm] : (colors[nm] != null && colors[nm] >= 0 ? String(colors[nm] + 1) : "");
      nodeEls[nm] = g;
    });
    if (spec.caption) { var c = el("text", { x: W / 2, y: H - 4, "class": "cap" }, svg); c.textContent = spec.caption; }
    return {
      svg: svg, nodes: nodeEls, edges: edgeEls,
      setColors: function (map) {
        Object.keys(nodeEls).forEach(function (n) {
          var cl = nodeEls[n].classList;
          for (var i = 0; i < 8; i++) cl.remove("c" + i);
          if (map[n] != null && map[n] >= 0) cl.add("c" + (map[n] % 6));
          var b = nodeEls[n].querySelector(".bd");
          if (b) { b.classList.toggle("off", !(map[n] != null && map[n] >= 0)); b.querySelector("text").textContent = map[n] != null && map[n] >= 0 ? String(map[n] + 1) : ""; }
        });
      },
      setBadges: function (map) {
        Object.keys(nodeEls).forEach(function (n) {
          var b = nodeEls[n].querySelector(".bd"); if (!b) return;
          b.classList.toggle("off", map[n] == null);
          b.querySelector("text").textContent = map[n] == null ? "" : String(map[n]);
        });
      },
      setCur: function (n) { Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.toggle("cur", k === n); }); }
    };
  }

  /* ---------- diagrammes de classes ---------- */
  function uml(host, spec) {
    var svg = el("svg", { viewBox: "0 0 " + spec.w + " " + spec.h, "class": "usvg", role: "img", "aria-label": spec.alt || "diagramme de classes" }, host);
    var box = {};
    spec.classes.forEach(function (c) {
      var w = c.w || 130, h = 28 + (c.attrs && c.attrs.length ? c.attrs.length * 17 + 8 : 12);
      box[c.id] = { x: c.x, y: c.y, w: w, h: h };
      var g = el("g", { "class": "cl" }, svg);
      el("rect", { x: c.x, y: c.y, width: w, height: h, rx: 2 }, g);
      el("line", { x1: c.x, y1: c.y + 26, x2: c.x + w, y2: c.y + 26 }, g);
      var t = el("text", { x: c.x + w / 2, y: c.y + 18, "class": "h" }, g); t.textContent = c.name;
      (c.attrs || []).forEach(function (a, i) {
        var ta = el("text", { x: c.x + 8, y: c.y + 26 + 16 + i * 17, "class": "a" }, g); ta.textContent = a;
      });
    });
    function ctr(b) { return [b.x + b.w / 2, b.y + b.h / 2]; }
    function clip(b, from, to) { // intersection du segment centre(b)->to avec le rectangle b
      var c = ctr(b), dx = to[0] - c[0], dy = to[1] - c[1];
      var sx = dx ? (b.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (b.h / 2) / Math.abs(dy) : Infinity;
      var s = Math.min(sx, sy);
      return [c[0] + dx * s, c[1] + dy * s];
    }
    spec.rels.forEach(function (r) {
      var A = box[r.a], B = box[r.b], pts;
      if (r.a === r.b) {
        pts = [[A.x + A.w, A.y + 10], [A.x + A.w + 50, A.y + 10], [A.x + A.w + 50, A.y + A.h - 8], [A.x + A.w, A.y + A.h - 8]];
      } else {
        var mid = r.pts || [];
        var first = mid.length ? mid[0] : ctr(B), last = mid.length ? mid[mid.length - 1] : ctr(A);
        pts = [clip(A, null, first)].concat(mid).concat([clip(B, null, last)]);
      }
      el("polyline", { points: pts.map(function (p) { return p.join(","); }).join(" "), "class": "rl" + (r.dashed ? " d" : "") }, svg);
      var p0 = pts[0], p1 = pts[1], q0 = pts[pts.length - 1], q1 = pts[pts.length - 2];
      function deco(type, p, q) { // p = pointe, q = point précédent
        var u = norm(q[0] - p[0], q[1] - p[1]), n = [-u[1], u[0]], L = 14, Wd = 6;
        var a = [p[0] + u[0] * L + n[0] * Wd, p[1] + u[1] * L + n[1] * Wd];
        var b = [p[0] + u[0] * L - n[0] * Wd, p[1] + u[1] * L - n[1] * Wd];
        if (type === "comp" || type === "agg") {
          var c = [p[0] + u[0] * 2 * L, p[1] + u[1] * 2 * L];
          el("polygon", { points: [p, a, c, b].join(" "), "class": "hd" + (type === "comp" ? " f" : "") }, svg);
        } else if (type === "gen") {
          el("polygon", { points: [p, a, b].join(" "), "class": "hd" }, svg);
        } else if (type === "arrow") {
          el("polyline", { points: [a, p, b].join(" "), "class": "rl" }, svg);
        }
      }
      if (r.da) deco(r.da, p0, p1);
      if (r.db) deco(r.db, q0, q1);
      function txt(s, p, q, side) {
        if (!s) return;
        var u = norm(q[0] - p[0], q[1] - p[1]), n = [-u[1], u[0]];
        var x = p[0] + u[0] * 16 + n[0] * 12 * side, y = p[1] + u[1] * 16 + n[1] * 12 * side;
        var t = el("text", { x: x - 4, y: y + 4, "class": "rt" }, svg); t.textContent = s;
      }
      txt(r.ma, p0, p1, r.sa || 1);
      txt(r.mb, q0, q1, r.sb || 1);
      if (r.label) {
        var mi = Math.floor((pts.length - 1) / 2), pa = pts[mi], pb = pts[mi + 1];
        var t = el("text", { x: (pa[0] + pb[0]) / 2 + (r.lx || 0), y: (pa[1] + pb[1]) / 2 - 6 + (r.ly || 0), "class": "rt", "text-anchor": "middle" }, svg);
        t.textContent = r.label;
      }
    });
    return svg;
  }

  /* ---------- jeux de données ---------- */
  function circle(ids, cx, cy, rad, start) {
    var o = {}, n = ids.length;
    ids.forEach(function (id, i) {
      var a = (start == null ? -90 : start) * Math.PI / 180 + 2 * Math.PI * i / n;
      o[id] = [Math.round(cx + rad * Math.cos(a)), Math.round(cy + rad * Math.sin(a))];
    });
    return o;
  }
  function complete(n) {
    var ids = []; for (var i = 1; i <= n; i++) ids.push("K" + n + "_" + i);
    var nodes = circle(ids, 80, 75, n === 2 ? 40 : 52), edges = [], labels = {};
    ids.forEach(function (a, i) { labels[a] = String(i + 1); for (var j = i + 1; j < n; j++) edges.push([a, ids[j]]); });
    if (n === 2) { nodes[ids[0]] = [40, 75]; nodes[ids[1]] = [120, 75]; }
    return { w: 160, h: 150, nodes: nodes, edges: edges, labels: labels, r: 13 };
  }

  var D = {};
  D.g1 = { w: 420, h: 230, sub: true, nodes: { s1: [130, 50], s3: [270, 50], s2: [50, 115], s4: [130, 170], s5: [270, 170], s6: [370, 170] },
    edges: [["s1", "s2"], ["s1", "s3"], ["s1", "s5"], ["s2", "s4"], ["s2", "s6", { c: 75 }], ["s3", "s4"], ["s5", "s6"]] };
  D.g1b = { w: 400, h: 230, sub: true, nodes: { s1: [40, 120], s3: [120, 55], s4: [260, 55], s2: [120, 185], s6: [270, 185], s5: [360, 120] },
    edges: [["s1", "s2"], ["s1", "s3"], ["s1", "s5"], ["s2", "s4"], ["s2", "s6"], ["s3", "s4"], ["s5", "s6"]] };
  D.g2 = { w: 340, h: 230, directed: true, nodes: { B: [60, 55], D: [280, 55], C: [170, 120], F: [60, 190], E: [280, 190] },
    edges: [["B", "C"], ["B", "D", { c: -22 }], ["C", "B"], ["C", "D"], ["C", "E"], ["D", "E"], ["E", "D"], ["E", "F"], ["F", "C"]] };
  D.g3 = { w: 340, h: 230, directed: true, loops: { C: -90, D: -90 }, nodes: { C: [70, 80], D: [270, 80], F: [70, 190], E: [270, 190] },
    edges: [["C", "C"], ["C", "D"], ["C", "E"], ["D", "D"], ["E", "D"], ["E", "F"], ["F", "C"]] };
  D.g4 = { w: 360, h: 270, directed: true, sub: true, loops: { s1: 180, s3: -60 }, nodes: { s1: [60, 100], s2: [165, 80], s3: [300, 80], s4: [105, 200], s5: [250, 180], s6: [190, 250] },
    edges: [["s1", "s1"], ["s1", "s2"], ["s2", "s1"], ["s2", "s5"], ["s2", "s5"], ["s3", "s3"], ["s4", "s2"], ["s5", "s3"], ["s6", "s5"], ["s6", "s5"], ["s6", "s5"]] };
  D.gdeg = { w: 340, h: 240, sub: true, nodes: { s1: [165, 35], s2: [285, 85], s3: [80, 95], s4: [195, 150], s5: [120, 205], s6: [30, 190] },
    edges: [["s1", "s4"], ["s2", "s3"], ["s2", "s4"], ["s3", "s4"], ["s4", "s5"]] };
  D.gsub = { w: 340, h: 210, directed: true, nodes: { "1": [40, 105], "2": [125, 105], "4": [215, 30], "3": [318, 105], "5": [215, 180] },
    edges: [["2", "1"], ["2", "4"], ["2", "3"], ["4", "3"], ["2", "5"], ["5", "2"], ["5", "3"], ["5", "4", { c: 72 }]] };
  D.gsub1 = { w: 340, h: 210, directed: true, nodes: { "1": [40, 105], "4": [215, 30], "3": [318, 105], "5": [215, 180] },
    edges: [["4", "3"], ["5", "3"], ["5", "4", { c: 72 }]] };
  D.gsub2 = { w: 340, h: 210, directed: true, nodes: { "1": [40, 105], "2": [125, 105], "4": [215, 30], "3": [318, 105], "5": [215, 180] },
    edges: [["2", "1"], ["2", "5"], ["5", "2"], ["5", "3"], ["5", "4", { c: 72 }]] };
  D.gsub3 = { w: 340, h: 210, directed: true, nodes: { "2": [125, 105], "4": [215, 30], "5": [215, 180] },
    edges: [["2", "4"], ["2", "5"], ["5", "2"], ["5", "4", { c: 72 }]] };
  D.k2 = complete(2); D.k3 = complete(3); D.k4 = complete(4); D.k5 = complete(5);
  D.ex1 = { w: 330, h: 250, directed: true, nodes: { B: [165, 40], A: [50, 100], C: [280, 100], D: [50, 205], E: [165, 205], F: [280, 205] },
    edges: [["A", "B"], ["B", "A"], ["C", "B"], ["B", "D"], ["B", "E"], ["B", "F"], ["C", "F"], ["F", "C"], ["F", "D", { c: -48 }]] };
  D.chem = { w: 440, h: 250, sub: true, nodes: { p1: [345, 30], p2: [80, 55], p3: [170, 115], p4: [250, 55], p5: [80, 175], p6: [160, 225], p7: [345, 115], p8: [255, 180] },
    edges: [["p1", "p4"], ["p2", "p3"], ["p3", "p4"], ["p3", "p5"], ["p3", "p8"], ["p4", "p7"], ["p5", "p6"], ["p7", "p8"]] };
  D.ex5 = { w: 430, h: 310, sub: true, nodes: { s1: [210, 232], s2: [212, 50], s3: [110, 92], s4: [312, 190], s5: [312, 92], s6: [390, 235], s7: [35, 35], s8: [22, 95], s9: [38, 155], s10: [392, 165], s11: [110, 190], s12: [210, 290] },
    edges: [["s3", "s7"], ["s3", "s8"], ["s3", "s9"], ["s3", "s2"], ["s3", "s11"], ["s4", "s10"], ["s4", "s6"], ["s4", "s1"], ["s4", "s5"], ["s1", "s12"], ["s1", "s11"], ["s2", "s5"]] };
  var exPos = { A: [35, 115], S: [105, 45], Cn: [225, 45], E: [105, 175], M: [225, 175], Ch: [335, 110], I: [405, 45], P: [445, 120], Me: [335, 200] };
  var exEdges = [["Cn", "E"], ["Cn", "M"], ["Cn", "S"], ["E", "M"], ["E", "S"], ["M", "S"], ["A", "Ch"], ["A", "E"], ["A", "S"], ["Ch", "E"], ["Ch", "S"], ["Ch", "I"], ["Ch", "P"], ["I", "P"], ["Cn", "I"], ["Cn", "Me"], ["I", "Me"], ["Ch", "M"], ["Ch", "Me"], ["M", "Me"]];
  D.exams = { w: 480, h: 240, r: 18, nodes: exPos, edges: exEdges };
  D.exams2 = {
    w: 480, h: 240, r: 18,
    nodes: { A: exPos.A, E: exPos.E, Cn: exPos.Cn, M: exPos.M, Ch: exPos.Ch, I: exPos.I, Me: exPos.Me },
    edges: exEdges.filter(function (e) { return e[0] !== "S" && e[1] !== "S" && e[0] !== "P" && e[1] !== "P"; })
  };
  D.c5 = { w: 200, h: 190, nodes: circle(["u1", "u2", "u3", "u4", "u5"], 100, 95, 70), labels: { u1: "1", u2: "2", u3: "3", u4: "4", u5: "5" },
    edges: [["u1", "u2"], ["u2", "u3"], ["u3", "u4"], ["u4", "u5"], ["u5", "u1"]] };
  (function () {
    var out = circle(["o1", "o2", "o3", "o4", "o5"], 120, 110, 95), inn = circle(["i1", "i2", "i3", "i4", "i5"], 120, 110, 48);
    var nodes = {}, k; for (k in out) nodes[k] = out[k]; for (k in inn) nodes[k] = inn[k];
    var labels = {}; Object.keys(nodes).forEach(function (n, i) { labels[n] = String(i + 1); });
    D.petersen = { w: 240, h: 220, r: 12, nodes: nodes, labels: labels,
      edges: [["o1", "o2"], ["o2", "o3"], ["o3", "o4"], ["o4", "o5"], ["o5", "o1"], ["o1", "i1"], ["o2", "i2"], ["o3", "i3"], ["o4", "i4"], ["o5", "i5"], ["i1", "i3"], ["i3", "i5"], ["i5", "i2"], ["i2", "i4"], ["i4", "i1"]] };
  })();
  D.couronne = { w: 300, h: 250, r: 15, sub: true,
    nodes: { a1: [70, 40], b1: [230, 40], a2: [70, 95], b2: [230, 95], a3: [70, 150], b3: [230, 150], a4: [70, 205], b4: [230, 205] },
    edges: (function () { var e = []; for (var i = 1; i <= 4; i++) for (var j = 1; j <= 4; j++) if (i !== j) e.push(["a" + i, "b" + j]); return e; })() };
  D.social = { w: 380, h: 200, directed: true, r: 24, nodes: { Alice: [70, 100], Bob: [200, 40], "Chloé": [200, 160], David: [330, 100] },
    edges: [["Alice", "Bob"], ["Bob", "Alice"], ["Alice", "Chloé"], ["Chloé", "Bob"], ["David", "Alice"]] };
  D.metro = { w: 540, h: 200, r: 15, nodes: { A: [40, 100], B: [190, 100], C: [340, 100], D: [490, 100], E: [190, 30], F: [190, 170] },
    edges: [["A", "B", { l: "L1 · 2 min" }], ["B", "C", { l: "L1 · 3 min" }], ["C", "D", { l: "L1 · 2 min" }], ["E", "B", { l: "L2 · 4 min" }], ["B", "F", { l: "L2 · 3 min" }]] };
  D.raspail = { w: 320, h: 150, r: 22, nodes: { Raspail: [70, 75], Denfert: [250, 75] },
    edges: [["Raspail", "Denfert", { l: "ligne 4" }], ["Raspail", "Denfert", { l: "ligne 6" }]] };
  D.hero = { w: 330, h: 220, r: 17, nodes: { a: [60, 110], b: [150, 40], c: [150, 180], d: [260, 70], e: [270, 160] },
    edges: [["a", "b"], ["a", "c"], ["b", "c"], ["b", "d"], ["c", "e"], ["d", "e"]], colors: { a: 0, b: 1, c: 2, d: 0, e: 1 } };
  D.wiki = { w: 540, h: 330, r: 16, directed: true,
    nodes: { A: [60, 170], B: [150, 60], C: [270, 115], D: [150, 255], E: [410, 60], F: [310, 180], G: [480, 125], H: [310, 262], I: [430, 262], J: [370, 312], K: [490, 28] },
    edges: [["A", "B"], ["A", "C"], ["A", "D"], ["B", "C"], ["B", "E"], ["C", "F"], ["D", "F"], ["E", "G"], ["E", "K"], ["F", "E"], ["F", "H"], ["G", "A"], ["H", "D"], ["H", "I"], ["J", "F"], ["J", "I"]] };
  /* semaine 3 (chapitre 4) */
  D.ch4a = { w: 350, h: 180, r: 15, directed: true, alt: "Graphe orienté d'ordre 6 et de taille 8",
    nodes: { 1: [30, 90], 2: [120, 90], 4: [200, 30], 3: [240, 90], 5: [200, 150], 6: [320, 90] },
    edges: [["1", "2"], ["2", "3"], ["2", "4"], ["2", "5"], ["4", "3"], ["5", "3"], ["5", "6"], ["6", "4"]] };
  D.ch4b = { w: 340, h: 300, r: 15, directed: true, alt: "Graphe orienté d'ordre 7 et de taille 9",
    nodes: { 7: [150, 22], 2: [150, 110], 4: [285, 120], 1: [55, 170], 5: [185, 205], 6: [285, 240], 3: [85, 262] },
    edges: [["1", "2"], ["2", "4"], ["2", "7"], ["3", "5"], ["4", "5"], ["5", "6"], ["5", "2"], ["6", "3"], ["6", "1", { c: -35 }]] };
  D.circ = { w: 370, h: 200, r: 16, directed: true, alt: "Graphe orienté d'ordre 7 et de taille 10",
    nodes: { B: [40, 70], A: [130, 70], C: [230, 70], F: [330, 70], G: [40, 160], D: [230, 160], E: [330, 160] },
    edges: [["A", "C"], ["B", "A"], ["B", "G"], ["C", "D"], ["D", "E"], ["D", "G"], ["E", "F"], ["F", "A", { c: 22 }], ["G", "A"], ["G", "D"]] };
  D.arbo = { w: 400, h: 180, r: 16, directed: true, alt: "Arborescence de racine C",
    nodes: { C: [200, 120], B: [110, 60], E: [290, 40], F: [285, 145], A: [30, 60], D: [110, 150], G: [365, 90] },
    edges: [["C", "B"], ["C", "E"], ["C", "F"], ["B", "A"], ["B", "D"], ["E", "G"]] };
  D.ex7 = { w: 380, h: 260, r: 17, directed: true, alt: "Graphe de l'exercice 7",
    nodes: { E: [150, 30], I: [260, 30], D: [150, 95], F: [260, 95], J: [350, 95], A: [45, 95], B: [60, 200], C: [150, 165], G: [260, 165], H: [260, 230] },
    edges: [["A", "C"], ["B", "A"], ["C", "B"], ["C", "D"], ["C", "G"], ["C", "H"], ["D", "E"], ["E", "I"], ["F", "D"], ["G", "H"], ["H", "J"], ["I", "A"], ["J", "I"]] };
  D.connexite = { w: 440, h: 190, r: 16, alt: "Graphe non orienté du fichier connexite.txt",
    nodes: { A: [60, 45], B: [30, 150], C: [110, 150], D: [150, 65], E: [225, 60], F: [225, 150], G: [300, 45], H: [390, 45], I: [405, 150], J: [315, 150] },
    edges: [["A", "B"], ["A", "C"], ["A", "D"], ["C", "D"], ["E", "F"], ["G", "H"], ["G", "J"], ["H", "I"], ["H", "J"], ["I", "J"]] };
  D.bipartite = { w: 300, h: 160, r: 15, nodes: { x1: [50, 40], x2: [50, 120], y1: [220, 20], y2: [220, 80], y3: [220, 140] },
    edges: [["x1", "y1"], ["x1", "y2"], ["x2", "y2"], ["x2", "y3"]] };

  var UM = {};
  UM.social = { w: 560, h: 210, alt: "Diagramme de classes : réseau social", classes: [
    { id: "C", name: "Compte", x: 30, y: 20, w: 150, attrs: ["pseudo {id}", "photo [0..1]", "bio [0..1]"] },
    { id: "P", name: "Publication", x: 30, y: 140, w: 150, attrs: ["date", "contenu"] },
    { id: "A", name: "Abonnement", x: 330, y: 20, w: 170, attrs: ["nbPublicationsLikees"] }],
    rels: [
      { a: "C", b: "P", da: "comp", ma: "1", mb: "*", label: "publie", lx: 30 },
      { a: "A", b: "C", label: "abonné", ma: "*", mb: "1", lx: 0, ly: -8, pts: [] },
      { a: "A", b: "C", label: "suivi", ma: "*", mb: "1", lx: 0, ly: 16, pts: [[255, 98]] }]
  };
  UM.metro = { w: 560, h: 240, alt: "Diagramme de classes : réseau ferré", classes: [
    { id: "S", name: "Station", x: 20, y: 30, w: 130, attrs: ["nom {id}"] },
    { id: "L", name: "Ligne", x: 20, y: 150, w: 130, attrs: ["numero {id}", "couleur"] },
    { id: "T", name: "Liaison", x: 330, y: 30, w: 170, attrs: ["tempsTrajet : int"] }],
    rels: [
      { a: "T", b: "S", label: "origine", ma: "*", mb: "1", ly: -4 },
      { a: "T", b: "L", label: "sur", ma: "*", mb: "1", ly: 4 },
      { a: "L", b: "S", label: "terminus", ma: "*", mb: "2", dashed: true, lx: 0, ly: 18, pts: [[85, 120]] }]
  };
  UM.planif = { w: 600, h: 250, alt: "Diagramme de classes : planification d'examens", classes: [
    { id: "U", name: "Universite", x: 20, y: 20, w: 200, attrs: ["- nom : String", "- l_exams : ArrayList<Examen>", "- l_creneaux : ArrayList<Creneau>", "- matriceAdj : int[][]"] },
    { id: "E", name: "Examen", x: 380, y: 20, w: 200, attrs: ["- id : int", "- intitule : String", "- c : Creneau"] },
    { id: "C", name: "Creneau", x: 380, y: 160, w: 200, attrs: ["- id : int"] }],
    rels: [
      { a: "U", b: "E", da: "comp", mb: "*", label: "l_exams", ly: -4 },
      { a: "U", b: "C", da: "comp", mb: "*", label: "l_creneaux", pts: [[120, 195]], lx: -10, ly: 14 },
      { a: "E", b: "C", db: "arrow", ma: "*", mb: "0..1", label: "c", lx: 14 }]
  };
  UM.matrice = { w: 440, h: 130, alt: "Diagramme de classes : matrice d'adjacence", classes: [
    { id: "G", name: "Graphe", x: 20, y: 25, w: 160, attrs: ["- ordre : int", "- matAdj : int[][]"] },
    { id: "S", name: "Sommet", x: 280, y: 25, w: 130, attrs: ["- id", "- num"] }],
    rels: [{ a: "G", b: "S", da: "comp", mb: "*" }]
  };
  UM.aretes = { w: 480, h: 230, alt: "Diagramme de classes : liste d'arêtes", classes: [
    { id: "G", name: "Graphe", x: 20, y: 25, w: 120 },
    { id: "S", name: "Sommet", x: 320, y: 25, w: 120, attrs: ["- id"] },
    { id: "A", name: "Arete", x: 20, y: 140, w: 120, attrs: ["- id", "- info"] }],
    rels: [
      { a: "G", b: "S", da: "comp", mb: "*" },
      { a: "G", b: "A", da: "comp", mb: "*" },
      { a: "A", b: "S", db: "arrow", ma: "*", mb: "*", pts: [[380, 175]] }]
  };
  UM.succ = { w: 420, h: 150, alt: "Diagramme de classes : liste de successeurs", classes: [
    { id: "G", name: "Graphe", x: 20, y: 25, w: 120 },
    { id: "S", name: "Sommet", x: 260, y: 25, w: 120, attrs: ["- id"] }],
    rels: [{ a: "G", b: "S", da: "comp", mb: "*" }, { a: "S", b: "S", db: "arrow", mb: "* succ" }]
  };

  UM.explo = { w: 560, h: 170, alt: "Diagramme de classes de l'activité 8", classes: [
    { id: "G", name: "Graphe", x: 20, y: 25, w: 210, attrs: ["- orient : int", "- l_sommets : ArrayList<Sommet>"] },
    { id: "S", name: "Sommet", x: 330, y: 25, w: 200, attrs: ["- id : int", "- nom : String", "- successeurs : ArrayList<Sommet>"] }],
    rels: [{ a: "G", b: "S", da: "comp", mb: "*" }, { a: "S", b: "S", db: "arrow", mb: "* succ" }]
  };

  /* ---------- montage automatique ---------- */
  function parseMap(s) {
    var o = {}; if (!s) return o;
    s.split(",").forEach(function (p) { var kv = p.split(":"); o[kv[0].trim()] = parseInt(kv[1], 10); });
    return o;
  }
  function mount(root) {
    (root || document).querySelectorAll("[data-graph]").forEach(function (h) {
      if (h.dataset.done) return;
      var spec = D[h.dataset.graph]; if (!spec) return;
      var o = {};
      if (h.dataset.colors) o.colors = parseMap(h.dataset.colors);
      if (h.dataset.hl) o.hl = h.dataset.hl.split(",");
      if (h.dataset.hln) o.hln = h.dataset.hln.split(",");
      if (h.dataset.order) o.order = h.dataset.order.split(",");
      render(h, spec, o); h.dataset.done = "1";
    });
    (root || document).querySelectorAll("[data-uml]").forEach(function (h) {
      if (h.dataset.done) return;
      var spec = UM[h.dataset.uml]; if (!spec) return;
      uml(h, spec); h.dataset.done = "1";
    });
  }

  window.GV = { render: render, uml: uml, data: D, mount: mount };
  document.addEventListener("DOMContentLoaded", function () { mount(); });
})();
