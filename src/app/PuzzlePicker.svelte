<script lang="ts">
  import type { PuzzleDate } from '../engine';
  import { de } from '../locale/de';
  import type { PickerEntry } from './picker';

  let {
    open,
    entries,
    onpick,
    onclose,
  }: {
    open: boolean;
    entries: readonly PickerEntry[];
    onpick: (date: PuzzleDate) => void;
    onclose: () => void;
  } = $props();
</script>

{#if open}
  <div class="picker" role="dialog" aria-modal="true" aria-label={de.picker.title}>
    <h2>{de.picker.title}</h2>
    <ul aria-label={de.aria.puzzleList}>
      {#each entries as entry (entry.date)}
        <li>
          <button
            type="button"
            aria-current={entry.isSelected ? 'true' : undefined}
            onclick={() => {
              onpick(entry.date);
            }}
          >
            {de.picker.rowDate(entry.date)}
            {#if entry.isCurrent}<b>{de.picker.currentBadge}</b>{/if}
            {de.ranks[entry.rankId]} · {de.picker.foundOfTotal(entry.foundCount, entry.totalWords)}
          </button>
        </li>
      {/each}
    </ul>
    <button type="button" onclick={onclose}>{de.picker.close}</button>
  </div>
{/if}
