/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Mode d'emploi du popup Steam, construit dans l'interface à partir des clés `steam.guide.*` :
 * un changement de langue s'applique tout de suite (le main n'envoie plus que des données).
 */

import type { SteamGuideData, SteamSourceIssue } from "@shared/types";

type Translate = (key: string, vars?: Record<string, unknown>) => string;

/** Fragment « (build X, installé : Y) » ou chaîne vide. */
const buildText = (t: Translate, data: SteamGuideData, withInstalled: boolean): string => {
  if (data.expectedBuild === undefined) return "";
  const installed = withInstalled && data.installedBuild ? t("steam.guide.installed", { build: data.installedBuild }) : "";
  return t("steam.guide.build", { expected: data.expectedBuild, installed });
};

export const buildSteamGuideText = (t: Translate, issue: Pick<SteamSourceIssue, "issue" | "depotAvailable" | "depotOnly" | "guideData">): string => {
  const data = issue.guideData;
  const lines: string[] = [];

  if (issue.depotOnly) {
    lines.push(
      t("steam.guide.depotTitle", { entry: data.entry }),
      "",
      t("steam.guide.depotOnly"),
      "",
      t("steam.guide.depotOnlyWhy", { build: buildText(t, data, false) }),
      "",
      t("steam.guide.depotOnlyHow"),
    );
    return lines.join("\n");
  }

  const missing = issue.issue === "missing";
  lines.push(t(missing ? "steam.guide.missingTitle" : "steam.guide.versionTitle", { entry: data.entry }), "");
  const files = data.files ?? [];
  lines.push(
    missing
      ? t("steam.guide.missing")
      : t("steam.guide.version", {
          build: buildText(t, data, true),
          files: files.length > 0 ? t("steam.guide.files", { list: files.slice(0, 3).join("`, `") }) : "",
        }),
  );
  if (data.chosenFolder) lines.push("", t("steam.guide.chosen"));
  lines.push("", t("steam.guide.s1"), "");
  if (missing) {
    lines.push(t("steam.guide.openLibrary"), t("steam.guide.install"));
  } else {
    lines.push(t("steam.guide.props"), data.branch ? t("steam.guide.beta", { branch: data.branch }) : t("steam.guide.betaAny"), t("steam.guide.wait"));
  }
  lines.push(t("steam.guide.back", { n: missing ? 3 : 4 }));
  if (data.appId !== undefined) lines.push("", t("steam.guide.page", { id: data.appId }));
  lines.push("", t("steam.guide.s2"), "", t("steam.guide.s2text"));
  if (issue.depotAvailable) lines.push("", t("steam.guide.s3"), "", t("steam.guide.s3text"));
  return lines.join("\n");
};
