<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';
import type { MdSelectProps } from '../../types/components';
import type { SelectOption } from '../../types/ui';
import MdIcon from './MdIcon.vue';

const props = withDefaults(defineProps<MdSelectProps>(), {
  disabled: false,
  supportingText: '',
  errorText: '',
  placeholder: '',
  noMatchesText: 'No matches',
});

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const fieldId = useId();
const labelId = `${fieldId}-label`;
const listId = `${fieldId}-list`;
const supportId = `${fieldId}-support`;

const field = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref('');
const activeIndex = ref(-1);
const above = ref(false);
const listStyle = ref<Record<string, string>>({});

function optionId(index: number): string {
  return `${fieldId}-option-${String(index)}`;
}

const hasError = computed(() => props.errorText.length > 0);
const supportMessage = computed(() => (hasError.value ? props.errorText : props.supportingText));

const selectedOption = computed<SelectOption | null>(
  () => props.options.find((option) => option.value === props.modelValue) ?? null,
);
const selectedLabel = computed(() => selectedOption.value?.label ?? '');

const filteredOptions = computed<readonly SelectOption[]>(() => {
  const needle = query.value.trim().toLowerCase();
  if (needle === '') {
    return props.options;
  }
  return props.options.filter((option) => option.label.toLowerCase().includes(needle));
});

const activeOption = computed<SelectOption | null>(
  () => filteredOptions.value[activeIndex.value] ?? null,
);
const activeDescendant = computed(() =>
  activeOption.value === null ? undefined : optionId(activeIndex.value),
);

const displayValue = computed(() => (open.value ? query.value : selectedLabel.value));
const fieldPlaceholder = computed(() =>
  open.value && selectedLabel.value !== '' ? selectedLabel.value : props.placeholder,
);

function positionList(): void {
  const anchor = field.value;
  if (anchor === null) {
    return;
  }
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeAbove = spaceBelow < rect.top;
  above.value = placeAbove;
  listStyle.value = {
    left: `${String(Math.round(rect.left))}px`,
    width: `${String(Math.round(rect.width))}px`,
    top: placeAbove ? 'auto' : `${String(Math.round(rect.bottom))}px`,
    bottom: placeAbove ? `${String(Math.round(window.innerHeight - rect.top))}px` : 'auto',
    '--md-select-space': `${String(Math.round(placeAbove ? rect.top : spaceBelow))}px`,
  };
}

function trackViewport(): void {
  window.addEventListener('scroll', positionList, true);
  window.addEventListener('resize', positionList);
}

function untrackViewport(): void {
  window.removeEventListener('scroll', positionList, true);
  window.removeEventListener('resize', positionList);
}

function openList(): void {
  if (open.value) {
    return;
  }
  query.value = '';
  open.value = true;
  activeIndex.value = props.options.findIndex((option) => option.value === props.modelValue);
}

function closeList(): void {
  open.value = false;
  query.value = '';
  activeIndex.value = -1;
}

function commit(option: SelectOption): void {
  emit('update:modelValue', option.value);
  closeList();
}

function moveActive(delta: number): void {
  const count = filteredOptions.value.length;
  if (count === 0) {
    activeIndex.value = -1;
    return;
  }
  if (activeIndex.value === -1) {
    activeIndex.value = delta > 0 ? 0 : count - 1;
    return;
  }
  activeIndex.value = (activeIndex.value + delta + count) % count;
}

function onInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  query.value = target.value;
  open.value = true;
  activeIndex.value = filteredOptions.value.length === 0 ? -1 : 0;
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    if (open.value) {
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    openList();
    return;
  }
  if (event.key === 'Enter' && open.value) {
    event.preventDefault();
    const option = activeOption.value;
    if (option === null) {
      closeList();
      return;
    }
    commit(option);
    return;
  }
  if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    event.stopPropagation();
    closeList();
    return;
  }
  if (event.key === 'Tab') {
    closeList();
  }
}

watch(
  activeIndex,
  (index) => {
    const container = list.value;
    if (container === null) {
      return;
    }
    const element = container.children[index];
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: 'nearest' });
    }
  },
  { flush: 'post' },
);

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      positionList();
      trackViewport();
      return;
    }
    untrackViewport();
  },
  { flush: 'post' },
);

onBeforeUnmount(untrackViewport);
</script>

<template>
  <div class="md-select" :class="{ 'md-select--error': hasError }">
    <label :id="labelId" class="md-select__label" :for="fieldId">{{ props.label }}</label>
    <div ref="field" class="md-select__field">
      <input
        :id="fieldId"
        class="md-select__input"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        :value="displayValue"
        :placeholder="fieldPlaceholder"
        :disabled="props.disabled"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="activeDescendant"
        :aria-invalid="hasError"
        :aria-describedby="supportMessage === '' ? undefined : supportId"
        @input="onInput"
        @keydown="onKeydown"
        @click="openList"
        @blur="closeList"
      />
      <MdIcon class="md-select__caret" :name="open ? 'expand_less' : 'expand_more'" />
    </div>
    <Teleport to="body">
      <ul
        v-if="open"
        :id="listId"
        ref="list"
        class="md-select__list"
        :class="{ 'md-select__list--above': above }"
        :style="listStyle"
        role="listbox"
        :aria-labelledby="labelId"
      >
        <li
          v-for="(option, index) in filteredOptions"
          :id="optionId(index)"
          :key="option.value"
          class="md-select__option"
          :class="{ 'md-select__option--active': index === activeIndex }"
          role="option"
          :aria-selected="option.value === props.modelValue"
          @mousedown.prevent
          @click="commit(option)"
        >
          {{ option.label }}
        </li>
        <li v-if="filteredOptions.length === 0" class="md-select__empty" role="presentation">
          {{ props.noMatchesText }}
        </li>
      </ul>
    </Teleport>
    <p v-if="supportMessage !== ''" :id="supportId" class="md-select__support">
      {{ supportMessage }}
    </p>
  </div>
</template>

<style scoped>
.md-select {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  inline-size: 100%;
}

.md-select__label {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-select__field {
  position: relative;
  display: flex;
}

.md-select__input {
  inline-size: 100%;
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4) var(--md-sys-spacing-10);
  padding-block: var(--md-sys-spacing-2);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  text-overflow: ellipsis;
  cursor: pointer;
}

.md-select__input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.md-select__input:disabled {
  opacity: var(--md-sys-state-disabled-opacity);
  cursor: not-allowed;
}

.md-select--error .md-select__input {
  border-color: var(--md-sys-color-error);
}

.md-select__caret {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--md-sys-spacing-3);
  transform: translateY(-50%);
  color: var(--md-sys-color-on-surface-variant);
  pointer-events: none;
}

.md-select__list {
  position: fixed;
  max-block-size: min(15rem, calc(var(--md-select-space, 100vh) - var(--md-sys-spacing-4)));
  overflow-y: auto;
  margin-block-start: var(--md-sys-spacing-1);
  padding-block: var(--md-sys-spacing-2);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: var(--md-sys-elevation-level2);
  z-index: var(--md-sys-z-index-popover);
  list-style: none;
}

.md-select__list--above {
  margin-block: 0 var(--md-sys-spacing-1);
}

.md-select__option {
  display: flex;
  align-items: center;
  min-block-size: var(--md-sys-size-touch-target);
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-2);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  cursor: pointer;
}

.md-select__option:hover {
  background-color: var(--md-sys-color-surface-container-highest);
}

.md-select__option[aria-selected='true'] {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-select__option--active {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: -2px;
}

.md-select__empty {
  padding-inline: var(--md-sys-spacing-4);
  padding-block: var(--md-sys-spacing-3);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}

.md-select__support {
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  color: var(--md-sys-color-on-surface-variant);
}

.md-select--error .md-select__support {
  color: var(--md-sys-color-error);
}
</style>
