import { CONFIG } from './config.js';
import { animate, animateResponsive, nextFrames, wait } from './utils.js';

export class RoomController {
  #scene;
  #room;
  #aurell;
  #deskCalendar;
  #deskCalendarInner;

  init() {
    this.#scene = document.getElementById('scene-room');
    this.#room = this.#scene.querySelector('.room');
    this.#aurell = document.getElementById('aurell');
    this.#deskCalendar = document.getElementById('deskCalendar');
    this.#deskCalendarInner = this.#deskCalendar.querySelector('.desk-calendar__inner');

    this.#aurell.style.left = CONFIG.room.startLeft;
    this.#updateCalendarScale();

    window.addEventListener('resize', () => this.#updateCalendarScale(), { passive: true });
  }

  mountCalendar(calendar) {
    this.#deskCalendarInner.replaceChildren(calendar);
    this.#updateCalendarScale();
  }

  beginCutscene() {
    this.#updateCalendarScale();
  }

  async walkToDesk() {
    await wait(CONFIG.timing.standStill);

    this.#setPose('side');
    this.#aurell.classList.add('is-walking');

    await animate(
      this.#aurell,
      [
        { left: CONFIG.room.startLeft },
        { left: `calc(${CONFIG.room.stopLeft} + 4%)`, offset: 0.85 },
        { left: CONFIG.room.stopLeft }
      ],
      {
        duration: CONFIG.timing.walk,
        easing: 'linear',
        fill: 'forwards'
      }
    );

    this.#aurell.style.left = CONFIG.room.stopLeft;
    this.#aurell.classList.remove('is-walking');
    this.#setPose('back');
  }

  async focusCalendar() {
    await animateResponsive(this.#room, () => this.#getCameraTarget(), {
      duration: CONFIG.timing.cameraPOV,
      easing: CONFIG.easing.camera
    });

    await nextFrames(2);
  }

  #setPose(pose) {
    this.#aurell.classList.remove('pose-front', 'pose-side', 'pose-back');
    this.#aurell.classList.add(`pose-${pose}`);
  }

  #updateCalendarScale() {
    const width = this.#deskCalendar.clientWidth;
    if (!width) return;

    const scale = width / 320;
    this.#deskCalendar.style.setProperty('--k', scale.toFixed(5));

    if ('zoom' in this.#deskCalendarInner.style) {
      this.#deskCalendarInner.style.zoom = scale;
      this.#deskCalendarInner.style.transform = 'none';
    } else {
      this.#deskCalendarInner.style.transform = `scale(${scale.toFixed(5)})`;
    }
  }

  #getCameraTarget() {
    const savedTransform = this.#room.style.transform;
    this.#room.style.transform = 'none';

    const roomRect = this.#room.getBoundingClientRect();
    const calendarRect = this.#deskCalendar.getBoundingClientRect();

    this.#room.style.transform = savedTransform;

    const scale = Math.min(
      4.2,
      (window.innerWidth * 0.86) / Math.max(calendarRect.width, 1),
      (window.innerHeight * 0.62) / Math.max(calendarRect.height, 1)
    );

    const originX = roomRect.left + roomRect.width * 0.5;
    const originY = roomRect.top + roomRect.height * 0.55;
    const targetX = calendarRect.left + calendarRect.width * 0.5;
    const targetY = calendarRect.top + calendarRect.height * 0.35;
    const viewX = window.innerWidth * 0.5;
    const viewY = window.innerHeight * 0.54;

    return {
      transform: `translate3d(
        ${viewX - (originX + (targetX - originX) * scale)}px,
        ${viewY - (originY + (targetY - originY) * scale)}px,
        0
      ) scale(${scale})`
    };
  }
}
