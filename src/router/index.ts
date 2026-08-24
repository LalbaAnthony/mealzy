import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: readonly RouteRecordRaw[] = [
  { path: '/', redirect: '/meals' },
  {
    path: '/meals',
    name: 'meals',
    component: () => import('../views/MealsView.vue'),
    meta: { title: 'Meals' },
  },
  {
    path: '/recipes',
    name: 'recipes',
    component: () => import('../views/RecipesView.vue'),
    meta: { title: 'Recipes' },
  },
  {
    path: '/recipes/:id',
    name: 'recipe-edit',
    component: () => import('../views/RecipeEditView.vue'),
    meta: { title: 'Recipe' },
  },
  {
    path: '/shopping',
    name: 'shopping',
    component: () => import('../views/ShoppingListView.vue'),
    meta: { title: 'Shopping list' },
  },
  {
    path: '/staples',
    name: 'staples',
    component: () => import('../views/StaplesView.vue'),
    meta: { title: 'Staples' },
  },
  {
    path: '/pantry',
    name: 'pantry',
    component: () => import('../views/IngredientsView.vue'),
    meta: { title: 'Pantry' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { title: 'Settings' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/meals' },
];

export const router = createRouter({
  history: createWebHistory(),
  routes: [...routes],
});
