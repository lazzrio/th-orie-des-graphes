import java.util.ArrayList;

/** Activité 8 : un sommet identifié par un numéro (0 à n-1) et un nom, avec sa liste de successeurs. */
public class Sommet {
    private int id;
    private String nom;
    private ArrayList<Sommet> successeurs;

    public Sommet(int id, String nom) {
        this.id = id;
        this.nom = nom;
        this.successeurs = new ArrayList<Sommet>();
    }

    /** Ajoute s à la liste des successeurs (appelée par Graphe.charger). */
    public void ajouterSuccesseur(Sommet s) {
        successeurs.add(s);
    }

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
