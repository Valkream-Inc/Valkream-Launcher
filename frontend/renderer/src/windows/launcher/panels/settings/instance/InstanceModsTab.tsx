/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Mods (affichage joueur) : mods décrits par la config remote de l'instance.
 * Lecture seule : disponible même pendant une installation (voir l'onglet Debug pour le détail technique).
 */

import ClearIcon from "@mui/icons-material/Clear";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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

import { localized } from "../../../../../i18n";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

type ModItem = InstanceReport["mods"][number];

const PAGE_SIZE = 10;

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

function rankMod(mod: ModItem, rawQuery: string): number {
  const query = foldText(rawQuery);
  if (!query) return 1;

  const name = foldText(mod.name ?? "");
  const description = foldText(
    (mod.description ? localized(mod.description) : "") ?? "",
  );
  const id = foldText(String(mod.id ?? ""));

  const nameScore = scoreField(query, name, 2);
  const idScore = scoreField(query, id, 1.2);
  const descScore = scoreField(query, description, 0.75);

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    let tokenTotal = 0;
    for (const token of tokens) {
      const bestToken = Math.max(
        scoreField(token, name, 2),
        scoreField(token, id, 1.2),
        scoreField(token, description, 0.75),
      );
      if (bestToken === 0) {
        return Math.max(nameScore, idScore, descScore);
      }
      tokenTotal += bestToken;
    }
    return Math.max(nameScore, idScore, descScore, tokenTotal * 1.1);
  }

  return Math.max(nameScore, idScore, descScore);
}

export default function InstanceModsTab({
  report,
}: {
  report: InstanceReport;
}) {
  const { t } = useTranslation();
  const { mods } = report;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement | null>(null);
  const prevPageRef = useRef<number | null>(null);

  const filteredMods = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return mods;

    return mods
      .map((mod, index) => ({
        mod,
        index,
        score: rankMod(mod, trimmed),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((entry) => entry.mod);
  }, [mods, search]);

  useEffect(() => {
    setPage(1);
  }, [search, mods]);

  const pageCount = Math.max(1, Math.ceil(filteredMods.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (prevPageRef.current !== null && prevPageRef.current !== safePage) {
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevPageRef.current = safePage;
  }, [safePage]);

  const visibleMods = useMemo(
    () => filteredMods.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredMods, safePage],
  );

  // Titre stable : évite de faire varier la largeur du titre quand on filtre
  const totalDigits = String(mods.length).length;
  const paddedFilteredCount = String(filteredMods.length).padStart(
    totalDigits,
    "\u00A0",
  );
  const titleLabel = t("instance.mods", {
    count:
      mods.length == 0
        ? mods.length
        : `${paddedFilteredCount} / ${mods.length}`,
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
        <SettingsTitle warn={false} scope="game">
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
              }}
            >
              {titleLabel}
            </Box>

            {mods.length > 0 && (
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
                  placeholder={t("instance.searchMods")}
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
        {mods.length === 0 ? (
          <Typography color="text.secondary">{t("instance.noMods")}</Typography>
        ) : filteredMods.length === 0 ? (
          <SettingsBox warn={false}>
            <Typography color="text.secondary">
              {t("instance.noMatchingMods")}
            </Typography>
          </SettingsBox>
        ) : (
          visibleMods.map((mod) => {
            const desc = mod.description ? localized(mod.description) : "";

            return (
              <SettingsBox key={mod.id ?? mod.name} warn={false}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-start",
                    py: 0.5,
                    transition: "transform 140ms ease, opacity 140ms ease",
                    "&:hover": {
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={mod.icon || undefined}
                    alt={mod.name}
                    slotProps={{
                      img: { loading: "lazy", decoding: "async" },
                    }}
                    sx={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      fontWeight: 700,
                      bgcolor: "action.selected",
                      color: "text.primary",
                      borderRadius: 1.5,
                    }}
                  >
                    {!mod.icon ? mod.name.slice(0, 2).toUpperCase() : null}
                  </Avatar>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        lineHeight: 1.3,
                        wordBreak: "break-word",
                      }}
                    >
                      {mod.name}
                    </Typography>

                    {desc && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {desc}
                      </Typography>
                    )}

                    {mod.link && (
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => open(mod.link as string)}
                        sx={{
                          mt: 0.75,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                        }}
                      >
                        {t("instance.seePage")}
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </Link>
                    )}
                  </Box>
                </Box>
              </SettingsBox>
            );
          })
        )}
      </Box>
    </Box>
  );
}
