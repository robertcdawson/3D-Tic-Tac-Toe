(function () {
  const steps = [
    { text: 'Welcome to 3D Tic-Tac-Toe! Click Next to start.', event: 'next' },
    { text: 'Rotate the board by dragging or using arrow keys.', event: 'rotated' },
    { text: 'Place a mark on any cube.', event: 'markPlaced' },
    { text: 'Use the view buttons to change perspective.', event: 'presetUsed' },
    { text: 'Tutorial complete! Enjoy the game.', event: 'next' }
  ];

  let current = 0;
  let overlay, textBox, nextBtn, skipBtn, startBtn, dismissBtn;
  let active = false;
  let rotationBaseline;

  function init() {
    overlay = document.getElementById('tutorialOverlay');
    textBox = document.getElementById('tutorialText');
    nextBtn = document.getElementById('tutorialNext');
    skipBtn = document.getElementById('tutorialSkip');
    startBtn = document.getElementById('startTutorial');
    dismissBtn = document.getElementById('dismissTutorial');

    if (startBtn) startBtn.addEventListener('click', start);
    if (dismissBtn) dismissBtn.addEventListener('click', end);
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (skipBtn) skipBtn.addEventListener('click', end);
  }

  function start() {
    active = true;
    current = 0;
    rotationBaseline = camera ? camera.position.clone() : null;
    startBtn.classList.add('hidden');
    dismissBtn.classList.remove('hidden');
    show();
  }

  function end() {
    active = false;
    overlay.classList.add('hidden');
    dismissBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
  }

  function show() {
    const step = steps[current];
    if (!step) { end(); return; }
    textBox.innerText = step.text;
    overlay.classList.remove('hidden');
    nextBtn.style.display = step.event === 'next' ? 'inline-block' : 'none';
  }

  function next() {
    current++;
    if (current >= steps.length) {
      end();
    } else {
      if (steps[current].event === 'rotated' && camera) {
        rotationBaseline = camera.position.clone();
      }
      show();
    }
  }

  function checkRotation() {
    if (!active) return;
    const step = steps[current];
    if (step.event === 'rotated' && rotationBaseline && camera) {
      if (camera.position.distanceTo(rotationBaseline) > 0.2) {
        next();
      }
    }
  }

  function handleMarkPlaced() {
    if (active && steps[current].event === 'markPlaced') {
      next();
    }
  }

  function handlePresetUsed() {
    if (active && steps[current].event === 'presetUsed') {
      next();
    }
  }

  window.tutorial = {
    init,
    checkRotation,
    handleMarkPlaced,
    handlePresetUsed,
    start,
    end
  };

  document.addEventListener('DOMContentLoaded', init);
})();
