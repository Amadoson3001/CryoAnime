try {
  var pref = window.localStorage.getItem('cryoanime-potato-mode');
  if (pref === '1') {
    document.documentElement.classList.add('potato-mode');
  } else if (pref === null) {
    var isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry/i.test(navigator.userAgent);
    var hw = navigator.hardwareConcurrency || 4;
    var mem = navigator.deviceMemory || 4;
    // Require BOTH low cores AND low memory to avoid false positives
    // (e.g. 3 cores but 16GB RAM is not low-end)
    var isLowEnd = (hw < 4 && mem <= 4) || mem <= 2;
    if (isMobile || isLowEnd) {
      document.documentElement.classList.add('potato-mode');
    }
  }
} catch (e) {}
