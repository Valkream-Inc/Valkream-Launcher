/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
