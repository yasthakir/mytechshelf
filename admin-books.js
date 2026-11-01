const addBookForm = document.getElementById('addBookForm');
const adminMessage = document.getElementById('adminMessage');
const bookInventory = document.getElementById('bookInventory');
const logoutBtn = document.querySelector('.admin-logout');

function ensureSession() {
  const token = localStorage.getItem('coderslab_token');
  if (!token) {
    window.location.href = '/admin';
    return false;
  }
  return true;
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

async function loadInventory() {
  if (!ensureSession()) return;

  const token = localStorage.getItem('coderslab_token');
  const response = await fetch('/api/books', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    localStorage.removeItem('coderslab_token');
    localStorage.removeItem('coderslab_user');
    window.location.href = '/admin';
    return;
  }

  const books = await response.json();

  bookInventory.innerHTML = books.length
    ? books
        .map(
          (book) => `
            <div class="inventory-item">
              <div>
                <div class="inventory-name">${book.title}</div>
                <div class="inventory-meta">${book.category || 'General'} • ${money(book.price)}</div>
              </div>
               <div class="inventory-actions">
                 <button type="button" class="delete-book-btn" data-id="${book.id}">Delete</button>
               </div>
            </div>
          `
        )
        .join('')
    : '<div class="empty-review">No books added yet.</div>';

  document.querySelectorAll('.delete-book-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const confirmed = window.confirm('Delete this book from the catalog?');
      if (!confirmed) return;

      const token = localStorage.getItem('coderslab_token');
      const response = await fetch(`/api/books/${button.dataset.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        adminMessage.textContent = 'Unable to delete this book.';
        adminMessage.style.color = '#fca5a5';
        return;
      }

      adminMessage.textContent = 'Book deleted successfully.';
      adminMessage.style.color = '#f3d7e5';
      await loadInventory();
    });
  });
}

addBookForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminMessage.textContent = 'Adding book...';
  adminMessage.style.color = '#f3d7e5';

  const token = localStorage.getItem('coderslab_token');
  const formData = new FormData(addBookForm);

  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to add this book.');
    }

    adminMessage.textContent = result.message || 'Book added successfully.';
    addBookForm.reset();
    await loadInventory();
  } catch (error) {
    adminMessage.textContent = error.message;
    adminMessage.style.color = '#fca5a5';
  }
});

logoutBtn?.addEventListener('click', () => {
  localStorage.removeItem('coderslab_token');
  localStorage.removeItem('coderslab_user');
  window.location.href = '/admin';
});

loadInventory();
