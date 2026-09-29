<script lang="ts">
  import type { Letter } from '../engine';

  let {
    center,
    outer,
    onletter,
  }: { center: Letter; outer: readonly Letter[]; onletter: (letter: Letter) => void } = $props();
</script>

<div class="hive">
  <button type="button" onclick={() => onletter(center)}>{center.toUpperCase()}</button>
  {#each outer as letter (letter)}
    <button type="button" onclick={() => onletter(letter)}>{letter.toUpperCase()}</button>
  {/each}
</div>

<style>
  .hive {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
  }
</style>
