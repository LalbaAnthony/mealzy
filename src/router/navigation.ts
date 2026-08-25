import type { NavigationItem } from '../types/ui';

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { to: '/pantry', label: 'Pantry', icon: 'kitchen' },
  { to: '/staples', label: 'Staples', icon: 'inventory_2' },
  { to: '/recipes', label: 'Recipes', icon: 'menu_book' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping_cart' },
  { to: '/meals', label: 'Meals', icon: 'restaurant_menu' },
];
