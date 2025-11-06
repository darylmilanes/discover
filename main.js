document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const overlay = document.getElementById("overlay");
  const categoryList = document.getElementById("categoryList");
  const contentArea = document.getElementById("contentArea");
  const tagSearch = document.getElementById("tagSearch");
  const clearSearch = document.getElementById("clearSearch");
  const footer = document.querySelector('footer');

  // Helper: scroll a sidebar item so it sits above the fixed footer
  function scrollItemAboveFooter(itemEl){
    if (!itemEl || !sidebar) return;
    const sidebarRect = sidebar.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    const footerHeight = footer ? footer.getBoundingClientRect().height : 48;

    // Visible bottom of the sidebar (accounts for its set height)
    const sidebarVisibleBottom = sidebarRect.top + sidebar.clientHeight;
    const sidebarVisibleTop = sidebarRect.top;

    // If the item's bottom is below the visible bottom, scroll down so it becomes visible
    const deltaDown = itemRect.bottom - sidebarVisibleBottom;
    // If the item's top is above the visible top, scroll up so it becomes visible
    const deltaUp = itemRect.top - sidebarVisibleTop;

    const padding = 12; // extra spacing above footer or top
    const maxScroll = Math.max(0, sidebar.scrollHeight - sidebar.clientHeight);

    if (deltaDown > 0) {
      let newScroll = Math.min(maxScroll, Math.round(sidebar.scrollTop + deltaDown + padding));
      sidebar.scrollTo({ top: newScroll, behavior: 'smooth' });
    } else if (deltaUp < 0) {
      // deltaUp is negative when item is above; move up enough to show it with padding
      let newScroll = Math.max(0, Math.round(sidebar.scrollTop + deltaUp - padding));
      sidebar.scrollTo({ top: newScroll, behavior: 'smooth' });
    }
  }

  // If the last category group is open, ensure its last visible child sits above footer
  function ensureLastGroupVisibleIfNeeded(){
    const lastGroup = categoryList.lastElementChild;
    if (!lastGroup) return;
    const itemsContainer = lastGroup.querySelector('.category-items');
    if (!itemsContainer) return;
    if (itemsContainer.style.display === 'block'){
      const visibleItems = Array.from(itemsContainer.querySelectorAll('li')).filter(li => li.style.display !== 'none');
      const lastVisible = visibleItems.length ? visibleItems[visibleItems.length - 1] : null;
      scrollItemAboveFooter(lastVisible);
    }
  }

  // ===== Sidebar Toggle =====
  function toggleSidebar(show) {
    if (show) {
      sidebar.classList.add("open");
      overlay.classList.add("active");
      // prevent page from scrolling on small screens while sidebar is open
      if (window.innerWidth < 768) document.body.classList.add('no-scroll');
    } else {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
      document.body.classList.remove('no-scroll');
    }
  }

  // ensure we clear no-scroll if the user resizes to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) document.body.classList.remove('no-scroll');
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");
    toggleSidebar(!isOpen);
  });

  overlay.addEventListener("click", () => toggleSidebar(false));

  // ===== Group Data by Category =====
  const grouped = {};
  DATA.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  let openCategory = null; // Track open accordion
  let activeItemEl = null; // Track highlighted TOC item

  // ===== Build Sidebar =====
  Object.keys(grouped).forEach(category => {
    const group = document.createElement("div");
    group.classList.add("category-group");

    const title = document.createElement("div");
    title.classList.add("category-title");
    title.textContent = category;

    const ul = document.createElement("ul");
    ul.classList.add("category-items");

    grouped[category].forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.title;
      li.addEventListener("click", () => {
        showContent(item);

        // Close sidebar on mobile
        if (window.innerWidth < 768) toggleSidebar(false);

        // Highlight selected item
        if (activeItemEl) activeItemEl.classList.remove("active-item");
        li.classList.add("active-item");
        activeItemEl = li;
      });
      ul.appendChild(li);
    });

    // Accordion — only one open
    title.addEventListener("click", () => {
      if (openCategory && openCategory !== ul) {
        openCategory.style.display = "none";
      }
      ul.style.display = ul.style.display === "block" ? "none" : "block";
      openCategory = ul.style.display === "block" ? ul : null;

      // If this is the last group and it was opened, ensure last child is visible above footer
      if (group === categoryList.lastElementChild && ul.style.display === 'block'){
        const visibleItems = Array.from(ul.querySelectorAll('li')).filter(li => li.style.display !== 'none');
        const lastVisible = visibleItems.length ? visibleItems[visibleItems.length - 1] : null;
        // give the browser a moment to lay out before scrolling
        requestAnimationFrame(() => scrollItemAboveFooter(lastVisible));
      }
    });

    group.appendChild(title);
    group.appendChild(ul);
    categoryList.appendChild(group);
  });

  // Add final curiosity link below the last item (now a button that opens modal)
  (function addCuriosityLink(){
    const curiosityGroup = document.createElement('div');
    curiosityGroup.classList.add('category-group');

    const curiosityUl = document.createElement('ul');
    curiosityUl.classList.add('category-items');

    const curiosityLi = document.createElement('li');
    const curiosityBtn = document.createElement('button');
    curiosityBtn.type = 'button';
    curiosityBtn.textContent = 'What are you curious about?';
    curiosityBtn.className = 'ask-btn';
    curiosityBtn.addEventListener('click', () => openCuriosityModal());

    curiosityLi.appendChild(curiosityBtn);
    curiosityUl.appendChild(curiosityLi);
    curiosityGroup.appendChild(curiosityUl);
    categoryList.appendChild(curiosityGroup);
  })();

  // Curiosity modal helpers
  const curiosityModal = document.getElementById('curiosityModal');
  const cancelCuriosity = document.getElementById('cancelCuriosity');
  const curiosityBackdrop = curiosityModal?.querySelector('.modal-backdrop');
  const curiosityForm = document.getElementById('curiosityForm');
  const curiosityStatus = curiosityModal?.querySelector('#status');

  function openCuriosityModal(){
    if (!curiosityModal) return;
    curiosityModal.removeAttribute('hidden');
    curiosityModal.__previouslyFocused = document.activeElement;
    curiosityModal.querySelector('input,textarea,button')?.focus();
    document.body.classList.add('no-scroll');
  }

  function closeCuriosityModal(){
    if (!curiosityModal) return;
    curiosityModal.setAttribute('hidden', '');
    document.body.classList.remove('no-scroll');
    if (curiosityModal.__previouslyFocused) curiosityModal.__previouslyFocused.focus();
  }

  // Prevent closing on backdrop click by default; allow only cancel button
  if (cancelCuriosity) cancelCuriosity.addEventListener('click', () => closeCuriosityModal());

  // Handle form submit by delegating to existing form code (form.js) via custom event
  if (curiosityForm){
    curiosityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // build payload and dispatch a custom event so form.js can listen
      const data = new FormData(curiosityForm);
      const payload = {
        timestamp: new Date().toISOString(),
        name: data.get('name') || '',
        mobile: data.get('mobile') || '',
        email: data.get('email') || '',
        inquiry1: data.get('inq1') || '',
        inquiry2: data.get('inq2') || '',
        inquiry3: data.get('inq3') || '',
        message: data.get('message') || ''
      };
      document.dispatchEvent(new CustomEvent('curiosity:submit', { detail: { payload, form: curiosityForm, statusEl: curiosityStatus }}));
    });
  }

  // Live filter for tag/title search input
  if (tagSearch) {
    const doFilter = () => {
      const query = tagSearch.value.toLowerCase().trim();

      // If the query is empty, collapse all categories and reset item visibility
      if (!query) {
        document.querySelectorAll('.category-items li').forEach(li => li.style.display = 'block');
        document.querySelectorAll('.category-items').forEach(ul => ul.style.display = 'none');
        if (clearSearch) clearSearch.style.display = 'none';
        return;
      }

      document.querySelectorAll(".category-items li").forEach(li => {
        const title = li.textContent.toLowerCase();
        const item = DATA.find(x => x.title === li.textContent);
        const tags = item?.tags?.join(" ").toLowerCase() || "";

        // Match either title or tags
        const match = title.includes(query) || tags.includes(query);
        li.style.display = match ? "block" : "none";
      });

      // Show/hide entire category groups based on whether any item is visible
      document.querySelectorAll(".category-group").forEach(group => {
        const items = group.querySelectorAll("li");
        const anyVisible = Array.from(items).some(li => li.style.display !== "none");
        group.querySelector(".category-items").style.display = anyVisible ? "block" : "none";
      });

      // Toggle clear button visibility
      if (clearSearch) clearSearch.style.display = tagSearch.value ? "block" : "none";

      // ensure last group's open state is respected and scrolled if needed
      ensureLastGroupVisibleIfNeeded();
    };

    tagSearch.addEventListener("input", doFilter);

    if (clearSearch) {
      clearSearch.addEventListener("click", () => {
        tagSearch.value = "";
        doFilter();
        tagSearch.focus();
      });
    }
  }

  // ===== Show Content =====
  function showContent(item) {
    contentArea.innerHTML = `
      <article>
        <h2>${item.title}</h2>
        ${item.content}
        ${
          item.refs?.length
            ? `<h4>References</h4><ul>${item.refs
                .map(
                  ref =>
                    `<li><strong>${ref.term}:</strong> ${ref.desc}</li>`
                )
                .join("")}</ul>`
            : ""
        }
      </article>

      <!-- Ask CTA placed immediately after the article -->
      <div class="ask-cta inline">
        <button class="ask-btn" type="button">What are you curious about?</button>
      </div>
    `;

    // Attach click handler to the newly created inline ask button
    const inlineAskBtn = contentArea.querySelector('.ask-cta.inline .ask-btn');
    if (inlineAskBtn) inlineAskBtn.addEventListener('click', openCuriosityModal);

    // Scroll to top so reader starts at beginning
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ===== Default: Load "About Discover" =====
  const defaultItem = DATA.find(i => i.id === "discover-intro");
  if (defaultItem) {
    showContent(defaultItem);
  }
});
