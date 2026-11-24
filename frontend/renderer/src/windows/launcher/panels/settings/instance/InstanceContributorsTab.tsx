/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Contributeurs (affichage joueur) : personnes décrites par la config remote de l'instance.
 * Lecture seule : disponible même pendant une installation.
 */

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  Link,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { InstanceReport } from "@shared/types";

import { useGames } from "@/src/windows/launcher/context/games.context";
import { localized } from "../../../../../i18n";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

type ContributorItem = InstanceReport["contributors"][number];

const PAGE_SIZE = 24;

const open = (url: string) =>
  window.electron_API.openLink(url).catch(console.error);

const foldText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

/**
 * Calcule un score de pertinence (>= 0) pour une requête sur une cible donnée.
 * 0 signifie aucune correspondance.
 */
function scoreField(query: string, target: string, weight = 1): number {
  if (!query || !target) return 0;

  if (target === query) return 1000 * weight;
  if (target.startsWith(query)) return 700 * weight;

  const subIndex = target.indexOf(query);
  if (subIndex !== -1) {
    const boundaryBonus =
      subIndex === 0 || /[\s\-_:/]/.test(target[subIndex - 1]) ? 120 : 0;
    return (500 - Math.min(subIndex, 200) + boundaryBonus) * weight;
  }

  let qIdx = 0;
  let score = 0;
  let streak = 0;
  let lastMatchIdx = -2;

  for (let i = 0; i < target.length && qIdx < query.length; i++) {
    if (target[i] === query[qIdx]) {
      streak = i === lastMatchIdx + 1 ? streak + 1 : 1;
      score += 25 + streak * 15;
      if (i === 0 || /[\s\-_:/]/.test(target[i - 1])) {
        score += 20;
      }
      lastMatchIdx = i;
      qIdx++;
    }
  }

  if (qIdx < query.length) return 0;

  const compactnessBonus = Math.max(
    0,
    60 - Math.max(0, target.length - query.length),
  );
  return (score + compactnessBonus) * weight;
}

function rankContributor(person: ContributorItem, rawQuery: string): number {
  const query = foldText(rawQuery);
  if (!query) return 1;

  const name = foldText(person.name ?? "");
  const role = foldText((person.role ? localized(person.role) : "") ?? "");
  const link = foldText(String(person.link ?? ""));

  const nameScore = scoreField(query, name, 2);
  const roleScore = scoreField(query, role, 1.3);
  const linkScore = scoreField(query, link, 0.75);

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    let tokenTotal = 0;
    for (const token of tokens) {
      const bestToken = Math.max(
        scoreField(token, name, 2),
        scoreField(token, role, 1.3),
        scoreField(token, link, 0.75),
      );
      if (bestToken === 0) {
        return Math.max(nameScore, roleScore, linkScore);
      }
      tokenTotal += bestToken;
    }
    return Math.max(nameScore, roleScore, linkScore, tokenTotal * 1.1);
  }

  return Math.max(nameScore, roleScore, linkScore);
}

export default function InstanceContributorsTab({
  report,
}: {
  report: InstanceReport;
}) {
  const { t } = useTranslation();
  const { actualChannel: channel } = useGames();
  const { contributors } = report;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement | null>(null);
  const prevPageRef = useRef<number | null>(null);

  const filteredContributors = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return contributors;

    return contributors
      .map((person, index) => ({
        person,
        index,
        score: rankContributor(person, trimmed),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.person);
  }, [contributors, search]);

  useEffect(() => {
    setPage(1);
  }, [search, contributors]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredContributors.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (prevPageRef.current !== null && prevPageRef.current !== safePage) {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevPageRef.current = safePage;
  }, [safePage]);

  const visibleContributors = useMemo(
    () =>
      filteredContributors.slice(
        (safePage - 1) * PAGE_SIZE,
        safePage * PAGE_SIZE,
      ),
    [filteredContributors, safePage],
  );

  // Titre stable : évite de faire varier la largeur du titre quand on filtre
  const totalDigits = String(contributors.length).length;
  const paddedFilteredCount = String(filteredContributors.length).padStart(
    totalDigits,
    "\u00A0",
  );
  const titleLabel = t("instance.contributors", {
    count:
      contributors.length === 0
        ? contributors.length
        : `${paddedFilteredCount} / ${contributors.length}`,
  });

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: "100%",
          overflowY: "hidden",
          scrollbarGutter: "stable",
        }}
      >
        <SettingsTitle
          warn={false}
          scope="game"
          scopeDetail={channel !== "stable" ? channel : undefined}
        >
          <Stack
            direction="row"
            useFlexGap
            spacing={1.5}
            sx={{
              width: "100%",
              minHeight: 40,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              rowGap: 1,
              minWidth: 0,
            }}
          >
            <Box
              component="span"
              sx={{
                lineHeight: 1.2,
                minWidth: 0,
                flex: "1 1 auto",
                overflowWrap: "anywhere",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {titleLabel}
            </Box>

            {contributors.length > 0 && (
              <Stack
                direction="row"
                useFlexGap
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                  rowGap: 1,
                  flex: "0 1 auto",
                  maxWidth: "100%",
                  minWidth: 0,
                }}
              >
                <Pagination
                  size="small"
                  count={pageCount}
                  page={safePage}
                  onChange={(_event, value) => setPage(value)}
                  siblingCount={0}
                  boundaryCount={1}
                  sx={{
                    minHeight: 32,
                    display: "flex",
                    alignItems: "center",
                    visibility: pageCount > 1 ? "visible" : "hidden",
                  }}
                />

                <TextField
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("instance.searchContributors")}
                  sx={{
                    width: { xs: "100%", sm: 220, md: 240 },
                    flex: "1 1 160px",
                    maxWidth: { sm: 240 },
                    "& .MuiInputBase-root": {
                      height: 36,
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          sx={{
                            visibility: search ? "visible" : "hidden",
                          }}
                        >
                          <IconButton
                            size="small"
                            aria-label={t("instance.clearSearch")}
                            onClick={() => setSearch("")}
                            edge="end"
                            tabIndex={search ? 0 : -1}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>
            )}
          </Stack>
        </SettingsTitle>
      </Box>

      <Box
        ref={listRef}
        sx={{
          flex: 1,
          flexGrow: 1,
          minHeight: 0,
          overflowY: "auto",
          scrollbarGutter: "stable",
          width: "100%",
        }}
      >
        {contributors.length === 0 ? (
          <SettingsBox warn={false}>
            <Typography color="text.secondary">
              {t("instance.noContributors")}
            </Typography>
          </SettingsBox>
        ) : filteredContributors.length === 0 ? (
          <SettingsBox warn={false}>
            <Typography color="text.secondary">
              {t("instance.noMatchingContributors")}
            </Typography>
          </SettingsBox>
        ) : (
          <SettingsBox warn={false}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(auto-fill, minmax(220px, 1fr))",
                },
                columnGap: 3,
                rowGap: 2,
                alignItems: "center",
              }}
            >
              {visibleContributors.map((person) => {
                const roleText =
                  (person.role ? localized(person.role) : "") ?? "";

                return (
                  <Box
                    key={person.name}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "center",
                      minWidth: 0, // Indispensable pour que l'ellipsis fonctionne dans une grid
                    }}
                  >
                    <Avatar
                      src={person.avatar || undefined}
                      alt={person.name}
                      slotProps={{
                        img: { loading: "lazy", decoding: "async" },
                      }}
                      sx={{ width: 36, height: 36, flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      {person.link ? (
                        <Link
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => open(person.link as string)}
                          sx={{
                            display: "block",
                            maxWidth: "100%",
                            textAlign: "left",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          {person.name}
                        </Link>
                      ) : (
                        <Typography noWrap sx={{ fontWeight: 500 }}>
                          {person.name}
                        </Typography>
                      )}
                      {roleText && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          sx={{ display: "block" }}
                        >
                          {roleText}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </SettingsBox>
        )}
      </Box>
    </Box>
  );
}
