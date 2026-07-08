(() => {
  const CORE_SRC = 'site-v287-core.js?v=291.0';

  function loadCore() {
    if (document.readyState === 'loading') {
      document.write('<script src="' + CORE_SRC + '"><\/script>');
      return;
    }

    const script = document.createElement('script');
    script.src = CORE_SRC;
    document.head.appendChild(script);
  }

  loadCore();
})();
