/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Contributeurs (affichage joueur) : personnes décrites par la config remote de l'instance.
 * Lecture seule : disponible même pendant une installation.
 */

import { Avatar, Box, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { InstanceReport } from "@shared/types";

import { localized } from "../../../../../i18n";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const open = (url: string) => window.electron_API.openLink(url).catch(console.error);

export default function InstanceContributorsTab({ report }: { report: InstanceReport }) {
  const { t } = useTranslation();
  const { contributors } = report;

  return (
    <>
      <SettingsTitle warn={false} scope="game">{t("instance.contributors", { count: contributors.length })}</SettingsTitle>
      <SettingsBox warn={false}>
        {contributors.length === 0 && <Typography>{t("instance.noContributors")}</Typography>}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {contributors.map((person) => (
            <Box key={person.name} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Avatar src={person.avatar} alt={person.name} slotProps={{ img: { loading: "lazy", decoding: "async" } }} sx={{ width: 32, height: 32 }} />
              <Box>
                {person.link ? (
                  <Link component="button" onClick={() => open(person.link as string)}>
                    {person.name}
                  </Link>
                ) : (
                  <Typography>{person.name}</Typography>
                )}
                {person.role && <Typography variant="caption">{localized(person.role)}</Typography>}
              </Box>
            </Box>
          ))}
        </Box>
      </SettingsBox>
    </>
  );
}
