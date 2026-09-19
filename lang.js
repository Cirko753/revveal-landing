/* Selecteur de langue — complement a <details>.

   L'element natif gere deja l'ouverture, la fermeture au clic sur le
   bouton, la navigation clavier et l'etat ouvert/ferme. Il ne sait pas
   se fermer quand on clique ailleurs, ni sur Echap : c'est tout ce que
   ce fichier ajoute. Sans lui, le menu reste utilisable.

   Delegue sur document plutot qu'un ecouteur par menu : il n'y en a
   qu'un par page aujourd'hui, mais ca reste vrai s'il y en a deux. */
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.lang[open]').forEach((d) => {
    if (!d.contains(e.target)) d.open = false;
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('details.lang[open]').forEach((d) => {
    d.open = false;
    d.querySelector('summary')?.focus();
  });
});
