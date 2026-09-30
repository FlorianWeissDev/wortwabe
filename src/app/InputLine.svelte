<script lang="ts">
  import { de } from '../locale/de';
  import type { Letter } from '../engine';

  let { input, center, shakeId }: { input: string; center: Letter; shakeId: number } = $props();
</script>

<div class="inputwrap">
  {#key shakeId}
    <div
      class="input"
      role="textbox"
      aria-readonly="true"
      aria-label="{de.aria.input}: {input}"
      class:shake={shakeId !== 0}
    >
      {#each input.toUpperCase().split('') as letter}
        <span class:cl={letter === center.toUpperCase()}>{letter}</span>
      {/each}
      <span class="caret" aria-hidden="true"></span>
    </div>
  {/key}
</div>

<style>
  .inputwrap {
    position: relative;
    min-height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.35rem;
  }

  .input {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
    align-items: center;
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1.15;
  }

  .input.shake {
    animation: shake 300ms;
  }

  .input :is(.cl) {
    color: var(--accent-text);
  }

  .caret {
    width: 3px;
    height: 3rem;
    background: var(--accent-strong);
    margin-left: 0.2rem;
    animation: blink 1.1s steps(1) infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-0.3rem);
    }
    75% {
      transform: translateX(0.3rem);
    }
  }

  @media (max-height: 740px) {
    .inputwrap {
      min-height: 3.4rem;
    }

    .input {
      font-size: 2.4rem;
    }

    .caret {
      height: 2.4rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .caret {
      animation: none;
    }
    .input.shake {
      animation: none;
    }
  }
</style>
