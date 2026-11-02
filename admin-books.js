const API_BASE = (window.MYTECHSHELF_API_URL || '') || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : 'https://mytechshelf-backend.onrender.com');
const apiUrl = (path) => `${API_BASE}${path}`;

const addBookForm = document.getElementById('addBookForm');
const adminMessage = document.getElementById('adminMessage');
const bookInventory = document.getElementById('bookInventory');
const logoutBtn = document.querySelector('.admin-logout');
const bookCategory = document.getElementById('bookCategory');
const bookStd = document.getElementById('bookStd');
const bookSubject = document.getElementById('bookSubject');

function toggleSchoolBookFields() {
  const category = bookCategory?.value || 'Programming Books';
  const isSchoolStyle = category === 'School Notes' || category === 'Competitive Exam Notes';
  if (bookStd) bookStd.required = isSchoolStyle;
  if (bookSubject) bookSubject.required = isSchoolStyle;
  const fields = document.querySelectorAll('.school-book-field');
  fields.forEach((field) => {
    field.style.display = isSchoolStyle ? 'block' : 'none';
  });
}

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
  const response = await fetch(apiUrl('/api/books'), {
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
      const response = await fetch(apiUrl(`/api/books/${button.dataset.id}`), {
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

bookCategory?.addEventListener('change', toggleSchoolBookFields);
toggleSchoolBookFields();

addBookForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminMessage.textContent = 'Adding book...';
  adminMessage.style.color = '#f3d7e5';

  const token = localStorage.getItem('coderslab_token');
  const formData = new FormData(addBookForm);

  const category = String(formData.get('category') || '').trim();
  if ((category === 'School Notes' || category === 'Competitive Exam Notes') && (!formData.get('std') || !formData.get('subject'))) {
    adminMessage.textContent = 'Please select the class and subject for this notes category.';
    adminMessage.style.color = '#fca5a5';
    return;
  }

  try {
    const response = await fetch(apiUrl('/api/books'), {
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
