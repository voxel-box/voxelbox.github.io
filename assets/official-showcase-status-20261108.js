const cards = [...document.querySelectorAll('[data-world-status]')];
const interval = 30_000;

function render(worlds) {
  for (const card of cards) {
    const world = worlds[card.dataset.worldStatus];
    const state = ['online', 'offline'].includes(world?.state) ? world.state : 'unknown';
    const players = world?.players;
    const count = state === 'online' && Number.isInteger(players) && players >= 0
      ? ` · ${players} ${players === 1 ? 'player' : 'players'}`
      : state === 'online' ? ' · Player count unavailable' : '';
    const label = { online: 'Online', offline: 'Offline', unknown: 'Status unavailable' }[state];
    card.dataset.state = state;
    const message = label + count;
    if (card.textContent !== message) card.textContent = message;
  }
}

async function refresh() {
  try {
    const response = await fetch('/assets/showcase-status/current.json', {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) throw new Error('Status feed unavailable');
    const snapshot = await response.json();
    if (!Number.isFinite(snapshot.checked_at) || Math.abs(Date.now() / 1000 - snapshot.checked_at) > 120) {
      throw new Error('Status feed expired');
    }
    render(snapshot.worlds);
  } catch {
    render({});
  } finally {
    setTimeout(refresh, interval);
  }
}

if (cards.length) refresh();
