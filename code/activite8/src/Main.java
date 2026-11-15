import java.io.IOException;
import java.util.ArrayList;

public class Main {
    public static void main(String[] args) throws IOException {
        Graphe g=new Graphe();
        g.charger("exercice7.txt");          // changer le fichier pour tester les autres graphes
        g.afficherListeSucc();
        Sommet depart=g.getSommet(2);        // sommet C

        System.out.println("Exploration en largeur (BFS) :");
        afficher_ordre_decouverte(g.explorerLargeur(depart));
        System.out.println("Exploration en profondeur itératif avec pile (DFS) :");
        afficher_ordre_decouverte(g.explorerProfondeur_it(depart));
        System.out.println("Exploration en profondeur récursif (DFS récursif) :");
        afficher_ordre_decouverte(g.explorerProfondeur_rec(depart));

        // chemins de depart à chaque sommet avec les deux parcours
        ArrayList<Sommet> parentsBFS=g.BFS_Parents(depart);
        ArrayList<Sommet> parentsDFS=g.DFS_Parents(depart);
        int id=0;
        Sommet arrivee=g.getSommet(id);
        while(arrivee!=null){
            ArrayList<Sommet> cheminBFS=g.retrouverChemin(depart,arrivee,parentsBFS);
            ArrayList<Sommet> cheminDFS=g.retrouverChemin(depart,arrivee,parentsDFS);
            System.out.println("Vers "+arrivee.getName()+" : BFS "+cheminBFS.size()+" sommets, DFS "+cheminDFS.size()+" sommets");
            id++;
            arrivee=g.getSommet(id);
        }

        System.out.println("Faiblement connexe : "+g.testerConnexite());
        ArrayList<ArrayList<Sommet>> composantes=g.chercherCC();
        System.out.println("Nombre de composantes connexes : "+composantes.size());
        for(ArrayList<Sommet> composante:composantes){
            System.out.print("  ");
            for(Sommet s:composante){
                System.out.print(s.getName()+" ");
            }
            System.out.println();
        }
    }
    public static void afficher_ordre_decouverte(ArrayList<Sommet> l){
        for(Sommet s: l){
            System.out.print(s.getName()+" ");
        }
        System.out.println();
    }
}
