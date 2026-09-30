<script lang="ts">
  import { de } from '../locale/de';

  let { open, onclose }: { open: boolean; onclose: () => void } = $props();
</script>

{#if open}
  <div class="rules" role="dialog" aria-modal="true" aria-label={de.rules.title}>
    <h2>{de.rules.title}</h2>
    {#each de.rules.paragraphs as paragraph (paragraph)}
      <p>{paragraph}</p>
    {/each}
    <button type="button" onclick={onclose}>{de.rules.close}</button>
  </div>
{/if}
