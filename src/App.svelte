<script lang="ts">
  import { untrack } from 'svelte';

  import Controls from './app/Controls.svelte';
  import FoundWords from './app/FoundWords.svelte';
  import { createGame, type Game } from './app/game.svelte';
  import Hive from './app/Hive.svelte';
  import InputLine from './app/InputLine.svelte';
  import { keyToAction } from './app/keys';
  import { currentPuzzleDate } from './engine';
  import type { PuzzleDate } from './engine';
  import { pickerEntries } from './app/picker';
  import PuzzlePicker from './app/PuzzlePicker.svelte';
  import { openPuzzle, puzzles } from './app/puzzles';
  import RankBar from './app/RankBar.svelte';
  import RulesDialog from './app/RulesDialog.svelte';
  import Toast from './app/Toast.svelte';
  import { feedbackText } from './app/feedback';
  import { de } from './locale/de';
  import { browserStorage, loadProgress, saveProgress } from './storage/progress';

  let now = $state(new Date());
  let search = $state(window.location.search);
  let opened = $derived(openPuzzle(now, search));
  const storage = browserStorage();

  let rulesOpen = $state(false);
  let pickerOpen = $state(false);
  const dialogOpen = $derived(rulesOpen || pickerOpen);

  // Screen-reader announcements; `id` re-inserts the text so repeats are read again.
  let announcement = $state({ text: '', id: 0 });
  let lastSeen: { game: Game; feedbackId: number; rankIndex: number } | null = null;

  const puzzle = $derived(opened.puzzle);
  const hasExplicitDate = $derived(new URLSearchParams(search).has('date'));
  const currentDate = $derived(currentPuzzleDate(now));
  const isOlder = $derived(puzzle !== null && puzzle.date < currentDate);
  const entries = $derived(
    pickerOpen
      ? pickerEntries(puzzles, now, (date) => loadProgress(storage, date), puzzle?.date ?? null)
      : [],
  );

  // A new game per shown puzzle; saved progress is read once when it is created.
  const game = $derived.by(() => {
    const current = puzzle;
    if (current === null) {
      return null;
    }
    return createGame(current, {
      saved: untrack(() => loadProgress(storage, current.date)),
      onfound: (words) => {
        saveProgress(storage, current.date, words);
      },
    });
  });

  $effect(() => {
    const current = game;
    if (current === null) {
      lastSeen = null;
      return;
    }
    const feedbackId = current.feedbackId;
    const rankIndex = current.rank.index;
    const previous = lastSeen;
    lastSeen = { game: current, feedbackId, rankIndex };
    // A freshly created game (first render or puzzle switch) announces nothing.
    if (previous === null || previous.game !== current) {
      return;
    }
    const parts: string[] = [];
    if (feedbackId !== previous.feedbackId) {
      const result = untrack(() => current.state.lastResult);
      if (result?.status === 'ACCEPTED') {
        const word =
          untrack(() => current.state.index.displayForms.get(result.word)) ?? result.word;
        parts.push(
          result.isPangram
            ? de.a11y.pangramAccepted(word, result.points)
            : de.a11y.wordAccepted(word, result.points),
        );
      } else if (result !== null) {
        parts.push(feedbackText(result));
      }
    }
    if (rankIndex > previous.rankIndex) {
      parts.push(de.a11y.rankUp(de.ranks[current.rank.id]));
    }
    if (parts.length > 0) {
      announcement = { text: parts.join('. '), id: announcement.id + 1 };
    }
  });

  function navigate(next: string): void {
    now = new Date();
    search = next;
  }

  function show(date: PuzzleDate | null): void {
    const params = new URLSearchParams(search);
    if (date === null || date === currentPuzzleDate(new Date())) {
      params.delete('date');
    } else {
      params.set('date', date);
    }
    const query = params.toString();
    const next = query === '' ? '' : `?${query}`;
    history.pushState(null, '', `${window.location.pathname}${next}`);
    navigate(next);
  }

  function pick(date: PuzzleDate): void {
    pickerOpen = false;
    show(date);
  }

  function onpopstate(): void {
    navigate(window.location.search);
  }

  function onvisibilitychange(): void {
    if (document.visibilityState !== 'visible') {
      return;
    }
    const fresh = new Date();
    if (!hasExplicitDate && puzzle !== null && currentPuzzleDate(fresh) !== currentDate) {
      now = fresh;
    }
  }

  function onkeydown(event: KeyboardEvent): void {
    if (dialogOpen || document.querySelector('[data-sheet-open]') !== null) {
      return;
    }
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

<svelte:window {onkeydown} {onpopstate} />
<svelte:document {onvisibilitychange} />

<div class="app">
  <header class="top">
    <button
      class="icon"
      type="button"
      aria-label={de.aria.rules}
      onclick={() => {
        rulesOpen = true;
      }}>?</button
    >
    <div class="brand">
      <span class="logo"></span>
      <div>
        <h1>{de.appName}</h1>
        {#if puzzle}<small>{de.puzzleFrom(puzzle.date)}</small>{/if}
      </div>
    </div>
    <button
      class="icon"
      type="button"
      aria-label={de.aria.pickPuzzle}
      onclick={() => {
        pickerOpen = true;
      }}>☰</button
    >
  </header>

  {#if game && puzzle}
    {#if opened.resolution.status === 'NEWEST_AVAILABLE'}
      <p class="notice">{de.newestAvailableNotice}</p>
    {/if}
    {#if isOlder}
      <p class="notice">
        {de.olderPuzzleNotice(puzzle.date)} ·
        <button
          class="link"
          type="button"
          onclick={() => {
            show(null);
          }}>{de.backToCurrent}</button
        >
      </p>
    {/if}
    {#key puzzle.date}
      <RankBar progress={game.rank} />
      <FoundWords
        words={game.sortedFound}
        pangrams={game.pangramForms}
        total={puzzle.words.length}
      />
      <main class="play">
        <div class="mid">
          <Toast result={game.state.lastResult} feedbackId={game.feedbackId} />
          <InputLine input={game.state.input} center={puzzle.centerLetter} shakeId={game.shakeId} />
          <Hive
            center={puzzle.centerLetter}
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
    {/key}
  {:else}
    <main class="play"><p>{de.noPuzzle}</p></main>
  {/if}
</div>

<div class="sr-only" aria-live="polite" aria-atomic="true">
  {#key announcement.id}<span>{announcement.text}</span>{/key}
</div>

<RulesDialog
  open={rulesOpen}
  onclose={() => {
    rulesOpen = false;
  }}
/>
<PuzzlePicker
  open={pickerOpen}
  {entries}
  onpick={pick}
  onclose={() => {
    pickerOpen = false;
  }}
/>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    text-decoration: underline;
  }

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
