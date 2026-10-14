(() => {
  'use strict';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const button = document.createElement('button');
  const status = document.createElement('div');
  let recognition = null;
  let active = false;
  let lines = [];
  let position = 0;
  button.textContent = 'Suivi vocal (test)';
  button.style.cssText = 'padding:12px;margin:10px 0;background:#344c67;color:white;border-radius:10px;border:1px solid #8090a5;cursor:pointer';
  status.style.cssText = 'padding:8px;color:#ffda79;font-size:14px;white-space:normal;overflow-wrap:anywhere';
  const clean = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = s => clean(s).split(' ').filter(w => w.length > 2);
  function song() {
    return document.querySelector('.song.active') ||
      [...document.querySelectorAll('.song')].find(el => getComputedStyle(el).display !== 'none');
  }
  function stop() {
    active = false;
    if (recognition) { try { recognition.stop(); } catch(e) {} }
    recognition = null;
    button.textContent = 'Suivi vocal (test)';
  }
  function start() {
    if (!SR) { status.textContent = 'Reconnaissance vocale indisponible dans ce navigateur.'; return; }
    const current = song();
    if (!current) { status.textContent = 'Aucune chanson visible. Choisis Stand By Me.'; return; }
    const stage = current.querySelector('.stage');
    if (!stage) { status.textContent = 'Paroles introuvables.'; return; }
    lines = [...stage.querySelectorAll('.lyric-line, .verse-lines > div, .stage > div, .stage > p')]
      .map(el => ({el, words:tokens(el.textContent)}))
      .filter(x => x.words.length >= 2);
    if (!lines.length) { status.textContent = 'Lignes de paroles introuvables.'; return; }
    position = 0;
    try {
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = event => {
        if (!active || !event.results.length) return;
        const result = event.results[event.results.length - 1];
        const heard = clean(result[0].transcript);
        const heardWords = new Set(tokens(heard));
        let best = -1, score = 0;
        for (let i = position; i < Math.min(lines.length, position + 3); i++) {
          const overlap = lines[i].words.filter(w => heardWords.has(w)).length;
          const s = overlap / Math.max(2, Math.min(lines[i].words.length, heardWords.size));
          if (overlap >= 2 && s > score + 0.15 * (i - position)) { score = s; best = i; }
        }
        if (best >= 0 && score >= 0.45) {
          position = best;
          lines[best].el.scrollIntoView({behavior:'smooth',block:'center'});
          status.textContent = 'Ligne reconnue : ' + (best + 1) + '/' + lines.length;
          // V2 : pas d'avance automatique après une reconnaissance.
        } else {
          status.textContent = 'Entendu : ' + heard.slice(0,60);
        }
      };
      recognition.onerror = e => {
        status.textContent = 'Erreur reconnaissance : ' + e.error;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') stop();
      };
      recognition.onend = () => {
        if (active) { try { recognition.start(); } catch(e) { stop(); status.textContent = 'Reconnaissance interrompue : ' + e.message; } }
      };
      recognition.start();
      active = true;
      button.textContent = 'Arrêter le suivi vocal';
      status.textContent = 'Écoute en cours : chante Stand By Me.';
    } catch(e) {
      stop();
      status.textContent = 'Impossible de démarrer : ' + e.message;
    }
  }
  button.onclick = () => active ? stop() : start();
  const panel = document.querySelector('#audioPanel .audio-row') || document.querySelector('#audioPanel');
  if (panel) {
    panel.appendChild(button);
    document.body.appendChild(status);
status.style.cssText = 'position:fixed;top:8px;left:8px;right:8px;z-index:99999;background:#171717;color:#ffda79;padding:10px;border:1px solid #555;border-radius:8px;font-size:13px;text-align:center;pointer-events:none;';
status.textContent = 'Suivi vocal prêt';
  }
  document.querySelector('#picker')?.addEventListener('change', stop);
})();
