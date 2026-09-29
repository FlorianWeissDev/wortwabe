<script lang="ts">
  import { de } from '../locale/de';
  import type { Letter } from '../engine';

  let { input, center, shakeId }: { input: string; center: Letter; shakeId: number } = $props();
</script>

<div class="input" aria-label={de.aria.input} data-shake={shakeId} data-center={center}>
  {input.toUpperCase() || de.inputPlaceholder}
</div>

<style>
  .input {
    min-height: 4.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 800;
  }
</style>
