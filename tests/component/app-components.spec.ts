import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MealListItem from '../../src/components/app/MealListItem.vue';
import ShoppingLineItem from '../../src/components/app/ShoppingLineItem.vue';
import EmptyState from '../../src/components/app/EmptyState.vue';
import { makeMealPlanned } from '../support/factories';

describe('MealListItem', () => {
  it('shows the snapshot name and the schedule', () => {
    const wrapper = mount(MealListItem, {
      props: {
        meal: makeMealPlanned({
          recipeNameSnapshot: 'Tomato soup',
          scheduledDate: '2026-09-01',
          slot: 'dinner',
        }),
        canMoveUp: true,
        canMoveDown: true,
      },
    });

    expect(wrapper.text()).toContain('Tomato soup');
    expect(wrapper.text()).toContain('Tue, 1 Sept 2026');
    expect(wrapper.text()).toContain('dinner');
  });

  it('reports an undated meal', () => {
    const wrapper = mount(MealListItem, {
      props: {
        meal: makeMealPlanned({ recipeNameSnapshot: 'Soup', scheduledDate: null, slot: null }),
        canMoveUp: false,
        canMoveDown: false,
      },
    });

    expect(wrapper.text()).toContain('No date');
  });

  it('BR-07 marks an eaten meal and emits the toggle', async () => {
    const wrapper = mount(MealListItem, {
      props: {
        meal: makeMealPlanned({ recipeNameSnapshot: 'Soup', status: 'eaten', eatenAt: 5 }),
        canMoveUp: false,
        canMoveDown: false,
      },
    });

    expect(wrapper.classes()).toContain('meal-list-item--eaten');
    expect(wrapper.text()).toContain('eaten');

    await wrapper.get('input[type="checkbox"]').setValue(false);
    expect(wrapper.emitted('toggle-eaten')).toHaveLength(1);
  });

  it('BR-06 disables the reorder controls at the boundaries', () => {
    const wrapper = mount(MealListItem, {
      props: {
        meal: makeMealPlanned({}),
        canMoveUp: false,
        canMoveDown: true,
      },
    });

    const moveUp = wrapper.get('[aria-label="Move up"]');
    const moveDown = wrapper.get('[aria-label="Move down"]');
    expect(moveUp.attributes('disabled')).toBeDefined();
    expect(moveDown.attributes('disabled')).toBeUndefined();
  });

  it('BR-09 offers deletion behind the overflow menu', async () => {
    const wrapper = mount(MealListItem, {
      props: { meal: makeMealPlanned({}), canMoveUp: false, canMoveDown: false },
    });

    expect(wrapper.find('[role="menu"]').exists()).toBe(false);

    await wrapper.get('[aria-label="More actions"]').trigger('click');
    expect(wrapper.get('[role="menu"]').text()).toContain('Delete');

    const menuItems = wrapper.findAll('[role="menuitem"]');
    expect(menuItems.map((item) => item.text())).toEqual(['Edit schedule', 'Delete']);

    await menuItems[1]?.trigger('click');
    expect(wrapper.emitted('remove')).toHaveLength(1);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });
});

describe('ShoppingLineItem', () => {
  it('renders the label with its display quantity', () => {
    const wrapper = mount(ShoppingLineItem, {
      props: {
        line: {
          key: 'ingredient:flour:g',
          label: 'Flour',
          categoryId: 'grocery',
          quantity: { amount: 1200, unit: 'g' },
          sources: [],
          purchased: false,
        },
        sourceLabels: [],
      },
    });

    expect(wrapper.text()).toContain('Flour 1.2 kg');
  });

  it('omits the quantity for an unquantified line', () => {
    const wrapper = mount(ShoppingLineItem, {
      props: {
        line: {
          key: 'ingredient:salt:none',
          label: 'Salt',
          categoryId: 'grocery',
          quantity: null,
          sources: [],
          purchased: false,
        },
        sourceLabels: [],
      },
    });

    expect(wrapper.get('.md-list-item__headline').text()).toBe('Salt');
  });

  it('BR-16 emits the purchased state', async () => {
    const wrapper = mount(ShoppingLineItem, {
      props: {
        line: {
          key: 'ingredient:salt:none',
          label: 'Salt',
          categoryId: 'grocery',
          quantity: null,
          sources: [],
          purchased: false,
        },
        sourceLabels: [],
      },
    });

    await wrapper.get('input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted('toggle-purchased')).toEqual([[true]]);
  });

  it('reveals why the line is on the list', async () => {
    const wrapper = mount(ShoppingLineItem, {
      props: {
        line: {
          key: 'ingredient:salt:none',
          label: 'Salt',
          categoryId: 'grocery',
          quantity: null,
          sources: [{ kind: 'staple', stapleId: 'staple-1' }],
          purchased: false,
        },
        sourceLabels: ['Staple', 'Tomato soup'],
      },
    });

    expect(wrapper.text()).not.toContain('Tomato soup');

    await wrapper.get('[aria-label="Show why Salt is listed"]').trigger('click');

    expect(wrapper.text()).toContain('Staple');
    expect(wrapper.text()).toContain('Tomato soup');
  });
});

describe('EmptyState', () => {
  it('renders the icon, title and body', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: 'shopping_cart', title: 'Nothing to buy', body: 'Plan a meal first.' },
    });

    expect(wrapper.get('.md-icon').classes()).toContain('md-icon--shopping_cart');
    expect(wrapper.text()).toContain('Nothing to buy');
    expect(wrapper.text()).toContain('Plan a meal first.');
  });
});
