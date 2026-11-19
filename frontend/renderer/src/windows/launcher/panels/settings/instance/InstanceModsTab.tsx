/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Mods (affichage joueur) : mods et contributeurs décrits par la config
 * remote de l'instance. Aucun détail technique ici (voir l'onglet Debug).
 */

import { Avatar, Box, Link, Typography } from "@mui/material";

import type { InstanceReport } from "@shared/types";

import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const open = (url: string) => window.electron_API.openLink(url).catch(console.error);

export default function InstanceModsTab({ report }: { report: InstanceReport }) {
  const { mods, contributors } = report;

  return (
    <>
      <SettingsTitle warn={false}>Mods ({mods.length})</SettingsTitle>
      {mods.length === 0 && (
        <SettingsBox warn={false}>
          <Typography>Aucun mod à afficher pour cette instance.</Typography>
        </SettingsBox>
      )}
      {mods.map((mod) => (
        <SettingsBox key={mod.id ?? mod.name} warn={false}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {mod.icon && <Avatar variant="rounded" src={mod.icon} alt={mod.name} />}
            <Box>
              <Typography fontWeight={700}>{mod.name}</Typography>
              {mod.description && <Typography variant="body2">{mod.description}</Typography>}
              {mod.link && (
                <Link component="button" onClick={() => open(mod.link as string)}>
                  Voir la page
                </Link>
              )}
            </Box>
          </Box>
        </SettingsBox>
      ))}

      <SettingsTitle warn={false}>Contributeurs ({contributors.length})</SettingsTitle>
      <SettingsBox warn={false}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {contributors.map((person) => (
            <Box key={person.name} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Avatar src={person.avatar} alt={person.name} sx={{ width: 32, height: 32 }} />
              <Box>
                {person.link ? (
                  <Link component="button" onClick={() => open(person.link as string)}>
                    {person.name}
                  </Link>
                ) : (
                  <Typography>{person.name}</Typography>
                )}
                {person.role && <Typography variant="caption">{person.role}</Typography>}
              </Box>
            </Box>
          ))}
        </Box>
      </SettingsBox>
    </>
  );
}
