# Enlarging the Triangle Heart Beyond `R1`–`R6`: Zero-Backoff Collinear Endpoints, the Repaired Conic Bridge, Additional $\Omega_4$ Rays, and the 6-Parameter Cubic-Phase Family

**Date:** 17 October 2026  
**Scope:** Exact computer-assisted global attractivity certificates, exact leave-one-out separation witnesses, and 6,125-shape audit results implementing all four recommendations on top of `Attractive_Centers_Independent_Rays_2026-10-17.zip`.

## 1. Executive Summary of New Certified Results

Building on the baseline established in `Attractive_Centers_Independent_Rays_2026-10-17.zip`—which comprises the 46 benchmark centers $\text{B46}$, the complete constant-coefficient Symmedian/Steiner domain $\Omega_{K, HK}$, the four earlier shape-dependent maps, and the six independent rays $R_1, \dots, R_6$—this extension establishes four rigorously certified enlargements of the triangle Heart:

1. **Zero-Backoff ($\delta = 0$) Global Radial Endpoints $R_2^*$ and $R_5^*$:**
   By shifting the 4-parameter ansatz $Z = G + (f_0 + f_1 q)K + (g_0 + g_1 q)HK$ to collinear-centered coordinates $\bar{f} = f_0 + \frac{1}{4}f_1, \; \bar{g} = g_0 + \frac{1}{4}g_1$ with $\tilde{q} = \frac{1}{4} - q = 3zv$, the derivative-coupling perturbations $\Delta a(z, v)$ and $\Delta c(z, v)$ vanish identically on the collinear boundary $v = 0$. Consequently, the exact supremal radial thresholds along the seeds of $R_2 = (3/4, 23/10, -1, 6/5)$ and $R_5 = (9/20, 6/5, -8/5, 13/5)$ are the exact rational numbers:
   $$\lambda_{R_2}^* = \frac{8960}{9081} \approx 0.9866754763, \qquad \lambda_{R_5}^* = \frac{3040}{3113} \approx 0.9765499518.$$
   Using a 4-box collar decomposition that isolates the exact square collinear factor $c(z, 0) \ge 0$ and certifies the polynomial remainder $R(z, v) = (\det M - a(z,0)c(z,0))/v > 0$ on the collinear collar, both exact endpoints $R_2^*$ and $R_5^*$ are globally certified with **zero backoff ($\delta = 0$)** in **28** and **25** 2D Bernstein leaves, respectively (`CONIC_BRIDGE_CERTIFICATE.json`).

2. **Repaired Continuous Conic Bridge $\mathbf{c}_{\text{bridge}}(t)$ Between $R_2^*$ and $R_5^*$ ($\delta = 0$):**
   In `probe_collinear_bridge.py`, the linear numerator $(1-t)\mathbf{c}_{R_2} + t\mathbf{c}_{R_5}$ normalized by the collinear tangency factor $\lambda_{\text{flat}}(t) = \frac{640(5t+14)}{1329t^2+2042t+9081}$ failed at the midpoint $t = 1/2$ on the isosceles slice $h = 1$ ($a(9/40, 53/160) = -58932991/2086850000 < 0$). Adding the collinear-invisible quadratic bow $10560\,t(1-t)(-1/4, 1, 3/10, -6/5)$ (which satisfies $\Delta\bar{f} = \Delta\bar{g} = 0$ and thus leaves the collinear boundary $v = 0$ untouched) yields the rational quadratic arc:
   $$\mathbf{c}_{\text{bridge}}(t) = \frac{640(5t + 14)\bigl[(1 - t)\mathbf{c}_{R_2} + t\mathbf{c}_{R_5}\bigr] + 10560\,t(1 - t)\bigl(-1/4, \; 1, \; 3/10, \; -6/5\bigr)}{1329t^2 + 2042t + 9081}, \qquad t \in [0, 1].$$
   Along this entire curve, $D(t)c(z, 0, t) = (120tz - 17t + 336z - 165)^2 \ge 0$ remains an exact square vanishing at $z_*(t) = \frac{17t+165}{24(5t+14)}$, while at the former midpoint counterexample $(t, z, v) = (1/2, 9/40, 53/160)$ both the diagonal and determinant become strictly positive ($a = 27673/417370 > 0, \; \det M = 84395890319/1741977169000 > 0$). The entire continuous curve $t \in [0, 1]$ is globally certified with **zero backoff ($\delta = 0$)** in **78 exact 3D Bernstein leaves** across 5 sub-domains (`CONIC_BRIDGE_CERTIFICATE.json`), and its support function $\max_{t \in [0,1]} n \cdot Z_{\text{bridge}}(t)$ is evaluated in closed form via quadratic stationary roots in `conic_bridge_and_cubic_centers.py`.

3. **Four Additional Certified $\Omega_4$ Rays (`R7`–`R10`):**
   Four additional simple rational directions in the 4-parameter $(f_0, f_1, g_0, g_1)$ family are globally certified with radial brackets of width $3 \times 10^{-8}$ (`NEW_OMEGA4_RAYS_CERTIFICATES.json`), expanding the $q$-linear slice $\pi_q(\Omega_4)$ across previously uncaptured angular sectors.

4. **The 6-Parameter Cubic-Phase Family (`P1`–`P3`):**
   Introducing the root-free cubic squared-side central moment $p := 36\sum_{i=1}^3(s_i - 1/3)^3 = (1 - 3z)(36z^2 - 24z + 1 + 36zv) \in [-1, 1]$ breaks the acute/obtuse phase degeneracy $\pm\cos(6\theta_0)$ of $q$-only models while keeping all entries of $3\operatorname{Sym} D_1 Z$ polynomial in $(z, v)$ and at most quadratic in $v$. Both the product-rule derivation and direct fixed-vertex Cartesian differentiation in $\mathbb{Q}[r, X, Y]$ agree with zero residual (`CUBIC_PHASE_MATRIX.json`), and three high-gain 6-parameter rays (`P1`, `P2`, `P3`) are globally certified with radial brackets of width $3 \times 10^{-8}$ (`CUBIC_PHASE_CERTIFICATES.json`).

## 2. Summary of Certified Maps and Radial Brackets

| Label | Family | Seed $\mathbf{c}_0$ | Certified Radial Lower Bound $\lambda_-$ (or Exact $\lambda^*$) | Upper Non-Attractivity Bound $\lambda_+$ | Bernstein Leaves (`diag`, `det` / 5-task) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `R2_star` | $\Omega_4$ ($\delta=0$) | $(3/4, \; 23/10, \; -1, \; 6/5)$ | $8960/9081 \approx 0.98667548$ (exact $\lambda^*$) | $8960/9081$ (width $0$) | $28$ ($10, 1, 15, 1, 1$) |
| `R5_star` | $\Omega_4$ ($\delta=0$) | $(9/20, \; 6/5, \; -8/5, \; 13/5)$ | $3040/3113 \approx 0.97654995$ (exact $\lambda^*$) | $3040/3113$ (width $0$) | $25$ ($12, 1, 10, 1, 1$) |
| `Conic_Bridge` | $\Omega_4$ curve ($\delta=0$) | $\mathbf{c}_{\text{bridge}}(t), \; t \in [0, 1]$ | $\delta = 0$ on full interval $t \in [0, 1]$ | Exact collinear tangency $\forall t \in [0,1]$ | $78$ 3D leaves ($40, 1, 35, 1, 1$) |
| `Bridge_Mid` | $\Omega_4$ ($\delta=0$) | $(43/80, \; 2, \; -49/40, \; 8/5)$ | $42240/41737 \approx 1.01205166$ (exact $\lambda^*$) | $42240/41737$ (width $0$) | Slice $t=1/2$ of 3D certificate |
| `R7` | $\Omega_4$ ray | $(3/5, \; 0, \; -29/20, \; 2)$ | $94423179/10^8 = 0.94423179$ | $94423182/10^8 = 0.94423182$ | $6, \; 26$ |
| `R8` | $\Omega_4$ ray | $(1, \; 4/3, \; -1/2, \; -7/10)$ | $99579960/10^8 = 0.99579960$ | $99579963/10^8 = 0.99579963$ | $4, \; 24$ |
| `R9` | $\Omega_4$ ray | $(0, \; -12/5, \; 8/5, \; -9/2)$ | $91081582/10^8 = 0.91081582$ | $91081585/10^8 = 0.91081585$ | $4, \; 43$ |
| `R10` | $\Omega_4$ ray | $(1/2, \; -7/5, \; -2, \; 9)$ | $96617699/10^8 = 0.96617699$ | $96617702/10^8 = 0.96617702$ | $9, \; 30$ |
| `P1` | $\Omega_6$ $(q,p)$ ray | $(3/5, \; 1/10, \; -3/5, \; -8/5, \; 3, \; 7/10)$ | $101367358/10^8 = 1.01367358$ | $101367361/10^8 = 1.01367361$ | $13, \; 71$ |
| `P2` | $\Omega_6$ $(q,p)$ ray | $(1/5, \; -14/5, \; 1/5, \; 13/10, \; -7/5, \; -1/5)$ | $95069548/10^8 = 0.95069548$ | $95069551/10^8 = 0.95069551$ | $7, \; 29$ |
| `P3` | $\Omega_6$ $(q,p)$ ray | $(4/5, \; 11/5, \; -1/5, \; -4/5, \; -4/5, \; 2/5)$ | $99773390/10^8 = 0.99773390$ | $99773393/10^8 = 0.99773393$ | $9, \; 28$ |

## 3. Exact Leave-One-Out Separation Certificates (`ENLARGEMENT_SEPARATIONS.json`)

Every new discrete addition (`Bridge_Mid`, `R7`–`R10`, `P1`–`P3`) has an exact rational leave-one-out separation witness proving that it lies strictly outside the convex hull of:
- All 44 rational `B46` models + rigorous interval-arithmetic enclosures of $M_-$ and $M_+$,
- The entire continuous constant-coefficient domain $\Omega_{K, HK}$ (bounded via an exact 2-constraint rational LP dual),
- All 4 previous shape-dependent maps + all 6 `Independent_Rays` maps $R_1, \dots, R_6$ + the exact zero-backoff endpoints $R_2^*, R_5^*$,
- For `R7`–`R10` and `P1`–`P3`, **the entire continuous conic bridge $\mathbf{c}_{\text{bridge}}([0, 1])$** (bounded via an exact 1D Bernstein positivity certificate on $t \in [0, 1]$),
- And all other 6 new rays, uniformly across their $[\lambda_-, \lambda_+]$ radial boundary brackets.

| Target Map | Witness Sides $(a, b, c)$ | Separating Normal $n = (n_B, n_C)$ | Exact Point Gap | Robust Bracket Gap | 6,125-Shape Individual Gain Count | 6,125-Shape Leave-One-Out Count |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Conic_Bridge` ($t \in [0,1]$) | $(12, 8, 6)$ (at $t=1/2$) | $(-8546/9569, \; -4305/9643)$ | $+9.030070 \times 10^{-4}$ | $+9.030031 \times 10^{-4}$ | $520 / 6125$ | $421 / 6125$ ($322$ for $t=1/2$ alone) |
| `R7` | $(14, 11, 5)$ | $(-4869/5009, \; 1647/7067)$ | $+1.444020 \times 10^{-3}$ | $+1.444020 \times 10^{-3}$ | $328 / 6125$ | $300 / 6125$ |
| `R8` | $(6, 5, 3)$ | $(6977/7896, \; -3220/6889)$ | $+2.867143 \times 10^{-3}$ | $+2.867143 \times 10^{-3}$ | $294 / 6125$ | $286 / 6125$ |
| `R9` | $(9, 8, 7)$ | $(-1717/5889, \; -9215/9639)$ | $+3.551533 \times 10^{-3}$ | $+3.551532 \times 10^{-3}$ | $104 / 6125$ | $46 / 6125$ |
| `R10` | $(9, 8, 7)$ | $(8620/9399, \; -3931/9922)$ | $+6.749631 \times 10^{-3}$ | $+6.749631 \times 10^{-3}$ | $82 / 6125$ | $82 / 6125$ |
| `P1` | $(6, 5, 3)$ | $(-9069/9316, \; 1301/5701)$ | $+1.322587 \times 10^{-2}$ | $+1.322586 \times 10^{-2}$ | $659 / 6125$ | $647 / 6125$ |
| `P2` | $(6, 5, 3)$ | $(-6609/9709, \; -6832/9331)$ | $+3.768958 \times 10^{-2}$ | $+3.768958 \times 10^{-2}$ | $271 / 6125$ | $263 / 6125$ |
| `P3` | $(6, 5, 3)$ | $(9883/9908, \; -685/9742)$ | $+1.131836 \times 10^{-2}$ | $+1.131836 \times 10^{-2}$ | $585 / 6125$ | $531 / 6125$ |

Across all $6,125$ nondegenerate archived shapes (`ENLARGEMENT_AUDIT_SUMMARY.json`), the new additions strictly enlarge the `Independent_Rays` hull ($\text{B46} \cup \Omega_{K, HK} \cup \text{prev}_4 \cup \{R_1, \dots, R_6\}$) on **$1,389 / 6,125$ shapes ($22.68\%$)**: $520$ shapes from the repaired conic bridge, $513$ shapes from the four new $\Omega_4$ rays `R7`–`R10`, and $1,007$ shapes from the three 6-parameter cubic-phase rays `P1`–`P3`.

## 4. Reproducibility and Verification Commands

Run the standalone exact proof replay (requires only Python standard library, SymPy, NumPy, and mpmath; do not use `-O`):

```bash
python3 verify_conic_bridge_and_extensions.py
python3 test_conic_bridge_and_extensions.py
```

To regenerate all certificates, separation proofs, figures, and the complete archive from scratch:

```bash
python3 certify_conic_bridge_and_extensions.py
python3 certify_enlargement_separations.py
python3 plot_heart_enlargements.py
python3 audit_heart_enlargements.py
python3 build_heart_enlargement_bundle.py
```
