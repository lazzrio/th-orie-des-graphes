import java.io.IOException;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) throws IOException {
        Graphe g=new Graphe();
        g.charger("exercice7.txt");          // ou "activite6_wiki.txt"
        g.afficherListeSucc();
        Sommet depart=g.getSommet(2);        // C pour exercice7.txt (id 2), A pour activite6_wiki.txt (id 0)

        System.out.println("Exploration en largeur (BFS) :");
        System.out.println("Sommets découverts dans l'ordre :");
        afficher_ordre_decouverte(g.explorerLargeur(depart));

        System.out.println("Exploration en profondeur itératif avec pile (DFS) :");
        System.out.println("Sommets découverts dans l'ordre :");
        afficher_ordre_decouverte(g.explorerProfondeur_it(depart));

        System.out.println("Exploration en profondeur récursif (DFS récursif) :");
        System.out.println("Sommets découverts dans l'ordre :");
        afficher_ordre_decouverte(g.explorerProfondeur_rec(depart));
    }
    public static void afficher_ordre_decouverte(ArrayList<Sommet> l){
        for(Sommet s: l){
            System.out.println(s.getName());
        }
    }
}
