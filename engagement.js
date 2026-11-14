/* Calculateur de taux d'engagement TikTok — pages
   /tiktok-engagement-rate-beauty et /fr/taux-engagement-tiktok-beaute.

   Tout se calcule dans le navigateur : rien de ce qui est saisi n'est
   envoye nulle part (c'est ecrit sur la page, il faut que ce reste vrai).

   Memes definitions que les reperes publies sur la page, qui sont ceux de
   l'application : engagement d'un post = (j'aime + commentaires + partages
   + enregistrements) / vues, puis moyenne des posts ; vues rapportees aux
   abonnes = mediane des vues par post / abonnes.

   BENCH reprend EXACTEMENT les chiffres de la page (etude du 2026-10-12 :
   createurs beaute francais tires au hasard, publications recentes, posts
   sponsorises exclus ; quartiles par tranche d'abonnes). Si la page change,
   ce fichier suit, et inversement. Pas de repere « toutes tailles » : le
   tirage met autant de createurs dans chaque tranche, sa mediane globale
   ne decrirait aucune population reelle. */
(() => {
  const root = document.getElementById('eng');
  if (!root) return;

  const FR = document.documentElement.lang === 'fr';
  const LOCALE = FR ? 'fr-FR' : 'en-GB';

  const BENCH = [
    { min: 1e3, max: 1e4, p25: 3.9, med: 4.9, p75: 8.2, reach: 93,
      label: FR ? '1 000 à 10 000 abonnés' : '1,000 to 10,000 followers' },
    { min: 1e4, max: 1e5, p25: 4.0, med: 6.3, p75: 8.3, reach: 24,
      label: FR ? '10 000 à 100 000 abonnés' : '10,000 to 100,000 followers' },
    { min: 1e5, max: Infinity, p25: 8.2, med: 9.3, p75: 12.1, reach: 14,
      label: FR ? '100 000 abonnés et plus' : '100,000 followers and up' },
  ];

  const pct = (v) => `${v.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${FR ? ' %' : '%'}`;
  const whole = (v) => `${Math.round(v).toLocaleString(LOCALE)}${FR ? ' %' : '%'}`;

  const T = FR ? {
    views: 'Vues', likes: 'J’aime', comments: 'Commentaires', shares: 'Partages', saves: 'Enregistrements',
    post: 'Post', group: 'Posts récents',
    empty: 'Entrez au moins un post (vues et j’aime au minimum) : le résultat s’affiche ici.',
    sub: (n) => `d’engagement par post, en moyenne sur ${n} post${n > 1 ? 's' : ''}`,
    you: 'Ce créateur', median: 'Médiane de la tranche',
    chartTitle: 'Engagement par post',
    verdicts: [
      ['Très bon', 'dans le quart le plus haut des créateurs beauté français de sa taille.'],
      ['Bon', 'au-dessus de la médiane des créateurs beauté français de sa taille.'],
      ['Moyen', 'sous la médiane, mais au-dessus du quart le plus bas.'],
      ['Faible', 'dans le quart le plus bas des créateurs beauté français de sa taille.'],
    ],
    bench: (b) => `Repère, ${b.label} : médiane <strong>${pct(b.med)}</strong>, la moitié des créateurs entre ${pct(b.p25)} et ${pct(b.p75)}.`,
    noFollowers: 'Ajoutez son nombre d’abonnés pour le comparer aux créateurs beauté français de sa taille.',
    tooSmall: 'Nos repères commencent à 1 000 abonnés : pas de comparaison en dessous.',
    reach: (x, b) => `Ses vues par post représentent <strong>${whole(x)}</strong> de ses abonnés (médiane). Repère de sa tranche : ${whole(b.reach)}.`,
    basis: 'Prenez des posts récents, non sponsorisés : les repères les excluent. Un indice, pas une garantie.',
  } : {
    views: 'Views', likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves',
    post: 'Post', group: 'Recent posts',
    empty: 'Fill in at least one post (views and likes at minimum): the result shows up here.',
    sub: (n) => `engagement per post, averaged over ${n} post${n > 1 ? 's' : ''}`,
    you: 'This creator', median: 'Median for the size',
    chartTitle: 'Engagement per post',
    verdicts: [
      ['Very good', 'in the top quarter of French beauty creators of the same size.'],
      ['Good', 'above the median of French beauty creators of the same size.'],
      ['Average', 'below the median, but above the bottom quarter.'],
      ['Low', 'in the bottom quarter of French beauty creators of the same size.'],
    ],
    bench: (b) => `Benchmark, ${b.label}: median <strong>${pct(b.med)}</strong>, half of creators between ${pct(b.p25)} and ${pct(b.p75)}.`,
    noFollowers: 'Add their follower count to compare them with French beauty creators of the same size.',
    tooSmall: 'Our benchmarks start at 1,000 followers: no comparison below that.',
    reach: (x, b) => `Their views per post equal <strong>${whole(x)}</strong> of their followers (median). Benchmark for the size: ${whole(b.reach)}.`,
    basis: 'Use recent, non-sponsored posts: the benchmarks leave sponsored ones out. An indication, not a guarantee.',
  };

  const FIELDS = ['views', 'likes', 'comments', 'shares', 'saves'];
  const MIN = 1;
  const START = 3;
  const MAX = 8;

  // Chiffres d'exemple, FICTIFS et annonces comme tels sur la page.
  const EXAMPLE = {
    followers: '48k',
    posts: [['12k', '640', '18', '9', '40'], ['9.4k', '510', '11', '6', '28'], ['15k', '820', '25', '14', '61']],
  };

  /* « 12,3 k », « 12.3K », « 1,2 M », « 12 345 » : TikTok abrege ses
     compteurs, et l'interface francaise met une virgule. Rien de saisi
     = null (champ vide), pas 0. Meme lecture que calculator.js. */
  function parse(raw) {
    let s = String(raw).trim().toLowerCase().replace(/[\s  ]/g, '');
    if (!s) return null;
    let mult = 1;
    if (s.endsWith('k')) { mult = 1e3; s = s.slice(0, -1); }
    else if (s.endsWith('m')) { mult = 1e6; s = s.slice(0, -1); }
    if (/^\d{1,3}(,\d{3})+$/.test(s) && mult === 1) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n * mult : NaN;
  }

  function median(a) {
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  // ── Construction du tableau ───────────────────────────────────
  const box = root.querySelector('[data-group="posts"]');
  const body = box.querySelector('tbody');
  const followersInput = root.querySelector('[data-followers]');
  box.querySelector('thead tr').innerHTML =
    `<th scope="col"><span class="sr">${T.post}</span></th>` +
    FIELDS.map((f) => `<th scope="col">${T[f]}</th>`).join('');
  for (let i = 0; i < START; i++) addRow();
  box.querySelector('[data-add]').addEventListener('click', () => { addRow(); update(); });
  box.querySelector('[data-remove]').addEventListener('click', () => { removeRow(); update(); });

  function addRow() {
    if (body.rows.length >= MAX) return;
    const n = body.rows.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `<th scope="row"><span class="calc-postno">${T.post} </span>${n}</th>` + FIELDS.map((f) =>
      `<td data-label="${T[f]}"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" data-f="${f}"
        aria-label="${T.group} — ${T.post} ${n} — ${T[f]}" /></td>`).join('');
    body.appendChild(tr);
    syncButtons();
  }

  function removeRow() {
    if (body.rows.length > MIN) body.deleteRow(-1);
    syncButtons();
  }

  function syncButtons() {
    box.querySelector('[data-add]').disabled = body.rows.length >= MAX;
    box.querySelector('[data-remove]').disabled = body.rows.length <= MIN;
  }

  // ── Lecture et calcul ─────────────────────────────────────────
  function readPosts() {
    const posts = [];
    [...body.rows].forEach((tr) => {
      const v = {};
      let bad = false;
      tr.querySelectorAll('input').forEach((input) => {
        const n = parse(input.value);
        input.classList.toggle('is-bad', Number.isNaN(n));
        if (Number.isNaN(n)) bad = true;
        v[input.dataset.f] = n;
      });
      // Un post compte des qu'il a des vues et des j'aime : les autres
      // compteurs vides valent 0 (meme regle que calculator.js).
      if (bad || !(v.views > 0) || v.likes == null) return;
      const inter = (v.likes || 0) + (v.comments || 0) + (v.shares || 0) + (v.saves || 0);
      posts.push({ views: v.views, eng: (inter / v.views) * 100 });
    });
    return posts;
  }

  const out = root.querySelector('[data-result]');

  function update() {
    const posts = readPosts();
    const followers = parse(followersInput.value);
    followersInput.classList.toggle('is-bad', Number.isNaN(followers));

    if (posts.length < MIN) {
      out.innerHTML = `<p class="calc-empty">${T.empty}</p>`;
      return;
    }
    const eng = posts.reduce((t, p) => t + p.eng, 0) / posts.length;
    const known = followers > 0;
    const tier = known ? BENCH.find((b) => followers >= b.min && followers < b.max) : null;

    let html = `
      <div class="calc-score${tier ? ` calc-score--${toneOf(eng, tier)}` : ''}">
        <span class="calc-score-val">${pct(eng)}</span>
        <span class="calc-score-sub">${T.sub(posts.length)}</span>
      </div>`;

    if (!tier) {
      html += `<p class="calc-bench">${known ? T.tooSmall : T.noFollowers}</p>`;
    } else {
      const i = eng >= tier.p75 ? 0 : eng >= tier.med ? 1 : eng >= tier.p25 ? 2 : 3;
      const tone = toneOf(eng, tier);
      html += bars(eng, tier);
      html += `
        <div class="panel-verdict calc-verdict calc-verdict--${tone}">
          <p><strong>${T.verdicts[i][0]}${FR ? ' :' : ':'}</strong> ${T.verdicts[i][1]}</p>
        </div>
        <p class="calc-bench">${T.bench(tier)}</p>`;
      const reach = (median(posts.map((p) => p.views)) / followers) * 100;
      html += `<p class="calc-bench">${T.reach(reach, tier)}</p>`;
    }
    html += `<p class="calc-basis">${T.basis}</p>`;
    out.innerHTML = html;
  }

  function toneOf(eng, tier) {
    return eng >= tier.med ? 'good' : eng >= tier.p25 ? 'mid' : 'bad';
  }

  // Deux barres sur un axe commun : la plus grande valeur fait la piste
  // entiere (meme regle que le calculateur d'ecart et l'app).
  function bars(eng, tier) {
    const max = Math.max(eng, tier.p75) || 1;
    const row = (cls, label, val) => `
      <div class="gaprow ${cls}">
        <span class="gaprow-label">${label}</span>
        <span class="gaprow-track"><i style="width:${Math.max(2, (val / max) * 100)}%"></i></span>
        <span class="gaprow-val">${pct(val)}</span>
      </div>`;
    return `<div class="panel-gap"><p class="panel-gap-title">${T.chartTitle}</p>
      ${row('', T.you, eng)}${row('gaprow--muted', T.median, tier.med)}</div>`;
  }

  root.addEventListener('input', update);

  root.querySelector('[data-example]').addEventListener('click', () => {
    while (body.rows.length > EXAMPLE.posts.length) body.deleteRow(-1);
    while (body.rows.length < EXAMPLE.posts.length) addRow();
    followersInput.value = EXAMPLE.followers;
    EXAMPLE.posts.forEach((vals, i) => {
      body.rows[i].querySelectorAll('input').forEach((input, j) => {
        input.value = FR ? vals[j].replace('.', ',') : vals[j];
      });
    });
    syncButtons();
    update();
  });

  root.querySelector('[data-clear]').addEventListener('click', () => {
    root.querySelectorAll('input').forEach((input) => { input.value = ''; input.classList.remove('is-bad'); });
    update();
  });

  update();
})();
