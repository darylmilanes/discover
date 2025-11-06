// Open the guidance modal on every load; no persistence to localStorage
(function(){
  const modal = document.getElementById('guidanceModal');
  if (!modal) return;

  const acceptBtn = document.getElementById('acceptGuidance');
  const backdrop = modal.querySelector('.modal-backdrop');

  function openModal(){
    modal.removeAttribute('hidden');
    // save currently focused element to restore later
    modal.__previouslyFocused = document.activeElement;
    // move focus to the primary action
    acceptBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (modal.__previouslyFocused && typeof modal.__previouslyFocused.focus === 'function'){
      modal.__previouslyFocused.focus();
    }
  }

  // Always open the modal on each page load
  openModal();

  acceptBtn.addEventListener('click', function(){
    closeModal();
  });

  // NOTE: intentionally do NOT close when backdrop is clicked. Backdrop exists to dim
  // the page but clicking outside will not dismiss the guidance. This makes the
  // 'Amen!' button the only way to exit.

  // Do NOT close on Escape key — require explicit Amen button press
  // document.addEventListener('keydown', ...) intentionally omitted

  // Basic focus trap: keep focus inside the modal while open
  document.addEventListener('focus', function(e){
    if (modal.hasAttribute('hidden')) return;
    if (!modal.contains(e.target)){
      e.stopPropagation();
      acceptBtn.focus();
    }
  }, true);
})();
