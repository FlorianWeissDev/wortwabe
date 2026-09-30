<script lang="ts">
  import { untrack } from 'svelte';

  import { RANK_THRESHOLDS, pointsForRank, type RankProgress } from '../engine';
  import { de } from '../locale/de';

  let { progress }: { progress: RankProgress } = $props();

  let open = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let pulse = $state(false);

  function close(): void {
    open = false;
    trigger?.focus();
  }

  function focusOnMount(node: HTMLElement): void {
    node.focus({ preventScroll: true });
  }

  // Focus stays on the sheet itself, which has no focusable children.
  function trap(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault();
    } else if (event.key === 'Escape') {
      event.stopPropagation();
      close();
    }
  }

  // Pulse only when the rank rises during this component's lifetime; the parent
  // remounts on a puzzle switch, so the initial value is never a rise.
  let previousIndex = untrack(() => progress.index);
  $effect(() => {
    const index = progress.index;
    if (index > previousIndex) {
      pulse = true;
      const timer = setTimeout(() => {
        pulse = false;
      }, 700);
      previousIndex = index;
      return () => clearTimeout(timer);
    }
    previousIndex = index;
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (open && e.key === 'Escape') close();
  }}
/>

<div class="rank">
  <button
    type="button"
    class="rank-bar"
    aria-expanded={open}
    bind:this={trigger}
    onclick={() => {
      open = !open;
    }}
  >
    <span class="rank-name" class:pulse>{de.ranks[progress.id]}</span>
    <span class="track">
      <span class="line"></span>
      <span class="fill" style:width="{(progress.index / (RANK_THRESHOLDS.length - 1)) * 90}%"
      ></span>
      {#each RANK_THRESHOLDS as t, i (t.id)}
        {#if i === progress.index}
          <i class="dot cur" class:pulse>{progress.score}</i>
        {:else}
          <i class="dot" class:on={i < progress.index}></i>
        {/if}
      {/each}
    </span>
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
        <span>{de.yourScore(progress.score, progress.maxScore)}</span>
        {#if progress.nextRank}
          <span
            >{de.pointsToRank(progress.nextRank.pointsAway, de.ranks[progress.nextRank.id])}</span
          >
        {/if}
      </p>
      <ol>
        {#each RANK_THRESHOLDS as t, i (t.id)}
          <li class:done={i < progress.index} class:now={i === progress.index}>
            <span class="m">{i <= progress.index ? '●' : '○'}</span>
            <span class="n">{de.ranks[t.id]}</span>
            <span class="p">{de.points(pointsForRank(t, progress.maxScore))}</span>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</div>

<style>
  .rank {
    position: relative;
    padding: 0.25rem 1rem 0.5rem;
  }

  .rank-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 3rem;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .rank-name {
    flex: 0 0 6.6rem;
    font-weight: 700;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .track {
    position: relative;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    align-items: center;
    justify-items: center;
    height: 2rem;
    min-width: 0;
  }

  .line,
  .fill {
    position: absolute;
    left: 5%;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
    border-radius: 2px;
  }

  .line {
    right: 5%;
    background: var(--border);
  }

  .fill {
    background: var(--accent-strong);
  }

  .dot {
    position: relative;
    z-index: 1;
    box-sizing: content-box;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--border);
  }

  .dot.on {
    background: var(--accent-strong);
    border-color: var(--accent-strong);
  }

  .dot.cur {
    box-sizing: border-box;
    width: 1.75rem;
    height: 1.75rem;
    background: var(--accent);
    border: 2px solid var(--accent-strong);
    display: grid;
    place-items: center;
    font-style: normal;
    font-weight: 800;
    font-size: 0.78rem;
    color: var(--on-accent);
    font-variant-numeric: tabular-nums;
    box-shadow: 0 0 0 3px var(--bg);
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
    top: 100%;
    left: 0.75rem;
    right: 0.75rem;
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

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 0.7rem;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
  }

  .m {
    color: var(--accent-strong);
    width: 1rem;
    text-align: center;
    font-size: 0.8rem;
  }

  li:not(.done):not(.now) .m {
    color: var(--muted);
  }

  .n {
    flex: 1;
  }

  .p {
    color: var(--muted);
  }

  li.done {
    color: var(--muted);
  }

  li.now {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 800;
  }

  li.now .m,
  li.now .p {
    color: var(--on-accent);
  }

  .sheet:focus {
    outline: none;
  }

  .rank-name.pulse,
  .dot.cur.pulse {
    animation: rank-pulse 700ms ease-out;
  }

  @keyframes rank-pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 3px var(--bg);
    }
    35% {
      transform: scale(1.25);
      box-shadow:
        0 0 0 3px var(--bg),
        0 0 0.9rem 0.3rem var(--accent);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 3px var(--bg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rank-name.pulse,
    .dot.cur.pulse {
      animation: none;
    }
  }
</style>
