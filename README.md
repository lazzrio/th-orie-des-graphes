# Théorie des graphes — Ing2 (ECE)

Site de révision statique : cours semaine par semaine, exercices et activités corrigés, fiche « À retenir », QCM par semaine et atelier de coloration pas à pas.

## Contenu

**Semaine 1** (chapitres 1, 2 et 3 partie 1)
- Cours : présentation des graphes, modélisation et représentation (UML, matrice d'adjacence, liste d'arêtes, liste de successeurs), coloration.
- Corrigés : activités 1, 2 (sujets A et B), 3 et 4, exercices 1 à 5, questions sur K<sub>n</sub>.
- Fiche « À retenir » imprimable.
- QCM de 46 questions corrigées avec explications (progression enregistrée dans le navigateur).
- Atelier : algorithme séquentiel, degré décroissant, DSATUR ou ordre manuel sur 7 graphes.

**Semaine 2** (chapitre 3 partie 2 et exploration d'un graphe)
- Cours : exhaustif / glouton / heuristiques, complexité, séquentiel, séquentiel ordonné, Welsh-Powell, DSATUR, encadrement de χ(G) ; exploration d'un graphe (file, pile).
- Corrigés : exercice 6, activité 5 (code Java compilé et exécuté sur les 6 jeux de données fournis) et activité 6 (exploration d'un wiki).
- Fiche « À retenir » et QCM de 57 questions.
- Atelier de coloration (nouveau mode Welsh-Powell) et atelier d'exploration (file / pile).

**Semaine 3** (chapitre 4 : exploration des graphes)
- Cours : chemins et chaînes (simples, élémentaires), descendants et ascendants, circuits, arborescences ; parcours en largeur (file) et en profondeur (pile, récursivité) ; reconstruction des chemins par les parents (arborescence de parcours) ; faible connexité et composantes connexes.
- Corrigés : questions du cours, exercice 7 (tableaux pas à pas file et pile), activité 7, exercice 8, activité 8 (code Java complété, compilé et exécuté sur `exercice7.txt`, `activite6_wiki.txt` et `connexite.txt`).
- Fiche « À retenir » (rappels S1-S2, vocabulaire, parcours, chemins, connexité, pièges de QCM, 10 schémas SVG générés par `outils/gen_fiche_figs.py`) et QCM de 51 questions.
- Atelier d'exploration enrichi : choix du graphe (wiki, exercice 7, connexite.txt), arborescence des parents, chemin reconstruit.

**Semaine 4** (chapitre 5 : plus courts chemins pondérés, Dijkstra)
- Cours : graphes pondérés, longueur pondérée, limites du BFS, brute force, algorithme de Dijkstra (preuve, arrêt, complexité selon l'implémentation), files de priorité (`PriorityQueue`), limites et perspectives ; activité 9 (modèle du métro, association qualifiée, `HashMap`, diagrammes UML, stratégies BFS / BFS_DFS / BFS préférentiel, comparaison globale).
- Corrigés : questions du cours, exercice 9 (tableau complet des étapes, arborescence, chemins) et les 12 questions de l'activité 9 (programme du métro fourni compilé et exécuté sur `troncons_voies.txt`).
- Fiche « À retenir » et QCM de 66 questions.
- Atelier Dijkstra pas à pas (graphe de l'exercice 9, contre-exemple du BFS, réseau libre) avec comparaison au BFS.
- Onglet **Présentations** : deux diaporamas (activité 9 ; chapitre 5 / exercice 9) au style de la semaine 3, avec téléchargement `.pptx` et texte oral (`presentations/s4/`).

## Utilisation

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```
python -m http.server 8000
```

## Structure

- `index.html` : page unique, générée par `outils/build.py` à partir de `parts/`
- `parts/` : fragments HTML (cours, corrigés, fiche, QCM, atelier)
- `css/style.css`, `js/graph.js` (rendu SVG des graphes et diagrammes de classes), `js/app.js`, `js/atelier.js`, `js/qcm-data.js`
- `code/Graphes.java` (semaine 1), `code/Semaine2.java` (Welsh-Powell, parcours en largeur et en profondeur) et `code/Dijkstra.java` (semaine 4 : Dijkstra par tableau et par `PriorityQueue`, exercice 9 et contre-exemple du BFS), `code/activite8/` (semaine 3 : `Graphe`, `Sommet`, `Main` ; uniquement les méthodes demandées par l'énoncé : BFS, DFS itératif et récursif, parents BFS et DFS, chemins, composantes connexes) : implémentations Java compilées et exécutées pour vérifier les corrigés

Pour modifier le contenu : éditer les fichiers de `parts/` puis lancer `python outils/build.py`.
Les schémas de la fiche de la semaine 3 sont des fragments `parts/figs/f3_*.html` produits par `python outils/gen_fiche_figs.py` (qui écrit aussi leur CSS dans `css/style.css`, entre deux marqueurs `FIGURES FICHE S3`) ; relancer ce script puis `build.py` après toute modification.
Pour ajouter une semaine : nouveaux fragments dans `parts/`, une entrée dans `PARTS` de `build.py`, un bouton dans la barre de navigation (`p0_head.html`) et un bloc dans `js/qcm-data.js`.
