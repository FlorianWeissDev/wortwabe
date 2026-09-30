<script lang="ts">
  import { untrack } from 'svelte';

  import { de } from '../locale/de';

  let {
    words,
    pangrams,
    total,
  }: { words: readonly string[]; pangrams: ReadonlySet<string>; total?: number } = $props();

  let open = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let flashId = $state(0);

  function close(): void {
    open = false;
    trigger?.focus();
  }

  function focusOnMount(node: HTMLElement): void {
    node.focus({ preventScroll: true });
  }

  // The sheet has no focusable children, so Tab simply stays on it.
  function trap(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  // Flash only when a word is added during this component's lifetime; the parent
  // remounts on a puzzle switch, so the initial count is never a "new word".
  let previousCount = untrack(() => words.length);
  $effect(() => {
    const count = words.length;
    if (count > previousCount) {
      flashId += 1;
    }
    previousCount = count;
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === 'Escape') close();
  }}
/>

<div class="wrap">
  {#if words.length === 0}
    <div class="strip">
      <span class="cnt">{de.foundCount(0)}</span>
    </div>
  {:else}
    <button
      type="button"
      class="strip"
      aria-expanded={open}
      bind:this={trigger}
      onclick={() => {
        open = !open;
      }}
    >
      {#key flashId}
        {#if flashId > 0}<span class="flash" aria-hidden="true"></span>{/if}
      {/key}
      <span class="cnt">{de.foundCount(words.length)}</span>
      <span class="list">
        {#each words as word, i (word)}
          <span class:pg={pangrams.has(word)}>{word}{i < words.length - 1 ? ', ' : ''}</span>
        {/each}
      </span>
      <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
    </button>

    {#if open}
      <button type="button" class="scrim" tabindex="-1" aria-hidden="true" onclick={close}></button>
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        data-sheet-open
        use:focusOnMount
        onkeydown={trap}
      >
        <p class="cap">
          <span
            >{total === undefined
              ? de.foundCount(words.length)
              : de.foundOfTotal(words.length, total)}</span
          >
          <span class="lg"><b class="pg">{de.pangramLegend}</b></span>
        </p>
        <ul>
          {#each words as word (word)}
            <li class:pg={pangrams.has(word)}>{word}</li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>

<style>
  .wrap {
    position: relative;
  }

  .strip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-sizing: border-box;
    width: calc(100% - 2rem);
    margin-inline: 1rem;
    padding: 0.65rem 0.85rem;
    min-height: 2.9rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font: inherit;
    font-size: 0.9rem;
    color: inherit;
    text-align: left;
  }

  button.strip {
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }

  .flash {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: var(--accent);
    opacity: 0;
    animation: flash 600ms ease-out;
  }

  @keyframes flash {
    from {
      opacity: 0.55;
    }
    to {
      opacity: 0;
    }
  }

  .sheet:focus {
    outline: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .flash {
      animation: none;
    }
  }

  .cnt {
    font-weight: 700;
    white-space: nowrap;
  }

  .list {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--muted);
  }

  .pg {
    font-weight: 800;
    color: var(--accent-text);
  }

  .chev {
    flex: none;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 20;
    padding: 0;
    border: 0;
    background: var(--scrim);
  }

  .sheet {
    position: absolute;
    z-index: 21;
    top: 0;
    left: 0.75rem;
    right: 0.75rem;
    max-height: 60dvh;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 0.9rem 1rem 1rem;
  }

  .cap {
    margin: 0 0 0.6rem;
    font-size: 0.8rem;
    color: var(--muted);
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .cap span:first-child {
    font-weight: 700;
    color: var(--text);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    column-count: 3;
    column-gap: 1rem;
    font-size: 0.95rem;
  }

  li {
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border);
    break-inside: avoid;
    overflow-wrap: anywhere;
  }
</style>
