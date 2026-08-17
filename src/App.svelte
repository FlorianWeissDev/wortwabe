<script lang="ts">
  import { de } from './locale/de';
</script>

<main>
  <h1>{de.appName}</h1>
  <p>{de.tagline}</p>
</main>

<style>
  main {
    max-width: 32rem;
    margin: 0 auto;
    padding: 2rem 1rem;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: 0.02em;
  }

  p {
    color: var(--color-text-muted);
  }
</style>
