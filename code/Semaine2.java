import java.util.*;

/** Semaine 2 : Welsh-Powell (par classes de couleur) et exploration d'un graphe (largeur / profondeur). */
public class Semaine2 {

    /** Welsh-Powell : on remplit une couleur au maximum avant de passer à la suivante. */
    static int[] welshPowell(boolean[][] adj) {
        int n = adj.length;
        int[] deg = new int[n];
        for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) if (adj[i][j]) deg[i]++;
        Integer[] ordre = new Integer[n];
        for (int i = 0; i < n; i++) ordre[i] = i;
        Arrays.sort(ordre, (a, b) -> deg[b] - deg[a]);            // tri stable par degré décroissant
        int[] couleur = new int[n];
        Arrays.fill(couleur, -1);
        int restants = n, c = 0;
        while (restants > 0) {
            for (int i : ordre) {
                if (couleur[i] != -1) continue;
                boolean ok = true;
                for (int j = 0; j < n; j++) if (adj[i][j] && couleur[j] == c) { ok = false; break; }
                if (ok) { couleur[i] = c; restants--; }
            }
            c++;                                                    // on passe à la couleur suivante
        }
        return couleur;
    }

    /** Parcours en largeur (file) : renvoie l'ordre d'exploration depuis s0. */
    static List<String> largeur(Map<String, List<String>> succ, String s0) {
        List<String> explores = new ArrayList<>();
        Set<String> vus = new HashSet<>();
        Deque<String> aExplorer = new ArrayDeque<>();
        vus.add(s0);
        aExplorer.addLast(s0);
        while (!aExplorer.isEmpty()) {
            String s = aExplorer.pollFirst();                       // file : le plus ancien d'abord
            explores.add(s);
            for (String t : succ.getOrDefault(s, List.of())) {
                if (vus.add(t)) aExplorer.addLast(t);               // add renvoie false si t déjà vu : pas de doublon
            }
        }
        return explores;
    }

    /** Parcours en profondeur (pile) : même algorithme, mais on prend le dernier ajouté. */
    static List<String> profondeur(Map<String, List<String>> succ, String s0) {
        List<String> explores = new ArrayList<>();
        Set<String> vus = new HashSet<>();
        Deque<String> aExplorer = new ArrayDeque<>();
        vus.add(s0);
        aExplorer.addLast(s0);
        while (!aExplorer.isEmpty()) {
            String s = aExplorer.pollLast();                        // pile : le plus récent d'abord
            explores.add(s);
            for (String t : succ.getOrDefault(s, List.of())) {
                if (vus.add(t)) aExplorer.addLast(t);
            }
        }
        return explores;
    }

    static boolean[][] graphe(int n, int[][] aretes) {
        boolean[][] adj = new boolean[n][n];
        for (int[] e : aretes) { adj[e[0]][e[1]] = true; adj[e[1]][e[0]] = true; }
        return adj;
    }

    public static void main(String[] args) {
        // mini wiki de l'activité 6
        Map<String, List<String>> wiki = new LinkedHashMap<>();
        wiki.put("A", List.of("B", "C", "D"));
        wiki.put("B", List.of("C", "E"));
        wiki.put("C", List.of("F"));
        wiki.put("D", List.of("F"));
        wiki.put("E", List.of("G", "K"));
        wiki.put("F", List.of("E", "H"));
        wiki.put("G", List.of("A"));
        wiki.put("H", List.of("D", "I"));
        wiki.put("J", List.of("F", "I"));
        System.out.println("largeur depuis B  : " + largeur(wiki, "B"));
        System.out.println("largeur depuis E  : " + largeur(wiki, "E"));
        System.out.println("profondeur depuis B: " + profondeur(wiki, "B"));
        System.out.println("profondeur depuis E: " + profondeur(wiki, "E"));
        System.out.println("largeur depuis J  : " + largeur(wiki, "J"));
        System.out.println("largeur depuis A  : " + largeur(wiki, "A"));

        // Welsh-Powell sur les jeux de données (indices 0..n-1)
        boolean[][] chim = graphe(8, new int[][]{{0,3},{1,2},{2,3},{2,4},{2,7},{3,6},{4,5},{6,7}});
        System.out.println("WP chimie : " + Arrays.toString(welshPowell(chim)));
        boolean[][] ex5 = graphe(12, new int[][]{{0,3},{0,10},{0,11},{1,2},{1,4},{2,6},{2,7},{2,8},{2,10},{3,4},{3,5},{3,9}});
        System.out.println("WP ex5 v2 : " + Arrays.toString(welshPowell(ex5)));
    }
}
