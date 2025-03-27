// rekap-script.js - Versi Manual Filter dengan Tombol

import { simpanRekapPenjualan, getRekapUser, cekLogin } from "./firebase.js";

const hppInput = document.getElementById("baseHpp");
const profitInput = document.getElementById("baseProfit");
const qtyInput = document.getElementById("dailyQty");
const adSpendInput = document.getElementById("dailyAdSpend");
const hppField = document.getElementById("dailyHpp");
const grossField = document.getElementById("dailyGrossProfit");
const netField = document.getElementById("dailyNetProfit");

const simpanBtn = document.getElementById("simpanBtn");
const dateInput = document.getElementById("dailyDate");
const productInput = document.getElementById("dailyProduct");
const tableBody = document.querySelector("#rekapTable tbody");
const notifSuccess = document.getElementById("notifSuccess");

const filterRange = document.getElementById("filterRange");

// ⛳ Tambahkan tombol manual
const filterBtn = document.createElement("button");
filterBtn.id = "filterBtn";
filterBtn.innerText = "🔍 Filter";
filterBtn.style.marginLeft = "0.5rem";
filterBtn.className = "btn";
filterRange?.insertAdjacentElement("afterend", filterBtn);

const resetBtn = document.createElement("button");
resetBtn.id = "resetFilter";
resetBtn.innerText = "♻️ Reset";
resetBtn.style.marginLeft = "0.5rem";
resetBtn.className = "btn";
filterBtn?.insertAdjacentElement("afterend", resetBtn);

let rekapData = [];
let allData = [];
let currentUid = null;
let selectedStart = "", selectedEnd = "";

qtyInput.addEventListener("input", hitungOtomatis);
adSpendInput.addEventListener("input", hitungOtomatis);

function hitungOtomatis() {
  const hpp = parseInt(hppInput.value) || 0;
  const profit = parseInt(profitInput.value) || 0;
  const qty = parseInt(qtyInput.value) || 0;
  const iklan = parseInt(adSpendInput.value) || 0;

  const totalHpp = hpp * qty;
  const gross = profit * qty;
  const net = gross - totalHpp - iklan;

  hppField.value = "Rp " + totalHpp.toLocaleString("id-ID");
  grossField.value = "Rp " + gross.toLocaleString("id-ID");
  netField.value = "Rp " + net.toLocaleString("id-ID");
}

cekLogin(async (user) => {
  if (!user) return;
  currentUid = user.uid;
  allData = await getRekapUser(currentUid);
  rekapData = [...allData];
  tampilkanData();
  hitungRingkasan();
});

simpanBtn.addEventListener("click", async () => {
  const tanggal = dateInput.value;
  const produk = productInput.value.trim();
  const qty = parseInt(qtyInput.value);
  const hpp = parseInt(hppInput.value);
  const profit = parseInt(profitInput.value);
  const iklan = parseInt(adSpendInput.value);

  if (!tanggal || !produk || !qty || !hpp || !profit) {
    alert("Isi semua field yang dibutuhkan!");
    return;
  }

  const totalHpp = hpp * qty;
  const gross = profit * qty;
  const net = gross - totalHpp - iklan;

  const data = {
    tanggal,
    produk,
    qty,
    iklan,
    gross,
    net,
    profitPerProduk: profit,
    createdAt: new Date()
  };

  await simpanRekapPenjualan(currentUid, data);
  notifSuccess.style.display = "block";
  setTimeout(() => (notifSuccess.style.display = "none"), 2500);

  qtyInput.value = "";
  adSpendInput.value = "";
  hppField.value = "Auto";
  grossField.value = "Auto";
  netField.value = "Auto";

  allData = await getRekapUser(currentUid);
  rekapData = [...allData];
  tampilkanData();
  hitungRingkasan();
});

function tampilkanData() {
  tableBody.innerHTML = "";
  rekapData.forEach((d, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.tanggal}</td>
      <td>${d.produk}</td>
      <td><input type="number" class="edit-qty" value="${d.qty}" style="width:60px" disabled /></td>
      <td><input type="number" class="edit-iklan" value="${d.iklan}" style="width:80px" disabled /></td>
      <td class="td-gross">Rp ${d.gross.toLocaleString("id-ID")}</td>
      <td class="td-net">Rp ${d.net.toLocaleString("id-ID")}</td>
      <td>
        <button class="btn-edit" data-index="${index}" data-mode="edit">✏️ Edit</button>
        <button class="btn-delete" data-index="${index}">🗑️</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-index]");
  if (!btn) return;
  const index = parseInt(btn.dataset.index);
  const row = btn.closest("tr");
  const qtyInput = row.querySelector(".edit-qty");
  const iklanInput = row.querySelector(".edit-iklan");
  const tdGross = row.querySelector(".td-gross");
  const tdNet = row.querySelector(".td-net");

  const d = rekapData[index];
  const docId = d.id;

  if (btn.classList.contains("btn-edit")) {
    if (btn.dataset.mode === "edit") {
      qtyInput.disabled = false;
      iklanInput.disabled = false;
      btn.innerText = "💾 Simpan";
      btn.dataset.mode = "save";
    } else {
      const qty = parseInt(qtyInput.value);
      const iklan = parseInt(iklanInput.value);
      const profitPerProduk = d.profitPerProduk || d.gross / d.qty;
      const gross = profitPerProduk * qty;
      const totalHpp = (parseInt(hppInput.value) || 0) * qty;
      const net = gross - totalHpp - iklan;

      const { updateRekapUser } = await import("./firebase.js");
      await updateRekapUser(currentUid, docId, { qty, iklan, gross, net });

      tdGross.innerText = "Rp " + gross.toLocaleString("id-ID");
      tdNet.innerText = "Rp " + net.toLocaleString("id-ID");
      qtyInput.disabled = true;
      iklanInput.disabled = true;
      btn.innerText = "✏️ Edit";
      btn.dataset.mode = "edit";

      allData = await getRekapUser(currentUid);
      rekapData = [...allData];
      hitungRingkasan();
    }
  }

  if (btn.classList.contains("btn-delete")) {
    if (confirm("Yakin ingin menghapus data ini?")) {
      const { deleteRekapUser } = await import("./firebase.js");
      await deleteRekapUser(currentUid, docId);
      allData = await getRekapUser(currentUid);
      rekapData = [...allData];
      tampilkanData();
      hitungRingkasan();
    }
  }
});

function hitungRingkasan() {
  let totalGross = 0, totalNet = 0, totalQty = 0, totalAd = 0;
  rekapData.forEach((d) => {
    totalGross += d.gross;
    totalNet += d.net;
    totalQty += d.qty;
    totalAd += d.iklan;
  });

  const labaBersihPerProduk = totalQty ? totalNet / totalQty : 0;
  const cpr = totalQty ? totalAd / totalQty : 0;
  const margin = totalGross ? (totalNet / totalGross) * 100 : 0;
  const roas = totalAd ? totalGross / totalAd : 0;

  document.getElementById("summaryProfitPerUnit").innerText = "Rp" + Math.round(labaBersihPerProduk).toLocaleString("id-ID");
  document.getElementById("summaryNet").innerText = "Rp" + totalNet.toLocaleString("id-ID");
  document.getElementById("summaryMargin").innerText = margin.toFixed(1) + "%";
  document.getElementById("summaryRoas").innerText = roas.toFixed(2);
  document.getElementById("summaryCpr").innerText = "Rp" + Math.round(cpr).toLocaleString("id-ID");
}

// Akhir dari konfigurasi Litepicker
new Litepicker({
    element: document.getElementById("filterRange"),
    singleMode: false,
    numberOfMonths: 2,
    numberOfColumns: 2,
    format: "YYYY-MM-DD",
    autoApply: true,
    onSelect: (start, end) => {
      selectedStart = start.format("YYYY-MM-DD");
      selectedEnd = end.format("YYYY-MM-DD");
  
      const startDateNum = parseInt(selectedStart.replace(/-/g, ""));
      const endDateNum = parseInt(selectedEnd.replace(/-/g, ""));
  
      rekapData = allData.filter((d) => {
        const tanggalNum = parseInt(d.tanggal.replace(/-/g, ""));
        return tanggalNum >= startDateNum && tanggalNum <= endDateNum;
      });
  
      tampilkanData();
      hitungRingkasan();
    }
  });
  

