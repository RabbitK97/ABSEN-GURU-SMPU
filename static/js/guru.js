// ======================================
// master_guru.js - FINAL STABIL + POLISH
// ======================================

document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // ELEMENT
    // ================================
    const guruPerPageInput = document.getElementById('guru-per-page');
    const addGuruBtn = document.getElementById('add-guru-btn');
    const guruFormContainer = document.getElementById('guru-form-container');
    const guruFormTitle = document.getElementById('guru-form-title');
    const guruSaveBtn = document.getElementById('guru-save');
    const guruCancelBtn = document.getElementById('guru-cancel');

    const guruNama = document.getElementById('guru-nama');
    const guruJabatan = document.getElementById('guru-jabatan');
    const guruTempat = document.getElementById('guru-tempat');
    const guruTanggal = document.getElementById('guru-tanggal');
    const guruJk = document.getElementById('guru-jk');
    const guruStatus = document.getElementById('guru-status');
    const guruHp = document.getElementById('guru-hp');
    const guruAlamat = document.getElementById('guru-alamat');
    const guruEmail = document.getElementById('guru-email');

    const guruTableBody = document.querySelector('#guru-table tbody');
    const guruTotalData = document.getElementById('guru-total-data');
    const guruPagination = document.getElementById('guru-pagination');

    const guruSearchInput = document.getElementById('guru-search-input');
    const guruSearchBtn = document.getElementById('guru-search-btn');

    // ================================
    // STATE
    // ================================
    let guruData = [];

    let editIndex = null;
    let currentPage = 1;
    let perPage = 5;

    function loadGuruFromAPI() {
        fetch("/api/guru")
            .then(res => res.json())
            .then(data => {
                guruData = data;
                renderTable();
            });
    }

    // Panggil saat halaman pertama kali load
    loadGuruFromAPI();

    // ================================
    // HELPER TEXT
    // ================================
    function addHelperText(input, text) {
        let helper = input.nextElementSibling;
        if (!helper || !helper.classList.contains('helper-text')) {
            helper = document.createElement('div');
            helper.className = 'helper-text';
            input.insertAdjacentElement('afterend', helper);
        }
        helper.textContent = text;
    }

    // ================================
    // PER PAGE CONTROL (Tampilkan X data)
    // ================================
    if (guruPerPageInput) {
        guruPerPageInput.addEventListener('input', () => {
            let val = parseInt(guruPerPageInput.value);

            if (isNaN(val) || val < 1) {
                perPage = 1;
            } else {
                perPage = val;
            }

            currentPage = 1; // reset ke halaman pertama
            renderTable();
        });
    }

    // ================================
    // OPEN / CLOSE FORM
    // ================================
    addGuruBtn.addEventListener('click', () => openForm());
    guruCancelBtn.addEventListener('click', closeForm);

    function openForm(edit = false) {
        guruFormContainer.classList.add('show');
        guruFormTitle.textContent = edit ? 'Edit Guru' : 'Tambah Guru';
        setTimeout(() => guruNama.focus(), 100);
    }

    function closeForm() {
        guruFormContainer.classList.remove('show');
        clearForm();
        clearErrors();
        editIndex = null;
    }

    function clearForm() {
        guruNama.value = '';
        guruJabatan.value = '';
        guruTempat.value = '';
        guruTanggal.value = '';
        guruJk.value = '';
        guruStatus.value = '';
        guruHp.value = '';
        guruAlamat.value = '';
        guruEmail.value = '';
    }

    // ================================
    // INPUT RESTRICTIONS
    // ================================

    // No HP: hanya angka dan + di awal, max 13 digit
    guruHp.addEventListener('input', () => {
        let val = guruHp.value;
        val = val.replace(/[^0-9+]/g, '');

        if (val.indexOf('+') > 0) {
            val = val.replace(/\+/g, '');
        }

        let numeric = val.replace('+', '');
        if (numeric.length > 13) {
            numeric = numeric.slice(0, 13);
            val = val.startsWith('+') ? '+' + numeric : numeric;
        }

        guruHp.value = val;
    });

    // Tahun lahir: selalu 4 digit terakhir
    guruTanggal.addEventListener('input', () => {
        if (!guruTanggal.value) return;

        const parts = guruTanggal.value.split('-'); // yyyy-mm-dd
        if (parts[0].length > 4) {
            parts[0] = parts[0].slice(-4); // ambil 4 digit terakhir
            guruTanggal.value = parts.join('-');
        }
    });

    // ================================
    // HILANGKAN ERROR SAAT DIKETIK
    // ================================
    [
        guruNama, guruJabatan, guruTempat, guruTanggal,
        guruJk, guruStatus, guruHp, guruAlamat, guruEmail
    ].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            const msg = input.nextElementSibling;
            if (msg && msg.classList.contains('error-message')) {
                msg.remove();
            }
        });
    });

    // ================================
    // ENTER = SIMPAN
    // ================================

    /*
    [
       // guruNama, guruJabatan, guruTempat, guruTanggal,
        guruJk, guruStatus, guruHp, guruAlamat, guruEmail
    ].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveGuru();
            }
        });
    });
    */

    guruSaveBtn.addEventListener('click', saveGuru);

    // ================================
    // SAVE DATA
    // ================================
    function saveGuru() {
        clearErrors();

        const fields = [
            { el: guruNama, name: 'Nama' },
            { el: guruJabatan, name: 'Jabatan' },
            { el: guruTempat, name: 'Tempat Lahir' },
            { el: guruTanggal, name: 'Tahun Lahir' },
            { el: guruJk, name: 'Jenis Kelamin' },
            { el: guruStatus, name: 'Status' },
            { el: guruHp, name: 'No. HP' },
            { el: guruAlamat, name: 'Alamat' },
            { el: guruEmail, name: 'Email' }
        ];

        let hasError = false;

        fields.forEach(f => {
            if (!f.el.value.trim()) {
                showError(f.el, `${f.name} wajib diisi`);
                hasError = true;
            }
        });

        // Validasi tahun
        const year = parseInt(guruTanggal.value);
        const nowYear = new Date().getFullYear();
        if (year < 1950 || year > nowYear - 10) {
            showError(guruTanggal, `Tahun harus antara 1950 - ${nowYear - 10}`);
            hasError = true;
        }

        // Validasi HP
        const hpNumeric = guruHp.value.replace('+', '');
        if (hpNumeric.length < 8 || hpNumeric.length > 13) {
            showError(guruHp, 'No. HP harus 8–13 digit. Contoh: 08123456789 atau +628123456789');
            hasError = true;
        }

        // Validasi email (strict: tidak boleh ....com)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?$/;
        if (!emailRegex.test(guruEmail.value.trim())) {
            showError(guruEmail, 'Format salah. Contoh: nama@email.com atau nama@email.co.id');
            hasError = true;
        }

        if (hasError) {
            showNotification('Periksa kembali data!', 'error');
            return;
        }

        const data = {
            nama: guruNama.value.trim(),
            jabatan: guruJabatan.value.trim(),
            tempat: guruTempat.value.trim(),
            tahun: guruTanggal.value.trim(),
            jk: guruJk.value,
            status: guruStatus.value,
            hp: guruHp.value.trim(),
            alamat: guruAlamat.value.trim(),
            email: guruEmail.value.trim()
        };

        let url, method;
        if (editIndex !== null) {
            url = `/api/guru/update/${guruData[editIndex].id}`;
            method = "PUT";
        } else {
            url = "/api/guru/add";
            method = "POST";
        }

        fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => {
            if(res.status === "success") {
                showNotification(res.message || "Berhasil!", "success");
                loadGuruFromAPI();
                closeForm();
            } else {
                showNotification(res.message || "Terjadi error", "error");
            }
        })
        .catch(err => {
            console.error(err);
            showNotification("Terjadi error server", "error");
        });

    }

    // ================================
    // RENDER TABLE + PAGINATION
    // ================================
    function renderTable(data = guruData) {
        guruTableBody.innerHTML = '';

        const totalPages = Math.ceil(data.length / perPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = data.slice(start, end);

        pageData.forEach((guru, index) => {
            const realIndex = start + index;
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${realIndex + 1}</td>
                <td>${guru.nama}</td>
                <td>${guru.jabatan}</td>
                <td>${guru.hp}</td>
                <td>${guru.email}</td>
                <td style="text-align:center;">
                    <img src="/static/icons/edit.png" class="edit-btn" style="width:24px;cursor:pointer;margin-right:10px;">
                    <img src="/static/icons/delete.png" class="delete-btn" style="width:24px;cursor:pointer;">
                </td>
            `;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
                loadToForm(guru, realIndex);
            });

            tr.querySelector('.delete-btn').addEventListener('click', () => {
                showDeleteConfirm(guru.nama, () => {
                    fetch(`/api/guru/delete/${guru.id}`, { method: "DELETE" })
                        .then(res => res.json())
                        .then(res => {
                            if(res.status === "success") {
                                showNotification(res.message, "success");
                                loadGuruFromAPI(); // reload table
                            } else {
                                showNotification(res.message, "error");
                            }
                        });
                });
            });

            guruTableBody.appendChild(tr);
        });

        guruTotalData.textContent = data.length;
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        guruPagination.innerHTML = '';

        const prev = document.createElement('button');
        prev.textContent = 'Prev';
        prev.disabled = currentPage === 1;
        prev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
        guruPagination.appendChild(prev);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === currentPage ? 'active' : '';
            btn.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });
            guruPagination.appendChild(btn);
        }

        const next = document.createElement('button');
        next.textContent = 'Next';
        next.disabled = currentPage === totalPages;
        next.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });
        guruPagination.appendChild(next);
    }

    // ================================
    // LOAD TO FORM
    // ================================
    function loadToForm(guru, index) {
        editIndex = index;

        guruNama.value = guru.nama;
        guruJabatan.value = guru.jabatan;
        guruTempat.value = guru.tempat || '';
        guruTanggal.value = guru.tahun || '';
        guruJk.value = guru.jk || '';
        guruStatus.value = guru.status || '';
        guruHp.value = guru.hp || '';
        guruAlamat.value = guru.alamat || '';
        guruEmail.value = guru.email || '';

        openForm(true);
    }

    // ================================
    // SEARCH
    // ================================
    guruSearchBtn.addEventListener('click', doSearch);

    guruSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch();
        }
    });

    function doSearch() {
        const keyword = guruSearchInput.value.toLowerCase().trim();
        if (!keyword) {
            renderTable();
            return;
        }

        const result = guruData.filter(g => g.nama.toLowerCase().includes(keyword));

        if (result.length === 0) {
            showNotification('Data tidak ditemukan', 'error');
            renderTable();
        } else {
            renderTable(result);
        }
    }

    // ================================
    // CUSTOM CONFIRM DELETE
    // ================================
    function showDeleteConfirm(nama, onYes) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';

        const box = document.createElement('div');
        box.className = 'confirm-box';

        box.innerHTML = `
            <p>Anda yakin menghapus data <b>${nama}</b>?</p>
            <div class="confirm-actions">
                <button class="confirm-yes">Ya</button>
                <button class="confirm-no">Batal</button>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        box.querySelector('.confirm-yes').addEventListener('click', () => {
            document.body.removeChild(overlay);
            onYes();
        });

        box.querySelector('.confirm-no').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    // ================================
    // ERROR HANDLER
    // ================================
    function showError(input, message) {
        input.classList.add('error');

        let msg = input.nextElementSibling;
        if (!msg || !msg.classList.contains('error-message')) {
            msg = document.createElement('div');
            msg.className = 'error-message';
            input.insertAdjacentElement('afterend', msg);
        }

        msg.textContent = message;
        msg.style.display = 'block';
    }

    function clearErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

});
