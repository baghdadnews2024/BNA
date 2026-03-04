import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnNZL7aqmrru2kXFUx5DysxG4lt3ACYUM",
  authDomain: "baghdad-news-agency-4b2e8.firebaseapp.com",
  projectId: "baghdad-news-agency-4b2e8",
  storageBucket: "baghdad-news-agency-4b2e8.appspot.com",
  messagingSenderId: "594564766455",
  appId: "1:594564766455:web:9c9a1c2a28241b5c6e11f2",
  measurementId: "G-LD8BW6J0GD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("cat") || "كل الأقسام";

const titleEl = document.getElementById("categoryTitle");
if (titleEl) titleEl.textContent = selectedCategory === "كل الأقسام" ? "آخر الأخبار" : selectedCategory;

const newsGrid = document.getElementById("newsGrid");
if (!newsGrid) throw new Error("newsGrid element not found!");

let allNews = [];
const q = query(collection(db, "news"), orderBy("timestamp", "desc"));

onSnapshot(q, snapshot => {
  allNews = [];
  snapshot.forEach(d => {
    const n = d.data();
    allNews.push({
      id: d.id,
      title: n.title || "عنوان غير متوفر",
      content: n.content || "محتوى غير متوفر",
      imageURL: n.imageURL || null,
      videoURL: n.videoURL || null,
      category: n.category || "منوعة"
    });
  });

  render();
});

function render() {
  newsGrid.innerHTML = "";

  const filtered = allNews.filter(n =>
    selectedCategory === "كل الأقسام" || n.category === selectedCategory
  );

  if (filtered.length === 0) {
    newsGrid.innerHTML = `<p style="padding:20px;color:#666;">لا توجد أخبار في هذا القسم حالياً.</p>`;
    return;
  }

  filtered.forEach(news => {
    const card = document.createElement("div");
    card.className = "card";

    const mediaHTML = news.videoURL
      ? `<video src="${news.videoURL}" controls style="width:100%;height:150px;object-fit:cover;"></video>`
      : `<img src="${news.imageURL || 'https://picsum.photos/300/200'}" alt="">`;

    card.innerHTML = `
      ${mediaHTML}
      <h3>${news.title}</h3>
      <p>${news.content}</p>
    `;

    newsGrid.appendChild(card);
  });
}

// Hamburger
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
hamburger?.addEventListener("click", () => navLinks?.classList.toggle("show"));