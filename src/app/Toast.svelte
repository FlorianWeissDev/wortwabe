<script lang="ts">
  import { untrack } from 'svelte';

  import type { SubmitResult } from '../engine';
  import { feedbackText } from './feedback';

  let { result, feedbackId }: { result: SubmitResult | null; feedbackId: number } = $props();

  let isVisible = $state(false);

  $effect(() => {
    // Only a new feedbackId shows the toast. Reading `result` untracked keeps
    // unrelated state changes (e.g. a shuffle) from replaying the last result.
    if (feedbackId && untrack(() => result) !== null) {
      isVisible = true;
      const timer = setTimeout(() => {
        isVisible = false;
      }, 1500);
      return () => clearTimeout(timer);
    }
  });
</script>

<!-- Announced by the live region in App.svelte; no live role here to avoid doubles. -->
<div class="toastslot" aria-hidden="true">
  {#if isVisible && result !== null}
    <div class="toast" class:pang={result.status === 'ACCEPTED' && result.isPangram}>
      <span>
        {feedbackText(result)}
        {#if result.status === 'ACCEPTED'}
          +{result.points}
        {/if}
      </span>
    </div>
  {/if}
</div>

<style>
  .toastslot {
    position: relative;
    height: 2.4rem;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .toast {
    padding: 0.45rem 1rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 1rem;
    white-space: nowrap;
    background: var(--text);
    color: var(--bg);
    box-shadow: var(--shadow);
    animation: slide-in 300ms ease-out;
  }

  .toast.pang {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 800;
    font-size: 1.1rem;
    padding: 0.55rem 1.35rem;
    box-shadow:
      0 0 0 3px var(--bg),
      0 0 0 5px var(--accent-strong),
      var(--shadow);
  }

  .toast.pang::before,
  .toast.pang::after {
    content: '⬢';
    font-size: 0.8em;
    margin-inline: 0.4em;
    opacity: 0.8;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
</style>
