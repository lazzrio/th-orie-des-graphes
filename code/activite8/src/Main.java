import java.io.IOException;
import java.util.ArrayList;

/** Activité 8 : tests sur les trois fichiers fournis (exercice7.txt, activite6_wiki.txt, connexite.txt). */
public class Main {
    public static void main(String[] args) throws IOException {
        String dossier = args.length > 0 ? args[0] : ".";
        String[] fichiers = {"exercice7.txt", "activite6_wiki.txt", "connexite.txt"};
        int[] departs = {2, 0, 0};      // C pour l'exercice 7, A pour le wiki et pour connexite
        for (int f = 0; f < fichiers.length; f++) {
            Graphe g = new Graphe();
            g.charger(dossier + "/" + fichiers[f]);
            Sommet s0 = g.getSommet(departs[f]);
            System.out.println("========== " + fichiers[f] + " (départ " + s0.getName() + ") ==========");
            g.afficherListeSucc();
            System.out.println("BFS (file)          : " + noms(g.explorerLargeur(s0)));
            System.out.println("DFS itératif (pile) : " + noms(g.explorerProfondeur_it(s0)));
            System.out.println("DFS récursif        : " + noms(g.explorerProfondeur_rec(s0)));

            ArrayList<Sommet> pb = g.BFS_Parents(s0), pd = g.DFS_Parents(s0);
            System.out.println("Parents BFS : " + parents(g, pb));
            System.out.println("Parents DFS : " + parents(g, pd));
            for (int id = 0; id < g.getOrdre(); id++) {
                Sommet cible = g.getSommet(id);
                if (cible == s0) continue;
                ArrayList<Sommet> cb = g.retrouverChemin(s0, cible, pb), cd = g.retrouverChemin(s0, cible, pd);
                System.out.println("  " + s0.getName() + " -> " + cible.getName() + " : BFS " + chemin(cb) + " | DFS " + chemin(cd));
            }
            boolean cx = g.testerConnexite();
            System.out.println("Faiblement connexe : " + cx);
            ArrayList<ArrayList<Sommet>> lcc = g.chercherCC();
            System.out.println("Composantes connexes (" + lcc.size() + ") :");
            for (ArrayList<Sommet> cc : lcc) System.out.println("  " + noms(cc));
        }
    }

    static String noms(ArrayList<Sommet> l) {
        StringBuilder b = new StringBuilder();
        for (Sommet s : l) b.append(s.getName()).append(' ');
        return b.toString().trim();
    }

    static String parents(Graphe g, ArrayList<Sommet> p) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < p.size(); i++) b.append(g.getSommet(i).getName()).append('=').append(p.get(i) == null ? "-" : p.get(i).getName()).append(' ');
        return b.toString().trim();
    }

    static String chemin(ArrayList<Sommet> c) {
        return c.isEmpty() ? "aucun" : noms(c).replace(' ', '-') + " (" + (c.size() - 1) + " arcs)";
    }

    public static void afficher_ordre_decouverte(ArrayList<Sommet> l) {
        for (Sommet s : l) System.out.println(s.getName());
    }
}
