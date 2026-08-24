import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MdButton from '../../src/components/md/MdButton.vue';
import MdCheckbox from '../../src/components/md/MdCheckbox.vue';
import MdDialog from '../../src/components/md/MdDialog.vue';
import MdIcon from '../../src/components/md/MdIcon.vue';
import MdIconButton from '../../src/components/md/MdIconButton.vue';
import MdSegmentedButton from '../../src/components/md/MdSegmentedButton.vue';
import MdSwitch from '../../src/components/md/MdSwitch.vue';
import MdTextField from '../../src/components/md/MdTextField.vue';

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
