// Turns every .password-field wrapper on the page into a show/hide password box.
// The button is added here rather than in the markup so a browser with JS off
// simply gets a plain masked input instead of a dead button.
(function () {
  document.querySelectorAll('.password-field').forEach((field) => {
    const input = field.querySelector('input');
    if (!input || field.querySelector('.password-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle';

    const render = () => {
      const shown = input.type === 'text';
      button.textContent = shown ? 'Hide' : 'Show';
      button.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', shown ? 'true' : 'false');
    };

    button.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      render();
      input.focus();
    });

    render();
    field.appendChild(button);
  });
})();
