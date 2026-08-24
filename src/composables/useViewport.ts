import { onScopeDispose, ref } from 'vue';
import type { ViewportClass } from '../types/ui';
import type { ViewportApi } from '../types/composables';

const MEDIUM_BREAKPOINT = '(min-width: 600px)';
const EXPANDED_BREAKPOINT = '(min-width: 840px)';

export function useViewport(): ViewportApi {
  const viewportClass = ref<ViewportClass>('compact');

  const mediumQuery = window.matchMedia(MEDIUM_BREAKPOINT);
  const expandedQuery = window.matchMedia(EXPANDED_BREAKPOINT);

  function update(): void {
    if (expandedQuery.matches) {
      viewportClass.value = 'expanded';
      return;
    }
    viewportClass.value = mediumQuery.matches ? 'medium' : 'compact';
  }

  update();
  mediumQuery.addEventListener('change', update);
  expandedQuery.addEventListener('change', update);

  onScopeDispose(() => {
    mediumQuery.removeEventListener('change', update);
    expandedQuery.removeEventListener('change', update);
  });

  return { viewportClass };
}
