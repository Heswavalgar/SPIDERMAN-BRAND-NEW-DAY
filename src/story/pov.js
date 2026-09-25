import { nextFrames } from './utils.js';

export class PovController {
  #room;

  init() {
    this.#room = document.getElementById('scene-room');
  }

  async play(roomController) {
    this.#room.dataset.cutscene = 'pov-moving';

    try {
      await roomController.focusCalendar();
      await nextFrames(2);
      this.#room.dataset.cutscene = 'pov-settled';
    } catch (error) {
      delete this.#room.dataset.cutscene;
      throw error;
    }
  }
}
