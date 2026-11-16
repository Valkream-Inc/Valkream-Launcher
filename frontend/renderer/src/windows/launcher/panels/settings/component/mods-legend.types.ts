/**
 * @author Valkream Team
 * @license MIT-NC
 */

export interface ModsStats {
  total: number;
  processed: number;
  updatesAvailable: number;
  errors: number;
}

export interface LegendItem {
  color: string;
  label: string;
}

export interface LegendProps {
  stats: ModsStats;
  error: string | null;
  isDevActive: boolean;
}
