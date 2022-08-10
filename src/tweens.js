import {
  is,
} from './helpers.js';

import {
  parseEasings,
} from './easings.js';

import {
  getFunctionValue,
  getOriginalTargetValue,
  getRelativeValue,
  decomposeValue,
} from './values.js';

import {
  getUnit,
} from './units.js';

// Tweens

function convertKeyframeToTween(keyframe, animatable) {
  const tween = {};
  for (let p in keyframe) {
    let prop = getFunctionValue(keyframe[p], animatable);
    if (is.arr(prop)) {
      prop = prop.map(v => getFunctionValue(v, animatable));
      if (prop.length === 1) {
        prop = prop[0];
      }
    }
    tween[p] = prop;
  }
  // Make sure duration is not equal to 0 to prevents NaN when (progress = 0 / duration = 0);
  tween.duration = parseFloat(tween.duration) || Number.MIN_VALUE;
  tween.delay = parseFloat(tween.delay);
  return tween;
}

export function convertKeyframesToTweens(keyframes, animatable, propertyName) {
  let previousTween;
  const tweens = [];
  for (let i = 0, l = keyframes.length; i < l; i++) {
    const keyframe = keyframes[i];
    const tween = convertKeyframeToTween(keyframe, animatable);
    const tweenValue = tween.value;
    let to = is.arr(tweenValue) ? tweenValue[1] : tweenValue;
    const toUnit = getUnit(to);
    const originalValue = getOriginalTargetValue(animatable.target, propertyName, toUnit, animatable);
    const previousValue = previousTween ? previousTween.to.original : originalValue;
    const from = is.arr(tweenValue) ? tweenValue[0] : previousValue;
    const fromUnit = getUnit(from) || getUnit(originalValue);
    const unit = toUnit || fromUnit;
    if (is.und(to)) to = previousValue;
    tween.from = decomposeValue(from, unit);
    tween.to = decomposeValue(getRelativeValue(to, from), unit);
    tween.start = previousTween ? previousTween.end : 0;
    tween.end = tween.start + tween.delay + tween.duration + tween.endDelay;
    tween.easing = parseEasings(tween.easing, tween.duration);
    tween.isPath = !is.und(tweenValue) && is.pth(tweenValue);
    tween.isPathTargetInsideSVG = tween.isPath && is.svg(animatable.target);
    tween.isColor = is.col(tween.from.original);
    if (tween.isColor) {
      tween.round = 1;
    }
    previousTween = tween;
    tweens.push(tween);
  }
  return tweens;
}