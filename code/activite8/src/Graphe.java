import java.io.File;
import java.io.IOException;
import java.util.*;

public class Graphe {
    /* attributs */
    private int orient;
    private ArrayList<Sommet> l_sommets;

    /* chargement du graphe */
    public void charger(String ficName)throws IOException {
        //ouverture du fichier en lecture
        Scanner sc=new Scanner(new File(ficName));
        //lecture de l'orientation
        orient=sc.nextInt();
        sc.nextLine();
        //lecture de l'ordre
        int n=sc.nextInt();
        //création de l'ArrayList de sommets
        l_sommets=new ArrayList<Sommet>();
        sc.nextLine();
        int id;
        String nom;
        //lecture, création et ajout des sommets dans l'ARrayList
        for(int i=0;i<n;i++){
            id=sc.nextInt();
            nom=sc.next();
            sc.nextLine();
            l_sommets.add(new Sommet(id,nom));
        }
        //lecture des liens
        int id1,id2;
        while(sc.hasNextLine()){
            //lecture des extrémités
            id1=sc.nextInt();
            id2=sc.nextInt();
            //ajout de id2 aux successeurs de id1
            l_sommets.get(id1).ajouterSuccesseur(l_sommets.get(id2));
            //si le graphe n'est pas orienté : ajout de id1 aux successeurs de id2
            if(orient==0) l_sommets.get(id2).ajouterSuccesseur(l_sommets.get(id1));
            sc.nextLine();
        }
        sc.close();
    }
    // Chercher et retourner un sommet d'après son id
    public Sommet getSommet(int id){
        for(Sommet s:l_sommets){
            if(s.getId()==id) return s;
        }
        return null;
    }
    /*exploration en largeur à partir d'un sommet s
    retour : liste des sommets explorés*/
    public ArrayList<Sommet> explorerLargeur(Sommet s){
        ArrayList<Sommet> l_decouverts=new ArrayList<Sommet>();
        Queue<Sommet> file=new ArrayDeque<Sommet>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
        }
        file.add(s);
        marque.set(s.getId(),true);
        l_decouverts.add(s);
        while(!file.isEmpty()){
            s=file.poll();
            for(Sommet succ:s.getSuccesseurs()){
                if(!(marque.get(succ.getId()))){
                    marque.set(succ.getId(),true);
                    file.add(succ);
                    l_decouverts.add(succ);
                }
            }
        }
        return l_decouverts;
    }
    /*exploration en profondeur à partir d'un sommet s
    version itérative avec pile
   retour : liste des sommets explorés*/
    public ArrayList<Sommet> explorerProfondeur_it(Sommet s){
        ArrayList<Sommet> l_decouverts=new ArrayList<Sommet>();
        Stack<Sommet> pile=new Stack<Sommet>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
        }
        pile.push(s);
        marque.set(s.getId(),true);
        l_decouverts.add(s);
        while(!pile.isEmpty()){
            s=pile.pop();
            for(Sommet succ:s.getSuccesseurs()){
                if(!(marque.get(succ.getId()))){
                    marque.set(succ.getId(),true);
                    pile.push(succ);
                    l_decouverts.add(succ);
                }
            }
        }
        return l_decouverts;
    }
    /*exploration en profondeur à partir d'un sommet s
    version récursive
   retour : liste des sommets explorés*/
    public ArrayList<Sommet> explorerProfondeur_rec(Sommet s){
        ArrayList<Sommet> l_decouverts=new ArrayList<Sommet>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
        }
        marque.set(s.getId(),true);
        l_decouverts.add(s);
        parcoursProfondeur_rec(s,l_decouverts,marque);
        return l_decouverts;
    }
    public void parcoursProfondeur_rec(Sommet s,ArrayList<Sommet> l_decouverts,ArrayList<Boolean> marque){
        for(Sommet succ:s.getSuccesseurs()){
            if(!(marque.get(succ.getId()))){
                marque.set(succ.getId(),true);
                l_decouverts.add(succ);
                parcoursProfondeur_rec(succ,l_decouverts,marque);
            }
        }
    }
    /* parcours en largeur qui mémorise le parent de chaque sommet
    retour : liste des parents, indexée par l'id (null = pas de parent)*/
    public ArrayList<Sommet> BFS_Parents(Sommet s){
        ArrayList<Sommet> l_parents=new ArrayList<Sommet>(l_sommets.size());
        Queue<Sommet> file=new ArrayDeque<Sommet>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
            l_parents.add(i,null);
        }
        file.add(s);
        marque.set(s.getId(),true);
        while(!file.isEmpty()){
            s=file.poll();
            for(Sommet succ:s.getSuccesseurs()){
                if(!(marque.get(succ.getId()))){
                    marque.set(succ.getId(),true);
                    l_parents.set(succ.getId(),s);
                    file.add(succ);
                }
            }
        }
        return l_parents;
    }
    /* parcours en profondeur (avec une pile) qui mémorise le parent de chaque sommet*/
    public ArrayList<Sommet> DFS_Parents(Sommet s){
        ArrayList<Sommet> l_parents=new ArrayList<Sommet>(l_sommets.size());
        Stack<Sommet> pile=new Stack<Sommet>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
            l_parents.add(i,null);
        }
        pile.push(s);
        marque.set(s.getId(),true);
        while(!pile.isEmpty()){
            s=pile.pop();
            for(Sommet succ:s.getSuccesseurs()){
                if(!(marque.get(succ.getId()))){
                    marque.set(succ.getId(),true);
                    l_parents.set(succ.getId(),s);
                    pile.push(succ);
                }
            }
        }
        return l_parents;
    }
    /* chemin de s1 à s2 : on remonte les parents depuis s2
    retour : liste vide si s2 n'est pas atteignable depuis s1*/
    public ArrayList<Sommet> retrouverChemin(Sommet s1,Sommet s2,ArrayList<Sommet> l_parents){
        ArrayList<Sommet> chemin=new ArrayList<Sommet>();
        Sommet courant=s2;
        while(courant!=null && courant!=s1){
            chemin.add(0,courant);
            courant=l_parents.get(courant.getId());
        }
        if(courant==null){
            return new ArrayList<Sommet>();
        }
        chemin.add(0,s1);
        return chemin;
    }
    /* vrai si le graphe n'a qu'une composante connexe */
    public boolean testerConnexite(){
        return chercherCC().size()==1;
    }
    /* composantes connexes : une exploration par composante, en ignorant l'orientation*/
    public ArrayList<ArrayList<Sommet>> chercherCC(){
        ArrayList<ArrayList<Sommet>> l_composantes=new ArrayList<ArrayList<Sommet>>();
        ArrayList<Boolean> marque=new ArrayList<Boolean>(l_sommets.size());
        for(int i=0;i<l_sommets.size();i++){
            marque.add(i,false);
        }
        for(Sommet depart:l_sommets){
            if(!(marque.get(depart.getId()))){
                ArrayList<Sommet> composante=new ArrayList<Sommet>();
                Queue<Sommet> file=new ArrayDeque<Sommet>();
                file.add(depart);
                marque.set(depart.getId(),true);
                composante.add(depart);
                while(!file.isEmpty()){
                    Sommet s=file.poll();
                    for(Sommet t:l_sommets){
                        // t est voisin de s si t est un successeur de s ou si s est un successeur de t
                        if(!(marque.get(t.getId())) && (s.getSuccesseurs().contains(t) || t.getSuccesseurs().contains(s))){
                            marque.set(t.getId(),true);
                            file.add(t);
                            composante.add(t);
                        }
                    }
                }
                l_composantes.add(composante);
            }
        }
        return l_composantes;
    }
    /* Affichage des listes de successeurs*/
    public void afficherListeSucc(){
        for(Sommet s:l_sommets){
            System.out.print(s.getId()+":");
            for(Sommet succ:s.getSuccesseurs()){
                System.out.print(succ.getId()+" ");
            }
            System.out.println();
        }
    }
}
