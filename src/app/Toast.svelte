<script lang="ts">
  import type { SubmitResult } from '../engine';
  import { feedbackText } from './feedback';

  let { result, feedbackId }: { result: SubmitResult | null; feedbackId: number } = $props();
</script>

<div class="toast" data-feedback={feedbackId} role="status">
  {#if result}{feedbackText(result)}{/if}
</div>

<style>
  .toast {
    min-height: 2.8rem;
    text-align: center;
    font-weight: 700;
  }
</style>
