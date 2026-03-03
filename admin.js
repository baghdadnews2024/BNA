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
  serverTimestamp,
  getDocs,
  where
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

const isBreaking = document.getElementById("isBreaking");
const breakingBox = document.getElementById("breakingBox");
const breakingText = document.getElementById("breakingText");

const postsList = document.getElementById("postsList");
const submitBtn = document.getElementById("submitBtn");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

/* ================= Helpers ================= */
function show(el) { if (el) el.style.display = "block"; }
function hide(el) { if (el) el.style.display = "none"; }

function safePreview(imgEl, file) {
  if (!imgEl || !file) return;
  imgEl.src = URL.createObjectURL(file);
  show(imgEl);
}

function getDisplayValue() {
  const r = document.querySelector('input[name="display"]:checked');
  return r ? r.value : "normal";
}

function setDisplayValue(value) {
  const r = document.querySelector(`input[name="display"][value="${value}"]`);
  if (r) r.checked = true;
}

function badgeHTML({ display, isBreaking }) {
  const badges = [];

  if (display === "featured") badges.push(`<span class="badge featured">رئيسي</span>`);
  if (display === "side") badges.push(`<span class="badge side">جانبي</span>`);
  if (isBreaking) badges.push(`<span class="badge breaking">عاجل</span>`);

  return badges.length ? `<div class="badges">${badges.join("")}</div>` : "";
}

let editingId = null;
let editingImageURL = null;

/* ================= Reset ================= */
function resetForm() {
  newsForm.reset();
  hide(imagePreview);

  hide(breakingBox);
  if (breakingText) breakingText.value = "";

  editingId = null;
  editingImageURL = null;

  formTitle.textContent = "إضافة خبر";
  submitBtn.textContent = "نشر الخبر";
  hide(cancelEditBtn);

  // Default
  setDisplayValue("normal");
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

/* ================= UI (Breaking toggle) ================= */
isBreaking?.addEventListener("change", () => {
  if (isBreaking.checked) {
    show(breakingBox);
    // اقتراح تلقائي إذا النص فارغ
    if (breakingText && !breakingText.value.trim()) {
      breakingText.value = newsTitle?.value?.trim() ? `عاجل | ${newsTitle.value.trim()}` : "عاجل | ";
    }
  } else {
    hide(breakingBox);
    if (breakingText) breakingText.value = "";
  }
});

/* ================= Preview Image ================= */
newsImage?.addEventListener("change", () => {
  const file = newsImage.files?.[0];
  if (file) safePreview(imagePreview, file);
});

/* ================= Upload to ImageKit via Netlify Function ================= */
async function uploadImageToImageKit(file) {
  const base64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const resp = await fetch("/.netlify/functions/imagekit-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64: base64, fileName: file.name })
  });

  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json(); // { url }
}

/* ================= Featured single enforcement ================= */
async function unsetOldFeatured(exceptId = null) {
  const featuredQ = query(collection(db, "news"), where("display", "==", "featured"));
  const snap = await getDocs(featuredQ);

  const tasks = [];
  snap.forEach(d => {
    if (exceptId && d.id === exceptId) return;
    tasks.push(updateDoc(doc(db, "news", d.id), { display: "normal" }));
  });

  if (tasks.length) await Promise.all(tasks);
}

/* ================= CRUD ================= */
newsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = newsTitle.value.trim();
  const content = newsContent.value.trim();
  const category = newsCategory.value;

  const display = getDisplayValue(); // featured | side | normal
  const breaking = !!isBreaking?.checked;
  const breakingTxt = breaking ? (breakingText?.value?.trim() || `عاجل | ${title}`) : "";

  if (!title || !content) {
    alert("املئي الحقول المطلوبة");
    return;
  }

  submitBtn.disabled = true;

  try {
    // الصورة
    let imageURL = editingId ? (editingImageURL || null) : null;
    const file = newsImage?.files?.[0];
    if (file) {
      const up = await uploadImageToImageKit(file);
      imageURL = up.url;
    }

    // إذا هذا الخبر رئيسي: لازم نلغي الرئيسي القديم
    if (display === "featured") {
      await unsetOldFeatured(editingId);
    }

    const payload = {
      title,
      content,
      category,
      imageURL,
      display,                 // ✅ جديد
      isBreaking: breaking,    // ✅ جديد
      breakingText: breakingTxt, // ✅ جديد
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

cancelEditBtn?.addEventListener("click", () => resetForm());

/* ================= Show Posts ================= */
const q = query(collection(db, "news"), orderBy("timestamp", "desc"));

onSnapshot(q, snapshot => {
  postsList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const div = document.createElement("div");
    div.className = "post-item";

    const thumb = document.createElement("div");
    thumb.className = "post-thumb";
    thumb.innerHTML = `<img src="${data.imageURL || "https://picsum.photos/300/200"}" alt="">`;

    const info = document.createElement("div");
    info.className = "post-info";
    info.innerHTML = `
      ${badgeHTML({ display: data.display, isBreaking: data.isBreaking })}
      <h4>${data.title || ""}</h4>
      <div class="meta">${data.category || ""}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "post-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn small secondary";
    editBtn.textContent = "تعديل";
    editBtn.onclick = () => {
      editingId = docSnap.id;
      editingImageURL = data.imageURL || null;

      newsTitle.value = data.title || "";
      newsContent.value = data.content || "";
      newsCategory.value = data.category || "المحلية";

      setDisplayValue(data.display || "normal");

      if (data.isBreaking) {
        isBreaking.checked = true;
        show(breakingBox);
        breakingText.value = data.breakingText || "";
      } else {
        isBreaking.checked = false;
        hide(breakingBox);
        breakingText.value = "";
      }

      formTitle.textContent = "تعديل خبر";
      submitBtn.textContent = "حفظ التعديل";
      show(cancelEditBtn);

      if (editingImageURL) {
        imagePreview.src = editingImageURL;
        show(imagePreview);
      } else {
        hide(imagePreview);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn small danger";
    deleteBtn.textContent = "حذف";
    deleteBtn.onclick = async () => {
      if (confirm("هل أنت متأكد من الحذف؟")) {
        await deleteDoc(doc(db, "news", docSnap.id));
        if (editingId === docSnap.id) resetForm();
      }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    div.appendChild(thumb);
    div.appendChild(info);
    div.appendChild(actions);

    postsList.appendChild(div);
  });
});
