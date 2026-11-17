/* Navigation, thème, coloration du code, sommaires, QCM. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }

  /* ---------- thème ---------- */
  var root = document.documentElement;
  var th = safeGet("tg_theme");
  if (th) root.setAttribute("data-theme", th);
  window.toggleTheme = function () {
    var cur = root.getAttribute("data-theme");
    if (!cur) cur = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var nx = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", nx); safeSet("tg_theme", nx);
  };

  /* ---------- coloration du code ---------- */
  var KW = /\b(class|public|private|protected|static|final|void|int|double|boolean|new|return|if|else|for|while|do|this|import|extends|implements|interface|abstract|true|false|null|String|List|ArrayList|Set|HashSet|Arrays|Integer|Math|System)\b/g;
  function hl(src) {
    var out = "", re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g, last = 0, m;
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    var types = /^(String|List|ArrayList|Set|HashSet|Arrays|Integer|Math|System|Sommet|Arete|SommetS|GrapheMatrice|GrapheAretes)$/;
    var kws = /^(class|public|private|protected|static|final|void|int|double|boolean|new|return|if|else|for|while|do|this|import|extends|implements|interface|abstract|true|false|null|break|continue)$/;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index)); last = re.lastIndex;
      if (m[1]) out += "<span class='cm'>" + esc(m[1]) + "</span>";
      else if (m[2]) out += "<span class='s'>" + esc(m[2]) + "</span>";
      else if (m[3]) out += "<span class='n'>" + m[3] + "</span>";
      else if (kws.test(m[4])) out += "<span class='k'>" + m[4] + "</span>";
      else if (types.test(m[4])) out += "<span class='t'>" + m[4] + "</span>";
      else out += m[4];
    }
    return out + esc(src.slice(last));
  }
  $$("pre.code code").forEach(function (c) { if (c.dataset.raw !== "1") c.innerHTML = hl(c.textContent.replace(/^\n/, "")); });

  /* ---------- sommaires automatiques ---------- */
  $$(".chap, .pane.toc-auto").forEach(function (box, bi) {
    var hs = $$("h2, h3", box).filter(function (h) { return !h.closest(".box") && !h.closest("details"); });
    if (hs.length < 3 || $(".toc", box)) return;
    var det = document.createElement("details"); det.className = "toc";
    var ol = document.createElement("ol");
    hs.forEach(function (h, i) {
      if (h.tagName !== "H2") return;
      if (!h.id) h.id = "h-" + bi + "-" + i;
      var li = document.createElement("li"), a = document.createElement("a");
      a.href = "#" + h.id; a.textContent = h.textContent;
      a.addEventListener("click", function (e) { e.preventDefault(); h.scrollIntoView({ behavior: "smooth", block: "start" }); });
      li.appendChild(a); ol.appendChild(li);
    });
    det.innerHTML = "<summary>Dans ce chapitre</summary>"; det.appendChild(ol);
    box.insertBefore(det, box.children[1] || null);
  });

  /* ---------- routage ---------- */
  var views = $$(".view"), navBtns = $$("[data-view]");
  function show(hash) {
    var parts = (hash || location.hash || "#accueil").replace(/^#/, "").split("/");
    var view = parts[0] || "accueil";
    if (!$("#view-" + view)) view = "accueil";
    views.forEach(function (v) { v.classList.toggle("active", v.id === "view-" + view); });
    navBtns.forEach(function (b) { b.classList.toggle("active", b.dataset.view === view); });
    var wk = /^s\d+$/.test(view) ? view : null;
    if (wk) {
      var pane = parts[1] || "cours", chap = parts[2] || "1";
      $$("#view-" + wk + " .tabs button").forEach(function (b) { b.classList.toggle("active", b.dataset.pane === pane); });
      $$("#view-" + wk + " .pane").forEach(function (p) { p.classList.toggle("active", p.dataset.pane === pane); });
      $$("#view-" + wk + " .chnav button").forEach(function (b) { b.classList.toggle("active", b.dataset.chap === chap); });
      $$("#view-" + wk + " .chap").forEach(function (c) { c.classList.toggle("active", c.dataset.chap === chap); });
    }
    $("#nav").classList.remove("open"); $("#burger").setAttribute("aria-expanded", "false");
    window.scrollTo(0, 0);
    document.title = "Théorie des graphes — Ing2" + (view === "accueil" ? "" : " · " + (wk ? wk.toUpperCase() : view));
  }
  window.go = function (h) { if (location.hash === "#" + h) show("#" + h); else location.hash = h; };
  window.addEventListener("hashchange", function () { show(); });
  $("#burger").addEventListener("click", function () {
    var o = $("#nav").classList.toggle("open"); this.setAttribute("aria-expanded", String(o));
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]");
    if (t) { e.preventDefault(); go(t.dataset.go); }
  });

  /* ---------- corrigés : tout ouvrir / fermer ---------- */
  $$("[data-cx]").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.dataset.cx === "open";
      $$("details.cx", b.closest(".pane")).forEach(function (d) { d.open = open; });
    });
  });
  window.addEventListener("beforeprint", function () { $$("details.cx").forEach(function (d) { d.dataset.was = d.open ? "1" : ""; d.open = true; }); });
  window.addEventListener("afterprint", function () { $$("details.cx").forEach(function (d) { d.open = d.dataset.was === "1"; }); });

  /* ---------- QCM ---------- */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function initQcm(wk) {
    var data = window.QCM && QCM[wk], box = $("#qcm-" + wk);
    if (!data || !box) return;
    var key = "tg_qcm_" + wk, N = data.questions.length;
    var chap = data.chapitres || { 1: "Chapitre 1", 2: "Chapitre 2", 3: "Chapitre 3" };
    $$("[data-qcount='" + wk + "']").forEach(function (e) { e.textContent = N; });
    var st; try { st = JSON.parse(safeGet(key)); } catch (e) { st = null; }
    if (!st || !st.order || st.order.length !== N) st = { order: data.questions.map(function (_, i) { return i; }), ans: {}, val: {} };
    var filter = "0";
    function save() { safeSet(key, JSON.stringify(st)); }
    function isGood(i) {
      var q = data.questions[i], a = (st.ans[i] || []).slice().sort().join(","), ok = q.ok.slice().sort().join(",");
      return a === ok;
    }
    function draw() {
      var done = 0, good = 0;
      Object.keys(st.val).forEach(function (i) { if (st.val[i]) { done++; if (isGood(+i)) good++; } });
      var html = "<div class='qbar'><label for='qf-" + wk + "'><b>Chapitre :</b></label><select id='qf-" + wk + "'>" +
        (["0|Tous"].concat(Object.keys(chap).map(function (k) { return k + "|" + chap[k]; }))).map(function (o) { var p = o.split("|"); return "<option value='" + p[0] + "'" + (filter === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") +
        "</select><div class='prog'><i style='width:" + Math.round(100 * done / N) + "%'></i></div><span><b>" + good + "</b> bonnes / " + done + " validées (sur " + N + ")</span>" +
        "<button class='btn ghost' data-act='valall'>Tout valider</button><button class='btn ghost' data-act='reset'>Recommencer (mélanger)</button></div>";
      st.order.forEach(function (i) {
        var q = data.questions[i];
        if (filter !== "0" && String(q.ch) !== filter) return;
        var multi = q.ok.length > 1, locked = !!st.val[i], a = st.ans[i] || [], good1 = locked && isGood(i);
        html += "<div class='qc" + (locked ? " locked " + (good1 ? "ok" : "ko") : "") + "' data-i='" + i + "'><div class='qh'><span class='tag'>" + chap[q.ch] + "</span>" +
          (multi ? "<span class='tag warm'>plusieurs réponses</span>" : "") + (locked ? "<span class='tag " + (good1 ? "" : "warm") + "'>" + (good1 ? "✔ juste" : "✘ à revoir") + "</span>" : "") +
          "</div><div class='qt'>" + q.q + "</div>";
        q.o.forEach(function (o, k) {
          var cl = "opt";
          if (locked) { var sel = a.indexOf(k) >= 0, right = q.ok.indexOf(k) >= 0; if (sel && right) cl += " good"; else if (sel && !right) cl += " bad"; else if (!sel && right) cl += " miss"; }
          html += "<label class='" + cl + "'><input type='" + (multi ? "checkbox" : "radio") + "' name='q" + wk + i + "' value='" + k + "'" + (a.indexOf(k) >= 0 ? " checked" : "") + (locked ? " disabled" : "") + "><span>" + o + "</span></label>";
        });
        if (locked) html += "<div class='exp'><b>Explication.</b> " + q.e + "</div>";
        else html += "<div style='margin-top:8px'><button class='btn' data-act='val' data-i='" + i + "'>Valider</button></div>";
        html += "</div>";
      });
      if (done === N) html += "<div class='result'><div>Score final</div><b>" + good + " / " + N + "</b><div>" + (good === N ? "Parfait, tu maîtrises cette semaine !" : good >= N * 0.75 ? "Très bien — relis les explications des questions ratées." : "Relis la fiche « À retenir » puis recommence.") + "</div></div>";
      box.innerHTML = html;
      var sel = $("#qf-" + wk); if (sel) sel.addEventListener("change", function () { filter = this.value; draw(); });
    }
    box.addEventListener("change", function (e) {
      var c = e.target.closest(".qc"); if (!c || !e.target.matches("input")) return;
      var i = +c.dataset.i; st.ans[i] = $$("input:checked", c).map(function (x) { return +x.value; }); save();
    });
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var act = b.dataset.act;
      if (act === "val") { st.val[b.dataset.i] = true; }
      else if (act === "valall") { st.order.forEach(function (i) { st.val[i] = true; }); }
      else if (act === "reset") { st = { order: shuffle(data.questions.map(function (_, i) { return i; })), ans: {}, val: {} }; }
      save(); draw();
    });
    draw();
  }
  initQcm("s1");
  initQcm("s2");
  initQcm("s3");
  initQcm("s4");

  /* ---------- diaporamas : agrandir une diapositive ---------- */
  var lb = document.createElement("div");
  lb.className = "lightbox"; lb.innerHTML = "<img alt=''>";
  document.body.appendChild(lb);
  lb.addEventListener("click", function () { lb.classList.remove("on"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("on"); });
  document.addEventListener("click", function (e) {
    var im = e.target.closest(".pres-grid img");
    if (im) { lb.querySelector("img").src = im.src; lb.querySelector("img").alt = im.alt; lb.classList.add("on"); }
  });

  show();
})();
