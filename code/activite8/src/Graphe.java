import java.io.File;
import java.io.IOException;
import java.util.*;

/** Activité 8 : explorations (BFS, DFS itératif et récursif), chemins par les parents, faible connexité. */
public class Graphe {
    private int orient;                 // 0 : non orienté, 1 : orienté
    private ArrayList<Sommet> l_sommets;

    /* chargement du graphe (méthode fournie) */
    public void charger(String ficName) throws IOException {
        Scanner sc = new Scanner(new File(ficName));
        orient = sc.nextInt();
        sc.nextLine();
        int n = sc.nextInt();
        l_sommets = new ArrayList<Sommet>();
        sc.nextLine();
        int id;
        String nom;
        for (int i = 0; i < n; i++) {
            id = sc.nextInt();
            nom = sc.next();
            sc.nextLine();
            l_sommets.add(new Sommet(id, nom));
        }
        int id1, id2;
        while (sc.hasNextInt()) {        // (fourni : hasNextLine, qui plante s'il reste une ligne vide en fin de fichier)
            id1 = sc.nextInt();
            id2 = sc.nextInt();
            l_sommets.get(id1).ajouterSuccesseur(l_sommets.get(id2));
            if (orient == 0) l_sommets.get(id2).ajouterSuccesseur(l_sommets.get(id1));
            if (sc.hasNextLine()) sc.nextLine();
        }
        sc.close();
    }

    public Sommet getSommet(int id) {
        for (Sommet s : l_sommets) {
            if (s.getId() == id) return s;
        }
        return null;
    }

    public int getOrdre() {
        return l_sommets.size();
    }

    /* ================= I. Explorations ================= */

    /** Exploration en largeur (file FIFO) : liste des sommets dans l'ordre de découverte. */
    public ArrayList<Sommet> explorerLargeur(Sommet s) {
        ArrayList<Sommet> l_decouverts = new ArrayList<Sommet>();
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        boolean[] marque = new boolean[l_sommets.size()];
        marque[s.getId()] = true;              // on marque dès la découverte
        file.add(s);
        l_decouverts.add(s);
        while (!file.isEmpty()) {
            Sommet x = file.poll();            // le plus ancien sommet en attente
            for (Sommet succ : x.getSuccesseurs()) {
                if (!marque[succ.getId()]) {
                    marque[succ.getId()] = true;
                    file.add(succ);
                    l_decouverts.add(succ);
                }
            }
        }
        return l_decouverts;
    }

    /** Exploration en profondeur itérative avec pile (méthode fournie). */
    public ArrayList<Sommet> explorerProfondeur_it(Sommet s) {
        ArrayList<Sommet> l_decouverts = new ArrayList<Sommet>();
        Stack<Sommet> pile = new Stack<Sommet>();
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            marque.add(i, false);
        }
        pile.push(s);
        marque.set(s.getId(), true);
        l_decouverts.add(s);
        while (!pile.isEmpty()) {
            s = pile.pop();
            for (Sommet succ : s.getSuccesseurs()) {
                if (!(marque.get(succ.getId()))) {
                    marque.set(succ.getId(), true);
                    pile.push(succ);
                    l_decouverts.add(succ);
                }
            }
        }
        return l_decouverts;
    }

    /** Exploration en profondeur récursive : crée et initialise les structures puis lance la récursion. */
    public ArrayList<Sommet> explorerProfondeur_rec(Sommet s) {
        ArrayList<Sommet> l_decouverts = new ArrayList<Sommet>();
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) marque.add(false);
        marque.set(s.getId(), true);
        l_decouverts.add(s);
        parcoursProfondeur_rec(s, l_decouverts, marque);
        return l_decouverts;
    }

    /** Méthode récursive : se rappelle sur chaque successeur non marqué (la pile d'appels joue le rôle de la pile). */
    public void parcoursProfondeur_rec(Sommet s, ArrayList<Sommet> l_decouverts, ArrayList<Boolean> marque) {
        for (Sommet succ : s.getSuccesseurs()) {
            if (!marque.get(succ.getId())) {
                marque.set(succ.getId(), true);
                l_decouverts.add(succ);
                parcoursProfondeur_rec(succ, l_decouverts, marque);
            }
        }
    }

    /* ================= II. Retrouver les chemins ================= */

    /** BFS en mémorisant le parent de chaque sommet découvert (case = null : pas de parent). */
    public ArrayList<Sommet> BFS_Parents(Sommet s) {
        ArrayList<Sommet> l_parents = new ArrayList<Sommet>();
        for (int i = 0; i < l_sommets.size(); i++) l_parents.add(null);
        boolean[] marque = new boolean[l_sommets.size()];
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        marque[s.getId()] = true;
        file.add(s);
        while (!file.isEmpty()) {
            Sommet x = file.poll();
            for (Sommet succ : x.getSuccesseurs()) {
                if (!marque[succ.getId()]) {
                    marque[succ.getId()] = true;
                    l_parents.set(succ.getId(), x);   // succ a été découvert par x
                    file.add(succ);
                }
            }
        }
        return l_parents;
    }

    /** DFS récursif en mémorisant les parents. */
    public ArrayList<Sommet> DFS_Parents(Sommet s) {
        ArrayList<Sommet> l_parents = new ArrayList<Sommet>();
        for (int i = 0; i < l_sommets.size(); i++) l_parents.add(null);
        boolean[] marque = new boolean[l_sommets.size()];
        marque[s.getId()] = true;
        dfsParents(s, marque, l_parents);
        return l_parents;
    }

    private void dfsParents(Sommet x, boolean[] marque, ArrayList<Sommet> l_parents) {
        for (Sommet succ : x.getSuccesseurs()) {
            if (!marque[succ.getId()]) {
                marque[succ.getId()] = true;
                l_parents.set(succ.getId(), x);
                dfsParents(succ, marque, l_parents);
            }
        }
    }

    /** Chemin de s1 à s2 en remontant les parents depuis s2 ; liste vide si s2 n'est pas atteignable. */
    public ArrayList<Sommet> retrouverChemin(Sommet s1, Sommet s2, ArrayList<Sommet> l_parents) {
        ArrayList<Sommet> chemin = new ArrayList<Sommet>();
        Sommet x = s2;
        while (x != null && x != s1) {
            chemin.add(0, x);                 // on insère en tête : on remonte de s2 vers s1
            x = l_parents.get(x.getId());
        }
        if (x == null) return new ArrayList<Sommet>();   // on n'est jamais arrivé à s1 : pas de chemin
        chemin.add(0, s1);
        return chemin;
    }

    /* ================= III. Faible connexité ================= */

    /** Voisins sans tenir compte de l'orientation : successeurs + prédécesseurs. */
    private ArrayList<ArrayList<Sommet>> voisinsNonOrientes() {
        ArrayList<ArrayList<Sommet>> v = new ArrayList<ArrayList<Sommet>>();
        for (int i = 0; i < l_sommets.size(); i++) v.add(new ArrayList<Sommet>());
        for (Sommet s : l_sommets) {
            for (Sommet t : s.getSuccesseurs()) {
                if (!v.get(s.getId()).contains(t)) v.get(s.getId()).add(t);
                if (!v.get(t.getId()).contains(s)) v.get(t.getId()).add(s);
            }
        }
        return v;
    }

    /** BFS sur le graphe non orienté associé, en marquant les sommets découverts. */
    private ArrayList<Sommet> explorerNonOriente(Sommet s, boolean[] marque, ArrayList<ArrayList<Sommet>> v) {
        ArrayList<Sommet> cc = new ArrayList<Sommet>();
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        marque[s.getId()] = true;
        file.add(s);
        cc.add(s);
        while (!file.isEmpty()) {
            Sommet x = file.poll();
            for (Sommet y : v.get(x.getId())) {
                if (!marque[y.getId()]) {
                    marque[y.getId()] = true;
                    file.add(y);
                    cc.add(y);
                }
            }
        }
        return cc;
    }

    /** Vrai si une seule exploration (orientation ignorée) découvre tous les sommets. */
    public boolean testerConnexite() {
        if (l_sommets.isEmpty()) return true;
        boolean[] marque = new boolean[l_sommets.size()];
        return explorerNonOriente(l_sommets.get(0), marque, voisinsNonOrientes()).size() == l_sommets.size();
    }

    /** Toutes les composantes connexes : une exploration par sommet encore non marqué. */
    public ArrayList<ArrayList<Sommet>> chercherCC() {
        ArrayList<ArrayList<Sommet>> lcc = new ArrayList<ArrayList<Sommet>>();
        ArrayList<ArrayList<Sommet>> v = voisinsNonOrientes();
        boolean[] marque = new boolean[l_sommets.size()];
        for (Sommet s : l_sommets) {
            if (!marque[s.getId()]) lcc.add(explorerNonOriente(s, marque, v));
        }
        return lcc;
    }

    public void afficherListeSucc() {
        for (Sommet s : l_sommets) {
            System.out.print(s.getId() + ":");
            for (Sommet succ : s.getSuccesseurs()) {
                System.out.print(succ.getId() + " ");
            }
            System.out.println();
        }
    }
}
