// register.js
import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
  doc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Fungsi register
export async function register() {
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  if (!email || !password) {
    alert("Email dan password wajib diisi.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Tambahkan user ke Firestore dengan createdAt
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      isActive: false,
      createdAt: serverTimestamp() // 🟢 Waktu server disimpan
    });

    alert("Akun berhasil dibuat! Menunggu verifikasi admin.");
    window.location.href = "/"; // Tetap di halaman utama setelah daftar
  } catch (error) {
    alert("Gagal daftar: " + error.message);
  }
}

// agar bisa diakses dari HTML
window.register = register;
