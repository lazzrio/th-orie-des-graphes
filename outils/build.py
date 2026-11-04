#!/usr/bin/env python3
"""Assemble index.html à partir des fragments de parts/ (et génère les matrices d'adjacence des corrigés).

Usage (depuis le dossier du site) :  python outils/build.py
Pour ajouter une semaine : créer des fragments pX_*.html, les ajouter à PARTS, ajouter un bouton dans p0_head.html
et des données dans js/qcm-data.js.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = ["p0_head.html", "p1_ch1.html", "p2_ch2.html", "p3_ch3.html", "p4_corriges.html", "p5_fiche_qcm_atelier.html"]


def sub(label):
    m = re.match(r"^([A-Za-z]+)(\d+)$", label)
    return f"{m.group(1)}<sub>{m.group(2)}</sub>" if m else label


def matrice(labels, pairs, directed):
    idx = {l: i for i, l in enumerate(labels)}
    n = len(labels)
    m = [[0] * n for _ in range(n)]
    for a, b in pairs:
        m[idx[a]][idx[b]] = 1
        if not directed:
            m[idx[b]][idx[a]] = 1
    h = '<div class="tw"><table class="mat"><tr><th></th>' + "".join(f"<th>{sub(l)}</th>" for l in labels) + "</tr>"
    for i, l in enumerate(labels):
        h += f"<tr><th>{sub(l)}</th>" + "".join(f'<td class="one">1</td>' if v else "<td>0</td>" for v in m[i]) + "</tr>"
    return h + "</table></div>"


MATS = {
    "ex1": matrice(list("ABCDEF"), [("A", "B"), ("B", "A"), ("C", "B"), ("B", "D"), ("B", "E"), ("B", "F"), ("C", "F"), ("F", "C"), ("F", "D")], True),
    "chem": matrice([f"p{i}" for i in range(1, 9)], [("p1", "p4"), ("p2", "p3"), ("p3", "p4"), ("p3", "p5"), ("p3", "p8"), ("p4", "p7"), ("p5", "p6"), ("p7", "p8")], False),
}

html = ""
for p in PARTS:
    with open(os.path.join(ROOT, "parts", p), encoding="utf-8") as f:
        html += f.read()
def inclure(m):
    with open(os.path.join(ROOT, "parts", m.group(1)), encoding="utf-8") as f:
        return f.read()


html = re.sub(r"\{\{PART:([\w.]+)\}\}", inclure, html)
html = re.sub(r"\{\{MAT:(\w+)\}\}", lambda m: MATS[m.group(1)], html)
with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8", newline="\n") as f:
    f.write(html)
print("index.html :", len(html), "caractères")
