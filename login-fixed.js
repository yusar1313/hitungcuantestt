import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCJF3FKYkdRc8AKICpgqE_mFWb80xzGdro",
  authDomain: "hitung-cuan.firebaseapp.com",
  projectId: "hitung-cuan",
  storageBucket: "hitung-cuan.firebasestorage.app",
  messagingSenderId: "386744606371",
  appId: "1:386744606371:web:b033a6567b643c7f5fa916",
  measurementId: "G-9QXB07L6QW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle Login
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Email dan password wajib diisi!");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().isActive) {
      alert("Login berhasil!");
      window.location.href = "/kalkulator";
    } else {
      alert("Akun Anda belum aktif. Hubungi admin.");
      await signOut(auth);
    }
  } catch (error) {
    alert("Gagal login: " + error.message);
  }
});
