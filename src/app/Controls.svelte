<script lang="ts">
  import { de } from '../locale/de';

  let {
    ondelete,
    onshuffle,
    onsubmit,
  }: { ondelete: () => void; onshuffle: () => void; onsubmit: () => void } = $props();

  const keepFocus = (event: PointerEvent): void => {
    event.preventDefault();
  };
</script>

<div class="actions">
  <button type="button" class="btn" onpointerdown={keepFocus} onclick={ondelete}>
    {de.buttons.delete}
  </button>
  <button
    type="button"
    class="btn round"
    aria-label={de.buttons.shuffle}
    onpointerdown={keepFocus}
    onclick={onshuffle}
  >
    ↻
  </button>
  <button type="button" class="btn primary" onpointerdown={keepFocus} onclick={onsubmit}>
    {de.buttons.submit}
  </button>
</div>

<style>
  .actions {
    display: flex;
    gap: 0.6rem;
    align-items: stretch;
    padding: 0.5rem 1rem 1.5rem;
  }
  .btn {
    min-height: 3.25rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    padding-inline: 1.1rem;
    font-weight: 700;
    font-size: 1rem;
    flex: 1;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .btn:active {
    background: var(--cell-press);
  }
  .btn.round {
    flex: none;
    width: 3.25rem;
    padding: 0;
    font-size: 1.5rem;
    line-height: 1;
  }
  .btn.primary {
    background: var(--accent);
    border-color: var(--accent-strong);
    color: var(--on-accent);
    flex: 1.3;
  }
  .btn.primary:active {
    background: var(--accent-strong);
  }
</style>
