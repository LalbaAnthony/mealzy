<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { DeleteAllDataDialogProps } from '../../types/components';
import type { DeleteAllDataStep } from '../../types/ui';
import MdButton from '../md/MdButton.vue';
import MdCheckbox from '../md/MdCheckbox.vue';
import MdDialog from '../md/MdDialog.vue';
import MdTextField from '../md/MdTextField.vue';

const props = defineProps<DeleteAllDataDialogProps>();

const emit = defineEmits<{ 'export-backup': []; confirm: []; cancel: [] }>();

const CONFIRMATION_PHRASE = 'DELETE';

const step = ref<DeleteAllDataStep>('backup');
const acknowledged = ref(false);
const typedPhrase = ref('');
const stepContent = ref<HTMLElement | null>(null);

const title = computed(() =>
  step.value === 'backup' ? 'Export a backup first' : 'Delete everything?',
);

const phraseMatches = computed(
  () => typedPhrase.value.trim().toUpperCase() === CONFIRMATION_PHRASE,
);

function focusFirstControl(): void {
  const container = stepContent.value;
  if (container === null) {
    return;
  }
  const target = container.querySelector('button, input');
  if (target instanceof HTMLElement) {
    target.focus();
  }
}

function goToStep(next: DeleteAllDataStep): void {
  step.value = next;
  void nextTick(focusFirstControl);
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

const deletionLines = computed(() => [
  countLabel(props.summary.recipes, 'recipe', 'recipes'),
  countLabel(props.summary.plannedMeals, 'planned meal', 'planned meals'),
  countLabel(props.summary.ingredients, 'ingredient', 'ingredients'),
  countLabel(props.summary.categories, 'category', 'categories'),
  countLabel(props.summary.staples, 'staple', 'staples'),
  countLabel(props.summary.adHocItems, 'ad hoc item', 'ad hoc items'),
  countLabel(props.summary.purchasedTicks, 'purchased tick', 'purchased ticks'),
]);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 'backup';
      acknowledged.value = false;
      typedPhrase.value = '';
    }
  },
);
</script>

<template>
  <MdDialog :open="props.open" :title="title" @close="emit('cancel')">
    <div ref="stepContent" class="delete-all-data__content">
      <template v-if="step === 'backup'">
        <p class="delete-all-data__warning">
          Every recipe, meal and list lives in this browser only. There is no server copy, no
          account and no undo.
        </p>
        <p>About to be deleted:</p>
        <ul class="delete-all-data__list">
          <li v-for="line in deletionLines" :key="line">{{ line }}</li>
        </ul>
        <MdButton variant="tonal" icon="download" @click="emit('export-backup')">
          Export backup now
        </MdButton>
        <p v-if="props.backupExported" class="delete-all-data__exported">
          Backup downloaded. Check the file before you continue.
        </p>
        <MdCheckbox
          :model-value="acknowledged"
          label="I have a backup, or I accept losing this data for good."
          @update:model-value="acknowledged = $event"
        />
      </template>

      <template v-else>
        <p class="delete-all-data__warning">
          This is the last step. Deleting is immediate and permanent, and it cannot be undone from
          inside Mealzy.
        </p>
        <p>
          Mealzy restarts as it does on a new device, with its default categories and staples, and
          the theme back on System.
        </p>
        <MdTextField
          :model-value="typedPhrase"
          label="Type DELETE to confirm"
          placeholder="DELETE"
          :supporting-text="`Type ${CONFIRMATION_PHRASE} to unlock the button.`"
          @update:model-value="typedPhrase = $event"
        />
      </template>
    </div>

    <template #actions>
      <template v-if="step === 'backup'">
        <MdButton variant="text" @click="emit('cancel')">Cancel</MdButton>
        <MdButton variant="tonal" :disabled="!acknowledged" @click="goToStep('confirm')">
          Continue
        </MdButton>
      </template>
      <template v-else>
        <MdButton variant="text" @click="goToStep('backup')">Back</MdButton>
        <MdButton
          variant="filled"
          icon="delete_forever"
          :disabled="!phraseMatches"
          @click="emit('confirm')"
        >
          Delete everything
        </MdButton>
      </template>
    </template>
  </MdDialog>
</template>

<style scoped>
.delete-all-data__content {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-3);
}

.delete-all-data__warning {
  color: var(--md-sys-color-error);
  font-weight: var(--md-sys-typescale-weight-medium);
}

.delete-all-data__list {
  display: flex;
  flex-direction: column;
  gap: var(--md-sys-spacing-1);
  padding-inline-start: var(--md-sys-spacing-4);
  list-style: disc;
}

.delete-all-data__exported {
  color: var(--md-sys-color-primary);
}
</style>
