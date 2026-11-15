import java.util.ArrayList;

public class Sommet {
    /* attributs */
    private int id;
    private String nom;
    private ArrayList<Sommet> successeurs;

    /* constructeur */
    public Sommet(int id, String nom) {
        this.id = id;
        this.nom = nom;
        this.successeurs = new ArrayList<Sommet>();
    }

    /* méthode d'ajout d'un successeur */
    public void ajouterSuccesseur(Sommet s) {
        successeurs.add(s);
    }

    /* accesseurs */
    public ArrayList<Sommet> getSuccesseurs() {
        return successeurs;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return nom;
    }
}
