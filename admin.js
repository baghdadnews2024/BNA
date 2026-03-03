import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

console.log("Admin JS Connected ✅");

/* ================= Firebase Config ================= */
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
const auth = getAuth(app);

/* ================= DOM ================= */
const loginDiv = document.getElementById("loginDiv");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

const newsForm = document.getElementById("newsForm");
const newsTitle = document.getElementById("newsTitle");
const newsContent = document.getElementById("newsContent");
const newsCategory = document.getElementById("newsCategory");

const newsImage = document.getElementById("newsImage");
const imagePreview = document.getElementById("imagePreview");

const postsList = document.getElementById("postsList");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");

/* ================= Helpers ================= */
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }

function safePreview(imgEl, file) {
  if (!imgEl || !file) return;
  imgEl.src = URL.createObjectURL(file);
  show(imgEl);
}

let editingId = null;
let editingImageURL = null;

function resetForm() {
  newsForm.reset();
  hide(imagePreview);
  editingId = null;
  editingImageURL = null;
  formTitle.textContent = "إضافة خبر";
  submitBtn.textContent = "نشر الخبر";
}

/* ================= Login ================= */
loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (err) {
    console.error(err);
    loginError.textContent = `خطأ: ${err.code || "فشل تسجيل الدخول"}`;
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, user => {
  if (user) {
    hide(loginDiv);
    show(dashboard);
  } else {
    show(loginDiv);
    hide(dashboard);
  }
});

/* ================= Preview ================= */
newsImage?.addEventListener("change", () => {
  const file = newsImage.files?.[0];
  if (file) safePreview(imagePreview, file);
});

/* ================= Upload to ImageKit via Netlify Function ================= */
async function uploadImageToImageKit(file) {
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]); // base64 فقط
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const resp = await fetch("/.netlify/functions/imagekit-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileBase64: base64,
      fileName: file.name
    })
  });

  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json(); // { url }
}

/* ================= CRUD ================= */
newsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = newsTitle.value.trim();
  const content = newsContent.value.trim();
  const category = newsCategory.value;

  if (!title || !content) {
    alert("املئي الحقول المطلوبة");
    return;
  }

  submitBtn.disabled = true;

  try {
    // إذا تعديل: احتفظي بالرابط القديم ما لم ترفعين صورة جديدة
    let imageURL = editingId ? (editingImageURL || null) : null;

    const file = newsImage?.files?.[0];
    if (file) {
      const up = await uploadImageToImageKit(file);
      imageURL = up.url;
    }

    const payload = {
      title,
      content,
      category,
      imageURL,
      timestamp: serverTimestamp()
    };

    if (!editingId) {
      await addDoc(collection(db, "news"), payload);
    } else {
      await updateDoc(doc(db, "news", editingId), payload);
    }

    resetForm();
    alert("تم الحفظ بنجاح ✅");
  } catch (err) {
    console.error(err);
    alert(`حدث خطأ ❌\n${err.message || err}`);
  }

  submitBtn.disabled = false;
});

/* ================= Show Posts ================= */
const q = query(collection(db, "news"), orderBy("timestamp", "desc"));

onSnapshot(q, snapshot => {
  postsList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "post-item";

    const img = document.createElement("img");
    img.src = data.imageURL || "https://picsum.photos/300/200";
    img.alt = data.title || "";

    const contentDiv = document.createElement("div");
    contentDiv.className = "post-content";
    contentDiv.innerHTML = `
      <h4>${data.title || ""}</h4>
      <small>${data.category || ""}</small>
    `;

    const actions = document.createElement("div");
    actions.className = "post-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "تعديل";
    editBtn.onclick = () => {
      editingId = docSnap.id;
      editingImageURL = data.imageURL || null;

      newsTitle.value = data.title || "";
      newsContent.value = data.content || "";
      newsCategory.value = data.category || "";

      formTitle.textContent = "تعديل خبر";
      submitBtn.textContent = "حفظ التعديل";

      if (editingImageURL) {
        imagePreview.src = editingImageURL;
        show(imagePreview);
      } else {
        hide(imagePreview);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "حذف";
    deleteBtn.classList.add("danger");
    deleteBtn.onclick = async () => {
      if (confirm("هل أنت متأكد من الحذف؟")) {
        await deleteDoc(doc(db, "news", docSnap.id));
      }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    div.appendChild(img);
    div.appendChild(contentDiv);
    div.appendChild(actions);

    postsList.appendChild(div);
  });
});
