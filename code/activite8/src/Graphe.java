import java.io.File;
import java.io.IOException;
import java.util.*;

public class Graphe {
    /* attributs */
    private int orient;                       // 0 : non orienté, 1 : orienté
    private ArrayList<Sommet> l_sommets;

    /* chargement du graphe (fourni, avec hasNextInt à la place de hasNextLine) */
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
        while (sc.hasNextInt()) {             // hasNextLine plantait sur une ligne vide en fin de fichier
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

    /* ---------- I. Explorations ---------- */

    /* exploration en largeur à partir d'un sommet s : on utilise une file
       retour : liste des sommets découverts, dans l'ordre */
    public ArrayList<Sommet> explorerLargeur(Sommet s) {
        ArrayList<Sommet> l_decouverts = new ArrayList<Sommet>();
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            marque.add(i, false);
        }
        file.add(s);
        marque.set(s.getId(), true);
        l_decouverts.add(s);
        while (!file.isEmpty()) {
            s = file.poll();                  // le plus ancien sommet en attente
            for (Sommet succ : s.getSuccesseurs()) {
                if (!(marque.get(succ.getId()))) {
                    marque.set(succ.getId(), true);
                    file.add(succ);
                    l_decouverts.add(succ);
                }
            }
        }
        return l_decouverts;
    }

    /* exploration en profondeur à partir d'un sommet s : version itérative avec pile (fournie) */
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

    /* exploration en profondeur : version récursive */
    public ArrayList<Sommet> explorerProfondeur_rec(Sommet s) {
        ArrayList<Sommet> l_decouverts = new ArrayList<Sommet>();
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            marque.add(i, false);
        }
        marque.set(s.getId(), true);
        l_decouverts.add(s);
        parcoursProfondeur_rec(s, l_decouverts, marque);
        return l_decouverts;
    }

    public void parcoursProfondeur_rec(Sommet s, ArrayList<Sommet> l_decouverts, ArrayList<Boolean> marque) {
        for (Sommet succ : s.getSuccesseurs()) {
            if (!(marque.get(succ.getId()))) {
                marque.set(succ.getId(), true);
                l_decouverts.add(succ);
                parcoursProfondeur_rec(succ, l_decouverts, marque);    // on s'enfonce avant de passer au successeur suivant
            }
        }
    }

    /* ---------- II. Retrouver les chemins ---------- */

    /* exploration en largeur qui mémorise le parent de chaque sommet découvert
       retour : liste des parents, indexée par l'id (null = pas de parent) */
    public ArrayList<Sommet> BFS_Parents(Sommet s) {
        ArrayList<Sommet> l_parents = new ArrayList<Sommet>(l_sommets.size());
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            l_parents.add(i, null);
            marque.add(i, false);
        }
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        file.add(s);
        marque.set(s.getId(), true);
        while (!file.isEmpty()) {
            s = file.poll();
            for (Sommet succ : s.getSuccesseurs()) {
                if (!(marque.get(succ.getId()))) {
                    marque.set(succ.getId(), true);
                    l_parents.set(succ.getId(), s);       // succ a été découvert depuis s
                    file.add(succ);
                }
            }
        }
        return l_parents;
    }

    /* même chose en profondeur (version récursive) */
    public ArrayList<Sommet> DFS_Parents(Sommet s) {
        ArrayList<Sommet> l_parents = new ArrayList<Sommet>(l_sommets.size());
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            l_parents.add(i, null);
            marque.add(i, false);
        }
        marque.set(s.getId(), true);
        parcoursProfondeur_parents(s, marque, l_parents);
        return l_parents;
    }

    public void parcoursProfondeur_parents(Sommet s, ArrayList<Boolean> marque, ArrayList<Sommet> l_parents) {
        for (Sommet succ : s.getSuccesseurs()) {
            if (!(marque.get(succ.getId()))) {
                marque.set(succ.getId(), true);
                l_parents.set(succ.getId(), s);
                parcoursProfondeur_parents(succ, marque, l_parents);
            }
        }
    }

    /* chemin de s1 à s2 : on remonte les parents depuis s2
       retour : liste vide si s2 n'est pas atteignable depuis s1 */
    public ArrayList<Sommet> retrouverChemin(Sommet s1, Sommet s2, ArrayList<Sommet> l_parents) {
        ArrayList<Sommet> chemin = new ArrayList<Sommet>();
        Sommet courant = s2;
        while (courant != null && courant != s1) {
            chemin.add(0, courant);                       // on ajoute en tête : on remonte de s2 vers s1
            courant = l_parents.get(courant.getId());
        }
        if (courant == null) {
            return new ArrayList<Sommet>();               // on n'est jamais arrivé à s1
        }
        chemin.add(0, s1);
        return chemin;
    }

    /* ---------- III. Faible connexité ---------- */

    /* liste des voisins de chaque sommet sans tenir compte de l'orientation : successeurs + prédécesseurs */
    private ArrayList<ArrayList<Sommet>> calculerVoisins() {
        ArrayList<ArrayList<Sommet>> voisins = new ArrayList<ArrayList<Sommet>>();
        for (int i = 0; i < l_sommets.size(); i++) {
            voisins.add(new ArrayList<Sommet>());
        }
        for (Sommet s : l_sommets) {
            for (Sommet succ : s.getSuccesseurs()) {
                voisins.get(s.getId()).add(succ);
                voisins.get(succ.getId()).add(s);         // le lien compte aussi dans l'autre sens
            }
        }
        return voisins;
    }

    /* exploration en largeur à partir de s sur les voisins ; marque est commun à toutes les explorations
       retour : les sommets découverts = la composante connexe de s */
    private ArrayList<Sommet> explorerComposante(Sommet s, ArrayList<Boolean> marque, ArrayList<ArrayList<Sommet>> voisins) {
        ArrayList<Sommet> composante = new ArrayList<Sommet>();
        Queue<Sommet> file = new ArrayDeque<Sommet>();
        file.add(s);
        marque.set(s.getId(), true);
        composante.add(s);
        while (!file.isEmpty()) {
            s = file.poll();
            for (Sommet v : voisins.get(s.getId())) {
                if (!(marque.get(v.getId()))) {
                    marque.set(v.getId(), true);
                    file.add(v);
                    composante.add(v);
                }
            }
        }
        return composante;
    }

    /* vrai si une seule exploration découvre tous les sommets */
    public boolean testerConnexite() {
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            marque.add(i, false);
        }
        ArrayList<Sommet> decouverts = explorerComposante(l_sommets.get(0), marque, calculerVoisins());
        return decouverts.size() == l_sommets.size();
    }

    /* une exploration par composante connexe */
    public ArrayList<ArrayList<Sommet>> chercherCC() {
        ArrayList<ArrayList<Sommet>> l_composantes = new ArrayList<ArrayList<Sommet>>();
        ArrayList<ArrayList<Sommet>> voisins = calculerVoisins();
        ArrayList<Boolean> marque = new ArrayList<Boolean>(l_sommets.size());
        for (int i = 0; i < l_sommets.size(); i++) {
            marque.add(i, false);
        }
        for (Sommet s : l_sommets) {
            if (!(marque.get(s.getId()))) {
                l_composantes.add(explorerComposante(s, marque, voisins));
            }
        }
        return l_composantes;
    }

    /* Affichage des listes de successeurs */
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
