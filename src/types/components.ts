import type { IconName } from './icons';
import type { MealPlanned } from './meal';
import type { LocalDataSummary } from './services';
import type { ShoppingLine } from './shopping';
import type {
  ButtonVariant,
  ChipVariant,
  ListItemLines,
  NavigationItem,
  SegmentedOption,
  SelectOption,
  SnackbarTone,
  TextFieldType,
} from './ui';

export interface MdIconProps {
  name: IconName;
}

export interface MdButtonProps {
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  disabled?: boolean;
  icon?: IconName | null;
  fullWidth?: boolean;
}

export interface MdIconButtonProps {
  icon: IconName;
  label: string;
  variant?: 'standard' | 'filled' | 'tonal';
  disabled?: boolean;
  selected?: boolean;
}

export interface MdFabProps {
  icon: IconName;
  label: string;
  extended?: boolean;
}

export interface MdTextFieldProps {
  modelValue: string;
  label: string;
  type?: TextFieldType;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  supportingText?: string;
  errorText?: string;
  min?: string;
  step?: string;
}

export interface MdSelectProps {
  modelValue: string;
  label: string;
  options: readonly SelectOption[];
  disabled?: boolean;
  supportingText?: string;
  errorText?: string;
  placeholder?: string;
  noMatchesText?: string;
}

export interface MdCheckboxProps {
  modelValue: boolean;
  label: string;
  disabled?: boolean;
  hideLabel?: boolean;
}

export interface MdSwitchProps {
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
}

export interface MdChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: IconName | null;
  removable?: boolean;
  disabled?: boolean;
}

export interface MdSegmentedButtonProps {
  modelValue: string;
  options: readonly SegmentedOption[];
  label: string;
}

export interface MdCardProps {
  variant?: 'elevated' | 'filled' | 'outlined';
}

export interface MdListProps {
  label?: string;
}

export interface MdListItemProps {
  headline: string;
  supportingText?: string;
  lines?: ListItemLines;
  interactive?: boolean;
}

export interface MdDialogProps {
  open: boolean;
  title: string;
  describedBy?: string;
}

export interface MdSnackbarProps {
  message: string;
  tone?: SnackbarTone;
  actionLabel?: string;
}

export interface MdTopAppBarProps {
  title: string;
}

export interface MdNavigationBarProps {
  items: readonly NavigationItem[];
  rail?: boolean;
}

export interface MdMenuProps {
  open: boolean;
  label: string;
}

export interface MdMenuItemProps {
  label: string;
  icon?: IconName | null;
  destructive?: boolean;
  disabled?: boolean;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  details?: readonly string[];
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface DeleteAllDataDialogProps {
  open: boolean;
  summary: LocalDataSummary;
  backupExported: boolean;
}

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body: string;
}

export interface QuantityFieldProps {
  amount: string;
  unit: string;
  label: string;
}

export interface ShoppingLineSourcesProps {
  sourceLabels: readonly string[];
}

export interface MealListItemProps {
  meal: MealPlanned;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface ShoppingLineItemProps {
  line: ShoppingLine;
  sourceLabels: readonly string[];
}

export interface RecipeIngredientRowProps {
  ingredientName: string;
  quantityLabel: string;
}

export interface StorageUnavailableProps {
  message: string;
}
