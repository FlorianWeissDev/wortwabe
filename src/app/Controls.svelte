<script lang="ts">
  import { de } from '../locale/de';

  let {
    ondelete,
    onshuffle,
    onsubmit,
  }: { ondelete: () => void; onshuffle: () => void; onsubmit: () => void } = $props();
</script>

<div class="actions">
  <button type="button" onclick={ondelete}>{de.buttons.delete}</button>
  <button type="button" aria-label={de.buttons.shuffle} onclick={onshuffle}>↻</button>
  <button type="button" onclick={onsubmit}>{de.buttons.submit}</button>
</div>

<style>
  .actions {
    display: flex;
    gap: 0.6rem;
    padding: 0.5rem 1rem 1.5rem;
  }
</style>
