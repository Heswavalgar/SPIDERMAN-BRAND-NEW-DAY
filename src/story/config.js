export const CONFIG = Object.freeze({
  music: Object.freeze({
    src: 'assets/audio/music.mp3',
    volume: 0.55,
    fadeIn: 900
  }),

  timing: Object.freeze({
    storyFade: 900,
    storyHold: 3800,
    standStill: 380,
    walkLead: 450,
    walk: 4200,
    cameraPOV: 3800,
    sceneTransition: 420,
    calendarIntroPause: 1000,
    calendarWindLead: 220,
    calendarWooshLead: 300,
    calendarPageFly: 4000,
    calendarZoom: 3800,
    calendarMarkDelay: 100,
    calendarMark: 2400,
    beforeEnding: 0
  }),

  room: Object.freeze({
    startLeft: '72%',
    stopLeft: '30%'
  }),

  easing: Object.freeze({
    camera: 'cubic-bezier(.24,.72,.24,1)',
    paper: 'cubic-bezier(.2,.76,.22,1)',
    anticipation: 'cubic-bezier(.36,0,.62,.2)',
    acceleration: 'cubic-bezier(.62,0,.82,.28)',
    settling: 'cubic-bezier(.18,.76,.22,1)'
  }),

  ending: Object.freeze({
    wake: 'WAKE UP,',
    name: 'AURELL',
    sub: 'SEPTEMBER WAS ENDED.'
  })
});

export function applyCssTimings() {
  const root = document.documentElement;
  const { timing } = CONFIG;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const ms = value => `${reducedMotion ? 0 : value}ms`;

  root.style.setProperty('--scene-transition-duration', ms(timing.sceneTransition));
  root.style.setProperty('--story-fade-duration', ms(timing.storyFade));
  root.style.setProperty('--calendar-mark-duration', ms(timing.calendarMark));
}
