// --- AUTH & PERFIL ---
function loadUserData() {
  const username = localStorage.getItem('username') || 'Usuario';
  const profilePic = localStorage.getItem('profilePic') || 'assets/default-profile.jpg';
  if (document.getElementById('username')) {
    document.getElementById('username').textContent = username;
    document.getElementById('userHandle').textContent = `@${username.toLowerCase().replace(/\s+/g, '')}`;
  }
  if (document.getElementById('profilePic')) {
    document.getElementById('profilePic').src = profilePic;
  }
  if (document.getElementById('miniProfilePic')) {
    document.getElementById('miniProfilePic').src = profilePic;
  }
}

function setupProfileModals() {
  // Username modal
  const editUsernameBtn = document.getElementById('editUsernameBtn');
  const usernameModal = document.getElementById('usernameModal');
  if (editUsernameBtn && usernameModal) {
    editUsernameBtn.addEventListener('click', () => {
      usernameModal.style.display = 'flex';
      document.getElementById('newUsername').value = localStorage.getItem('username') || '';
    });
    document.getElementById('closeUsernameModal').addEventListener('click', () => {
      usernameModal.style.display = 'none';
    });
    document.getElementById('saveUsernameBtn').addEventListener('click', () => {
      const newUsername = document.getElementById('newUsername').value.trim();
      if (newUsername) {
        localStorage.setItem('username', newUsername);
        loadUserData();
        usernameModal.style.display = 'none';
      }
    });
  }
  // Profile pic modal
  const editProfilePicBtn = document.getElementById('editProfilePicBtn');
  const profilePicModal = document.getElementById('profilePicModal');
  if (editProfilePicBtn && profilePicModal) {
    editProfilePicBtn.addEventListener('click', () => {
      profilePicModal.style.display = 'flex';
    });
    document.getElementById('closeProfilePicModal').addEventListener('click', () => {
      profilePicModal.style.display = 'none';
    });
    document.getElementById('saveProfilePicBtn').addEventListener('click', () => {
      const file = document.getElementById('newProfilePicInput').files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          localStorage.setItem('profilePic', e.target.result);
          loadUserData();
        };
        reader.readAsDataURL(file);
      }
      profilePicModal.style.display = 'none';
    });
  }
}

// --- FIREBASE FEED ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-storage.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE5mysXNsXeQ6cRmzxMblgLEgrMaVqrEs",
  authDomain: "educatif-31d29.firebaseapp.com",
  projectId: "educatif-31d29",
  storageBucket: "educatif-31d29.appspot.com",
  messagingSenderId: "584653902860",
  appId: "1:584653902860:web:1fcfc54d3d68904be8ca29",
  measurementId: "G-1FZ39SR288"
};
const app = initializeApp(firebaseConfig);
const storage = getStorage();
const db = getFirestore();
const postsCollection = collection(db, 'posts');

// --- FEED FIREBASE ---
async function submitPost() {
  const text = document.getElementById('postText').value.trim();
  const mediaInput = document.getElementById('mediaInput');
  const media = mediaInput.files[0];
  if (!text && !media) return;
  const username = localStorage.getItem('username') || 'Usuario';
  const handle = '@' + username.toLowerCase().replace(/\s+/g, '');
  const profilePic = localStorage.getItem('profilePic') || 'assets/default-profile.jpg';
  const date = new Date().toISOString();
  let mediaUrl = null;
  let mediaType = null;
  if (media) {
    const ext = media.name.split('.').pop();
    const fileRef = storageRef(storage, `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
    await uploadBytes(fileRef, media);
    mediaUrl = await getDownloadURL(fileRef);
    mediaType = media.type;
  }
  await addDoc(postsCollection, {
    text,
    media: mediaUrl,
    type: mediaType,
    username,
    handle,
    profilePic,
    date
  });
  document.getElementById('postText').value = '';
  mediaInput.value = '';
}

function mostrarPost(post, postId, currentUser) {
  const feed = document.getElementById('feed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = 'post';
  let mediaHtml = '';
  if (post.media && post.type) {
    if (post.type.startsWith('image/')) {
      mediaHtml = `<img class='post-media' src="${post.media}" alt="Imagen">`;
    } else if (post.type.startsWith('video/')) {
      mediaHtml = `<video class='post-media' controls><source src="${post.media}"></video>`;
    }
  }
  let deleteBtn = '';
  if (currentUser && post.username === currentUser) {
    deleteBtn = `<button class="btn-danger" style="float:right;margin-left:8px;font-size:0.9rem;" data-postid="${postId}" data-media="${post.media || ''}">Eliminar</button>`;
  }
  div.innerHTML = `
    <img class="post-avatar" src="${post.profilePic}" alt="avatar">
    <div class="post-content">
      <div class="post-header">
        <span class="post-username">${post.username}</span>
        <span class="post-handle">${post.handle}</span>
        <span class="post-date">· ${new Date(post.date).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
        ${deleteBtn}
      </div>
      <div class="post-text">${post.text}</div>
      ${mediaHtml}
    </div>
  `;
  // Evento eliminar
  if (deleteBtn) {
    div.querySelector('.btn-danger').onclick = async function() {
      if (confirm('¿Eliminar esta publicación?')) {
        await eliminarPost(postId, post.media);
      }
    };
  }
  feed.appendChild(div);
}

async function eliminarPost(postId, mediaUrl) {
  // Eliminar de Firestore
  const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js');
  await deleteDoc(doc(db, 'posts', postId));
  // Eliminar media de Storage si existe
  if (mediaUrl) {
    try {
      const { ref: storageRef, deleteObject } = await import('https://www.gstatic.com/firebasejs/11.9.0/firebase-storage.js');
      const httpsReference = storageRef(storage, mediaUrl);
      await deleteObject(httpsReference);
    } catch (e) {
      // Puede fallar si la URL no es válida o ya fue eliminada
    }
  }
}

function cargarPostsRealtime() {
  const feed = document.getElementById('feed');
  if (!feed) return;
  feed.innerHTML = '';
  const q = query(postsCollection, orderBy('date', 'desc'));
  const currentUser = localStorage.getItem('username') || 'Usuario';
  onSnapshot(q, (snapshot) => {
    feed.innerHTML = '';
    snapshot.forEach(docSnap => mostrarPost(docSnap.data(), docSnap.id, currentUser));
  });
}

// --- SIDEBAR & MODALES ---
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('sidebar-open');
      // El CSS se encarga del desplazamiento de main-content
    });
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
        sidebar.classList.remove('sidebar-open');
        // El CSS se encarga del desplazamiento de main-content
      }
    });
  }
}

function setupCloseModalsOnClick() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// --- DARK MODE ---
function setDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', '1');
    const btn = document.getElementById('darkModeToggle');
    if (btn) btn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', '0');
    const btn = document.getElementById('darkModeToggle');
    if (btn) btn.textContent = '🌙';
  }
}

function setupDarkModeToggle() {
  const btn = document.getElementById('darkModeToggle');
  if (!btn) return;
  // Inicializa icono según modo
  setDarkMode(localStorage.getItem('darkMode') === '1');
  btn.onclick = () => {
    const isDark = document.body.classList.contains('dark-mode');
    setDarkMode(!isDark);
  };
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  setupProfileModals();

  // Solo cargar el feed y el botón de publicar si existen en la página
  if (document.getElementById('feed')) {
    cargarPostsRealtime();
    const submitBtn = document.getElementById('submitPost');
    if (submitBtn) submitBtn.onclick = submitPost;
  }

  setupSidebar();
  setupCloseModalsOnClick();
  setupDarkModeToggle();
});

// El dark mode ya está implementado correctamente
