/* Enhancement only: the artwork and all destination links work without JavaScript. */
(() => {
  const button = document.querySelector('.world-toggle');
  button?.addEventListener('click', () => {
    const open = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(open));
    document.querySelector('.world-frame').classList.toggle('exploded', open);
    button.innerHTML = open ? 'Build it again <span>↙</span>' : 'Pull it apart <span>↗</span>';
    document.querySelector('.world-caption').textContent = open ? 'Every big idea starts with small pieces.' : 'An idea, taking shape.';
  });
  const toggle = document.querySelector('.nav-toggle');
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      toggle.click(); toggle.focus();
    }
  });
})();
