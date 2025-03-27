
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Konfigurasi proyek Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJF3FKYkdRc8AKICpgqE_mFWb80xzGdro",
  authDomain: "hitung-cuan.firebaseapp.com",
  projectId: "hitung-cuan",
  storageBucket: "hitung-cuan.firebasestorage.app",
  messagingSenderId: "386744606371",
  appId: "1:386744606371:web:b033a6567b643c7f5fa916",
  measurementId: "G-9QXB07L6QW"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Fungsi login
export async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Email dan password wajib diisi!");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists() && userDoc.data().isActive) {
      alert("Login berhasil!");
      window.location.href = "kalkulator.html";
    } else {
      alert("Akun Anda belum aktif.");
      await signOut(auth);
    }
  } catch (error) {
    alert("Gagal login: " + error.message);
  }
}

// 🔽 Fungsi: Simpan rekap penjualan (ISO + angka)
export async function simpanRekapPenjualan(uid, data) {
  const rekapRef = collection(db, "rekap", uid, "data");

  const tanggalFormatted = new Date(data.tanggal).toISOString().slice(0, 10);
  const tanggalNumber = parseInt(tanggalFormatted.replace(/-/g, ""));

  await addDoc(rekapRef, {
    ...data,
    tanggal: tanggalFormatted,
    tanggalNum: tanggalNumber,
    createdAt: new Date()
  });
}

// 🔽 Fungsi: Ambil semua data rekap penjualan user
export async function getRekapUser(uid) {
  const rekapRef = collection(db, "rekap", uid, "data");
  const q = query(rekapRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  const results = [];
  querySnapshot.forEach((docSnap) => {
    results.push({ id: docSnap.id, ...docSnap.data() });
  });

  return results;
}

// 🔒 Fungsi: Cek login status dan ambil user aktif
export function cekLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().isActive) {
        callback(user);
      } else {
        alert("Akun belum aktif.");
        await signOut(auth);
        window.location.href = "login.html";
      }
    } else {
      window.location.href = "login.html";
    }
  });
}

// 🔄 Fungsi: Update data rekap user (edit qty/iklan)
export async function updateRekapUser(uid, docId, newData) {
  const ref = doc(db, "rekap", uid, "data", docId);
  await setDoc(ref, newData, { merge: true });
}

// 🗑 Fungsi: Hapus data rekap user
export async function deleteRekapUser(uid, docId) {
  const ref = doc(db, "rekap", uid, "data", docId);
  await deleteDoc(ref);
}