<script lang="ts">
  import { untrack } from 'svelte';

  import { de } from '../locale/de';

  let {
    words,
    pangrams,
    total,
    missed,
    revealed,
    onreveal,
    onhide,
  }: {
    words: readonly string[];
    pangrams: ReadonlySet<string>;
    total?: number;
    missed: readonly string[];
    revealed: boolean;
    onreveal: () => void;
    onhide: () => void;
  } = $props();

  let open = $state(false);
  let confirming = $state(false);
  let sheet = $state<HTMLElement>();
  let trigger = $state<HTMLButtonElement>();
  let flashId = $state(0);

  // The confirm step never survives a closed sheet.
  $effect(() => {
    if (!open) {
      confirming = false;
    }
  });

  function reveal(): void {
    confirming = false;
    onreveal();
    sheet?.focus({ preventScroll: true });
  }

  function hide(): void {
    onhide();
    sheet?.focus({ preventScroll: true });
  }

  function startConfirm(): void {
    confirming = true;
  }

  function cancelConfirm(): void {
    confirming = false;
    sheet?.focus({ preventScroll: true });
  }

  function close(): void {
    open = false;
    trigger?.focus();
  }

  function focusOnMount(node: HTMLElement): void {
    node.focus({ preventScroll: true });
  }

  // Tab cycles through the sheet's own buttons only.
  function trap(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
      const items = [...(sheet?.querySelectorAll<HTMLElement>('button') ?? [])];
      if (items.length === 0) {
        return;
      }
      const at = items.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      const next = at === -1 ? (event.shiftKey ? items.length - 1 : 0) : at + step;
      items[(next + items.length) % items.length]?.focus();
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
    <span class="cnt"
      >{revealed && total !== undefined
        ? `${de.foundOfTotal(words.length, total)} · ${de.reveal.stripSuffix}`
        : de.foundCount(words.length)}</span
    >
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
      bind:this={sheet}
      use:focusOnMount
      onkeydown={trap}
    >
      <p class="cap">
        <span
          >{total === undefined
            ? de.foundCount(words.length)
            : de.foundOfTotal(words.length, total)}</span
        >
        <span class="lg"
          ><b class="pg">{de.pangramLegend}</b>{#if revealed}
            · <span class="grey">{de.missedLegend}</span>{/if}</span
        >
      </p>
      <ul>
        {#each words as word (word)}
          <li class:pg={pangrams.has(word)}>{word}</li>
        {/each}
        {#if revealed}
          {#each missed as word (word)}
            <li class="miss" class:pg={pangrams.has(word)}>{word}</li>
          {/each}
        {/if}
      </ul>
      <div class="actions">
        {#if revealed}
          <button type="button" class="btn" onclick={hide}>{de.reveal.keepGuessing}</button>
        {:else if confirming}
          <p class="ask">{de.reveal.confirm}</p>
          <div class="row">
            <button type="button" class="btn" onclick={cancelConfirm}>{de.reveal.cancel}</button>
            <button type="button" class="btn primary" onclick={reveal}>{de.reveal.show}</button>
          </div>
        {:else}
          <button type="button" class="btn" onclick={startConfirm}>{de.reveal.action}</button>
        {/if}
      </div>
    </div>
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

  li.miss:not(.pg) {
    color: var(--muted);
  }

  li.miss {
    opacity: 0.7;
  }

  .grey {
    color: var(--muted);
  }

  .actions {
    margin-top: 0.9rem;
    text-align: center;
  }

  .ask {
    margin: 0 0 0.5rem;
    font-weight: 700;
  }

  .row {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
  }

  .btn {
    min-height: 2.75rem;
    padding: 0.5rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: inherit;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }

  .btn:focus-visible {
    outline: 2px solid var(--accent-strong);
    outline-offset: 2px;
  }

  li {
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--border);
    break-inside: avoid;
    overflow-wrap: anywhere;
  }
</style>
