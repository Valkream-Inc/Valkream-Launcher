/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * DepotDownloader affiche le QR code de connexion avec des caractères « demi-blocs » (▀ ▄ █ et espace) :
 * chaque caractère porte deux modules l'un au-dessus de l'autre. Selon la police, ils s'affichent en
 * rectangles vides et, sur un thème sombre, le QR est inversé (illisible). On le redessine donc nous-mêmes
 * (noir sur blanc, marge incluse) à partir du texte.
 */

/** Ligne faite uniquement de demi-blocs / espaces, avec assez de blocs pour être un QR code. */
export const isQrLine = (line: string): boolean => /^[\u2580-\u259f ]+$/.test(line) && /[\u2580\u2584\u2588]/.test(line);

/** Grille de modules (true = noir) d'un QR code en demi-blocs ; `null` si le texte n'en est pas un. */
export const qrModules = (lines: readonly string[]): boolean[][] | null => {
  if (lines.length < 5) return null;
  const width = Math.max(...lines.map((line) => line.length));
  if (width < 15) return null;
  const rows: boolean[][] = [];
  for (const line of lines) {
    const top: boolean[] = [];
    const bottom: boolean[] = [];
    for (let x = 0; x < width; x++) {
      const char = line[x] ?? " ";
      top.push(char === "\u2580" || char === "\u2588");
      bottom.push(char === "\u2584" || char === "\u2588");
    }
    rows.push(top, bottom);
  }
  return rows;
};
