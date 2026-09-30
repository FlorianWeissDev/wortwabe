<script lang="ts">
  import { RANK_THRESHOLDS, type PuzzleDate } from '../engine';
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

  let dialog: HTMLDialogElement | undefined = $state();

  function rankIndex(entry: PickerEntry): number {
    return RANK_THRESHOLDS.findIndex((t) => t.id === entry.rankId);
  }

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const target =
        dialog.querySelector<HTMLElement>('button.row[aria-current="true"]') ??
        dialog.querySelector<HTMLElement>('button.row');
      target?.focus();
      target?.scrollIntoView({ block: 'nearest' });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });
</script>

<dialog
  bind:this={dialog}
  class="picker"
  aria-label={de.picker.title}
  oncancel={onclose}
  {onclose}
  onclick={(e) => {
    if (e.target === e.currentTarget) onclose();
  }}
>
  <div class="panel">
    <header>
      <h2>{de.picker.title}</h2>
      <button type="button" class="close" aria-label={de.aria.closeDialog} onclick={onclose}>
        ✕
      </button>
    </header>
    <ul aria-label={de.aria.puzzleList}>
      {#each entries as entry (entry.date)}
        {@const idx = rankIndex(entry)}
        <li>
          <button
            type="button"
            class="row"
            class:selected={entry.isSelected}
            class:quiet={entry.foundCount === 0}
            aria-current={entry.isSelected ? 'true' : undefined}
            onclick={() => {
              onpick(entry.date);
            }}
          >
            <span class="top">
              <span class="date">{de.picker.rowDate(entry.date)}</span>
              {#if entry.isCurrent}<span class="badge">{de.picker.currentBadge}</span>{/if}
              {#if entry.revealed}<span class="tag">{de.picker.revealedTag}</span>{/if}
            </span>
            <span class="mid">
              <span class="rank">{de.ranks[entry.rankId]}</span>
              <span class="count">{de.picker.foundOfTotal(entry.foundCount, entry.totalWords)}</span
              >
            </span>
            <span class="steps" aria-hidden="true">
              {#each RANK_THRESHOLDS as t, i (t.id)}
                <i class:on={i <= idx && entry.foundCount > 0}></i>
              {/each}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
</dialog>

<style>
  .picker {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    max-height: 80dvh;
    margin: auto 0 0;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--surface);
    color: var(--text);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .picker[open] {
    display: flex;
    flex-direction: column;
    animation: rise 0.2s ease-out;
  }

  .picker::backdrop {
    background: var(--scrim);
  }

  @media (min-width: 40rem) {
    .picker {
      margin: auto;
      max-width: 32rem;
      border-radius: var(--radius);
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .picker[open] {
      animation: none;
    }
  }

  .panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 0.9rem 1rem 1rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .close {
    width: 3rem;
    height: 3rem;
    margin: -0.5rem -0.75rem -0.5rem 0;
    border: 0;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 1.1rem;
    cursor: pointer;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
    overflow-y: auto;
    overscroll-behavior: contain;
    min-height: 0;
  }

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'top steps'
      'mid steps';
    align-items: center;
    column-gap: 0.75rem;
    row-gap: 0.1rem;
    width: 100%;
    min-height: 3rem;
    padding: 0.5rem 0.7rem;
    border: 0;
    border-radius: 0.5rem;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }

  .row.selected {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }

  .row.quiet:not(.selected) {
    color: var(--muted);
  }

  .top {
    grid-area: top;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .date {
    font-weight: 700;
  }

  .badge {
    padding: 0.05rem 0.45rem;
    border-radius: 999px;
    border: 1px solid var(--accent-strong);
    font-size: 0.72rem;
    font-weight: 700;
  }

  .tag {
    font-size: 0.72rem;
    color: var(--muted);
  }

  .row.selected .tag {
    color: var(--on-accent);
  }

  .mid {
    grid-area: mid;
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    font-size: 0.82rem;
    color: var(--muted);
  }

  .row.selected .mid {
    color: var(--on-accent);
  }

  .steps {
    grid-area: steps;
    display: flex;
    gap: 2px;
  }

  .steps i {
    width: 0.3rem;
    height: 0.9rem;
    border-radius: 2px;
    background: var(--border);
  }

  .steps i.on {
    background: var(--accent-strong);
  }

  .row.selected .steps i {
    background: color-mix(in srgb, var(--on-accent) 25%, transparent);
  }

  .row.selected .steps i.on {
    background: var(--on-accent);
  }

  .row:focus-visible,
  .close:focus-visible {
    outline: 2px solid var(--accent-strong);
    outline-offset: 2px;
  }
</style>
