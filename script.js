const cardsEl = document.getElementById("cards");
const tocListEl = document.getElementById("toc-list");

let favorites = JSON.parse(localStorage.getItem("discover_favorites") || "[]");
let showingAll = false;

// Group by category
function groupByCategory(data) {
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  return grouped;
}

// Render TOC
function renderTOC(data) {
  tocListEl.innerHTML = "";
  const grouped = groupByCategory(data);
  for (const [category, items] of Object.entries(grouped)) {
    const catDiv = document.createElement("div");
    catDiv.className = "toc-category";

    const catHeader = document.createElement("h4");
    catHeader.textContent = category;
    catHeader.onclick = () => itemsList.classList.toggle("open");

    const itemsList = document.createElement("div");
    itemsList.className = "toc-items";
    items.forEach(it => {
      const el = document.createElement("div");
      el.className = "toc-item";
      el.textContent = it.title;
      el.onclick = () => showSingleCard(it.id);
      itemsList.appendChild(el);
    });

    catDiv.appendChild(catHeader);
    catDiv.appendChild(itemsList);
    tocListEl.appendChild(catDiv);
  }
}

// Render cards
function renderCards(items) {
  cardsEl.innerHTML = "";
  items.forEach(it => {
    const card = document.createElement("article");
    card.className = "card";
    card.id = "card-" + it.id;

    const q = document.createElement("div");
    q.className = "q";
    q.innerHTML = `<h2>${it.title}</h2>`;

    const favBtn = document.createElement("button");
    favBtn.className = "icon-btn";
    favBtn.textContent = favorites.includes(it.id) ? "★" : "☆";
    favBtn.onclick = e => {
      e.stopPropagation();
      toggleFavorite(it.id);
      favBtn.textContent = favorites.includes(it.id) ? "★" : "☆";
    };
    q.appendChild(favBtn);

    const a = document.createElement("div");
    a.className = "a";
    a.innerHTML = it.content;

    const refs = document.createElement("div");
    refs.className = "refs";
    it.refs.forEach(r => {
      const ri = document.createElement("div");
      ri.className = "ref-item";
      ri.innerHTML = `<div class="term">${r.term}</div><div>${r.desc}</div>`;
      refs.appendChild(ri);
    });

    card.appendChild(q);
    card.appendChild(a);
    card.appendChild(refs);
    cardsEl.appendChild(card);
  });
}

// Show featured on load
function showFeatured() {
  const featured = DATA.filter(it => it.featured);
  renderCards(featured);
}

// Show a single card
function showSingleCard(id) {
  const item = DATA.find(it => it.id === id);
  if (item) renderCards([item]);
}

// Toggle favorites
function toggleFavorite(id) {
  if (favorites.includes(id)) favorites = favorites.filter(x => x !== id);
  else favorites.push(id);
  localStorage.setItem("discover_favorites", JSON.stringify(favorites));
}

// Show favorites
function showFavorites() {
  const favItems = DATA.filter(x => favorites.includes(x.id));
  renderCards(favItems);
}

// Search functionality
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');

function searchData(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  // score items: favorites get a boost
  const scored = DATA.map(item => {
    let score = 0;
    if (favorites.includes(item.id)) score += 20;
    if (item.title.toLowerCase().includes(q)) score += 10;
    if ((item.content || '').toLowerCase().includes(q)) score += 6;
    if ((item.tags || []).some(t => t.toLowerCase().includes(q))) score += 8;
    if ((item.category || '').toLowerCase().includes(q)) score += 4;
    return { item, score };
  });
  return scored.filter(s => s.score > 0).sort((a,b) => b.score - a.score).map(s => s.item);
}

searchBtn && searchBtn.addEventListener('click', () => {
  const q = searchInput.value;
  const results = searchData(q);
  if (results.length) {
    // update TOC and show results
    renderTOC(results);
    renderCards(results);
  } else {
    // no results, clear cards and show message
    cardsEl.innerHTML = '<div class="card"><div class="q"><h2>No results</h2></div><div class="a">Try different keywords.</div></div>';
  }
});

clearSearchBtn && clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  renderTOC(DATA);
  showFeatured();
});

searchInput && searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchBtn.click();
  }
});

// Initial render
renderTOC(DATA);
showFeatured();

// Hide 'Introduction' category/items when TOC is inside an <aside>
document.addEventListener('DOMContentLoaded', function () {
  const toc = document.querySelector('aside .toc');
  if (!toc) return;

  function hideIntroduction() {
    // hide any .toc-item that carries a data-category or text content indicating Introduction
    toc.querySelectorAll('.toc-item').forEach(el => {
      const dataCat = el.dataset && el.dataset.category ? el.dataset.category : el.getAttribute('data-category');
      const text = (el.textContent || '').trim();
      if (dataCat === 'Introduction' || text === 'Introduction' || /\bIntroduction\b/i.test(text)) {
        el.style.display = 'none';
      }
    });

    // hide any category wrapper whose header text is 'Introduction'
    toc.querySelectorAll('.toc-category').forEach(block => {
      const h = block.querySelector('h4, h3');
      if (h && h.textContent.trim() === 'Introduction') {
        block.style.display = 'none';
      }
    });
  }

  // run once
  hideIntroduction();

  // observe for dynamic changes (in case TOC is built after load)
  const observer = new MutationObserver(hideIntroduction);
  observer.observe(toc, { childList: true, subtree: true });
});

(function() {
  // Delegate clicks on TOC items to set persistent active state
  document.addEventListener('click', function(e) {
    const item = e.target.closest('.toc-item');
    if (!item) return;
    const container = document.getElementById('toc') || document;
    const prev = container.querySelector('.toc-item.active, .toc-item[aria-current="true"]');
    if (prev && prev !== item) {
      prev.classList.remove('active');
      prev.removeAttribute('aria-current');
    }
    item.classList.add('active');
    item.setAttribute('aria-current', 'true');
  });

  // Keyboard activation (Enter / Space) triggers click
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const focused = document.activeElement;
      if (focused && focused.classList && focused.classList.contains('toc-item')) {
        focused.click();
        // prevent page scroll on Space
        if (e.key === ' ') e.preventDefault();
      }
    }
  });

  // On load, if a hash is present, try to mark corresponding TOC item active
  window.addEventListener('load', function() {
    const hash = location.hash;
    if (!hash) return;
    // Match by href, data-target, or data-id attributes commonly used
    const selectorCandidates = [
      `.toc-item[href="${hash}"]`,
      `.toc-item[data-target="${hash}"]`,
      `.toc-item[data-id="${hash.slice(1)}"]`,
      `a.toc-item[href="${hash}"]`,
      `a.toc-item[data-target="${hash}"]`
    ];
    const selector = selectorCandidates.join(',');
    const item = document.querySelector(selector);
    if (item) {
      const container = document.getElementById('toc') || document;
      const prev = container.querySelector('.toc-item.active, .toc-item[aria-current="true"]');
      if (prev && prev !== item) {
        prev.classList.remove('active');
        prev.removeAttribute('aria-current');
      }
      item.classList.add('active');
      item.setAttribute('aria-current', 'true');
    }
  });
})();
