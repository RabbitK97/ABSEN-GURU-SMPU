document.addEventListener('DOMContentLoaded', () => {

    // ======================
    // ELEMENTS ABSENSI
    // ======================
    let absensiData = []; // data akan diambil dari API nanti

    const tableBody = document.querySelector('#absensi-table tbody');
    const tampilInput = document.getElementById('absensi-per-page');
    const totalDataSpan = document.getElementById('absensi-total-data');

    const filterNama = document.getElementById('filter-nama');
    const filterTanggalAwal = document.getElementById('filter-tanggal-awal');
    const filterTanggalAkhir = document.getElementById('filter-tanggal-akhir');
    const filterBulan = document.getElementById('filter-bulan');
    const filterTahun = document.getElementById('filter-tahun');

    if (filterTahun) {
        filterTahun.addEventListener('input', () => {
            let value = filterTahun.value.toString();
            if (value.length > 4) filterTahun.value = value.slice(-4);
        });
    }

    // ======================
    // AMBIL DATA GURU UNTUK DROPDOWN NAMA
    // ======================
    function loadGuruToDropdown() {
        fetch('/api/guru/absensi')
            .then(res => res.json())
            .then(data => {
                if (!filterNama) return;
                filterNama.innerHTML = '<option value="">-- Semua Guru --</option>';
                data.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g.id;      // pakai id guru
                    opt.textContent = g.nama;
                    filterNama.appendChild(opt);
                });
            })
            .catch(err => console.error(err));
    }

    loadGuruToDropdown();

    // ======================
    // AMBIL DATA ABSENSI DARI SERVER
    // ======================
    function loadAbsensiData() {
        fetch('/api/absensi') // nanti kita buat route ini di app.py
            .then(res => res.json())
            .then(data => {
                absensiData = data;
                renderAbsensiTable();
            });
    }

    loadAbsensiData();

    // ======================
    // FILTER DATA
    // ======================
    function getFilteredData() {
        return absensiData.filter(item => {
            // Filter nama
            if (filterNama && filterNama.value && item.guru_id != filterNama.value) return false;

            // Filter tanggal
            if (filterTanggalAwal && filterTanggalAwal.value && item.tanggal < filterTanggalAwal.value) return false;
            if (filterTanggalAkhir && filterTanggalAkhir.value && item.tanggal > filterTanggalAkhir.value) return false;

            // Filter bulan
            if (filterBulan && filterBulan.value) {
                const bulanItem = new Date(item.tanggal).getMonth() + 1; // bulan 1-12
                if (parseInt(filterBulan.value) !== bulanItem) return false;
            }

            // Filter tahun
            if (filterTahun && filterTahun.value) {
                const tahunItem = new Date(item.tanggal).getFullYear();
                if (parseInt(filterTahun.value) !== tahunItem) return false;
            }

            return true;
        });
    }

    // ======================
    // RENDER TABEL ABSENSI
    // ======================
    function renderAbsensiTable() {
        if (!tableBody || !tampilInput || !totalDataSpan) return;

        tableBody.innerHTML = '';
        const limit = parseInt(tampilInput.value) || absensiData.length;

        const filteredData = getFilteredData();
        totalDataSpan.textContent = filteredData.length;

        filteredData.slice(0, limit).forEach((item, index) => {
            const tr = document.createElement('tr');

            let statusClass = '';
            switch(item.status) {
                case 'tepat': statusClass = 'status-tepat'; break;
                case 'terlambat': statusClass = 'status-terlambat'; break;
                case 'izin': statusClass = 'status-izin'; break;
                case 'izin_keluar': statusClass = 'status-izin-keluar'; break;
                case 'pulang_duluan': statusClass = 'status-pulang-duluan'; break;
            }

            tr.innerHTML = `
                <td class="center">${index + 1}</td>
                <td class="left">${item.nama}</td>
                <td class="center">${item.tanggal}</td>
                <td class="center ${statusClass}">${item.status.replace('_',' ')}</td>
                <td class="center">${item.jamMasuk || '-'}</td>
                <td class="center">${item.jamPulang || '-'}</td>
                <td class="left">${item.alasan || '-'}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ======================
    // EVENT FILTER & PER-PAGE
    // ======================
    [filterNama, filterTanggalAwal, filterTanggalAkhir, filterBulan, filterTahun, tampilInput].forEach(el => {
        if (el) el.addEventListener('change', renderAbsensiTable);
    });

window.loadAbsensiData = loadAbsensiData;
window.loadGuruToDropdown = loadGuruToDropdown;
});
