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

  // Close when clicking on backdrop
  backdrop.addEventListener('click', function(e){
    closeModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')){
      closeModal();
    }
  });

  // Basic focus trap: keep focus inside the modal while open
  document.addEventListener('focus', function(e){
    if (modal.hasAttribute('hidden')) return;
    if (!modal.contains(e.target)){
      e.stopPropagation();
      acceptBtn.focus();
    }
  }, true);
})();
