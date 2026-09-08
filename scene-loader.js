// Loads full scene in two parts (GitHub push size limits)
(function () {
  function loadText(src) {
    return fetch(src, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('Failed to load ' + src);
      return r.text();
    });
  }

  Promise.all([loadText('scene-part1.js'), loadText('scene-part2.js')])
    .then(function (parts) {
      var script = document.createElement('script');
      script.textContent = parts[0] + parts[1];
      document.body.appendChild(script);
    })
    .catch(function (err) {
      console.error(err);
    });
})();
