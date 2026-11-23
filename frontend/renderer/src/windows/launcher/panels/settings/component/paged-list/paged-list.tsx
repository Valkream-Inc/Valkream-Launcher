/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Liste paginée : seule la page affichée est rendue (longues listes de mods / contributeurs).
 */

import { Box, Pagination } from "@mui/material";
import { type ReactNode, useState } from "react";

import { paginate } from "../../../../../../instances/instances.helpers";

interface PagedListProps<T> {
  items: readonly T[];
  /** Éléments par page. */
  pageSize: number;
  renderItem: (item: T) => ReactNode;
}

export default function PagedList<T>({ items, pageSize, renderItem }: PagedListProps<T>) {
  const [requested, setRequested] = useState(1);
  const { items: visible, page, pageCount } = paginate(items, requested, pageSize);

  return (
    <>
      {visible.map(renderItem)}
      {pageCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 1, width: "100%" }}>
          <Pagination count={pageCount} page={page} onChange={(_event, value) => setRequested(value)} />
        </Box>
      )}
    </>
  );
}
