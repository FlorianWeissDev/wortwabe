<script lang="ts">
  import { de } from '../locale/de';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();

  let el: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!el) return;

    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  });

  function handleClose() {
    onclose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === el) {
      el?.close();
    }
  }
</script>

<dialog bind:this={el} onclose={handleClose} onclick={handleBackdropClick}>
  <div class="content">
    <h2>{de.rules.title}</h2>
    {#each de.rules.paragraphs as paragraph (paragraph)}
      <p>{paragraph}</p>
    {/each}
    <button type="button" onclick={() => el?.close()} aria-label={de.aria.closeDialog}>
      {de.rules.close}
    </button>
  </div>
</dialog>

<style>
  dialog {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    max-width: 32rem;
    width: calc(100% - 2rem);
    max-height: 85dvh;
    padding: 0;
  }

  dialog::backdrop {
    background: var(--scrim);
  }

  .content {
    padding: 1.25rem;
    line-height: 1.5;
    overflow-y: auto;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    margin: 0;
  }

  p {
    margin: 0;
  }

  button {
    background: var(--accent);
    color: var(--on-accent);
    border: none;
    border-radius: var(--radius);
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    align-self: flex-start;
  }

  button:hover {
    background: var(--accent-strong);
  }

  button:active {
    background: var(--accent-strong);
  }

  @media (prefers-reduced-motion: no-preference) {
    dialog {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
</style>
