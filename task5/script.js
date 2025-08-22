// Elements
const postForm = document.getElementById('postForm');
const postsContainer = document.getElementById('posts');
const searchInput = document.getElementById('searchInput');
const titleInput = document.getElementById('titleInput');
const contentInput = document.getElementById('contentInput');

// Load posts from localStorage
let blogPosts = JSON.parse(localStorage.getItem('blogPosts')) || [];

// Render posts to DOM with optional filtering via search
function renderPosts(filter = '') {
  postsContainer.innerHTML = '';
  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(filter.toLowerCase()) ||
    post.content.toLowerCase().includes(filter.toLowerCase())
  );

  if (filteredPosts.length === 0) {
    postsContainer.textContent = 'No posts found.';
    return;
  }

  filteredPosts.forEach((post, index) => {
    postsContainer.appendChild(createPostElement(post, index));
  });
}

// Create post DOM element
function createPostElement(post, index) {
  const postEl = document.createElement('article');
  postEl.classList.add('post');
  postEl.setAttribute('data-index', index);

  const dateObj = new Date(post.date);
  const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  // Post content display
  const contentDisplay = document.createElement('p');
  contentDisplay.textContent = post.content;

  const titleDisplay = document.createElement('h2');
  titleDisplay.textContent = post.title;

  const dateEl = document.createElement('small');
  dateEl.textContent = `Published on ${formattedDate}`;

  // Buttons container for edit and delete
  const buttonsDiv = document.createElement('div');
  buttonsDiv.classList.add('post-buttons');

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('aria-label', 'Edit post');
  editBtn.addEventListener('click', () => editPost(index));

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete post');
  deleteBtn.addEventListener('click', () => deletePost(index));

  buttonsDiv.appendChild(editBtn);
  buttonsDiv.appendChild(deleteBtn);

  // Likes and comments container
  const likesCommentsDiv = document.createElement('div');
  likesCommentsDiv.classList.add('likes-comments');

  // Like button and count
  const likeBtn = document.createElement('button');
  likeBtn.textContent = `Like (${post.likes.length})`;
  likeBtn.setAttribute('aria-pressed', 'false');
  likeBtn.setAttribute('aria-label', 'Like this post');
  if (post.likes.includes('me')) {
    likeBtn.classList.add('liked');
    likeBtn.setAttribute('aria-pressed', 'true');
  }
  likeBtn.addEventListener('click', () => toggleLike(index, likeBtn));

  likesCommentsDiv.appendChild(likeBtn);

  // Comments container
  const commentsSection = document.createElement('section');
  commentsSection.classList.add('comments-section');
  commentsSection.setAttribute('aria-label', 'Comments section');

  // Render existing comments
  post.comments.forEach(comment => {
    const commentEl = document.createElement('div');
    commentEl.classList.add('comment');
    commentEl.innerHTML = `<strong>${escapeHTML(comment.author)}</strong>: ${escapeHTML(comment.text)}`;
    commentsSection.appendChild(commentEl);
  });

  // Comment submission form
  const commentForm = document.createElement('form');
  commentForm.classList.add('comment-form');
  commentForm.setAttribute('aria-label', 'Add a comment');

  const commentInput = document.createElement('input');
  commentInput.type = 'text';
  commentInput.placeholder = 'Leave a comment...';
  commentInput.setAttribute('aria-label', 'Comment text');
  commentInput.required = true;

  const commentSubmit = document.createElement('input');
  commentSubmit.type = 'button';
  commentSubmit.value = 'Comment';

  commentSubmit.addEventListener('click', () => {
    if (!commentInput.value.trim()) return;
    addComment(index, 'Anonymous', commentInput.value.trim());
    commentInput.value = '';
  });

  commentForm.appendChild(commentInput);
  commentForm.appendChild(commentSubmit);

  // Append all elements to post container
  postEl.appendChild(titleDisplay);
  postEl.appendChild(dateEl);
  postEl.appendChild(buttonsDiv);
  postEl.appendChild(contentDisplay);
  postEl.appendChild(likesCommentsDiv);
  postEl.appendChild(commentsSection);
  postEl.appendChild(commentForm);

  return postEl;
}

// Escape HTML to prevent injection attacks
function escapeHTML(str) {
  return str.replace(/[&<>"'`=\/]/g, function(s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;',
      '=': '&#61;',
      '/': '&#47;'
    })[s];
  });
}

// Add a new post
postForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) return;

  const newPost = {
    title,
    content,
    date: new Date().toISOString(),
    likes: [],
    comments: []
  };

  blogPosts.unshift(newPost);
  saveAndRender();

  postForm.reset();
});

// Delete post
function deletePost(index) {
  if (confirm('Are you sure you want to delete this post?')) {
    blogPosts.splice(index, 1);
    saveAndRender();
  }
}

// Edit post
function editPost(index) {
  const postEl = postsContainer.querySelector(`.post[data-index="${index}"]`);
  if (!postEl) return;

  const post = blogPosts[index];

  // Replace title and content text with inputs for editing
  postEl.innerHTML = '';

  const titleInputEdit = document.createElement('input');
  titleInputEdit.type = 'text';
  titleInputEdit.value = post.title;
  titleInputEdit.classList.add('edit-textarea');

  const contentTextareaEdit = document.createElement('textarea');
  contentTextareaEdit.classList.add('edit-textarea');
  contentTextareaEdit.value = post.content;
  contentTextareaEdit.rows = 6;

  // Save & Cancel buttons
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const newTitle = titleInputEdit.value.trim();
    const newContent = contentTextareaEdit.value.trim();
    if (!newTitle || !newContent) {
      alert('Title and content cannot be empty.');
      return;
    }
    blogPosts[index].title = newTitle;
    blogPosts[index].content = newContent;
    saveAndRender();
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.style.backgroundColor = '#6c757d';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', saveAndRender);

  postEl.appendChild(titleInputEdit);
  postEl.appendChild(contentTextareaEdit);
  postEl.appendChild(saveBtn);
  postEl.appendChild(cancelBtn);
}

// Toggle like/unlike
function toggleLike(index, likeBtn) {
  const post = blogPosts[index];
  const userId = 'me';

  const likedIndex = post.likes.indexOf(userId);
  if (likedIndex > -1) {
    post.likes.splice(likedIndex, 1);
    likeBtn.classList.remove('liked');
    likeBtn.setAttribute('aria-pressed', 'false');
  } else {
    post.likes.push(userId);
    likeBtn.classList.add('liked');
    likeBtn.setAttribute('aria-pressed', 'true');
  }

  likeBtn.textContent = `Like (${post.likes.length})`;
  savePostsToStorage();
}

// Add comment
function addComment(postIndex, author, text) {
  blogPosts[postIndex].comments.push({ author, text });
  saveAndRender();
}

// Save posts to localStorage and re-render
function saveAndRender() {
  savePostsToStorage();
  renderPosts(searchInput.value);
}

function savePostsToStorage() {
  localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
}

// Search input event
searchInput.addEventListener('input', () => {
  renderPosts(searchInput.value);
});

// Initial render
renderPosts();
