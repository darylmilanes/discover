function groupByCategory(data) {
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  return grouped;
}

function renderTOC(container, data) {
  container.innerHTML = "";
  const grouped = groupByCategory(data);

  Object.entries(grouped).forEach(([category, items]) => {
    const categoryDiv = document.createElement("div");
    categoryDiv.className = "category";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = category;

    const list = document.createElement("ul");
    list.className = "category-items";

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item.title;
      li.dataset.id = item.id;
      list.appendChild(li);
    });

    categoryDiv.appendChild(title);
    categoryDiv.appendChild(list);
    container.appendChild(categoryDiv);
  });
}

function renderContent(displayElement, item) {
  displayElement.classList.remove("show");
  setTimeout(() => {
    displayElement.innerHTML = `
      <h2>${item.title}</h2>
      <div class="content-body">${item.content}</div>
    `;
    displayElement.classList.add("show");
  }, 100);
}

function filterData(data, query) {
  const q = query.toLowerCase();
  return data.filter(d => d.title.toLowerCase().includes(q));
}
