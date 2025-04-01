// script.js dengan tombol hitung manual dan auto-save ke Firestore

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

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
const auth = getAuth();
const db = getFirestore();

let debounceTimer;

// Input sanitasi (tidak trigger calculate)
document.querySelectorAll('input').forEach(input => {
  input.setAttribute('inputmode', 'numeric');
  input.addEventListener('paste', handlePaste);
});

function formatRupiah(value) {
  const isNegative = value < 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(value));
  return isNegative ? '-' + formatted : formatted;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function handlePaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text');
  const numeric = text.replace(/[^\d]/g, '');
  const value = parseInt(numeric) || 0;
  e.target.value = value;
}

function cleanNumber(id) {
  return parseFloat(document.getElementById(id)?.value.replace(/\./g, '')) || 0;
}

function calculate() {
  const productCost = cleanNumber('productCost');
  const sellingPrice = cleanNumber('sellingPrice');
  const discount = 0;
  const sales = cleanNumber('sales');
  const adSpend = cleanNumber('adSpend');
  const adminFee = cleanNumber('adminFee');
  const returnRate = cleanNumber('returnRate');

  const effectiveSellingPrice = sellingPrice - discount;
  const omset = effectiveSellingPrice * sales;

  const adAdminCost = adSpend * (adminFee / 100);
  const totalCost = productCost + (adSpend + adAdminCost) / (sales || 1);
  const netProfitPerSale = Math.floor(effectiveSellingPrice - totalCost);
  const grossPotentialProfit = netProfitPerSale * sales;
  const potentialProfit = Math.floor(grossPotentialProfit * ((100 - returnRate) / 100));
  const profitMargin = Math.floor((netProfitPerSale / effectiveSellingPrice) * 100);
  const roas = adSpend > 0 ? (omset / adSpend).toFixed(2) : '0.00';
  const cpr = sales > 0 ? Math.floor(adSpend / sales) : 0;

  document.getElementById('netProfit').textContent = formatRupiah(netProfitPerSale);
  document.getElementById('potentialProfit').textContent = formatRupiah(potentialProfit);
  document.getElementById('profitMargin').textContent = `${profitMargin}%`;
  document.getElementById('roas').textContent = roas;
  document.getElementById('cpr').textContent = formatRupiah(cpr);

  const profitStyle = (el, value) => {
    el.style.backgroundColor = value < 0 ? '#dc2626' : '#16a34a';
    el.style.color = '#ffffff';
    const label = el.querySelector('strong');
    if (label) label.style.color = '#000000';
  };
  profitStyle(document.getElementById('netProfit').parentElement, netProfitPerSale);
  profitStyle(document.getElementById('potentialProfit').parentElement, potentialProfit);

  evaluateAdPerformance(profitMargin, parseFloat(roas), cpr);

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDoc);
    if (!userSnap.exists() || userSnap.data().isActive !== true) return;

    try {
      await addDoc(collection(userDoc, "history"), {
        productCost,
        sellingPrice,
        discount,
        sales,
        adSpend,
        adminFee,
        returnRate,
        netProfitPerSale,
        potentialProfit,
        profitMargin,
        roas,
        cpr,
        timestamp: new Date().toISOString()
      });
      console.log("✅ Data disimpan ke Firestore");
    } catch (e) {
      console.error("❌ Gagal simpan data:", e);
    }
  }, 2000);
}

function evaluateAdPerformance(profitMargin, roas, cpr) {
  const evalBox = document.getElementById('adEvaluation');
  let messages = [];

  if (profitMargin < 20) {
    messages.push('⚠️ Margin keuntungan rendah. Pertimbangkan menaikkan harga jual atau menekan biaya.');
  } else if (profitMargin >= 30) {
    messages.push('✅ Margin bagus. Anda punya ruang cukup untuk scale iklan.');
  } else {
    messages.push('👌 Margin cukup. Tetap pantau biaya dan efektivitas iklan.');
  }

  if (roas < 2) {
    messages.push('⚠️ ROAS di bawah standar. Optimalkan targeting atau creative iklan.');
  } else if (roas >= 4) {
    messages.push('✅ ROAS sangat baik (4+). Waktunya scale iklan Anda!');
  } else {
    messages.push('✨ ROAS 2-3 bisa jadi sinyal winning. Pantau lebih lanjut!');
  }

  if (cpr > 35000) {
    messages.push('⚠️ Biaya per hasil (CPR) terlalu tinggi. Coba variasi iklan baru atau perbaiki funnel.');
  } else if (cpr <= 15000) {
    messages.push('✅ CPR efisien. Pertahankan performa.');
  } else {
    messages.push('👌 CPR wajar. Tetap awasi performa.');
  }

  evalBox.innerHTML = messages.map(m => `<p>${m}</p>`).join('');
}

window.calculate = calculate;



// Format input fields with ribuan separator (e.g. 1000000 -> 1.000.000)
function formatInputField(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("input", (e) => {
    const value = e.target.value.replace(/\./g, "");
    if (!value) {
      e.target.value = "";
      return;
    }
    e.target.value = new Intl.NumberFormat("id-ID").format(parseInt(value));
  });

  el.addEventListener("blur", (e) => {
    const value = e.target.value.replace(/\./g, "");
    e.target.value = value ? new Intl.NumberFormat("id-ID").format(parseInt(value)) : "";
  });
}

// Apply to relevant input IDs
["productCost", "sellingPrice", "sales", "adSpend", "adminFee", "returnRate"].forEach(formatInputField);