import java.util.*;

/** Exercice 9 : algorithme de Dijkstra, version tableau (recherche du minimum en O(n)) puis version file de priorité. */
public class Dijkstra {
    static final double INF = Double.POSITIVE_INFINITY;

    static String fmt(double d) { return d == INF ? "inf" : String.valueOf((int) d); }

    /** poids[i][j] = poids de l'arc i -> j, ou INF s'il n'y a pas d'arc. */
    static void dijkstraTableau(String[] noms, double[][] poids, int s0, boolean afficher) {
        int n = noms.length;
        boolean[] marque = new boolean[n];
        double[] dp = new double[n];
        int[] parent = new int[n];
        Arrays.fill(dp, INF);
        Arrays.fill(parent, -1);
        dp[s0] = 0;
        int etape = 0;
        if (afficher) ligne(noms, marque, dp, parent, etape);
        while (true) {
            int smin = -1;
            for (int i = 0; i < n; i++) if (!marque[i] && dp[i] != INF && (smin == -1 || dp[i] < dp[smin])) smin = i;
            if (smin == -1) break;
            marque[smin] = true;
            etape++;
            for (int s = 0; s < n; s++) {
                if (!marque[s] && poids[smin][s] != INF && dp[smin] + poids[smin][s] < dp[s]) {
                    dp[s] = dp[smin] + poids[smin][s];
                    parent[s] = smin;
                }
            }
            if (afficher) ligne(noms, marque, dp, parent, etape);
        }
        System.out.println("Chemins depuis " + noms[s0] + " :");
        for (int i = 0; i < n; i++) {
            if (i == s0 || dp[i] == INF) continue;
            LinkedList<String> ch = new LinkedList<>();
            for (int x = i; x != -1; x = parent[x]) ch.addFirst(noms[x]);
            System.out.println("  " + noms[i] + " : " + String.join(" -> ", ch) + "  (longueur " + fmt(dp[i]) + ")");
        }
    }

    static void ligne(String[] noms, boolean[] m, double[] dp, int[] p, int etape) {
        StringBuilder sb = new StringBuilder("etape " + etape + " : ");
        for (int i = 0; i < noms.length; i++) {
            sb.append(noms[i]).append("[").append(m[i] ? 1 : 0).append(",").append(fmt(dp[i])).append(",").append(p[i] == -1 ? "-" : noms[p[i]]).append("] ");
        }
        System.out.println(sb);
    }

    /** Version avec PriorityQueue : on réinsère un sommet à chaque amélioration et on ignore les entrées périmées. */
    static double[] dijkstraFile(double[][] poids, int s0) {
        int n = poids.length;
        double[] dp = new double[n];
        Arrays.fill(dp, INF);
        dp[s0] = 0;
        boolean[] marque = new boolean[n];
        PriorityQueue<double[]> file = new PriorityQueue<>((x, y) -> Double.compare(x[1], y[1]));
        file.add(new double[]{s0, 0});
        while (!file.isEmpty()) {
            double[] cur = file.poll();
            int u = (int) cur[0];
            if (marque[u]) continue;           // entrée périmée
            marque[u] = true;
            for (int v = 0; v < n; v++) {
                if (poids[u][v] != INF && !marque[v] && dp[u] + poids[u][v] < dp[v]) {
                    dp[v] = dp[u] + poids[u][v];
                    file.add(new double[]{v, dp[v]});
                }
            }
        }
        return dp;
    }

    public static void main(String[] args) {
        String[] noms = {"A", "B", "C", "D", "E", "F"};
        double[][] p = new double[6][6];
        for (double[] l : p) Arrays.fill(l, INF);
        // arcs de l'exercice 9
        p[1][0] = 6;   // B -> A
        p[0][1] = 4;   // A -> B
        p[1][2] = 2;   // B -> C
        p[2][0] = 1;   // C -> A
        p[0][3] = 5;   // A -> D
        p[0][5] = 6;   // A -> F
        p[2][3] = 2;   // C -> D
        p[2][4] = 8;   // C -> E
        p[3][4] = 2;   // D -> E
        p[4][5] = 10;  // E -> F
        // verification des 4 chemins B -> E du cours
        int[][] chemins = {{1, 0, 3, 4}, {1, 2, 0, 3, 4}, {1, 2, 3, 4}, {1, 2, 4}};
        for (int[] c : chemins) {
            double l = 0;
            for (int i = 0; i + 1 < c.length; i++) l += p[c[i]][c[i + 1]];
            System.out.println("chemin " + Arrays.toString(c) + " longueur " + (int) l);
        }
        dijkstraTableau(noms, p, 1, true);
        System.out.println("file de priorite : " + Arrays.toString(dijkstraFile(p, 1)));
        // contre-exemple du BFS (cours) : A->C 6, C->B 4, A->B 12, B->D 3
        String[] n2 = {"A", "B", "C", "D"};
        double[][] q = new double[4][4];
        for (double[] l : q) Arrays.fill(l, INF);
        q[0][2] = 6; q[2][1] = 4; q[0][1] = 12; q[1][3] = 3;
        System.out.println("--- contre-exemple du BFS (A -> D)");
        dijkstraTableau(n2, q, 0, true);
    }
}
