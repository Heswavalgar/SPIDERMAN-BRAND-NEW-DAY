import { StoryApp } from './main.js';

function boot() {
  const app = new StoryApp();

  app.start().catch(error => {
    console.error('Story failed:', error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
