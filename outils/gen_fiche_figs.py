#!/usr/bin/env python3
"""Génère les schémas SVG de la fiche « À retenir » de la semaine 3 (parts/p12_s3_fiche_qcm.html).

Usage (depuis le dossier du site) :  python outils/gen_fiche_figs.py  puis  python outils/build.py

- écrit un fragment HTML par figure dans parts/figs/f3_<nom>.html (inclus par la fiche avec {{PART:figs/f3_<nom>.html}}) ;
- écrit le CSS des figures dans css/style.css entre deux marqueurs de commentaire (remplacé à chaque exécution) ;
- tout est idempotent : relancer le script réécrit exactement les mêmes fichiers.
Les couleurs viennent des variables de css/style.css (thèmes clair et sombre) : aucune couleur n'est écrite en dur.
Les ordres de parcours (BFS, DFS) et la matrice sont CALCULÉS ici, pas saisis à la main.
"""
import math
import os
import re
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "parts", "figs")
CSS = os.path.join(ROOT, "css", "style.css")
CSS_BEGIN = "/* === FIGURES FICHE S3 (généré par outils/gen_fiche_figs.py, ne pas éditer à la main) === */"
CSS_END = "/* === /FIGURES FICHE S3 === */"


# ---------------------------------------------------------------- algorithmes (pour calculer les figures)
def bfs(succ, s):
    order, dist, parent, seen, q = [s], {s: 0}, {s: None}, {s}, deque([s])
    while q:
        x = q.popleft()
        for y in succ.get(x, []):
            if y not in seen:
                seen.add(y); dist[y] = dist[x] + 1; parent[y] = x; order.append(y); q.append(y)
    return order, dist, parent


def dfs_rec(succ, s):
    order, parent, seen = [s], {s: None}, {s}

    def go(x):
        for y in succ.get(x, []):
            if y not in seen:
                seen.add(y); parent[y] = x; order.append(y); go(y)
    go(s)
    return order, parent


def dfs_pile(succ, s):
    """Pile du cours : on marque à l'empilement. Renvoie (découverte, exploration, parents)."""
    disc, expl, parent, seen, st = [s], [], {s: None}, {s}, [s]
    while st:
        x = st.pop(); expl.append(x)
        for y in succ.get(x, []):
            if y not in seen:
                seen.add(y); parent[y] = x; disc.append(y); st.append(y)
    return disc, expl, parent


EX7_ARCS = [("A", "C"), ("B", "A"), ("C", "B"), ("C", "D"), ("C", "G"), ("C", "H"), ("D", "E"), ("E", "I"),
            ("F", "D"), ("G", "H"), ("H", "J"), ("I", "A"), ("J", "I")]
EX7_POS = {"E": (150, 30), "I": (260, 30), "D": (150, 95), "F": (260, 95), "J": (350, 95), "A": (45, 95),
           "B": (60, 200), "C": (150, 165), "G": (260, 165), "H": (260, 230)}


def succ_of(arcs):
    d = {}
    for a, b in arcs:
        d.setdefault(a, []).append(b)
    for k in d:
        d[k].sort()
    return d


# ---------------------------------------------------------------- constructeur SVG
class F:
    def __init__(self, uid, w, h, alt):
        self.uid, self.w, self.h, self.alt = uid, w, h, alt
        self.p = []
        self.ox = self.oy = 0

    def at(self, ox, oy):
        self.ox, self.oy = ox, oy

    def pt(self, p):
        return (p[0] + self.ox, p[1] + self.oy)

    def add(self, s):
        self.p.append(s)

    @staticmethod
    def f(v):
        return ("%.1f" % v).rstrip("0").rstrip(".")

    def text(self, x, y, s, cls="fs-s", anchor="middle", dy=14):
        x, y = self.pt((x, y))
        lines = s.split("|")
        if len(lines) == 1:
            self.add('<text class="%s" x="%s" y="%s" text-anchor="%s">%s</text>' % (cls, self.f(x), self.f(y), anchor, s))
        else:
            t = "".join('<tspan x="%s" dy="%s">%s</tspan>' % (self.f(x), 0 if i == 0 else dy, l) for i, l in enumerate(lines))
            self.add('<text class="%s" x="%s" y="%s" text-anchor="%s">%s</text>' % (cls, self.f(x), self.f(y), anchor, t))

    def rect(self, x, y, w, h, cls="fs-box", rx=6):
        x, y = self.pt((x, y))
        self.add('<rect class="%s" x="%s" y="%s" width="%s" height="%s" rx="%s"/>' % (cls, self.f(x), self.f(y), w, h, rx))

    def line(self, a, b, cls="fs-ln"):
        a, b = self.pt(a), self.pt(b)
        self.add('<path class="%s" d="M%s %s L%s %s"/>' % (cls, self.f(a[0]), self.f(a[1]), self.f(b[0]), self.f(b[1])))

    def node(self, p, label, cls="", r=16, badge=None):
        x, y = self.pt(p)
        self.add('<g class="fs-n %s"><circle cx="%s" cy="%s" r="%s"/><text x="%s" y="%s">%s</text></g>' % (cls, self.f(x), self.f(y), r, self.f(x), self.f(y), label))
        if badge is not None:
            bx, by = x + r * 0.8, y - r * 0.8
            self.add('<g class="fs-b"><circle cx="%s" cy="%s" r="8.5"/><text x="%s" y="%s">%s</text></g>' % (self.f(bx), self.f(by), self.f(bx), self.f(by), badge))

    def arc(self, a, b, cls="", bend=0, r1=16, r2=16, directed=True, label=None, lcls="fs-lb", loff=0):
        """a, b : points (centres). cls : '', 'tree', 'hot', 'faint'. Renvoie le point milieu de la courbe."""
        a, b = self.pt(a), self.pt(b)
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        ux, uy = dx / L, dy / L
        nx, ny = -uy, ux
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        if abs(bend) < 0.01:
            s = (a[0] + ux * r1, a[1] + uy * r1)
            t = (b[0] - ux * r2, b[1] - uy * r2)
            d = "M%s %s L%s %s" % (self.f(s[0]), self.f(s[1]), self.f(t[0]), self.f(t[1]))
            m = mid
        else:
            c = (mid[0] + nx * 2 * bend, mid[1] + ny * 2 * bend)
            la = math.hypot(c[0] - a[0], c[1] - a[1]) or 1
            lb = math.hypot(c[0] - b[0], c[1] - b[1]) or 1
            s = (a[0] + (c[0] - a[0]) / la * r1, a[1] + (c[1] - a[1]) / la * r1)
            t = (b[0] + (c[0] - b[0]) / lb * r2, b[1] + (c[1] - b[1]) / lb * r2)
            d = "M%s %s Q%s %s %s %s" % (self.f(s[0]), self.f(s[1]), self.f(c[0]), self.f(c[1]), self.f(t[0]), self.f(t[1]))
            m = (mid[0] + nx * bend, mid[1] + ny * bend)
        mk = ""
        if directed:
            mk = ' marker-end="url(#%s-a%s)"' % (self.uid, cls or "n")
        self.add('<path class="fs-e %s" d="%s"%s/>' % (cls, d, mk))
        if label is not None:
            lx, ly = m[0] + nx * loff, m[1] + ny * loff
            self.add('<text class="%s" x="%s" y="%s">%s</text>' % (lcls, self.f(lx), self.f(ly + 4), label))
        return m

    def defs(self):
        out = "<defs>"
        for k in ("n", "tree", "hot", "faint"):
            out += ('<marker id="%s-a%s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" '
                    'markerUnits="userSpaceOnUse" orient="auto"><path class="fs-ar %s" d="M0,0 L10,5 L0,10 z"/></marker>' % (self.uid, k, k))
        return out + "</defs>"

    def svg(self):
        return ('<svg viewBox="0 0 %s %s" role="img" aria-label="%s"><title>%s</title>%s%s</svg>'
                % (self.w, self.h, self.alt, self.alt, self.defs(), "".join(self.p)))


def figure(name, f, caption, extra=""):
    html = '<figure class="fig ffig"%s>%s<figcaption>%s</figcaption></figure>\n' % (extra, f.svg(), caption)
    return html


# ---------------------------------------------------------------- figures
def fig_simple_elem():
    f = F("fse", 360, 182, "Deux chemins : un simple non élémentaire, un ni simple ni élémentaire")
    # (a) chemin <(1,2),(2,4),(4,5),(5,2),(2,7)>
    f.at(0, 0)
    P = {"1": (22, 52), "2": (72, 52), "4": (128, 20), "5": (128, 84), "7": (72, 112)}
    steps = [("1", "2"), ("2", "4"), ("4", "5"), ("5", "2"), ("2", "7")]
    off = {0: -15, 1: -14, 2: -15, 3: -14, 4: 15}
    for i, (a, b) in enumerate(steps):
        f.arc(P[a], P[b], "hot", r1=13, r2=13, label=str(i + 1), lcls="fs-st", loff=off[i])
    for k, v in P.items():
        f.node(v, k, "doub" if k == "2" else "", r=13)
    f.text(88, 142, "(a) simple|non élémentaire|(2 visité deux fois)", "fs-s", dy=14)
    # (b) chemin <(1,2),(2,3),(3,1),(1,2)>
    f.at(185, 0)
    Q = {"1": (30, 100), "2": (80, 28), "3": (128, 100)}
    f.arc(Q["1"], Q["2"], "hot", bend=-13, r1=13, r2=13, label="1 et 4", lcls="fs-st", loff=-22)
    f.arc(Q["2"], Q["3"], "hot", r1=13, r2=13, label="2", lcls="fs-st", loff=-13)
    f.arc(Q["3"], Q["1"], "hot", r1=13, r2=13, label="3", lcls="fs-st", loff=14)
    for k, v in Q.items():
        f.node(v, k, "", r=13)
    f.text(80, 142, "(b) ni simple|ni élémentaire|(arc (1,2) répété)", "fs-s", dy=14)
    f.at(0, 0)
    f.line((180, 8), (180, 174), "fs-sep")
    cap = ("Les nombres sont l'ordre de parcours des arcs. (a) &lt;(1,2), (2,4), (4,5), (5,2), (2,7)&gt; : aucun arc répété (simple), "
           "mais 2 apparaît deux fois (non élémentaire). (b) &lt;(1,2), (2,3), (3,1), (1,2)&gt; : arc répété, donc ni simple ni élémentaire.")
    return figure("simple_elem", f, cap)


def fig_circuit_cycle():
    f = F("fcc", 360, 150, "Plus petits circuits et cycles : 2 arcs, 3 arêtes, 2 arêtes parallèles")
    # (a) circuit minimal orienté simple : u -> v -> u
    f.at(0, 0)
    f.arc((32, 52), (88, 52), "hot", bend=-13, r1=15, r2=15)
    f.arc((88, 52), (32, 52), "hot", bend=-13, r1=15, r2=15)
    f.node((32, 52), "u", "", r=15); f.node((88, 52), "v", "", r=15)
    f.text(60, 104, "orienté simple|circuit : 2 arcs", "fs-s", dy=14)
    # (b) cycle minimal non orienté simple : triangle
    f.at(120, 0)
    T = {"u": (60, 22), "v": (26, 78), "w": (94, 78)}
    for a, b in (("u", "v"), ("v", "w"), ("w", "u")):
        f.arc(T[a], T[b], "hot", r1=14, r2=14, directed=False)
    for k, v in T.items():
        f.node(v, k, "", r=14)
    f.text(60, 126, "non orienté simple|cycle : 3 arêtes", "fs-s", dy=14)
    # (c) multigraphe : deux arêtes parallèles
    f.at(240, 0)
    f.arc((28, 52), (92, 52), "hot", bend=-12, r1=15, r2=15, directed=False)
    f.arc((28, 52), (92, 52), "hot", bend=12, r1=15, r2=15, directed=False)
    f.node((28, 52), "u", "", r=15); f.node((92, 52), "v", "", r=15)
    f.text(60, 104, "multigraphe|cycle : 2 arêtes", "fs-s", dy=14)
    f.at(0, 0)
    f.line((120, 10), (120, 142), "fs-sep"); f.line((240, 10), (240, 142), "fs-sep")
    cap = ("Plus petits circuits / cycles : 2 arcs en orienté simple (u → v → u), 3 arêtes en non orienté simple (un triangle : "
           "une arête ne peut pas être réutilisée), 2 arêtes dans un multigraphe.")
    return figure("circuit_cycle", f, cap)


def fig_desc_asc():
    f = F("fda", 360, 292, "Descendants de 2 et ascendants de 4 dans un graphe orienté d'ordre 6")
    arcs = [("1", "2"), ("2", "3"), ("2", "4"), ("2", "5"), ("4", "3"), ("5", "3"), ("5", "6"), ("6", "4")]
    pos = {"1": (30, 62), "2": (106, 62), "4": (205, 22), "3": (250, 62), "5": (205, 112), "6": (330, 62)}
    pos["3"] = (262, 62)
    succ = succ_of(arcs)
    desc2 = set(bfs(succ, "2")[0]) - {"2"}
    rev = succ_of([(b, a) for a, b in arcs])
    asc4 = set(bfs(rev, "4")[0]) - {"4"}
    assert desc2 == {"3", "4", "5", "6"} and asc4 == {"1", "2", "5", "6"}
    for k, (ttl, root, mark, cl) in enumerate([("Desc(2) = {3, 4, 5, 6}", "2", desc2, "c2"), ("Asc(4) = {1, 2, 5, 6}", "4", asc4, "c1")]):
        f.at(0, k * 146)
        f.text(8, 14, ttl, "fs-h", anchor="start")
        for a, b in arcs:
            f.arc(pos[a], pos[b], "", r1=15, r2=15)
        for n, p in pos.items():
            f.node(p, n, ("root " if n == root else "") + (cl if n in mark else ""), r=15)
        f.text(352, 14, "anneau = départ", "fs-s", anchor="end")
    f.at(0, 0)
    f.line((0, 146), (360, 146), "fs-sep")
    cap = ("Même graphe, A = {(1,2), (2,3), (2,4), (2,5), (4,3), (5,3), (5,6), (6,4)}. Desc(x) = ce qu'on atteint depuis x ; "
           "Asc(x) = ce qui permet d'atteindre x (on lit les arcs « à l'envers »).")
    return figure("desc_asc", f, cap)


def fig_arbo():
    f = F("fab", 360, 176, "Une arborescence, puis deux graphes qui n'en sont pas")
    # (a) arborescence
    f.at(0, 0)
    P = {"r": (60, 22), "a": (32, 62), "b": (90, 62), "c": (14, 104), "d": (46, 104), "e": (90, 104)}
    for a, b in (("r", "a"), ("r", "b"), ("a", "c"), ("a", "d"), ("b", "e")):
        f.arc(P[a], P[b], "tree", r1=11, r2=11)
    for k, v in P.items():
        f.node(v, k, "root" if k == "r" else ("c2" if k in "cde" else ""), r=11)
    f.text(60, 142, "arborescence|racine r, feuilles|c, d et e", "fs-s", dy=13)
    # (b) deux prédécesseurs
    f.at(120, 0)
    Q = {"r": (60, 22), "a": (30, 62), "b": (90, 62), "d": (60, 104)}
    for a, b in (("r", "a"), ("r", "b"), ("a", "d"), ("b", "d")):
        f.arc(Q[a], Q[b], "hot" if b == "d" else "", r1=11, r2=11)
    for k, v in Q.items():
        f.node(v, k, "root" if k == "r" else "", r=11)
    f.text(60, 142, "non : d a deux|prédécesseurs|(2 chemins vers d)", "fs-s", dy=13)
    # (c) un prédécesseur chacun mais inatteignables
    f.at(240, 0)
    R = {"r": (60, 22), "a": (60, 62), "b": (30, 104), "c": (90, 104)}
    f.arc(R["r"], R["a"], "tree", r1=11, r2=11)
    f.arc(R["b"], R["c"], "hot", bend=-8, r1=11, r2=11)
    f.arc(R["c"], R["b"], "hot", bend=-8, r1=11, r2=11)
    for k, v in R.items():
        f.node(v, k, "root" if k == "r" else ("off" if k in "bc" else ""), r=11)
    f.text(60, 142, "non : b et c|inatteignables|depuis r", "fs-s", dy=13)
    f.at(0, 0)
    f.line((120, 8), (120, 162), "fs-sep"); f.line((240, 8), (240, 162), "fs-sep")
    cap = ("Une arborescence a une seule source (la racine) et un unique chemin de la racine vers chaque sommet. "
           "« Un seul prédécesseur par sommet » ne suffit pas : dans (c), b et c ne sont pas atteignables depuis r.")
    return figure("arbo", f, cap)


def fig_file_pile():
    disc, expl_pile, _ = dfs_pile(succ_of(EX7_ARCS), "C")
    order_file, _, _ = bfs(succ_of(EX7_ARCS), "C")
    f = F("ffp", 360, 322, "Une file et une pile contenant les mêmes sommets : on ne retire pas le même")
    items = ["B", "D", "G", "H"]
    x0, w, h = 116, 36, 34
    xr = x0 + 4 * w                      # bord droit des cases
    # ---- file
    y0 = 34
    f.text(8, 16, "File (BFS) : FIFO", "fs-h", anchor="start")
    for i, s in enumerate(items):
        f.rect(x0 + i * w, y0, w, h, "fs-box nxt" if i == 0 else "fs-box")
        f.text(x0 + i * w + w / 2, y0 + 22, s, "fs-bt")
    f.arc((x0 - 4, y0 + h / 2), (x0 - 60, y0 + h / 2), "", r1=0, r2=0)
    f.text(x0 - 32, y0 + h + 15, "retirer|(tête)", "fs-s", dy=14)
    f.arc((xr + 62, y0 + h / 2), (xr + 4, y0 + h / 2), "", r1=0, r2=0)
    f.text(xr + 33, y0 + h + 15, "ajouter|(queue)", "fs-s", dy=14)
    f.text(8, 124, "prochain sommet exploré : B (le plus ancien)|ordre d'exploration : " + " ".join(order_file), "fs-s", anchor="start", dy=16)
    f.line((0, 160), (360, 160), "fs-sep")
    # ---- pile
    y1 = 198
    f.text(8, 180, "Pile (DFS itératif) : LIFO", "fs-h", anchor="start")
    f.line((x0 - 4, y1 - 3), (x0 - 4, y1 + h + 3), "fs-wall")
    for i, s in enumerate(items):
        f.rect(x0 + i * w, y1, w, h, "fs-box nxt" if i == 3 else "fs-box")
        f.text(x0 + i * w + w / 2, y1 + 22, s, "fs-bt")
    f.arc((xr + 62, y1 + 9), (xr + 4, y1 + 9), "", r1=0, r2=0)
    f.arc((xr + 4, y1 + h - 9), (xr + 62, y1 + h - 9), "", r1=0, r2=0)
    f.text(xr + 33, y1 + h + 15, "push / pop|(sommet)", "fs-s", dy=14)
    f.text(x0 - 36, y1 + h / 2 + 4, "fond", "fs-s")
    f.text(8, 280, "prochain sommet exploré : H (le dernier empilé)|ordre d'exploration : " + " ".join(expl_pile), "fs-s", anchor="start", dy=16)
    cap = ("Ex. 7 depuis C : on vient d'explorer C et de marquer B, D, G, H. La file rend B (premier entré) ; la pile rend H (dernier entré). "
           "Ordre de découverte avec la pile : " + " ".join(disc) + ".")
    return figure("file_pile", f, cap)


def ex7_scaled():
    return {k: (round(v[0] * 0.93 + 12), round(v[1] * 0.93 + 10)) for k, v in EX7_POS.items()}


def legend(f, y, items, width=350):
    """items : liste de (cls, texte) ; pastilles alignées, retour à la ligne au-delà de width. Renvoie la hauteur utilisée."""
    x, row = 8, 0
    for cls, t in items:
        w = 26 + 6.6 * len(t) + 12
        if x + w > width and x > 8:
            x, row = 8, row + 1
        f.node((x + 8, y + row * 22), "", cls, r=8)
        f.text(x + 20, y + row * 22 + 4, t, "fs-s", anchor="start")
        x += w
    return (row + 1) * 22


def fig_bfs():
    succ = succ_of(EX7_ARCS)
    order, dist, parent = bfs(succ, "C")
    assert order == list("CBDGHAEJI"), order
    pos = ex7_scaled()
    f = F("fbf", 360, 292, "Parcours en largeur de l'exercice 7 depuis C : ordre de découverte, niveaux et arborescence")
    tree = {(p, c) for c, p in parent.items() if p}
    for a, b in EX7_ARCS:
        f.arc(pos[a], pos[b], "tree" if (a, b) in tree else "faint")
    lvl = {0: "root", 1: "c1", 2: "c2", 3: "c3"}
    for n, p in pos.items():
        if n in order:
            f.node(p, n, lvl[dist[n]], badge=order.index(n) + 1)
        else:
            f.node(p, n, "off")
    legend(f, 252, [("root", "départ"), ("c1", "distance 1"), ("c2", "distance 2"), ("c3", "distance 3"), ("off", "non découvert")])
    cap = ("Les numéros donnent l'ordre de découverte (" + " ".join(order) + "). Les arcs épais forment l'arborescence de parcours ; "
           "les arcs pâles ne sont pas retenus (sommet déjà marqué). F n'est jamais découvert.")
    return figure("bfs", f, cap)


def fig_dfs():
    succ = succ_of(EX7_ARCS)
    order, parent = dfs_rec(succ, "C")
    assert order == list("CBADEIGHJ"), order
    pos = ex7_scaled()
    f = F("fdf", 360, 274, "Parcours en profondeur récursif de l'exercice 7 depuis C : ordre de découverte et arborescence")
    tree = {(p, c) for c, p in parent.items() if p}
    for a, b in EX7_ARCS:
        f.arc(pos[a], pos[b], "tree" if (a, b) in tree else "faint")
    for n, p in pos.items():
        if n in order:
            f.node(p, n, "root" if n == "C" else "c4", badge=order.index(n) + 1)
        else:
            f.node(p, n, "off")
    legend(f, 252, [("root", "départ"), ("c4", "découvert"), ("off", "non découvert")])
    cap = ("Numéros = ordre de découverte du DFS récursif (" + " ".join(order) + "). Les arcs épais forment l'arborescence de parcours : "
           "le DFS s'enfonce (B puis A avant de revenir à D) et H est découvert depuis G, non depuis C comme en largeur.")
    return figure("dfs", f, cap)


def fig_parents():
    succ = succ_of(EX7_ARCS)
    order, dist, parent = bfs(succ, "C")
    f = F("fpa", 360, 330, "Tableau des parents du parcours en largeur depuis C et chemin de C à I obtenu en remontant")
    pos = {"C": (180, 24), "B": (50, 84), "D": (130, 84), "G": (230, 84), "H": (310, 84),
           "A": (50, 144), "E": (130, 144), "J": (310, 144), "I": (130, 204)}
    path = ["C", "D", "E", "I"]
    inpath = {(path[i], path[i + 1]) for i in range(3)}
    for c, p in parent.items():
        if p:
            f.arc(pos[p], pos[c], "hot" if (p, c) in inpath else "tree", r1=15, r2=15)
    for n, p in pos.items():
        f.node(p, n, "root" if n == "C" else ("hotn" if n in path else ""), r=15)
    f.text(176, 192, "remonter : I ← E ← D ← C|puis inverser :|C → D → E → I (3 arcs)", "fs-s", anchor="start", dy=16)
    # tableau
    cols = list("ABCDEFGHIJ")
    cw, x0, y0 = 30.5, 52, 250
    f.text(4, y0 + 19, "x", "fs-h", anchor="start")
    f.text(4, y0 + 47, "parent", "fs-s", anchor="start")
    for i, c in enumerate(cols):
        hot = c in ("I", "E", "D")
        f.rect(x0 + i * cw, y0, cw, 28, "fs-cell hd" + (" hot" if hot else ""), rx=0)
        f.text(x0 + i * cw + cw / 2, y0 + 19, c, "fs-bt")
        val = "—" if c == "C" else ("×" if c not in parent else parent[c])
        f.rect(x0 + i * cw, y0 + 28, cw, 28, "fs-cell" + (" hot" if hot else ""), rx=0)
        f.text(x0 + i * cw + cw / 2, y0 + 47, val, "fs-bt")
    f.text(4, y0 + 76, "— : racine, pas de parent ;  × : non découvert (F)", "fs-s", anchor="start")
    cap = ("Parents du BFS depuis C. Pour I : parent(I) = E, parent(E) = D, parent(D) = C. "
           "Avec une pile, le chemin vers A serait C → H → J → I → A (4 arcs) au lieu de C → B → A (2 arcs).")
    return figure("parents", f, cap)


def fig_matrice():
    arcs = [(0, 1), (0, 2), (1, 2), (2, 0), (2, 3)]
    n = 4
    M = [[1 if (i, j) in arcs else 0 for j in range(n)] for i in range(n)]
    f = F("fma", 360, 232, "Un graphe orienté d'ordre 4 et sa matrice d'adjacence")
    pos = {0: (38, 40), 1: (130, 40), 2: (130, 130), 3: (38, 130)}
    for a, b in arcs:
        bend = -14 if (b, a) in arcs else 0
        f.arc(pos[a], pos[b], "", bend=bend)
    for k, p in pos.items():
        f.node(p, str(k), "", r=15)
    f.text(14, 190, "Succ(2) = {0, 3}|Pred(2) = {0, 1}", "fs-s", anchor="start", dy=16)
    # matrice
    cw, x0, y0 = 30, 160, 40
    f.text(x0 + cw / 2, y0 - 6, "i \\ j", "fs-s")
    for j in range(n):
        f.text(x0 + cw + j * cw + cw / 2, y0 - 6, str(j), "fs-bt")
    for i in range(n):
        f.text(x0 + cw / 2, y0 + i * cw + cw / 2 + 5, str(i), "fs-bt")
        for j in range(n):
            cls = "fs-cell" + (" rowh" if i == 2 else "") + (" colh" if j == 2 else "")
            f.rect(x0 + cw + j * cw, y0 + i * cw, cw, cw, cls, rx=0)
            f.text(x0 + cw + j * cw + cw / 2, y0 + i * cw + cw / 2 + 5, str(M[i][j]), "fs-bt" if M[i][j] else "fs-s")
    f.text(x0 + 4, y0 + n * cw + 20, "ligne 2 = successeurs de 2", "fs-s", anchor="start")
    f.text(x0 + 4, y0 + n * cw + 37, "colonne 2 = prédécesseurs de 2", "fs-s", anchor="start")
    cap = ("m<sub>ij</sub> = 1 si j est un successeur de i. Lire les successeurs d'un sommet coûte un balayage de ligne, soit O(n) : "
           "explorer tous les sommets coûte donc O(n²) avec une matrice (et O(n + m) avec des listes de successeurs).")
    return figure("matrice", f, cap)


def fig_connexe():
    f = F("fcx", 360, 336, "Faible connexité : un graphe orienté faiblement connexe, puis trois composantes connexes")
    # --- haut : digraphe 1->2, 3->2, 3->4
    f.at(0, 0)
    f.text(6, 14, "Graphe orienté : exploration par les successeurs depuis 1", "fs-h", anchor="start")
    P = {"1": (36, 58), "2": (108, 58), "3": (108, 108), "4": (36, 108)}
    # 1 -> 2, 3 -> 2, 3 -> 4
    f.arc(P["1"], P["2"], "tree", r1=14, r2=14)
    f.arc(P["3"], P["2"], "", r1=14, r2=14)
    f.arc(P["3"], P["4"], "", r1=14, r2=14)
    f.node(P["1"], "1", "root", r=14); f.node(P["2"], "2", "c2", r=14)
    f.node(P["3"], "3", "off", r=14); f.node(P["4"], "4", "off", r=14)
    f.text(150, 54, "découverts : {1, 2}|3 et 4 : non atteignables", "fs-s", anchor="start", dy=14)
    f.text(150, 92, "ignorer le sens des arcs :|une seule composante|(faiblement connexe)", "fs-s", anchor="start", dy=14)
    f.line((0, 142), (360, 142), "fs-sep")
    # --- bas : connexite.txt
    f.at(0, 146)
    f.text(6, 14, "Graphe non orienté : une exploration par composante", "fs-h", anchor="start")
    base = {"A": (60, 45), "B": (30, 150), "C": (110, 150), "D": (150, 65), "E": (225, 60), "F": (225, 150),
            "G": (300, 45), "H": (390, 45), "I": (405, 150), "J": (315, 150)}
    pos = {k: (round(v[0] * 0.8 + 10), round(v[1] * 0.8 + 14)) for k, v in base.items()}
    edges = [("A", "B"), ("A", "C"), ("A", "D"), ("C", "D"), ("E", "F"), ("G", "H"), ("G", "J"), ("H", "I"), ("H", "J"), ("I", "J")]
    comp, starts = {}, []
    adj = {}
    for a, b in edges:
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    for s in sorted(base):
        if s not in comp:
            k = len(starts); starts.append(s)
            for x in bfs(adj, s)[0]:
                comp[x] = k
    assert starts == ["A", "E", "G"], starts
    for a, b in edges:
        f.arc(pos[a], pos[b], "", directed=False, r1=14, r2=14)
    for n, p in pos.items():
        f.node(p, n, "c%d" % (comp[n] + 1) if comp[n] else "c0", r=14, badge=(starts.index(n) + 1) if n in starts else None)
    f.text(180, 178, "n° = ordre des explorations (depuis A, E, G)", "fs-s")
    f.at(0, 0)
    cap = ("Haut : « atteignable » n'est pas « connecté » : depuis 1, on ne découvre que {1, 2}, alors que le graphe est faiblement connexe. "
           "Bas : connexite.txt, composantes {A, B, C, D}, {E, F} et {G, H, I, J}.")
    return figure("connexe", f, cap)


FIGS = [fig_simple_elem, fig_circuit_cycle, fig_desc_asc, fig_arbo, fig_file_pile, fig_bfs, fig_dfs, fig_parents, fig_matrice, fig_connexe]
NAMES = ["simple_elem", "circuit_cycle", "desc_asc", "arbo", "file_pile", "bfs", "dfs", "parents", "matrice", "connexe"]

# ---------------------------------------------------------------- CSS
CSS_BLOCK = CSS_BEGIN + """
.ffigs{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr));margin:14px 0;align-items:start}
.ffigs .ffig{margin:0}
.ffig svg{display:block;width:100%;height:auto;max-width:420px;margin:0 auto}
.ffig figcaption{margin-top:6px;text-align:left}
.ffig text{font-family:var(--font);fill:var(--ink)}
.ffig .fs-s{font-size:12.5px;fill:var(--muted)}
.ffig .fs-h{font:700 13px var(--head);fill:var(--ink)}
.ffig .fs-bt{font:700 14px var(--head);text-anchor:middle}
.ffig .fs-st{font:700 12px var(--head);fill:var(--hot);text-anchor:middle;paint-order:stroke;stroke:var(--surface);stroke-width:4px}
.ffig .fs-lb{font:600 12px var(--font);text-anchor:middle;paint-order:stroke;stroke:var(--surface);stroke-width:4px}
.ffig .fs-e{fill:none;stroke:var(--edge);stroke-width:2;stroke-linecap:round}
.ffig .fs-e.tree{stroke:var(--accent);stroke-width:3.4}
.ffig .fs-e.hot{stroke:var(--hot);stroke-width:3.2}
.ffig .fs-e.faint{stroke-width:1.6;stroke-dasharray:5 4;opacity:.6}
.ffig .fs-ar{fill:var(--edge)}
.ffig .fs-ar.tree{fill:var(--accent)}
.ffig .fs-ar.hot{fill:var(--hot)}
.ffig .fs-ar.faint{fill:var(--edge);opacity:.6}
.ffig .fs-n circle{fill:var(--surface);stroke:var(--ink);stroke-width:2}
.ffig .fs-n text{font:700 13px var(--head);fill:var(--ink);text-anchor:middle;dominant-baseline:central}
.ffig .fs-n.root circle{stroke:var(--accent);stroke-width:4;fill:var(--accent-soft)}
.ffig .fs-n.hotn circle{stroke:var(--hot);stroke-width:3.4}
.ffig .fs-n.doub circle{stroke:var(--hot);stroke-width:3.4}
.ffig .fs-n.c0 circle{fill:var(--c0f);stroke:var(--c0s)}
.ffig .fs-n.c1 circle{fill:var(--c1f);stroke:var(--c1s)}
.ffig .fs-n.c2 circle{fill:var(--c2f);stroke:var(--c2s)}
.ffig .fs-n.c3 circle{fill:var(--c3f);stroke:var(--c3s)}
.ffig .fs-n.c4 circle{fill:var(--c4f);stroke:var(--c4s)}
.ffig .fs-n.c5 circle{fill:var(--c5f);stroke:var(--c5s)}
.ffig .fs-n.root.c1 circle{fill:var(--c1f)}
.ffig .fs-n.off circle{fill:var(--bg);stroke:var(--muted);stroke-dasharray:4 3;stroke-width:1.8}
.ffig .fs-n.off text{fill:var(--muted)}
.ffig .fs-b circle{fill:var(--ink);stroke:var(--surface);stroke-width:1.5}
.ffig .fs-b text{font:700 11.5px var(--head);fill:var(--bg);text-anchor:middle;dominant-baseline:central}
.ffig .fs-sep{fill:none;stroke:var(--line);stroke-width:1.5}
.ffig .fs-box{fill:var(--surface2);stroke:var(--ink);stroke-width:1.6}
.ffig .fs-box.nxt{fill:var(--accent-soft);stroke:var(--accent);stroke-width:2.6}
.ffig .fs-in,.ffig .fs-out{fill:none;stroke:var(--muted);stroke-width:2}
.ffig .fs-wall{fill:none;stroke:var(--ink);stroke-width:4;stroke-linecap:round}
.ffig .fs-cell{fill:var(--surface);stroke:var(--line);stroke-width:1.2}
.ffig .fs-cell.hd{fill:var(--surface2)}
.ffig .fs-cell.hot{fill:var(--warm-soft);stroke:var(--hot)}
.ffig .fs-cell.rowh{fill:var(--accent-soft)}
.ffig .fs-cell.colh{fill:var(--warm-soft)}
.ffig .fs-cell.rowh.colh{fill:var(--c1f)}
""" + CSS_END


def write_css():
    with open(CSS, encoding="utf-8", newline="") as fh:
        css = fh.read()
    pat = re.compile(re.escape(CSS_BEGIN) + r".*?" + re.escape(CSS_END), re.S)
    if pat.search(css):
        css = pat.sub(lambda m: CSS_BLOCK, css)
    else:
        css = css.rstrip("\n") + "\n\n" + CSS_BLOCK + "\n"
    # r+ puis truncate : sous Windows, l'ouverture en "w" échoue parfois si le fichier est ouvert ailleurs (serveur local, navigateur)
    with open(CSS, "r+", encoding="utf-8", newline="") as fh:
        fh.seek(0)
        fh.write(css)
        fh.truncate()


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in zip(NAMES, FIGS):
        html = fn()
        with open(os.path.join(OUT, "f3_%s.html" % name), "w", encoding="utf-8", newline="\n") as fh:
            fh.write(html)
    write_css()
    print("%d figures écrites dans parts/figs/, CSS mis à jour." % len(FIGS))


if __name__ == "__main__":
    main()
