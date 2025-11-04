import '@styles/lenis.css';

import Lenis from 'lenis';

// Script to handle Lenis library settings for smooth scrolling
// Disable on dashboard pages to allow independent sidebar scrolling
if (!window.location.pathname.startsWith('/dash')) {
  const lenis = new Lenis();

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}
