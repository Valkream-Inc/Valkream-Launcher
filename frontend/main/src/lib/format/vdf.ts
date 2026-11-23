/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Lecteur du format texte de Valve (VDF / ACF : `libraryfolders.vdf`, `appmanifest_<id>.acf`).
 * Uniquement ce qu'il faut : chaînes entre guillemets, blocs `{ }`, commentaires `//`.
 */

export type VdfValue = string | { [key: string]: VdfValue };

const TOKEN = /"((?:[^"\\]|\\.)*)"|([{}])|\/\/[^\n]*|\s+/gy;

const unescape = (text: string): string => text.replace(/\\(.)/g, (_m, char: string) => (char === "n" ? "\n" : char === "t" ? "\t" : char));

export const parseVdf = (text: string): { [key: string]: VdfValue } => {
  const tokens: string[] = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < text.length) {
    const start = TOKEN.lastIndex;
    const match = TOKEN.exec(text);
    if (!match) throw new Error(`VDF invalide près du caractère ${start}`);
    if (match[1] !== undefined) tokens.push(`s${unescape(match[1])}`);
    else if (match[2]) tokens.push(match[2]);
  }

  let index = 0;
  const readBlock = (closing: boolean): { [key: string]: VdfValue } => {
    const block: { [key: string]: VdfValue } = {};
    while (index < tokens.length) {
      const token = tokens[index++];
      if (token === "}") {
        if (!closing) throw new Error("VDF invalide : « } » en trop");
        return block;
      }
      if (!token.startsWith("s")) throw new Error("VDF invalide : clé attendue");
      const key = token.slice(1);
      const next = tokens[index++];
      if (next === undefined) throw new Error("VDF invalide : valeur manquante");
      block[key] = next === "{" ? readBlock(true) : next.startsWith("s") ? next.slice(1) : (() => { throw new Error("VDF invalide"); })();
    }
    if (closing) throw new Error("VDF invalide : bloc non fermé");
    return block;
  };
  return readBlock(false);
};
