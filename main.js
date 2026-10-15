function selectSanctum(tabId, btn) {
  document.querySelectorAll('.module-card').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.rack-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
  triggerRelayImpact();
}

window.addEventListener('DOMContentLoaded', () => {
  calcResistorNominal();
  convertTextToBinaric();
  convertRadixNumber();
  showLoreEra('era-strife', document.querySelector('.lore-era-btn'));
  renderLaws();
  renderHierarchy();
  renderCycleQuestion();
});
