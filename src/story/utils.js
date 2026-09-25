export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

export function motionWait(ms) {
  return prefersReducedMotion() ? Promise.resolve() : wait(ms);
}

export function fadeAudio(audio, target, duration) {
  const start = audio.volume;
  const startedAt = performance.now();

  return new Promise(resolve => {
    const frame = now => {
      const progress = duration <= 0
        ? 1
        : Math.min(1, Math.max(0, (now - startedAt) / duration));

      audio.volume = Math.min(1, Math.max(0, start + (target - start) * progress));

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        audio.volume = Math.min(1, Math.max(0, target));
        resolve();
      }
    };

    requestAnimationFrame(frame);
  });
}

function applyFinalKeyframe(element, keyframes) {
  const finalFrame = keyframes[keyframes.length - 1];

  for (const [property, value] of Object.entries(finalFrame)) {
    if (property === 'offset' || property === 'easing' || property === 'composite') {
      continue;
    }
    element.style[property] = value;
  }
}

export function animate(element, keyframes, options) {
  if (prefersReducedMotion()) {
    applyFinalKeyframe(element, keyframes);
    return Promise.resolve();
  }

  if (!element.animate) {
    return wait(options.duration).then(() => applyFinalKeyframe(element, keyframes));
  }

  const effect = element.animate(keyframes, options);

  return effect.finished.then(() => {
    applyFinalKeyframe(element, keyframes);
    effect.cancel();
  });
}

export function animateResponsive(element, getTarget, options) {
  if (prefersReducedMotion()) {
    const target = getTarget();
    element.style.transform = target.transform;
    return Promise.resolve(target);
  }

  if (!element.animate) {
    return wait(options.duration).then(() => {
      const target = getTarget();
      element.style.transform = target.transform;
      return target;
    });
  }

  const startTime = performance.now();
  const deadline = startTime + options.duration;

  return new Promise((resolve, reject) => {
    let effect = null;
    let retargetTimer = null;
    let finished = false;

    const cleanup = () => {
      if (retargetTimer !== null) {
        clearTimeout(retargetTimer);
        retargetTimer = null;
      }
      window.removeEventListener('resize', scheduleRetarget);
      window.removeEventListener('orientationchange', scheduleRetarget);
    };

    const finish = () => {
      if (finished) return;
      finished = true;

      if (effect) {
        const activeEffect = effect;
        effect = null;
        element.style.transform = getComputedStyle(element).transform;
        activeEffect.cancel();
      }

      const target = getTarget();
      element.style.transform = target.transform;
      cleanup();
      resolve(target);
    };

    const run = (fromTransform, duration) => {
      const target = getTarget();

      if (duration <= 0) {
        finish();
        return;
      }

      const nextEffect = element.animate(
        [
          { transform: fromTransform },
          { transform: target.transform }
        ],
        {
          duration,
          easing: options.easing,
          fill: 'both'
        }
      );

      effect = nextEffect;

      nextEffect.finished.then(
        () => {
          if (!finished && effect === nextEffect) finish();
        },
        error => {
          if (finished || effect !== nextEffect) return;
          finished = true;
          cleanup();
          reject(error);
        }
      );
    };

    const retargetNow = () => {
      retargetTimer = null;
      if (finished || !effect) return;

      const activeEffect = effect;
      const currentTransform = getComputedStyle(element).transform;
      const remaining = Math.max(0, deadline - performance.now());

      effect = null;
      activeEffect.cancel();

      const stableTransform = currentTransform === 'none'
        ? 'translate3d(0,0,0) scale(1)'
        : currentTransform;

      element.style.transform = stableTransform;
      run(stableTransform, remaining);
    };

    function scheduleRetarget() {
      if (retargetTimer !== null) clearTimeout(retargetTimer);
      retargetTimer = window.setTimeout(retargetNow, 90);
    }

    window.addEventListener('resize', scheduleRetarget, { passive: true });
    window.addEventListener('orientationchange', scheduleRetarget, { passive: true });

    run(getComputedStyle(element).transform, options.duration);
  });
}

export function nextFrames(count) {
  return new Promise(resolve => {
    const step = () => {
      if (count-- <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
