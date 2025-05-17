console.log('tutorial.js loaded');

(function () {
  const steps = [
    { text: 'Welcome to 3D Tic-Tac-Toe! Click Next to start.', event: 'next' },
    { text: '🔄 Drag to rotate the cube', event: 'next' },
    { text: '🔍 Scroll to zoom in/out', event: 'next' },
    { text: '👆 Click on a cube to place your mark', event: 'next' },
    { text: '⌨️ Arrow keys to rotate', event: 'next' },
    { text: '⇧ Shift+Up/Down to zoom', event: 'next' },
    { text: 'ℹ️ You can click edges of interior cells from certain angles', event: 'next' },
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

    if (startBtn) startBtn.addEventListener('click', function() {
      console.log('[Tutorial] Start button clicked');
      start();
    });
    if (dismissBtn) dismissBtn.addEventListener('click', function() {
      console.log('[Tutorial] Dismiss button clicked');
      end();
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      console.log('[Tutorial] Next button clicked');
      next();
    });
    if (skipBtn) skipBtn.addEventListener('click', function() {
      console.log('[Tutorial] Skip button clicked');
      end();
    });
  }

  function start() {
    active = true;
    current = 0;
    rotationBaseline = camera ? camera.position.clone() : null;
    startBtn.classList.add('hidden');
    dismissBtn.classList.remove('hidden');
    console.log('[Tutorial] Tutorial started');
    show();
  }

  function end() {
    if (skipBtn) skipBtn.blur();
    if (nextBtn) nextBtn.blur();
    active = false;
    overlay.classList.add('hidden');
    dismissBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    console.log('[Tutorial] Tutorial ended. Overlay hidden.');
    console.log('[Tutorial] State:', { active, current });
  }

  function show() {
    const step = steps[current];
    if (!step) { 
      console.log('[Tutorial] No step found, ending tutorial.');
      end(); 
      return; 
    }
    textBox.innerText = step.text;
    overlay.classList.remove('hidden');
    nextBtn.style.display = step.event === 'next' ? 'inline-block' : 'none';
    skipBtn.style.display = 'inline-block';
    console.log('[Tutorial] Showing step', current, step.text);
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
