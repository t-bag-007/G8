/* ============================================================
   STUDIO ! — Script principal
   Modules :
   1. Navbar scroll
   2. Scroll reveal
   3. Validation formulaire contact
   4. Chatbot Léa (Gemini API)
   ============================================================ */


/* ============================================================
   0. ROBUSTESSE — secours si Bootstrap, les icônes ou les images
      ne se chargent pas (hors-ligne, CDN bloqué, content://…)
   ============================================================ */
(function initFallbacks() {
  const root = document.documentElement;

  /* --- Images cassées : on masque l'icône "image brisée" --- */
  document.querySelectorAll('img').forEach(img => {
    const fail = () => img.classList.add('img-failed');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
  });

  /* --- Icônes : bascule sur des symboles si la police est absente --- */
  const probe = document.querySelector('i.bi');
  if (probe) {
    const check = () => {
      const c = getComputedStyle(probe, '::before').content;
      if (!c || c === 'none' || c === 'normal') root.classList.add('no-icons');
    };
    if (document.readyState === 'complete') check();
    else window.addEventListener('load', check);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        try {
          document.fonts.forEach(f => {
            if (/bootstrap-icons/i.test(f.family) && f.status === 'error') root.classList.add('no-icons');
          });
        } catch (e) { /* ignore */ }
      });
    }
  }

  /* --- Bootstrap JS absent : menu burger + carrousel maison --- */
  if (window.bootstrap) return;
  root.classList.add('no-bs');

  // Menu mobile
  document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(btn => {
    const target = document.querySelector(btn.getAttribute('data-bs-target'));
    if (!target) return;
    const setOpen = open => {
      target.classList.toggle('show', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => setOpen(!target.classList.contains('show')));
    target.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  });

  // Carrousel
  document.querySelectorAll('.carousel').forEach(car => {
    const items = [...car.querySelectorAll('.carousel-item')];
    const dots  = [...car.querySelectorAll('.carousel-indicators [data-bs-slide-to]')];
    if (items.length < 2) return;
    let index = Math.max(0, items.findIndex(i => i.classList.contains('active')));
    let timer = null;

    const show = n => {
      index = (n + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle('active', i === index));
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
    };
    const play = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      stop(); timer = setInterval(() => show(index + 1), 5000);
    };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };

    car.querySelector('[data-bs-slide="prev"]')?.addEventListener('click', () => { show(index - 1); play(); });
    car.querySelector('[data-bs-slide="next"]')?.addEventListener('click', () => { show(index + 1); play(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); play(); }));

    // Balayage tactile
    let x0 = null;
    car.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(index + (dx < 0 ? 1 : -1)); play(); }
    }, { passive: true });

    car.addEventListener('mouseenter', stop);
    car.addEventListener('mouseleave', play);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
    show(index); play();
  });
})();


/* ============================================================
   1. NAVBAR — Changement de style au scroll
   ============================================================ */
(function initNavbar() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // état initial
})();


(function initMobileMenu() {
  const menu = document.getElementById('navbarNav');
  if (!menu || !window.bootstrap) return;
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
    });
  });
})();


/* ============================================================
   2. SCROLL REVEAL — Apparition des éléments au viewport
   ============================================================ */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Respecter prefers-reduced-motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Délai en cascade léger
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
})();


/* ============================================================
   3. FORMULAIRE CONTACT — Validation côté client
   ============================================================ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Renseigner une URL (ex. https://formspree.io/f/xxxx) pour un envoi réel.
  // Laissée vide : le formulaire ouvre l'application mail du visiteur.
  const FORM_ENDPOINT = '';
  const CONTACT_EMAIL = 'contact@studio-coiffure.fr';

  const successMsg  = document.getElementById('form-success');
  const submitBtn   = document.getElementById('submitBtn');
  const btnText     = submitBtn?.querySelector('.btn-text');
  const btnLoading  = submitBtn?.querySelector('.btn-loading');

  /**
   * Valide un champ et affiche/masque son message d'erreur.
   * @param {string} fieldId   - id du champ
   * @param {string} errorId   - id du span d'erreur
   * @param {Function} checkFn - fonction qui retourne true si valide
   * @returns {boolean}
   */
  function validateField(fieldId, errorId, checkFn) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);
    if (!field || !error) return true;

    const valid = checkFn(field.value.trim());
    field.classList.toggle('input-error', !valid);
    error.classList.toggle('visible', !valid);
    return valid;
  }

  /** Regex email simple */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** Validation globale */
  function validateAll() {
    const v1 = validateField('inputNom',     'error-nom',     v => v.length >= 2);
    const v2 = validateField('inputEmail',   'error-email',   v => emailRegex.test(v));
    const v3 = validateField('inputMessage', 'error-message', v => v.length >= 10);
    return v1 && v2 && v3;
  }

  /** Retrait des erreurs en temps réel à la saisie */
  ['inputNom', 'inputEmail', 'inputMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('input-error');
        const errEl = document.getElementById('error-' + id.replace('input', '').toLowerCase());
        if (errEl) errEl.classList.remove('visible');
      });
    }
  });

  /** Soumission */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateAll()) return;

    // État chargement
    if (btnText)    btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    submitBtn.disabled = true;

    const data = {
      nom:     document.getElementById('inputNom').value.trim(),
      email:   document.getElementById('inputEmail').value.trim(),
      tel:     (document.getElementById('inputTel')?.value || '').trim(),
      service: document.getElementById('inputService')?.selectedOptions[0]?.text || '',
      message: document.getElementById('inputMessage').value.trim()
    };

    const done = (ok) => {
      if (btnText)    btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');
      submitBtn.disabled = false;
      if (!successMsg) return;
      successMsg.classList.toggle('error', !ok);
      const label = successMsg.querySelector('[data-msg]');
      if (label) label.textContent = ok
        ? 'Message prêt ! Nous vous répondrons dans les plus brefs délais.'
        : 'Envoi impossible pour le moment. Appelez-nous au 01 23 45 67 89.';
      successMsg.classList.remove('hidden');
      setTimeout(() => successMsg.classList.add('hidden'), 8000);
    };

    if (FORM_ENDPOINT) {
      // Envoi réel (Formspree, Getform, fonction Vercel…)
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); form.reset(); done(true); })
        .catch(() => done(false));
    } else {
      // Sans backend : ouvre l'application mail avec le message pré-rempli
      const body = `Nom : ${data.nom}\nEmail : ${data.email}\nTéléphone : ${data.tel || '—'}\nService : ${data.service || '—'}\n\n${data.message}`;
      const href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent('Demande de RDV — ' + data.nom) +
        '&body=' + encodeURIComponent(body);
      window.location.href = href;
      form.reset();
      setTimeout(() => done(true), 400);
    }
  });
})();


/* ============================================================
   4. CHATBOT LÉA
   - En ligne : appelle /api/chat (fonction Vercel qui détient la clé Gemini)
   - Hors ligne / API indisponible : réponses locales de secours
   ============================================================ */
(function initChatbot() {

  /* ---- Éléments DOM ---- */
  const fab         = document.getElementById('chat-toggle');
  const chatWindow  = document.getElementById('chat-window');
  const closeBtn    = document.getElementById('chat-close');
  const messagesBox = document.getElementById('chat-messages');
  const chatInput   = document.getElementById('chat-input');
  const sendBtn     = document.getElementById('chat-send');

  if (!fab || !chatWindow || !messagesBox || !chatInput || !sendBtn) return;

  /* ---- Configuration ---- */
  // La clé Gemini n'est PLUS dans le navigateur : elle est dans la variable
  // d'environnement GEMINI_API_KEY de Vercel (voir api/chat.js).
  const CHAT_ENDPOINT = '/api/chat';

  /* ---- Historique de conversation ---- */
  let history = [];            // [{ role: 'user' | 'model', text }]
  let isOpen = false;
  let isWaiting = false;

  /* ---- Ouvrir / Fermer ---- */
  fab.addEventListener('click', () => {
    isOpen = !isOpen;
    chatWindow.classList.toggle('hidden', !isOpen);
    if (isOpen) {
      if (messagesBox.children.length === 0) {
        addMessage('bot', 'Bonjour ! Je suis Léa, votre assistante chez Studio&nbsp;! 💇 Comment puis-je vous aider aujourd\'hui ?');
      }
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    chatWindow.classList.add('hidden');
  });

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  /* ---- Affichage ---- */
  function addMessage(role, html) {
    const div = document.createElement('div');
    div.classList.add('chat-msg', role);
    div.innerHTML = html;
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.classList.add('chat-msg', 'bot', 'typing');
    div.id = 'typing-indicator';
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesBox.appendChild(div);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Texte brut -> HTML sûr (gras **x** et retours à la ligne conservés). */
  function formatReply(text) {
    return escapeHTML(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /* ---- Envoi d'un message ---- */
  async function handleSend() {
    const userText = chatInput.value.trim();
    if (!userText || isWaiting) return;

    isWaiting = true;
    chatInput.value = '';
    sendBtn.disabled = true;

    addMessage('user', escapeHTML(userText));
    history.push({ role: 'user', text: userText });
    showTyping();

    let reply;
    try {
      reply = await callApi();
    } catch (err) {
      console.warn('Chatbot : API indisponible, réponse locale utilisée.', err);
      reply = localReply(userText);
    }

    hideTyping();
    addMessage('bot', formatReply(reply));
    history.push({ role: 'model', text: reply });

    isWaiting = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }

  /* ---- Appel de la fonction serverless ---- */
  async function callApi() {
    if (location.protocol === 'file:') throw new Error('Ouvert en local (file://) : pas d\'API');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12) }),
        signal: controller.signal
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      if (!data || !data.reply) throw new Error('Réponse vide');
      return data.reply;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---- Réponses de secours (sans IA) ---- */
  function localReply(q) {
    const t = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const has = (...words) => words.some(w => t.includes(w));

    if (has('horaire', 'ouvert', 'ferme', 'heure'))
      return 'Nous sommes ouverts du mardi au vendredi de 9h à 19h, et le samedi de 9h à 18h. Fermé le dimanche et le lundi.';
    if (has('adresse', 'ou etes', 'situe', 'metro', 'acces', 'venir'))
      return 'Le salon est au 12 rue des Artisans, 75011 Paris. Métro Voltaire (ligne 9), à 3 minutes à pied.';
    if (has('rdv', 'rendez', 'reserv'))
      return 'Pour prendre rendez-vous, appelez le 01 23 45 67 89 ou utilisez le formulaire de la page Contact.';
    if (has('tel', 'appel', 'numero', 'mail', 'email', 'contact'))
      return 'Vous pouvez nous joindre au 01 23 45 67 89 ou par email à contact@studio-coiffure.fr.';
    if (has('equipe', 'coiffeur', 'coiffeuse', 'sophie', 'karim', 'ines', 'amara'))
      return 'L\'équipe : Sophie Marchand (fondatrice, coupes et colorations), Karim Benali (coupe homme, barbier), Inès Durand (coloriste, kératine) et Amara Diallo (cheveux bouclés, tresses, cérémonies).';
    if (has('homme'))
      return 'La coupe homme est à 20 € (shampoing + coupe, dégradé possible).';
    if (has('femme'))
      return 'La coupe femme est à 35 € (shampoing + coupe + coiffage).';
    if (has('balayage'))
      return 'Le balayage (californien, ombré, baby lights) démarre à 70 €.';
    if (has('colo'))
      return 'La coloration pleine démarre à 55 € (couverture des racines ou changement total).';
    if (has('keratine', 'lissage'))
      return 'La kératine (lissage semi-permanent, 3 à 4 mois) coûte 90 €.';
    if (has('chignon', 'mariage', 'soiree', 'ceremonie'))
      return 'Le chignon de soirée est à 55 € (structuré, tressé ou romantique).';
    if (has('soin'))
      return 'Le soin profond (nourrissant, restructurant ou hydratant) est à 30 €.';
    if (has('prix', 'tarif', 'combien', 'cout', 'service', 'prestation'))
      return 'Nos tarifs : coupe femme 35 €, coupe homme 20 €, balayage dès 70 €, coloration dès 55 €, kératine 90 €, chignon 55 €, soin profond 30 €.';
    if (has('bonjour', 'salut', 'coucou', 'bonsoir', 'hello'))
      return 'Bonjour ! Je peux vous renseigner sur nos services, tarifs, horaires ou la prise de rendez-vous.';
    if (has('merci'))
      return 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.';

    return 'Je ne suis pas sûre de pouvoir répondre à cela pour le moment. Appelez-nous au 01 23 45 67 89 et l\'équipe vous renseignera avec plaisir.';
  }

})();
