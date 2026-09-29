<script lang="ts">
  import { de } from '../locale/de';

  let { words, pangrams }: { words: readonly string[]; pangrams: ReadonlySet<string> } = $props();
</script>

<div class="strip">
  <span class="count">{de.foundCount(words.length)}:</span>
  <span class="list">
    {#each words as word, i (word)}
      <span class:pangram={pangrams.has(word)}>{word}{i < words.length - 1 ? ', ' : ''}</span>
    {/each}
  </span>
</div>

<style>
  .strip {
    display: flex;
    gap: 0.5rem;
    margin-inline: 1rem;
    padding: 0.65rem 0.85rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .list {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--muted);
  }

  .pangram {
    font-weight: 800;
    color: var(--accent-text);
  }
</style>
