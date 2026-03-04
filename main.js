import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

console.log("Main JS Connected ✅");

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

const heroMain = document.getElementById("heroMain");
const heroSide = document.getElementById("heroSide");
const newsGrid = document.getElementById("newsGrid");

// شريط عاجل
const breakingBar = document.getElementById("breakingBar");
const breakingTextEl = document.getElementById("breakingText");

const q = query(collection(db, "news"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
  const all = [];
  snapshot.forEach((d) => {
    const n = d.data();
    all.push({
      id: d.id,
      title: n.title || "عنوان غير متوفر",
      content: n.content || "",
      imageURL: n.imageURL || null,
      videoURL: n.videoURL || null,
      category: n.category || "",
      placement: n.placement || "normal", // featured / side / normal
      isBreaking: !!n.isBreaking,
      breakingText: n.breakingText || ""
    });
  });

  renderBreaking(all);
  renderHero(all);
  renderGrid(all);
});

function renderBreaking(all) {
  if (!breakingBar || !breakingTextEl) return;

  // نختار أحدث خبر عاجل
  const breaking = all.find(n => n.isBreaking && (n.breakingText || n.title));

  if (!breaking) {
    // ✅ إذا تريدين الشريط يختفي تماماً إذا ماكو عاجل:
    breakingBar.style.display = "none";
    breakingTextEl.textContent = "";

    // ✅ إذا تريدين شريط "ترحيبي" وقت التسليم (اختياري) بدّلي السطرين أعلاه بهذا:
    // breakingBar.style.display = "flex";
    // breakingTextEl.textContent = "مرحباً بكم في وكالة بغداد الإخبارية";

    return;
  }

  breakingBar.style.display = "flex";
  breakingTextEl.textContent = breaking.breakingText || breaking.title;
}

function renderHero(all) {
  if (!heroMain || !heroSide) return;

  const featured = all.find(n => n.placement === "featured") || all[0];

  const side = all.filter(n => n.placement === "side").slice(0, 3);
  const fallbackSide = all.filter(n => n.id !== featured?.id).slice(0, 3);
  const sideToUse = side.length ? side : fallbackSide;

  // Hero Main
  heroMain.innerHTML = "";
  if (featured) {
    const media = featured.videoURL
      ? `<video src="${featured.videoURL}" muted autoplay loop playsinline style="width:100%;height:500px;object-fit:cover;border-radius:5px;"></video>`
      : `<img src="${featured.imageURL || "https://picsum.photos/900/500"}" alt="" style="width:100%;height:500px;object-fit:cover;border-radius:5px;">`;

    heroMain.innerHTML = `
      ${media}
      <div class="overlay">
        <a href="post.html?id=${encodeURIComponent(featured.id)}" style="color:#fff;text-decoration:none;">
          ${featured.title}
        </a>
      </div>
    `;
  }

  // Hero Side
  heroSide.innerHTML = "";
  sideToUse.forEach(n => {
    const div = document.createElement("div");
    div.className = "small-news";
    div.innerHTML = `
      <a href="post.html?id=${encodeURIComponent(n.id)}" style="color:#111;text-decoration:none;">
        ${n.title}
      </a>
    `;
    heroSide.appendChild(div);
  });
}

function renderGrid(all) {
  if (!newsGrid) return;
  newsGrid.innerHTML = "";

  const normal = all.filter(n => n.placement !== "featured" && n.placement !== "side");

  normal.forEach(n => {
    const excerpt = n.content.length > 160 ? n.content.slice(0, 160) + "..." : n.content;

    const card = document.createElement("div");
    card.className = "card";

    const media = n.videoURL
      ? `<video src="${n.videoURL}" controls style="width:100%;height:150px;object-fit:cover;"></video>`
      : `<img src="${n.imageURL || "https://picsum.photos/300/200"}" alt="" style="width:100%;height:150px;object-fit:cover;" />`;

    card.innerHTML = `
      ${media}
      <h3>${n.title}</h3>
      <p>${excerpt}</p>
      <a href="post.html?id=${encodeURIComponent(n.id)}"
         style="display:inline-block;padding:0 15px 15px;color:#741c7f;font-weight:700;text-decoration:none;">
        اقرأ المزيد
      </a>
    `;

    newsGrid.appendChild(card);
  });

  if (!normal.length) {
    newsGrid.innerHTML = `<p style="padding:20px;color:#666;">لا توجد أخبار حالياً.</p>`;
  }
}

// Hamburger
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger?.addEventListener("click", () => navLinks?.classList.toggle("show"));

document.querySelectorAll("#navLinks a").forEach(a => {
  a.addEventListener("click", () => navLinks?.classList.remove("show"));
});
