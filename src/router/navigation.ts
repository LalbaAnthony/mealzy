import type { NavigationItem } from '../types/ui';

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { to: '/meals', label: 'Meals', icon: 'restaurant_menu' },
  { to: '/recipes', label: 'Recipes', icon: 'menu_book' },
  { to: '/shopping', label: 'Shopping', icon: 'shopping_cart' },
  { to: '/staples', label: 'Staples', icon: 'inventory_2' },
  { to: '/pantry', label: 'Pantry', icon: 'kitchen' },
];
