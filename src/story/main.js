import { CONFIG, applyCssTimings } from './config.js';
import { motionWait, wait } from './utils.js';
import { MenuController } from './menu.js';
import { RoomController } from './room.js';
import { PovController } from './pov.js';
import { CalendarController } from './calendar.js';
import { EndingController } from './ending.js';

export class StoryApp {
  #menu = new MenuController();
  #room = new RoomController();
  #pov = new PovController();
  #calendar = new CalendarController();
  #ending = new EndingController();

  init() {
    applyCssTimings();

    this.#menu.init();
    this.#room.init();
    this.#pov.init();
    this.#calendar.init();
    this.#ending.init();

    this.#room.mountCalendar(this.#calendar.cloneForDesk());
  }

  async start() {
    this.init();

    await this.#menu.waitForStart();

    await this.#menu.showStoryCard();
    await wait(CONFIG.timing.storyHold);

    this.#room.beginCutscene();

    const menuFade = this.#menu.hideStoryCard();
    await motionWait(CONFIG.timing.walkLead);

    await this.#room.walkToDesk();
    await menuFade;

    await this.#pov.play(this.#room);
    await this.#calendar.play();

    await wait(CONFIG.timing.beforeEnding);
    this.#ending.show();
  }
}
