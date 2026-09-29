<script lang="ts">
  import type { RankProgress } from '../engine';
  import { de } from '../locale/de';

  let { progress }: { progress: RankProgress } = $props();
</script>

<div class="rank">
  <strong>{de.ranks[progress.id]}</strong>
  <span>{progress.score} / {progress.maxScore}</span>
</div>

<style>
  .rank {
    display: flex;
    gap: 0.75rem;
    padding: 0.25rem 1rem 0.5rem;
  }
</style>
