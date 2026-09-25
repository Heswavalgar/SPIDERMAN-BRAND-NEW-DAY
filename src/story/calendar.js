import { CONFIG } from './config.js';
import { animate, animateResponsive, motionWait, prefersReducedMotion } from './utils.js';

export class CalendarController {
  #scene;
  #fit;
  #rig;
  #september;
  #wind;
  #woosh;
  #redPath;
  #targetDate;

  init() {
    this.#scene = document.getElementById('scene-calendar');
    this.#fit = document.getElementById('calendarFit');
    this.#rig = document.getElementById('cameraRig');
    this.#september = document.getElementById('septemberPage');
    this.#wind = document.getElementById('windOverlay');
    this.#woosh = document.getElementById('wooshText');
    this.#redPath = document.getElementById('redSketchPath');
    this.#targetDate = document.getElementById('targetDate1');
  }

  cloneForDesk() {
    const calendar = this.#scene.querySelector('.calendar-stand').cloneNode(true);

    calendar.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    calendar.querySelectorAll('.woosh-text, .wind-overlay').forEach(node => node.remove());

    return calendar;
  }

  async play() {
    this.#reset();

    const scale = this.#scaleForScreen();
    this.#showScene(scale);

    await motionWait(CONFIG.timing.calendarIntroPause);
    await this.#flySeptember();
    await this.#zoomToDate();
    await this.#markDate();
  }

  #reset() {
    this.#scene.classList.remove('is-active');
    this.#scene.setAttribute('aria-hidden', 'true');

    this.#fit.style.transition = 'none';
    this.#fit.style.opacity = '1';
    this.#fit.style.transform = 'translate3d(0,0,0)';

    this.#rig.style.transform = 'translate(0,0) scale(1)';

    this.#september.style.display = 'flex';
    this.#september.style.opacity = '1';

    this.#wind.style.opacity = '0';
    this.#woosh.classList.remove('animating');

    this.#redPath.style.transition = 'none';
    this.#redPath.style.strokeDashoffset = '600';
  }

  #showScene(scale) {
    this.#scene.classList.add('is-active');
    this.#scene.setAttribute('aria-hidden', 'false');

    this.#fit.style.transition = 'none';
    this.#fit.style.opacity = '0';
    this.#fit.style.transform =
      `translate3d(0,10px,0) scale(${(scale * 0.985).toFixed(5)})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.#fit.style.transition =
          'opacity 360ms ease-out, transform 520ms cubic-bezier(.18,.76,.22,1)';
        this.#fit.style.opacity = '1';
        this.#fit.style.transform = `translate3d(0,0,0) scale(${scale})`;
      });
    });
  }

  async #flySeptember() {
    await motionWait(CONFIG.timing.calendarWindLead);

    this.#wind.style.opacity = '1';
    this.#woosh.classList.add('animating');

    await motionWait(CONFIG.timing.calendarWooshLead);

    await animate(
      this.#september,
      [
        { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', offset: 0 },
        {
          transform: 'translate3d(-8px,3px,0) rotate(-2deg) scale(.995)',
          offset: 0.08,
          easing: CONFIG.easing.anticipation
        },
        {
          transform: 'translate3d(8vw,-2vh,0) rotate(7deg) scale(1.04)',
          offset: 0.26,
          easing: CONFIG.easing.acceleration
        },
        {
          transform: 'translate3d(42vw,-10vh,0) rotate(20deg) scale(1.08)',
          offset: 0.58,
          easing: CONFIG.easing.paper
        },
        {
          transform: 'translate3d(88vw,-24vh,0) rotate(34deg) scale(1.02)',
          offset: 0.84,
          easing: CONFIG.easing.settling
        },
        {
          transform: 'translate3d(140vw,-36vh,0) rotate(44deg) scale(.94)',
          offset: 1
        }
      ],
      {
        duration: CONFIG.timing.calendarPageFly,
        fill: 'forwards'
      }
    );

    this.#september.style.opacity = '0';
    this.#wind.style.opacity = '0';
  }

  #scaleForScreen() {
    return Math.min(
      window.innerWidth * 0.86 / 320,
      window.innerHeight * 0.62 / 430,
      1.5
    );
  }

  #getDateZoomTarget() {
    const scale = this.#scaleForScreen();
    this.#fit.style.transform = `scale(${scale})`;

    const savedTransform = this.#rig.style.transform;
    this.#rig.style.transform = 'none';

    const targetRect = this.#targetDate.getBoundingClientRect();
    const rigRect = this.#rig.getBoundingClientRect();

    this.#rig.style.transform = savedTransform;

    const zoom = 3.2;
    const x =
      ((rigRect.left + rigRect.width / 2) -
       (targetRect.left + targetRect.width / 2)) * zoom / scale;
    const y =
      ((rigRect.top + rigRect.height / 2) -
       (targetRect.top + targetRect.height / 2)) * zoom / scale;

    return {
      transform: `translate(${x}px,${y}px) scale(${zoom})`
    };
  }

  async #zoomToDate() {
    await animateResponsive(this.#rig, () => this.#getDateZoomTarget(), {
      duration: CONFIG.timing.calendarZoom,
      easing: CONFIG.easing.camera
    });
  }

  async #markDate() {
    await motionWait(CONFIG.timing.calendarMarkDelay);

    this.#redPath.style.transition = prefersReducedMotion()
      ? 'none'
      : `stroke-dashoffset var(--calendar-mark-duration) ${CONFIG.easing.paper}`;

    this.#redPath.style.strokeDashoffset = '0';

    await motionWait(CONFIG.timing.calendarMark);
  }
}
