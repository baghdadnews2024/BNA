import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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
const newsId = params.get("id");

const title = document.getElementById("articleTitle");
const category = document.getElementById("articleCategory");
const media = document.getElementById("articleMedia");
const content = document.getElementById("articleContent");

async function loadNews(){

if(!newsId) return;

const docRef = doc(db,"news",newsId);
const snap = await getDoc(docRef);

if(!snap.exists()){
title.textContent = "الخبر غير موجود";
return;
}

const n = snap.data();

title.textContent = n.title || "";

category.textContent = "القسم: " + (n.category || "");

content.textContent = n.content || "";

if(n.videoURL){

media.innerHTML = `
<video src="${n.videoURL}" controls></video>
`;

}else{

media.innerHTML = `
<img src="${n.imageURL || "https://picsum.photos/800/400"}">
`;

}

}

loadNews();

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger?.addEventListener("click",()=>{
navLinks?.classList.toggle("show");
});