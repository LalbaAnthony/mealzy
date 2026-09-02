import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import MdButton from '../../src/components/md/MdButton.vue';
import MdCheckbox from '../../src/components/md/MdCheckbox.vue';
import MdDialog from '../../src/components/md/MdDialog.vue';
import MdIcon from '../../src/components/md/MdIcon.vue';
import MdIconButton from '../../src/components/md/MdIconButton.vue';
import MdSegmentedButton from '../../src/components/md/MdSegmentedButton.vue';
import MdSelect from '../../src/components/md/MdSelect.vue';
import MdSnackbar from '../../src/components/md/MdSnackbar.vue';
import MdSwitch from '../../src/components/md/MdSwitch.vue';
import MdTextArea from '../../src/components/md/MdTextArea.vue';
import MdTextField from '../../src/components/md/MdTextField.vue';
import type { MdSelectProps } from '../../src/types/components';

describe('MdIcon', () => {
  it('renders the icon font class and hides itself from assistive technology', () => {
    const wrapper = mount(MdIcon, { props: { name: 'delete' } });

    expect(wrapper.classes()).toContain('md-icon');
    expect(wrapper.classes()).toContain('md-icon--delete');
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});

describe('MdButton', () => {
  it('emits a click and applies the variant class', async () => {
    const wrapper = mount(MdButton, {
      props: { variant: 'outlined' },
      slots: { default: 'Save' },
    });

    expect(wrapper.classes()).toContain('md-button--outlined');
    expect(wrapper.text()).toBe('Save');

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('does not emit when disabled', async () => {
    const wrapper = mount(MdButton, { props: { disabled: true } });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});

describe('MdIconButton', () => {
  it('carries an accessible name and a pressed state', () => {
    const wrapper = mount(MdIconButton, {
      props: { icon: 'edit', label: 'Edit recipe', selected: true },
    });

    expect(wrapper.attributes('aria-label')).toBe('Edit recipe');
    expect(wrapper.attributes('aria-pressed')).toBe('true');
  });
});

describe('MdTextField', () => {
  it('binds the label to the input and emits on input', async () => {
    const wrapper = mount(MdTextField, {
      props: { modelValue: '', label: 'Recipe name' },
    });

    const input = wrapper.get('input');
    const label = wrapper.get('label');
    expect(label.attributes('for')).toBe(input.attributes('id'));

    await input.setValue('Tomato soup');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Tomato soup']]);
  });

  it('exposes the error as the described message', () => {
    const wrapper = mount(MdTextField, {
      props: { modelValue: '', label: 'Name', errorText: 'A recipe needs a name.' },
    });

    const input = wrapper.get('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('p').text()).toBe('A recipe needs a name.');
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'));
  });
});

describe('MdTextArea', () => {
  it('binds the label to the textarea and emits on input', async () => {
    const wrapper = mount(MdTextArea, {
      props: { modelValue: '', label: 'Instructions', rows: 6 },
    });

    const textarea = wrapper.get('textarea');
    const label = wrapper.get('label');
    expect(label.attributes('for')).toBe(textarea.attributes('id'));
    expect(textarea.attributes('rows')).toBe('6');

    await textarea.setValue('Simmer for twenty minutes.');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Simmer for twenty minutes.']]);
  });

  it('exposes the error as the described message', () => {
    const wrapper = mount(MdTextArea, {
      props: { modelValue: '', label: 'Instructions', errorText: 'Something is wrong.' },
    });

    const textarea = wrapper.get('textarea');
    expect(textarea.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('p').text()).toBe('Something is wrong.');
    expect(textarea.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'));
  });

  it('prefers the error over the supporting text', () => {
    const wrapper = mount(MdTextArea, {
      props: {
        modelValue: '',
        label: 'Instructions',
        supportingText: 'Optional',
        errorText: 'Something is wrong.',
      },
    });

    expect(wrapper.get('p').text()).toBe('Something is wrong.');
  });
});

describe('MdSelect', () => {
  const options = [
    { value: 'flour', label: 'Flour' },
    { value: 'milk', label: 'Milk' },
    { value: 'olive-oil', label: 'Olive oil' },
  ];

  function mountSelect(props: MdSelectProps) {
    return mount(MdSelect, { props, global: { stubs: { teleport: true } } });
  }

  it('binds the label to the combobox and shows the selected option while closed', () => {
    const wrapper = mountSelect({ modelValue: 'milk', label: 'Ingredient', options });

    const input = wrapper.get('input');
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('role')).toBe('combobox');
    expect(input.attributes('aria-expanded')).toBe('false');
    expect(input.element.value).toBe('Milk');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('opens on click with every option and marks the current one selected', async () => {
    const wrapper = mountSelect({ modelValue: 'milk', label: 'Ingredient', options });
    const input = wrapper.get('input');

    await input.trigger('click');

    const rendered = wrapper.findAll('[role="option"]');
    expect(rendered).toHaveLength(3);
    expect(rendered[1]?.attributes('aria-selected')).toBe('true');
    expect(rendered[0]?.attributes('aria-selected')).toBe('false');
    expect(input.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[role="listbox"]').attributes('id')).toBe(
      input.attributes('aria-controls'),
    );
  });

  it('empties the field for the search and keeps the selection as the placeholder', async () => {
    const wrapper = mountSelect({ modelValue: 'milk', label: 'Ingredient', options });
    const input = wrapper.get('input');

    await input.trigger('click');

    expect(input.element.value).toBe('');
    expect(input.attributes('placeholder')).toBe('Milk');
  });

  it('filters on a case-insensitive substring and emits the clicked option', async () => {
    const wrapper = mountSelect({ modelValue: '', label: 'Ingredient', options });

    await wrapper.get('input').setValue('OIL');

    const rendered = wrapper.findAll('[role="option"]');
    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.text()).toBe('Olive oil');

    await rendered[0]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['olive-oil']]);
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('reports no matches instead of offering an option', async () => {
    const wrapper = mountSelect({
      modelValue: '',
      label: 'Ingredient',
      options,
      noMatchesText: 'Nothing found',
    });

    await wrapper.get('input').setValue('zzz');

    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    expect(wrapper.get('.md-select__empty').text()).toBe('Nothing found');
  });

  it('offers to create the typed name when nothing matches, and emits the trimmed text', async () => {
    const wrapper = mountSelect({
      modelValue: '',
      label: 'Ingredient',
      options,
      allowCreate: true,
      createPrefix: 'Add',
    });

    await wrapper.get('input').setValue('  Basil  ');

    const rendered = wrapper.findAll('[role="option"]');
    expect(rendered).toHaveLength(1);
    expect(rendered[0]?.text()).toBe('Add "Basil"');
    expect(wrapper.find('.md-select__empty').exists()).toBe(false);

    await rendered[0]?.trigger('click');
    expect(wrapper.emitted('create')).toEqual([['Basil']]);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
  });

  it('offers to create alongside a partial match and reaches it with the arrow keys', async () => {
    const wrapper = mountSelect({
      modelValue: '',
      label: 'Ingredient',
      options,
      allowCreate: true,
    });
    const input = wrapper.get('input');

    await input.setValue('mil');
    expect(wrapper.findAll('[role="option"]').map((row) => row.text())).toEqual([
      'Milk',
      'Add "mil"',
    ]);

    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('create')).toEqual([['mil']]);
  });

  it('does not offer to create an exact match, whatever its case', async () => {
    const wrapper = mountSelect({
      modelValue: '',
      label: 'Ingredient',
      options,
      allowCreate: true,
    });

    await wrapper.get('input').setValue('MILK');

    expect(wrapper.findAll('[role="option"]').map((row) => row.text())).toEqual(['Milk']);
  });

  it('keeps the create row out of the list unless it is allowed', async () => {
    const wrapper = mountSelect({ modelValue: '', label: 'Ingredient', options });

    await wrapper.get('input').setValue('zzz');

    expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    expect(wrapper.emitted('create')).toBeUndefined();
  });

  it('walks the filtered options with the arrow keys and commits on enter', async () => {
    const wrapper = mountSelect({ modelValue: '', label: 'Ingredient', options });
    const input = wrapper.get('input');

    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(input.attributes('aria-activedescendant')).toBeUndefined();

    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(input.attributes('aria-activedescendant')).toBe(
      wrapper.findAll('[role="option"]')[0]?.attributes('id'),
    );

    await input.trigger('keydown', { key: 'ArrowUp' });
    expect(input.attributes('aria-activedescendant')).toBe(
      wrapper.findAll('[role="option"]')[2]?.attributes('id'),
    );

    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('update:modelValue')).toEqual([['olive-oil']]);
  });

  it('restores the selected label on escape and on tab without emitting', async () => {
    const wrapper = mountSelect({ modelValue: 'milk', label: 'Ingredient', options });
    const input = wrapper.get('input');

    await input.setValue('fl');
    await input.trigger('keydown', { key: 'Escape' });

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(input.element.value).toBe('Milk');

    await input.setValue('fl');
    await input.trigger('keydown', { key: 'Tab' });

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(input.element.value).toBe('Milk');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('keeps escape from reaching a surrounding dialog while the list is open', async () => {
    const escapes: string[] = [];
    const record = (event: Event): void => {
      if (event instanceof KeyboardEvent) {
        escapes.push(event.key);
      }
    };
    document.addEventListener('keydown', record);

    const wrapper = mount(MdSelect, {
      props: { modelValue: 'milk', label: 'Ingredient', options },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    });
    const input = wrapper.get('input');

    await input.trigger('click');
    await input.trigger('keydown', { key: 'Escape' });
    expect(escapes).toHaveLength(0);

    await input.trigger('keydown', { key: 'Escape' });
    expect(escapes).toEqual(['Escape']);

    document.removeEventListener('keydown', record);
    wrapper.unmount();
  });

  it('renders the list outside the dialog that clips it', async () => {
    const wrapper = mount(MdDialog, {
      props: { open: true, title: 'Edit staple' },
      slots: { default: h(MdSelect, { modelValue: 'milk', label: 'Unit', options }) },
      attachTo: document.body,
    });

    const input = document.querySelector('[role="dialog"] input');
    input?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    const listboxes = document.querySelectorAll('[role="listbox"]');
    expect(listboxes).toHaveLength(1);

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.contains(listboxes[0] ?? null)).toBe(false);

    wrapper.unmount();
  });

  it('closes when focus leaves the field', async () => {
    const wrapper = mountSelect({ modelValue: 'milk', label: 'Ingredient', options });
    const input = wrapper.get('input');

    await input.trigger('click');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true);

    await input.trigger('blur');
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
    expect(input.element.value).toBe('Milk');
  });

  it('exposes the error as the described message', () => {
    const wrapper = mountSelect({
      modelValue: '',
      label: 'Aisle',
      options,
      errorText: 'Pick an aisle.',
    });

    const input = wrapper.get('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('p').text()).toBe('Pick an aisle.');
    expect(input.attributes('aria-describedby')).toBe(wrapper.get('p').attributes('id'));
  });

  it('disables the field through the native attribute', () => {
    const wrapper = mountSelect({
      modelValue: 'milk',
      label: 'Ingredient',
      options,
      disabled: true,
    });

    expect(wrapper.get('input').element.disabled).toBe(true);
  });
});

describe('MdCheckbox', () => {
  it('emits the new checked state', async () => {
    const wrapper = mount(MdCheckbox, {
      props: { modelValue: false, label: 'Purchased' },
    });

    await wrapper.get('input').setValue(true);

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('uses the label as an accessible name when hidden', () => {
    const wrapper = mount(MdCheckbox, {
      props: { modelValue: false, label: 'Purchased', hideLabel: true },
    });

    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.get('input').attributes('aria-label')).toBe('Purchased');
  });
});

describe('MdSwitch', () => {
  it('exposes the switch role and toggles', async () => {
    const wrapper = mount(MdSwitch, { props: { modelValue: false, label: 'Include salt' } });

    const control = wrapper.get('[role="switch"]');
    expect(control.attributes('aria-checked')).toBe('false');

    await control.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('stays silent when disabled', async () => {
    const wrapper = mount(MdSwitch, {
      props: { modelValue: false, label: 'Include salt', disabled: true },
    });

    await wrapper.get('[role="switch"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('renders no label element when the label is omitted', () => {
    const wrapper = mount(MdSwitch, { props: { modelValue: false } });

    expect(wrapper.find('label').exists()).toBe(false);
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
  });
});

describe('MdSegmentedButton', () => {
  it('marks the selected option and emits the chosen value', async () => {
    const wrapper = mount(MdSegmentedButton, {
      props: {
        modelValue: 'planned',
        label: 'Filter',
        options: [
          { value: 'planned', label: 'Planned', icon: null },
          { value: 'eaten', label: 'Eaten', icon: null },
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true');
    expect(buttons[1]?.attributes('aria-pressed')).toBe('false');

    await buttons[1]?.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toEqual([['eaten']]);
  });
});

describe('MdDialog', () => {
  it('renders nothing while closed', () => {
    const wrapper = mount(MdDialog, {
      props: { open: false, title: 'Delete?' },
      attachTo: document.body,
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    wrapper.unmount();
  });

  it('exposes a labelled modal dialog and closes on escape', async () => {
    const wrapper = mount(MdDialog, {
      props: { open: true, title: 'Delete this meal?' },
      attachTo: document.body,
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('aria-modal')).toBe('true');

    const labelledBy = dialog?.getAttribute('aria-labelledby');
    expect(document.getElementById(labelledBy ?? '')?.textContent).toBe('Delete this meal?');

    dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);

    wrapper.unmount();
  });
});

describe('MdSnackbar', () => {
  it('renders both tones on the inverse surface and marks the error tone with an icon', () => {
    const neutral = mount(MdSnackbar, { props: { message: 'Meal saved' } });
    const error = mount(MdSnackbar, { props: { message: 'Storage unavailable', tone: 'error' } });

    expect(neutral.classes()).toContain('md-snackbar--neutral');
    expect(neutral.findComponent(MdIcon).exists()).toBe(false);

    expect(error.classes()).toContain('md-snackbar--error');
    expect(error.findComponent(MdIcon).props('name')).toBe('error');
  });

  it('renders the action only when labelled and emits it', async () => {
    const silent = mount(MdSnackbar, { props: { message: 'Meal saved' } });
    expect(silent.findComponent(MdButton).exists()).toBe(false);

    const wrapper = mount(MdSnackbar, { props: { message: 'Meal saved', actionLabel: 'Dismiss' } });
    const action = wrapper.findComponent(MdButton);

    expect(action.props('variant')).toBe('text');
    expect(action.classes()).toContain('md-snackbar__action');

    await action.trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });
});
