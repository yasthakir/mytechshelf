const booksGrid = document.getElementById('booksGrid');
const categoryTitle = document.getElementById('categoryTitle');
const stdFilter = document.getElementById('stdFilter');
const subjectFilter = document.getElementById('subjectFilter');
const schoolFilters = document.getElementById('schoolFilters');

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    return [];
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = String(getCart().length);
}

function getFavorites() {
  try {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) return JSON.parse(storedFavorites);
    const legacySaved = localStorage.getItem('savedBooks');
    return legacySaved ? JSON.parse(legacySaved) : [];
  } catch (error) {
    return [];
  }
}

function setFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
  localStorage.setItem('savedBooks', JSON.stringify(favorites));
}

function setFavoriteCount() {
  const favoriteCount = document.getElementById('favoriteCount');
  if (favoriteCount) favoriteCount.textContent = String(getFavorites().length);
}

function addToCart(book) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === book.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({ id: book.id, title: book.title, price: Number(book.price || 0), quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function toggleFavorite(book) {
  const favorites = getFavorites();
  const exists = favorites.find((item) => item.id === book.id);

  if (exists) {
    setFavorites(favorites.filter((item) => item.id !== book.id));
  } else {
    setFavorites([...favorites, {
      id: book.id,
      title: book.title,
      price: Number(book.price || 0),
      image: book.image || '',
      category: book.category || 'General',
      description: book.description || ''
    }]);
  }

  setFavoriteCount();
}

function renderStars(rating = 0) {
  const stars = Array.from({ length: 5 }, (_, idx) => `<span class="star ${idx < Math.round(rating) ? 'filled' : ''}">★</span>`).join('');
  return `<span class="star-row" aria-label="${rating} out of 5 stars">${stars}</span>`;
}

function applyCategoryFilters(books, category) {
  const selectedStd = stdFilter?.value || '';
  const selectedSubject = subjectFilter?.value || '';

  return books.filter((book) => {
    if (category !== 'School Notes' && category !== 'Competitive Exam Notes') {
      return true;
    }

    const matchesStd = !selectedStd || String(book.std || '').trim() === selectedStd;
    const matchesSubject = !selectedSubject || String(book.subject || '').trim().toLowerCase() === selectedSubject.toLowerCase();
    return matchesStd && matchesSubject;
  });
}

async function loadCategoryBooks() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || 'Programming Books';
  const shouldShowFilters = category === 'School Notes' || category === 'Competitive Exam Notes';
  categoryTitle.textContent = category;
  if (schoolFilters) schoolFilters.style.display = shouldShowFilters ? 'flex' : 'none';

  const response = await fetch(`/api/books?category=${encodeURIComponent(category)}`);
  const books = await response.json();
  const filteredBooks = applyCategoryFilters(books, category);

  booksGrid.innerHTML = filteredBooks.length
    ? filteredBooks
        .map((book) => {
          const isFavorite = getFavorites().some((item) => item.id === book.id);
          const metadata = shouldShowFilters ? `<div class="book-meta-pill">Class ${book.std || 'N/A'}</div><div class="book-meta-pill">${book.subject || 'General'}</div>` : '';
          return `
            <article class="book-card" data-book-id="${book.id}" tabindex="0" aria-label="Open ${book.title}">
              <button class="favorite-toggle ${isFavorite ? 'active' : ''}" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}" data-image="${book.image || ''}" data-category="${book.category || 'General'}" data-description="${book.description || ''}" aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">${isFavorite ? '♥' : '♡'}</button>
              <img src="${book.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'}" alt="${book.title}" />
              <div class="book-content">
                <div class="book-topline">
                  <span class="category-tag">${book.category || 'General'}</span>
                  <span class="book-badge">${book.featured ? 'Featured' : 'Popular'}</span>
                </div>
                <h3>${book.title}</h3>
                <div class="author-line">By ${book.author}</div>
                <div class="meta-row">
                  ${renderStars(book.rating || 4.8)}
                  <span class="rating-copy">${Number(book.rating || 4.8).toFixed(1)}</span>
                </div>
                ${shouldShowFilters ? `<div class="meta-row small-meta-row">${metadata}</div>` : ''}
                <p>${book.description}</p>
                <div class="book-footer">
                  <strong>${money(book.price)}</strong>
                  <button class="btn btn-primary add-cart-btn" data-id="${book.id}" data-title="${book.title}" data-price="${book.price}">Add to Cart</button>
                </div>
              </div>
            </article>
          `;
        })
        .join('')
    : '<div class="empty-state">No books available in this category yet.</div>';

  booksGrid.querySelectorAll('.book-card').forEach((card) => {
    const openBook = () => {
      const bookId = card.dataset.bookId;
      if (bookId) {
        window.location.href = `/book.html?id=${encodeURIComponent(bookId)}`;
      }
    };

    card.addEventListener('click', (event) => {
      if (event.target.closest('.add-cart-btn')) return;
      openBook();
    });
  });

  booksGrid.querySelectorAll('.add-cart-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      addToCart({ id: button.dataset.id, title: button.dataset.title, price: Number(button.dataset.price || 0) });
      button.textContent = 'Added ✓';
      setTimeout(() => {
        button.textContent = 'Add to Cart';
      }, 900);
    });
  });

  booksGrid.querySelectorAll('.favorite-toggle').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const book = {
        id: button.dataset.id,
        title: button.dataset.title,
        price: Number(button.dataset.price || 0),
        image: button.dataset.image || '',
        category: button.dataset.category || 'General',
        description: button.dataset.description || ''
      };
      toggleFavorite(book);
      const active = getFavorites().some((item) => item.id === book.id);
      button.textContent = active ? '♥' : '♡';
      button.classList.toggle('active', active);
      button.setAttribute('aria-label', active ? 'Remove from favorites' : 'Add to favorites');
    });
  });

  updateCartBadge();
  setFavoriteCount();
}

stdFilter?.addEventListener('change', loadCategoryBooks);
subjectFilter?.addEventListener('change', loadCategoryBooks);

updateCartBadge();
setFavoriteCount();
loadCategoryBooks();
