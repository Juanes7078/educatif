import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-storage.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCE5mysXNsXeQ6cRmzxMblgLEgrMaVqrEs",
  authDomain: "educatif-31d29.firebaseapp.com",
  projectId: "educatif-31d29",
  storageBucket: "educatif-31d29.appspot.com",
  messagingSenderId: "584653902860",
  appId: "1:584653902860:web:1fcfc54d3d68904be8ca29",
  measurementId: "G-1FZ39SR288"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage();
const db = getFirestore();
const postsCollection = collection(db, 'posts');

// Función para cargar y mostrar los posts en tiempo real
export function loadPosts() {
  const feed = document.getElementById('feed');
  if (!feed) return;
  feed.innerHTML = '';

  onSnapshot(postsCollection, (snapshot) => {
    feed.innerHTML = '';
    
    snapshot.docs.forEach(doc => {
      const post = doc.data();
      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.style.background = 'var(--card-color)';
      postElement.style.borderRadius = '0.75rem';
      postElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      postElement.style.padding = '1rem';
      postElement.style.marginBottom = '1rem';
      postElement.style.display = 'flex';
      postElement.style.flexDirection = 'column';
      postElement.style.gap = '0.5rem';

      let mediaHtml = '';
      if (post.imageUrl) {
        mediaHtml = `<img src="${post.imageUrl}" alt="Imagen del post" style="max-width:100%;border-radius:0.5rem;">`;
      }

      const username = post.username || 'Usuario';

      postElement.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <img src="assets/default-profile.jpg" alt="Perfil" style="width:48px;height:48px;border-radius:50%;object-fit:cover; border: 2px solid var(--primary-color);">
          <span style="font-weight:bold; color: var(--primary-color);">${username}</span>
        </div>
        <p style="color: var(--text-color); font-size: 1rem; margin: 0;">${post.text || ''}</p>
        ${mediaHtml}
        <div style="color: var(--muted-text); font-size: 0.85rem;">${post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : ''}</div>
      `;

      feed.appendChild(postElement);
    });
  });
}


