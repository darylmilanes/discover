document.addEventListener("DOMContentLoaded", () => {
  const tocContainer = document.getElementById("toc-list");
  const contentDisplay = document.getElementById("content-display");
  const searchInput = document.getElementById("search");

  // Render initial TOC
  renderTOC(tocContainer, DATA);

  // Handle collapsible categories
  tocContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("category-title")) {
      const category = e.target.parentElement;
      document.querySelectorAll(".category").forEach(cat => {
        if (cat !== category) cat.classList.remove("open");
      });
      category.classList.toggle("open");
    }

    if (e.target.tagName === "LI") {
      const selectedId = e.target.dataset.id;
      const selectedItem = DATA.find(d => d.id === selectedId);

      // Highlight active item
      document.querySelectorAll(".category-items li").forEach(li => li.classList.remove("active"));
      e.target.classList.add("active");

      // Render content
      renderContent(contentDisplay, selectedItem);

      // Scroll top
      document.querySelector(".content").scrollTo({ top: 0, behavior: "smooth" });

      // Update hash
      window.location.hash = selectedId;
    }
  });

  // Handle search
  searchInput.addEventListener("input", (e) => {
    const filtered = filterData(DATA, e.target.value);
    renderTOC(tocContainer, filtered);
  });

  // Load from hash
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const initialItem = DATA.find(d => d.id === hash);
    if (initialItem) renderContent(contentDisplay, initialItem);
  }
});
