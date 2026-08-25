import type { CategoryId } from '../types/identifiers';
import type { AppPreferences } from '../types/settings';

export const UNCATEGORIZED_CATEGORY_ID: CategoryId = 'uncategorized';
export const UNCATEGORIZED_CATEGORY_NAME = 'Uncategorized';
export const UNCATEGORIZED_CATEGORY_SORT_ORDER = 1000;

export const DEFAULT_APP_PREFERENCES: AppPreferences = { themePreference: 'system' };
