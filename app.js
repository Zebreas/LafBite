// sheetWebhookURL : https://script.google.com/macros/s/AKfycbw6X-KIqYv-RcbXS_HZByikeYMGbEVBbKP7DIRuljpP9l38yjgpedTGKw1nem8OYw/exec
// sheetMenu : https://script.google.com/macros/s/AKfycbx5VKze_z_0sfkoUJdStb2h6vKPA1TLFL2WuAtMi1G4fXSkmppp8h7OAqeF2wGu5Dwj/exec

const menuBody = document.getElementById("menu-body");
let menuItems = [];

// URL Web App yang akan kita buat di Google Apps Script
// mike --> const sheetWebhookURL = "https://script.google.com/macros/s/AKfycbw6X-KIqYv-RcbXS_HZByikeYMGbEVBbKP7DIRuljpP9l38yjgpedTGKw1nem8OYw/exec";
const sheetWebhookURL = "https://script.google.com/macros/s/AKfycbw6X-KIqYv-RcbXS_HZByikeYMGbEVBbKP7DIRuljpP9l38yjgpedTGKw1nem8OYw/exec";

async function fetchMenuItems() {
  try {
    // mike --> const response = await fetch("https://script.google.com/macros/s/AKfycbx5VKze_z_0sfkoUJdStb2h6vKPA1TLFL2WuAtMi1G4fXSkmppp8h7OAqeF2wGu5Dwj/exec");
    const response = await fetch("https://script.google.com/macros/s/AKfycbx5VKze_z_0sfkoUJdStb2h6vKPA1TLFL2WuAtMi1G4fXSkmppp8h7OAqeF2wGu5Dwj/exec");
    menuItems = await response.json();

    menuItems.forEach((item, index) => {
      const row = document.createElement("tr");
      row.setAttribute("data-name", item.name.toLowerCase());

      row.innerHTML = `
        <td>${item.name}</td>
        <td class="harga">${item.price.toLocaleString()}</td>
        <td><input type="number" id="qty-${index}" min="0" value="0" oninput="updateTotals()" /></td>
        <td id="total-${index}" class="total">Rp 0</td>
      `;

      menuBody.appendChild(row);
    });
  } catch (error) {
    console.error("Gagal ambil data menu:", error);
  }
}
window.onload = fetchMenuItems;

function updateTotals() {
  let grandTotal = 0;
  menuItems.forEach((item, index) => {
    const qty = parseInt(document.getElementById(`qty-${index}`).value) || 0;
    const total = item.price * qty;
    document.getElementById(`total-${index}`).textContent = `Rp ${total.toLocaleString()}`;
    grandTotal += total;
  });
  document.getElementById("total-pembelian").textContent = `Rp ${grandTotal.toLocaleString()}`;
}

async function buatStruk() {
  const nama = document.getElementById("nama").value || "-";
  const whatsapp = document.getElementById("whatsapp").value || "-"; // Menambahkan input nomor WhatsApp

  let hasil = `Nama: ${nama}\n\n`;
  // Menambahkan kode struk di bagian atas hasil
  const nomorStruk = generateNomorStruk(); // Generate nomor struk
  hasil += `Kode Struk: ${nomorStruk}\n\n`;  // Menampilkan kode struk di bagian struk
  hasil += `Menu               Qty     Harga        Total\n`;
  hasil += `----------------------------------------------\n`;

  let total = 0;
  let penjualan = [];

  menuItems.forEach((item, index) => {
    const qty = parseInt(document.getElementById(`qty-${index}`).value) || 0;
    if (qty > 0) {
      const harga = item.price;
      const subtotal = harga * qty;
      total += subtotal;

      const menuName = item.name.padEnd(18, ' ');
      const qtyStr = qty.toString().padStart(3, ' ');
      const hargaStr = harga.toLocaleString().padStart(10, ' ');
      const totalStr = subtotal.toLocaleString().padStart(11, ' ');

      hasil += `${menuName}${qtyStr}  ${hargaStr}  ${totalStr}\n`;

      penjualan.push({
        menu: item.name,
        harga: harga,
        qty: qty,
        subtotal: subtotal
      });
    }
  });

  if (total === 0) {
    alert("Belum ada item yang dipilih.");
    return;
  }

  hasil += `\nTOTAL: Rp ${total.toLocaleString()}`;
  document.getElementById("output").textContent = hasil;

  // Menyembunyikan struk terlebih dahulu
  document.getElementById("struk").style.display = "none";

  // Tampilkan tombol OK untuk admin
  const konfirmasi = confirm("Apakah Anda yakin ingin menyimpan transaksi ini ke Google Sheets?");
  if (konfirmasi) {
    // Tampilkan struk setelah admin klik OK
    document.getElementById("struk").style.display = "block";
    
    // Kirim data ke Google Sheets setelah admin mengonfirmasi
    await kirimKeSheet(nama, whatsapp, penjualan, total, nomorStruk);  // Menambahkan nomor WhatsApp
    alert(`Transaksi berhasil disimpan dengan Nomor Struk: ${nomorStruk}`);
  } else {
    alert("Transaksi dibatalkan.");
  }
}

function resetForm() {
  const konfirmasi = confirm("Apakah Anda yakin ingin mereset form?");
  if (konfirmasi) {
    // Hapus input nama pembeli dan WhatsApp
    document.getElementById("nama").value = "";
    document.getElementById("whatsapp").value = "";

    // Reset input qty dan total untuk menu
    menuItems.forEach((item, index) => {
      const qtyInput = document.getElementById(`qty-${index}`);
      const totalCell = document.getElementById(`total-${index}`);
      if (qtyInput && totalCell) {
        qtyInput.value = 0;
        totalCell.textContent = "Rp 0";
      }
    });
    // Reset total pembelian
    document.getElementById("total-pembelian").textContent = "Rp 0";

    // Sembunyikan dan hapus output struk
    document.getElementById("struk").style.display = "none";
    document.getElementById("output").textContent = "";

    // Reset pencarian menu
    document.getElementById("search").value = ""; // Hapus isian pencarian menu
    filterMenu(); // Panggil filterMenu untuk menampilkan semua menu
  } else {
    alert("Reset dibatalkan.");
  }
}

function filterMenu() {
  const query = document.getElementById("search").value.toLowerCase();
  document.querySelectorAll("#menu-body tr").forEach(row => {
    row.style.display = row.getAttribute("data-name").includes(query) ? "" : "none";
  });
}

function kirimKeWhatsApp() {
  const nama = document.getElementById("nama").value || "-";
  const whatsapp = document.getElementById("whatsapp").value;
  
  if (!whatsapp) {
    alert("Nomor WhatsApp belum dimasukkan!");
    return;
  }

  const isi = document.getElementById("output").textContent;
  const pesan = encodeURIComponent(`Halo ${nama}, berikut struk pembelian Anda:\n\n${isi}`);
  const nomorWhatsApp = `+${whatsapp.replace(/\D/g, '')}`; // Menghapus karakter non-numerik
  window.open(`https://wa.me/${nomorWhatsApp}?text=${pesan}`, "_blank");
}

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
}

function generateNomorStruk() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const tanggal = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const waktu = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `TRX-${tanggal}-${waktu}`;
}

async function kirimKeSheet(nama, whatsapp, penjualan, total, nomorStruk) {
  try {
    const payload = {
      nama: nama,
      whatsapp: whatsapp, // Menambahkan nomor WhatsApp
      penjualan: penjualan,
      total: total,
      waktu: new Date().toLocaleString('id-ID'),
      nomorStruk: nomorStruk
    };

    await fetch(sheetWebhookURL, {
      method: "POST",
      //mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    console.log("Berhasil kirim ke Google Sheets");
  } catch (error) {
    console.error("Gagal kirim ke Google Sheets:", error);
  }
}
