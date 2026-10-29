/* Calculateur d'ecart sponsorise — pages /sponsored-gap-calculator et
   /fr/calculateur-ecart-sponsorise.

   Tout se calcule dans le navigateur : aucun chiffre saisi n'est envoye
   nulle part (c'est ecrit sur la page, il faut que ce reste vrai).

   Memes definitions que l'application : vues en mediane, engagement par
   post en moyenne, score = moyenne des deux rapports, seuils 85 % et 60 %,
   2 posts minimum de chaque cote. Si l'application change, ce fichier
   suit, sinon un meme createur donnerait deux chiffres differents.
   Le repere -46 % est le chiffre du barometre beaute France. */
(() => {
  const root = document.getElementById('calc');
  if (!root) return;

  const FR = document.documentElement.lang === 'fr';
  const T = FR ? {
    views: 'Vues', likes: 'J’aime', comments: 'Commentaires', shares: 'Partages', saves: 'Enregistrements',
    post: 'Post', add: 'Ajouter un post', remove: 'Retirer le dernier post',
    sponsored: 'Sponsorisés', organic: 'Habituels',
    viewsTitle: 'Vues par post (médiane)', engTitle: 'Engagement par post (moyenne)',
    ofOrganic: 'de la performance habituelle',
    empty: 'Remplissez au moins 2 posts de chaque côté (vues et j’aime au minimum) : le résultat s’affiche ici.',
    noBase: 'Les posts habituels n’ont pas de vues mesurables : impossible de comparer.',
    basis: (s, o) => `Calculé sur ${s} post${s > 1 ? 's' : ''} sponsorisé${s > 1 ? 's' : ''} et ${o} post${o > 1 ? 's' : ''} habituel${o > 1 ? 's' : ''}. Un indice, pas une garantie.`,
    bench: (d) => d >= 0
      ? `Ce créateur perd <strong>${d} %</strong> d’engagement sur ses posts sponsorisés. Repère : <strong>46 %</strong> de perte en médiane chez les créateurs beauté français étudiés (22 créateurs, octobre 2026).`
      : `Ce créateur <strong>gagne ${-d} %</strong> d’engagement sur ses posts sponsorisés. Repère : <strong>46 %</strong> de perte en médiane chez les créateurs beauté français étudiés (22 créateurs, octobre 2026).`,
    verdicts: [
      ['Les posts sponsorisés font mieux', 'Ses posts payés dépassent ses posts habituels : le sponsoring ne le pénalise pas.'],
      ['Les posts sponsorisés tiennent', 'Il garde presque toute sa portée et son engagement habituels quand le post est payé.'],
      ['Baisse modérée sur les sponsorisés', 'Une partie de l’audience décroche quand le post est payé. Comptez sur moins que ses chiffres habituels.'],
      ['Forte baisse sur les sponsorisés', 'Ses posts payés s’effondrent face à ses posts habituels. Attendez-vous à la même chose sur votre campagne.'],
    ],
    locale: 'fr-FR',
  } : {
    views: 'Views', likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves',
    post: 'Post', add: 'Add a post', remove: 'Remove the last post',
    sponsored: 'Sponsored', organic: 'Organic',
    viewsTitle: 'Views per post (median)', engTitle: 'Engagement per post (average)',
    ofOrganic: 'of organic performance',
    empty: 'Fill in at least 2 posts on each side (views and likes at minimum): the result shows up here.',
    noBase: 'The organic posts have no measurable views: nothing to compare against.',
    basis: (s, o) => `Based on ${s} sponsored post${s > 1 ? 's' : ''} and ${o} organic post${o > 1 ? 's' : ''}. An indication, not a guarantee.`,
    bench: (d) => d >= 0
      ? `This creator loses <strong>${d}%</strong> engagement on sponsored posts. Benchmark: a <strong>46%</strong> median drop among the French beauty creators we studied (22 creators, October 2026).`
      : `This creator <strong>gains ${-d}%</strong> engagement on sponsored posts. Benchmark: a <strong>46%</strong> median drop among the French beauty creators we studied (22 creators, October 2026).`,
    verdicts: [
      ['Sponsored posts outperform', 'Paid posts do better than this creator’s organic ones: sponsoring is no handicap here.'],
      ['Sponsored posts hold up', 'They keep nearly all of this creator’s usual reach and engagement when the post is paid.'],
      ['Moderate drop on sponsored posts', 'Part of the audience disengages when a post is paid. Plan on less than the organic figures.'],
      ['Sharp drop on sponsored posts', 'Paid posts collapse against this creator’s organic ones. Expect the same on your own campaign.'],
    ],
    locale: 'en-GB',
  };

  const FIELDS = ['views', 'likes', 'comments', 'shares', 'saves'];
  const MIN = 2;
  const MAX = 6;

  // Chiffres d'exemple, FICTIFS et annonces comme tels sur la page.
  const EXAMPLE = {
    sponsored: [['62k', '4.1k', '70', '40', '210'], ['70k', '4.9k', '85', '52', '260'], ['55k', '3.5k', '48', '30', '170']],
    organic: [['98k', '9.8k', '210', '160', '620'], ['120k', '12.4k', '260', '190', '700'], ['87k', '8.1k', '150', '120', '480']],
  };

  /* « 12,3 k », « 12.3K », « 1,2 M », « 12 345 » : TikTok abrege ses
     compteurs, et l'interface francaise met une virgule. Rien de saisi
     = null (champ vide), pas 0. */
  function parse(raw) {
    let s = String(raw).trim().toLowerCase().replace(/[\s  ]/g, '');
    if (!s) return null;
    let mult = 1;
    if (s.endsWith('k')) { mult = 1e3; s = s.slice(0, -1); }
    else if (s.endsWith('m')) { mult = 1e6; s = s.slice(0, -1); }
    // Virgule decimale, sauf si elle separe des milliers (« 12,345 »).
    if (/^\d{1,3}(,\d{3})+$/.test(s) && mult === 1) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n * mult : NaN;
  }

  const compact = new Intl.NumberFormat(T.locale, { notation: 'compact', maximumFractionDigits: 1 });
  const pct = (v) => `${v.toLocaleString(T.locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}${FR ? ' %' : '%'}`;
  const whole = (v) => `${Math.round(v)}${FR ? ' %' : '%'}`;

  function median(a) {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // ── Construction des tableaux ─────────────────────────────────
  const groups = {};
  ['sponsored', 'organic'].forEach((key) => {
    const box = root.querySelector(`[data-group="${key}"]`);
    groups[key] = { box, body: box.querySelector('tbody') };
    box.querySelector('thead tr').innerHTML =
      `<th scope="col"><span class="sr">${T.post}</span></th>` +
      FIELDS.map((f) => `<th scope="col">${T[f]}</th>`).join('');
    for (let i = 0; i < 3; i++) addRow(key);
    box.querySelector('[data-add]').addEventListener('click', () => { addRow(key); update(); });
    box.querySelector('[data-remove]').addEventListener('click', () => { removeRow(key); update(); });
  });

  function addRow(key) {
    const body = groups[key].body;
    if (body.rows.length >= MAX) return;
    const n = body.rows.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `<th scope="row"><span class="calc-postno">${T.post} </span>${n}</th>` + FIELDS.map((f) =>
      `<td data-label="${T[f]}"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-f="${f}"
        aria-label="${(key === 'sponsored' ? T.sponsored : T.organic)} — ${T.post} ${n} — ${T[f]}" /></td>`).join('');
    body.appendChild(tr);
    syncButtons(key);
  }

  function removeRow(key) {
    const body = groups[key].body;
    if (body.rows.length > MIN) body.deleteRow(-1);
    syncButtons(key);
  }

  function syncButtons(key) {
    const { box, body } = groups[key];
    box.querySelector('[data-add]').disabled = body.rows.length >= MAX;
    box.querySelector('[data-remove]').disabled = body.rows.length <= MIN;
  }

  // ── Lecture et calcul ─────────────────────────────────────────
  function read(key) {
    const posts = [];
    [...groups[key].body.rows].forEach((tr) => {
      const v = {};
      let bad = false;
      tr.querySelectorAll('input').forEach((input) => {
        const n = parse(input.value);
        input.classList.toggle('is-bad', Number.isNaN(n));
        if (Number.isNaN(n)) bad = true;
        v[input.dataset.f] = n;
      });
      // Un post compte des qu'il a des vues et des j'aime : les autres
      // compteurs vides valent 0. Sans j'aime, un post a moitie saisi
      // afficherait un engagement nul et fausserait le resultat.
      if (bad || !(v.views > 0) || v.likes == null) return;
      const inter = (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0);
      posts.push({ views: v.views, eng: (inter / v.views) * 100 });
    });
    return posts;
  }

  const out = root.querySelector('[data-result]');

  function update() {
    const s = read('sponsored');
    const o = read('organic');
    if (s.length < MIN || o.length < MIN) {
      out.innerHTML = `<p class="calc-empty">${T.empty}</p>`;
      return;
    }
    const views = { o: median(o.map((p) => p.views)), s: median(s.map((p) => p.views)) };
    const eng = {
      o: o.reduce((t, p) => t + p.eng, 0) / o.length,
      s: s.reduce((t, p) => t + p.eng, 0) / s.length,
    };
    const ratios = [views.o > 0 ? views.s / views.o : null, eng.o > 0 ? eng.s / eng.o : null].filter((r) => r !== null);
    if (!ratios.length) {
      out.innerHTML = `<p class="calc-empty">${T.noBase}</p>`;
      return;
    }
    const score = ratios.reduce((t, r) => t + r, 0) / ratios.length;
    const tone = score >= 0.85 ? 'good' : score >= 0.6 ? 'mid' : 'bad';
    const verdict = T.verdicts[score >= 1 ? 0 : score >= 0.85 ? 1 : score >= 0.6 ? 2 : 3];
    const drop = eng.o > 0 ? Math.round((1 - eng.s / eng.o) * 100) : null;

    out.innerHTML = `
      <div class="calc-score calc-score--${tone}">
        <span class="calc-score-val">${whole(score * 100)}</span>
        <span class="calc-score-sub">${T.ofOrganic}</span>
      </div>
      ${pair(T.viewsTitle, views, (v) => compact.format(Math.round(v)))}
      ${pair(T.engTitle, eng, pct)}
      <div class="panel-verdict calc-verdict calc-verdict--${tone}">
        <p><strong>${verdict[0]}.</strong> ${verdict[1]}</p>
      </div>
      ${drop !== null ? `<p class="calc-bench">${T.bench(drop)}</p>` : ''}
      <p class="calc-basis">${T.basis(s.length, o.length)}</p>`;
  }

  // Deux barres sur un axe commun : la plus grande valeur fait la piste
  // entiere (meme regle que GapChart dans l'app).
  function pair(title, v, fmt) {
    const max = Math.max(v.o, v.s) || 1;
    const row = (cls, label, val) => `
      <div class="gaprow ${cls}">
        <span class="gaprow-label">${label}</span>
        <span class="gaprow-track"><i style="width:${Math.max(2, (val / max) * 100)}%"></i></span>
        <span class="gaprow-val">${fmt(val)}</span>
      </div>`;
    return `<div class="panel-gap"><p class="panel-gap-title">${title}</p>
      ${row('', T.organic, v.o)}${row('gaprow--paid', T.sponsored, v.s)}</div>`;
  }

  root.addEventListener('input', update);

  root.querySelector('[data-example]').addEventListener('click', () => {
    ['sponsored', 'organic'].forEach((key) => {
      const body = groups[key].body;
      while (body.rows.length > EXAMPLE[key].length) body.deleteRow(-1);
      while (body.rows.length < EXAMPLE[key].length) addRow(key);
      EXAMPLE[key].forEach((vals, i) => {
        body.rows[i].querySelectorAll('input').forEach((input, j) => {
          input.value = FR ? vals[j].replace('.', ',') : vals[j];
        });
      });
      syncButtons(key);
    });
    update();
  });

  root.querySelector('[data-clear]').addEventListener('click', () => {
    root.querySelectorAll('input').forEach((input) => { input.value = ''; input.classList.remove('is-bad'); });
    update();
  });

  update();
})();
