// Keep genuine pointer clicks clear of sticky headers and unfinished entrance
// animations. Do not force clicks, retry application actions or change app CSS.
async function clickControl(locator) {
  await locator.waitFor({ state: 'visible' });
  await locator.evaluate(async element => {
    const animations = [];
    for (let node = element; node; node = node.parentElement) {
      animations.push(...node.getAnimations().filter(animation =>
        Number.isFinite(animation.effect?.getTiming().iterations)
      ));
    }
    await Promise.allSettled(animations.map(animation => animation.finished));
    element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
  });
  await locator.click();
}

module.exports = { clickControl };
