import java.util.*;

/** Représentation A : matrice d'adjacence (graphe orienté simple). */
class GrapheMatrice {
    private final int ordre;
    private final int[][] matAdj;

    GrapheMatrice(int ordre) {
        this.ordre = ordre;
        this.matAdj = new int[ordre][ordre];
    }

    void ajouterArc(int i, int j) { matAdj[i][j] = 1; }

    boolean sontAdjacents(int i, int j) { return matAdj[i][j] == 1; }   // O(1)

    int nbSuccesseurs(int i) {                                          // somme de la ligne i
        int n = 0;
        for (int j = 0; j < ordre; j++) n += matAdj[i][j];
        return n;
    }

    int nbPredecesseurs(int j) {                                        // somme de la colonne j
        int n = 0;
        for (int i = 0; i < ordre; i++) n += matAdj[i][j];
        return n;
    }

    void afficher() {
        for (int[] ligne : matAdj) System.out.println(Arrays.toString(ligne));
    }
}

/** Représentation B : liste de sommets + liste d'arêtes. */
class Sommet {
    final String id;
    Sommet(String id) { this.id = id; }
    @Override public String toString() { return id; }
}

class Arete {
    final Sommet origine, extremite;
    final double info;
    Arete(Sommet o, Sommet e, double info) { this.origine = o; this.extremite = e; this.info = info; }
    boolean touche(Sommet s) { return origine == s || extremite == s; }
    boolean relie(Sommet a, Sommet b) {                                  // cas non orienté
        return (origine == a && extremite == b) || (origine == b && extremite == a);
    }
}

class GrapheAretes {
    private final List<Sommet> sommets = new ArrayList<>();
    private final List<Arete> aretes = new ArrayList<>();

    Sommet ajouterSommet(String id) { Sommet s = new Sommet(id); sommets.add(s); return s; }
    void ajouterArete(Sommet a, Sommet b, double info) { aretes.add(new Arete(a, b, info)); }

    boolean adjacents(Sommet a, Sommet b) {                              // O(m)
        for (Arete e : aretes) if (e.relie(a, b)) return true;
        return false;
    }

    List<Sommet> voisins(Sommet s) {                                     // O(m)
        List<Sommet> res = new ArrayList<>();
        for (Arete e : aretes) {
            if (e.origine == s) res.add(e.extremite);
            else if (e.extremite == s) res.add(e.origine);
        }
        return res;
    }

    void supprimerSommet(Sommet s) {                                     // cohérence : supprimer aussi les arêtes incidentes
        aretes.removeIf(e -> e.touche(s));
        sommets.remove(s);
    }

    int taille() { return aretes.size(); }
    int ordre() { return sommets.size(); }
}

/** Représentation C : chaque sommet connaît ses successeurs. */
class SommetS {
    final String id;
    final List<SommetS> successeurs = new ArrayList<>();
    final List<SommetS> predecesseurs = new ArrayList<>();               // optionnel, pour accéder vite aux prédécesseurs
    SommetS(String id) { this.id = id; }

    void ajouterSuccesseur(SommetS autre) {
        successeurs.add(autre);
        autre.predecesseurs.add(this);                                   // maintenir la cohérence des deux listes
    }

    @Override public String toString() { return id; }
}

public class Graphes {

    /** Algorithme séquentiel : chaque sommet reçoit la plus petite couleur non utilisée par ses voisins déjà colorés. */
    static int[] sequentiel(boolean[][] adj, int[] ordre) {
        int n = adj.length;
        int[] couleur = new int[n];
        Arrays.fill(couleur, -1);
        for (int i : ordre) {
            int c = 0;
            boolean test;
            do {
                test = true;
                for (int j = 0; j < n; j++) {
                    if (adj[i][j] && couleur[j] == c) test = false;
                }
                if (!test) c++;
            } while (!test);
            couleur[i] = c;
        }
        return couleur;
    }

    static int[] ordreDegreDecroissant(boolean[][] adj) {
        int n = adj.length;
        Integer[] idx = new Integer[n];
        int[] deg = new int[n];
        for (int i = 0; i < n; i++) {
            idx[i] = i;
            for (int j = 0; j < n; j++) if (adj[i][j]) deg[i]++;
        }
        Arrays.sort(idx, (a, b) -> deg[b] - deg[a]);   // tri stable : à égalité, l'ordre d'origine est conservé
        int[] res = new int[n];
        for (int i = 0; i < n; i++) res[i] = idx[i];
        return res;
    }

    static int[] dsatur(boolean[][] adj) {
        int n = adj.length;
        int[] couleur = new int[n];
        Arrays.fill(couleur, -1);
        for (int etape = 0; etape < n; etape++) {
            int best = -1, bestSat = -1, bestDeg = -1;
            for (int i = 0; i < n; i++) {
                if (couleur[i] != -1) continue;
                Set<Integer> vues = new HashSet<>();
                int deg = 0;
                for (int j = 0; j < n; j++) {
                    if (!adj[i][j]) continue;
                    deg++;
                    if (couleur[j] != -1) vues.add(couleur[j]);
                }
                if (vues.size() > bestSat || (vues.size() == bestSat && deg > bestDeg)) {
                    best = i; bestSat = vues.size(); bestDeg = deg;
                }
            }
            int c = 0;
            while (true) {
                boolean ok = true;
                for (int j = 0; j < n; j++) if (adj[best][j] && couleur[j] == c) ok = false;
                if (ok) break;
                c++;
            }
            couleur[best] = c;
        }
        return couleur;
    }

    static int nbCouleurs(int[] couleur) {
        int max = -1;
        for (int c : couleur) max = Math.max(max, c);
        return max + 1;
    }

    static boolean propre(boolean[][] adj, int[] couleur) {
        for (int i = 0; i < adj.length; i++)
            for (int j = 0; j < adj.length; j++)
                if (adj[i][j] && couleur[i] == couleur[j]) return false;
        return true;
    }

    /** Nombre chromatique par force brute (petits graphes seulement). */
    static int chi(boolean[][] adj) {
        int n = adj.length;
        for (int k = 1; k <= n; k++) if (colorable(adj, new int[n], 0, k)) return k;
        return n;
    }

    static boolean colorable(boolean[][] adj, int[] col, int v, int k) {
        if (v == adj.length) return true;
        for (int c = 0; c < k; c++) {
            boolean ok = true;
            for (int u = 0; u < v; u++) if (adj[v][u] && col[u] == c) { ok = false; break; }
            if (!ok) continue;
            col[v] = c;
            if (colorable(adj, col, v + 1, k)) return true;
        }
        return false;
    }

    static boolean[][] graphe(int n, int[][] aretes) {
        boolean[][] adj = new boolean[n][n];
        for (int[] e : aretes) { adj[e[0]][e[1]] = true; adj[e[1]][e[0]] = true; }
        return adj;
    }

    public static void main(String[] args) {
        // ---- Exercice 1 : matrice d'adjacence (A..F = 0..5)
        GrapheMatrice g = new GrapheMatrice(6);
        int[][] arcs = {{0,1},{1,0},{2,1},{1,3},{1,4},{1,5},{2,5},{5,2},{5,3}};
        for (int[] a : arcs) g.ajouterArc(a[0], a[1]);
        g.afficher();
        System.out.println("succ(B)=" + g.nbSuccesseurs(1) + " pred(D)=" + g.nbPredecesseurs(3) + " adj(A,B)=" + g.sontAdjacents(0, 1));

        // ---- Liste d'arêtes
        GrapheAretes ga = new GrapheAretes();
        Sommet a = ga.ajouterSommet("A"), b = ga.ajouterSommet("B"), c = ga.ajouterSommet("C");
        ga.ajouterArete(a, b, 1.0); ga.ajouterArete(b, c, 2.5);
        System.out.println("adj(A,C)=" + ga.adjacents(a, c) + " voisins(B)=" + ga.voisins(b));
        ga.supprimerSommet(b);
        System.out.println("apres suppression de B : ordre=" + ga.ordre() + " taille=" + ga.taille());

        // ---- Liste de successeurs
        SommetS x = new SommetS("X"), y = new SommetS("Y");
        x.ajouterSuccesseur(y);
        System.out.println("succ(X)=" + x.successeurs + " pred(Y)=" + y.predecesseurs);

        // ---- Exercice 4 : produits chimiques p1..p8 = 0..7
        boolean[][] chim = graphe(8, new int[][]{{0,3},{1,2},{2,3},{2,4},{2,7},{3,6},{4,5},{6,7}});
        int[] c1 = sequentiel(chim, new int[]{0,1,2,3,4,5,6,7});
        System.out.println("chim ordre p1..p8 : " + Arrays.toString(c1) + " -> " + nbCouleurs(c1) + " zones, propre=" + propre(chim, c1));
        int[] c2 = sequentiel(chim, new int[]{2,3,4,6,7,0,1,5});
        System.out.println("chim ordre p3,p4,p5,p7,p8,p1,p2,p6 : " + Arrays.toString(c2) + " -> " + nbCouleurs(c2) + " zones, propre=" + propre(chim, c2));
        int[] c3 = sequentiel(chim, ordreDegreDecroissant(chim));
        System.out.println("chim degre decroissant : " + Arrays.toString(c3) + " -> " + nbCouleurs(c3));
        int[] c4 = dsatur(chim);
        System.out.println("chim dsatur : " + Arrays.toString(c4) + " -> " + nbCouleurs(c4));
        System.out.println("chim chi = " + chi(chim));

        // ---- Exercice 5 : s1..s12 = 0..11
        boolean[][] e5 = graphe(12, new int[][]{{2,6},{2,7},{2,8},{2,1},{2,10},{3,9},{3,5},{3,0},{3,4},{0,11},{0,10},{1,4}});
        int[] ordre5 = {2,3,0,1,4,10,5,6,7,8,9,11};   // s3,s4,s1,s2,s5,s11,s6,s7,s8,s9,s10,s12
        int[] d5 = sequentiel(e5, ordre5);
        System.out.println("ex5 ordre du tableau : " + Arrays.toString(d5) + " -> " + nbCouleurs(d5) + " couleurs, propre=" + propre(e5, d5));
        int[] od = ordreDegreDecroissant(e5);
        int[] d5b = sequentiel(e5, od);
        System.out.println("ex5 degre decroissant : ordre " + Arrays.toString(od) + " -> " + nbCouleurs(d5b));
        int[] d5c = dsatur(e5);
        System.out.println("ex5 dsatur : " + Arrays.toString(d5c) + " -> " + nbCouleurs(d5c));
        System.out.println("ex5 chi = " + chi(e5));
        int[] deg = new int[12];
        for (int i = 0; i < 12; i++) for (int j = 0; j < 12; j++) if (e5[i][j]) deg[i]++;
        System.out.println("ex5 degres : " + Arrays.toString(deg));

        // ---- Activité 4 : examens A,Ch,Cn,E,I,M,Me,P,S = 0..8
        String[] nom = {"A","Ch","Cn","E","I","M","Me","P","S"};
        int[][][] groupes = {{{2,3,5,8}}, {{0,1,3,8}}, {{1,4,7}}, {{2,4,6}}, {{1,5,6}}};
        boolean[][] ex = new boolean[9][9];
        for (int[][] gr : groupes) for (int u : gr[0]) for (int v : gr[0]) if (u != v) ex[u][v] = true;
        int[] od4 = ordreDegreDecroissant(ex);
        int[] e1 = sequentiel(ex, od4);
        StringBuilder sb = new StringBuilder();
        for (int i : od4) sb.append(nom[i]).append(" ");
        System.out.println("exams ordre WP : " + sb + "-> " + Arrays.toString(e1) + " -> " + nbCouleurs(e1) + " chi=" + chi(ex));
        // sans P et S : on retire les sommets 7 et 8
        int[] gardes = {0,1,2,3,4,5,6};
        boolean[][] ex2 = new boolean[7][7];
        for (int i = 0; i < 7; i++) for (int j = 0; j < 7; j++) ex2[i][j] = ex[gardes[i]][gardes[j]];
        System.out.println("exams sans P,S : chi=" + chi(ex2) + " dsatur=" + nbCouleurs(dsatur(ex2)) + " WP=" + nbCouleurs(sequentiel(ex2, ordreDegreDecroissant(ex2))));

        // ---- Kn
        for (int n = 2; n <= 6; n++) System.out.println("K" + n + " : aretes = " + (n * (n - 1) / 2));
    }
}
