// Start page sound handling
document.addEventListener('DOMContentLoaded', () => {
  // Initialize sound manager on hover
  const startBtn = document.getElementById('startButton');
  
  startBtn.addEventListener('mouseover', () => {
      if (!window.soundManager.initialized) {
          window.soundManager.init();
          window.soundManager.playSound('menuMusic', 1.0);
      }
  });

  // Add click sounds to all buttons
  document.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
          if (window.soundManager.initialized) {
              window.soundManager.playSound('click');
          } else {
            window.soundManager.init();
            window.soundManager.playSound('click');
            window.soundManager.crossfadeMusic('menuMusic', 1.0);
          }
      });
  });

  // Resume music if coming back from game
  if (window.soundManager.initialized && localStorage.getItem('currentMusic') === 'menuMusic') {
      window.soundManager.playMusic('menuMusic', true);
  }
});