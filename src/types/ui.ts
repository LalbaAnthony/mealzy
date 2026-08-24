import type { IconName } from './icons';
import type { Unit } from './units';

export type SnackbarTone = 'neutral' | 'error';

export interface SnackbarMessage {
  readonly id: string;
  readonly text: string;
  readonly tone: SnackbarTone;
}

export interface ConfirmDialogRequest {
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly destructive: boolean;
}

export interface NavigationItem {
  readonly to: string;
  readonly label: string;
  readonly icon: IconName;
}

export type ViewportClass = 'compact' | 'medium' | 'expanded';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
  readonly icon: IconName | null;
}

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
export type ChipVariant = 'assist' | 'filter' | 'input';
export type TextFieldType = 'text' | 'number' | 'date';
export type ListItemLines = 'one' | 'two' | 'three';
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface UnitOption {
  readonly value: Unit;
  readonly label: string;
}

export interface RecipeIngredientRowState {
  ingredientId: string;
  amount: string;
  unit: Unit;
}
