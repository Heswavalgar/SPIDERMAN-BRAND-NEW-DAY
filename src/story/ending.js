import { CONFIG } from './config.js';

export class EndingController {
  #scene;
  #wake;
  #name;
  #sub;
  #replay;

  init() {
    this.#scene = document.getElementById('scene-end');
    this.#wake = this.#scene.querySelector('.end-wake');
    this.#name = this.#scene.querySelector('.end-name');
    this.#sub = this.#scene.querySelector('.end-sub');
    this.#replay = this.#scene.querySelector('.end-replay');

    this.#wake.textContent = CONFIG.ending.wake;
    this.#name.textContent = CONFIG.ending.name;
    this.#sub.textContent = CONFIG.ending.sub;

    this.#replay.addEventListener('click', () => {
      window.location.reload();
    });
  }

  show() {
    this.#scene.classList.add('is-active');
    this.#scene.setAttribute('aria-hidden', 'false');
  }
}
