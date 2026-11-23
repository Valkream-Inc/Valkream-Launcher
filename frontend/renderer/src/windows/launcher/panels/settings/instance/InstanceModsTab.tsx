/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Mods (affichage joueur) : mods décrits par la config remote de l'instance.
 * Lecture seule : disponible même pendant une installation (voir l'onglet Debug pour le détail technique).
 */

import { Avatar, Box, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { InstanceReport } from "@shared/types";

import { localized } from "../../../../../i18n";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const open = (url: string) => window.electron_API.openLink(url).catch(console.error);

export default function InstanceModsTab({ report }: { report: InstanceReport }) {
  const { t } = useTranslation();
  const { mods } = report;

  return (
    <>
      <SettingsTitle warn={false} scope="game">{t("instance.mods", { count: mods.length })}</SettingsTitle>
      {mods.length === 0 && (
        <SettingsBox warn={false}>
          <Typography>{t("instance.noMods")}</Typography>
        </SettingsBox>
      )}
      {mods.map((mod) => (
        <SettingsBox key={mod.id ?? mod.name} warn={false}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {mod.icon && <Avatar variant="rounded" src={mod.icon} alt={mod.name} slotProps={{ img: { loading: "lazy", decoding: "async" } }} />}
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{mod.name}</Typography>
              {mod.description && <Typography variant="body2">{localized(mod.description)}</Typography>}
              {mod.link && (
                <Link component="button" onClick={() => open(mod.link as string)}>
                  {t("instance.seePage")}
                </Link>
              )}
            </Box>
          </Box>
        </SettingsBox>
      ))}
    </>
  );
}
