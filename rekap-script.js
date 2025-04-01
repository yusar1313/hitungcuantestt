// rekap-script.js - Patch warna langsung di-render

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

let rekapData = [];
let allData = [];
let currentUid = null;

qtyInput.addEventListener("input", hitungOtomatis);
adSpendInput.addEventListener("input", hitungOtomatis);

function hitungOtomatis() {
  const hpp = parseInt(hppInput.value.replace(/\./g, '')) || 0;
  const profit = parseInt(profitInput.value.replace(/\./g, '')) || 0;
  const qty = parseInt(qtyInput.value) || 0;
  const iklan = parseInt(adSpendInput.value.replace(/\./g, '')) || 0;

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
  const hpp = parseInt(hppInput.value.replace(/\./g, ''));
  const profit = parseInt(profitInput.value.replace(/\./g, ''));
  const iklan = parseInt(adSpendInput.value.replace(/\./g, ''));

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
      <td><input type="text" class="edit-iklan" value="Rp ${d.iklan.toLocaleString('id-ID')}" style="width:125px" disabled /></td>
      <td class="td-gross">Rp ${d.gross.toLocaleString("id-ID")}</td>
      <td class="td-net ${d.net > 0 ? 'profit-positive' : d.net < 0 ? 'profit-negative' : ''}">Rp ${d.net.toLocaleString("id-ID")}</td>
      <td>
        <button class="btn-edit" data-index="${index}" data-mode="edit">✏️ Edit</button>
        <button class="btn-delete" data-index="${index}">🗑️</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ... sisanya tetap


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
      // Format input "edit-iklan" saat masuk mode edit (pakai Rp dan titik)
      iklanInput.addEventListener("input", (e) => {
        const val = e.target.value.replace(/[^\d]/g, "");
        if (!val) {
          e.target.value = "";
          return;
        }
        const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val));
        e.target.value = "Rp " + formatted;
      });

      iklanInput.addEventListener("focus", (e) => {
        const val = e.target.value.replace(/[^\d]/g, "");
        e.target.value = val ? "Rp " + new Intl.NumberFormat("id-ID").format(parseInt(val)) : "";
      });

      iklanInput.addEventListener("blur", (e) => {
        const val = e.target.value.replace(/[^\d]/g, "");
        e.target.value = val ? "Rp " + new Intl.NumberFormat("id-ID").format(parseInt(val)) : "";
      });

      btn.innerText = "💾 Simpan";
      btn.dataset.mode = "save";
    } else {
      const qty = parseInt(qtyInput.value);
      const iklan = parseInt(iklanInput.value.replace(/[^\d]/g, ""));
      const profitPerProduk = d.profitPerProduk || d.gross / d.qty;
      const gross = profitPerProduk * qty;
      const totalHpp = (parseInt(hppInput.value) || 0) * qty;
      const net = gross - totalHpp - iklan;

      const { updateRekapUser } = await import("./firebase.js");
      await updateRekapUser(currentUid, docId, { qty, iklan, gross, net });

      tdGross.innerText = "Rp " + gross.toLocaleString("id-ID");
      
      tdNet.innerText = "Rp " + net.toLocaleString("id-ID");
      tdNet.classList.remove("text-green-600", "text-red-600");
      tdNet.classList.add(net >= 0 ? "text-green-600" : "text-red-600");

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
  document.getElementById("summaryTotalIklan").innerText = "Rp" + totalAd.toLocaleString("id-ID");
}

document.addEventListener("DOMContentLoaded", function () {
  flatpickr("#filterRange", {
    mode: "range",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates) {
      if (selectedDates.length === 1) {
        const only = selectedDates[0].toLocaleDateString("sv-SE");
        rekapData = allData.filter((d) => d.tanggal === only);
      } else if (selectedDates.length === 2) {
        const selectedStart = selectedDates[0].toLocaleDateString("sv-SE");
        const selectedEnd = selectedDates[1].toLocaleDateString("sv-SE");

        const startDateNum = parseInt(selectedStart.replace(/-/g, ""));
        const endDateNum = parseInt(selectedEnd.replace(/-/g, ""));

        rekapData = allData
          .filter((d) => {
            const tanggalNum = parseInt(d.tanggal.replace(/-/g, ""));
            return tanggalNum >= startDateNum && tanggalNum <= endDateNum;
          })
          .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      }

      tampilkanData();
      hitungRingkasan();
    }
  });
});

document.querySelectorAll("#filterPresets button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const range = btn.dataset.range;
    if (range === "today") {
      filterByPreset(1);
    } else if (range === "last7") {
      filterByPreset(7);
    } else if (range === "last14") {
      filterByPreset(14);
    } else if (range === "last30") {
      filterByPreset(30);
    }
  });
});

function filterByPreset(jumlahHari) {
  const now = new Date();
  const endDate = now.toLocaleDateString("sv-SE");
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - jumlahHari + 1);

  const startDateStr = startDate.toLocaleDateString("sv-SE");

  const startDateNum = parseInt(startDateStr.replace(/-/g, ""));
  const endDateNum = parseInt(endDate.replace(/-/g, ""));

  rekapData = allData
    .filter((d) => {
      const tanggalNum = parseInt(d.tanggal.replace(/-/g, ""));
      return tanggalNum >= startDateNum && tanggalNum <= endDateNum;
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  tampilkanData();
  hitungRingkasan();
}



// Format input fields with comma (e.g. 1000000 -> 1,000,000)
function formatInputWithComma(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.addEventListener("input", (e) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    if (!value) {
      e.target.value = "";
      return;
    }
    e.target.value = new Intl.NumberFormat("id-ID").format(parseInt(value));
  });

  el.addEventListener("blur", (e) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    e.target.value = value ? new Intl.NumberFormat("id-ID").format(parseInt(value)) : "";
  });
}

["baseHpp", "baseProfit", "dailyAdSpend"].forEach(formatInputWithComma);