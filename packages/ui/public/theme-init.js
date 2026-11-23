(function () {
  var preference = 'system';
  try {
    var stored = window.localStorage.getItem('supermarket.theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      preference = stored;
    }
  } catch (error) {
    preference = 'system';
  }
  var resolved = preference;
  if (preference === 'system') {
    var prefersDark = false;
    try {
      prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      prefersDark = false;
    }
    resolved = prefersDark ? 'dark' : 'light';
  }
  var root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
})();
