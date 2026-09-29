<script lang="ts">
  import Controls from './app/Controls.svelte';
  import FoundWords from './app/FoundWords.svelte';
  import { createGame } from './app/game.svelte';
  import Hive from './app/Hive.svelte';
  import InputLine from './app/InputLine.svelte';
  import { keyToAction } from './app/keys';
  import { openPuzzle } from './app/puzzles';
  import RankBar from './app/RankBar.svelte';
  import Toast from './app/Toast.svelte';
  import { de } from './locale/de';

  const opened = openPuzzle(new Date(), window.location.search);
  const game = opened.puzzle ? createGame(opened.puzzle) : null;

  function onkeydown(event: KeyboardEvent): void {
    const action = keyToAction(event);
    if (game === null || action === null) {
      return;
    }
    event.preventDefault();
    if (!event.repeat || action.type === 'TYPE' || action.type === 'DELETE') {
      game.dispatch(action);
    }
  }
</script>

<svelte:window {onkeydown} />

<div class="app">
  <header class="top">
    <button class="icon" type="button" aria-label={de.aria.rules}>?</button>
    <div class="brand">
      <span class="logo"></span>
      <div>
        <h1>{de.appName}</h1>
        {#if opened.puzzle}<small>{de.puzzleFrom(opened.puzzle.date)}</small>{/if}
      </div>
    </div>
    <button class="icon" type="button" aria-label={de.aria.pickPuzzle}>☰</button>
  </header>

  {#if game && opened.puzzle}
    {#if opened.resolution.status === 'NEWEST_AVAILABLE'}
      <p class="notice">{de.newestAvailableNotice}</p>
    {/if}
    <RankBar progress={game.rank} />
    <FoundWords words={game.sortedFound} pangrams={game.pangramForms} />
    <main class="play">
      <div class="mid">
        <Toast result={game.state.lastResult} feedbackId={game.feedbackId} />
        <InputLine
          input={game.state.input}
          center={opened.puzzle.centerLetter}
          shakeId={game.shakeId}
        />
        <Hive
          center={opened.puzzle.centerLetter}
          outer={game.state.outerOrder}
          onletter={(letter) => {
            game.dispatch({ type: 'TYPE', letter });
          }}
        />
      </div>
    </main>
    <Controls
      ondelete={() => {
        game.dispatch({ type: 'DELETE' });
      }}
      onshuffle={() => {
        game.dispatch({ type: 'SHUFFLE' });
      }}
      onsubmit={() => {
        game.dispatch({ type: 'SUBMIT' });
      }}
    />
  {:else}
    <main class="play"><p>{de.noPuzzle}</p></main>
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    max-width: 32rem;
    height: 100dvh;
    margin-inline: auto;
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem 0.5rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .brand h1 {
    margin: 0;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }

  .brand small {
    color: var(--muted);
    font-size: 0.72rem;
  }

  .logo {
    width: 1.5rem;
    height: 1.72rem;
    background: var(--accent);
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  }

  .icon {
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 1.15rem;
    font-weight: 700;
  }

  .notice {
    margin: 0 1rem 0.5rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .play {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    container-type: inline-size;
  }

  .mid {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.9rem;
  }
</style>
