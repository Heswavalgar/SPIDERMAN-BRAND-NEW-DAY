import { CONFIG } from './config.js';
import { motionWait } from './utils.js';
import { MusicController } from './music.js';

export class MenuController {
  #menu;
  #startButton;
  #storyFrame;
  #music;

  init() {
    this.#menu = document.getElementById('scene-menu');
    this.#startButton = document.getElementById('startButton');
    this.#storyFrame = document.getElementById('storyFrame');
    this.#music = new MusicController();
  }

  waitForStart() {
    return new Promise(resolve => {
      this.#startButton.addEventListener('click', async () => {
        this.#startButton.disabled = true;
        await this.#music.start();
        resolve();
      }, { once: true });
    });
  }

  async showStoryCard() {
    this.#storyFrame.classList.add('show');
    await motionWait(CONFIG.timing.storyFade);
    this.#menu.classList.add('is-handoff');
  }

  async hideStoryCard() {
    this.#storyFrame.classList.remove('show');
    await motionWait(CONFIG.timing.storyFade);
    this.#menu.classList.add('is-gone');
  }
}
