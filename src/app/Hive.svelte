<script lang="ts">
  import { flip } from 'svelte/animate';
  import type { Letter } from '../engine';
  import { de } from '../locale/de';

  let {
    center,
    outer,
    onletter,
  }: { center: Letter; outer: readonly Letter[]; onletter: (letter: Letter) => void } = $props();

  const slots = ['tl', 'tr', 'l', 'r', 'bl', 'br'];

  const reducedMotion = (): boolean =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep focus on the page so window keydown typing keeps working.
  const keepFocus = (event: PointerEvent): void => {
    event.preventDefault();
  };
</script>

<div class="hive" role="group" aria-label={de.aria.letters}>
  <button
    type="button"
    class="hex c"
    aria-label={center}
    onpointerdown={keepFocus}
    onclick={() => onletter(center)}
  >
    {center.toUpperCase()}
  </button>
  {#each outer as letter, i (letter)}
    <button
      type="button"
      class="hex {slots[i]}"
      aria-label={letter}
      onpointerdown={keepFocus}
      onclick={() => onletter(letter)}
      animate:flip={{ duration: reducedMotion() ? 0 : 350 }}
    >
      {letter.toUpperCase()}
    </button>
  {/each}
</div>

<style>
  .hive {
    --w: min(calc(82cqw / 3.194), 13dvh);
    position: relative;
    width: calc(var(--w) * 3.194);
    height: calc(var(--w) * 3.05);
    flex: none;
  }
  .hex {
    --h: calc(var(--w) * 1.1547);
    position: absolute;
    left: calc(50% - var(--w) / 2);
    top: calc(50% - var(--h) / 2);
    width: var(--w);
    height: var(--h);
    min-width: 48px;
    min-height: 48px;
    border: 0;
    padding: 0;
    background: var(--cell);
    color: var(--text);
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
    display: grid;
    place-items: center;
    font-size: calc(var(--w) * 0.42);
    font-weight: 800;
    text-transform: uppercase;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .hex:active,
  .hex:hover {
    background: var(--cell-press);
  }
  .hex.c {
    background: var(--accent);
    color: var(--on-accent);
  }
  .hex.c:hover,
  .hex.c:active {
    background: var(--accent-strong);
  }
  /* The individual `translate` property keeps slot placement separate from the
     `transform` that animate:flip drives. */
  .tl {
    translate: calc(var(--w) * -0.549) calc(var(--w) * -0.949);
  }
  .tr {
    translate: calc(var(--w) * 0.549) calc(var(--w) * -0.949);
  }
  .l {
    translate: calc(var(--w) * -1.097) 0;
  }
  .r {
    translate: calc(var(--w) * 1.097) 0;
  }
  .bl {
    translate: calc(var(--w) * -0.549) calc(var(--w) * 0.949);
  }
  .br {
    translate: calc(var(--w) * 0.549) calc(var(--w) * 0.949);
  }
</style>
