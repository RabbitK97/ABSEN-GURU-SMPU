// ======================================
// akun_guru.js - FINAL STABIL + API FLASK
// ======================================

document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // ELEMENT
    // ================================
    const addAkunBtn = document.getElementById('add-akun-btn');
    const akunFormContainer = document.getElementById('akun-form-container');
    const akunFormTitle = document.getElementById('akun-form-title');
    const akunSaveBtn = document.getElementById('akun-save');
    const akunCancelBtn = document.getElementById('akun-cancel');

    const akunGuruSelect = document.getElementById('akun-guru');
    const akunUsername = document.getElementById('akun-username');
    const akunPassword = document.getElementById('akun-password');
    const togglePasswordBtn = document.querySelector('.emoji-btn');

    const akunTableBody = document.querySelector('#akun-table tbody');
    const akunTotalData = document.getElementById('akun-total-data');
    const akunPagination = document.getElementById('akun-pagination');

    const akunSearchInput = document.getElementById('akun-search-input');
    const akunSearchBtn = document.getElementById('akun-search-btn');
    const akunPerPageInput = document.getElementById('akun-per-page');

    // ================================
    // STATE
    // ================================
    let akunData = [];
    let guruData = [];
    let editIndex = null;
    let currentPage = 1;
    let perPage = 5;

    // ================================
    // LOAD GURU DAN AKUN DARI API
    // ================================
    function loadGuruData() {
        return fetch('/api/guru')
            .then(res => res.json())
            .then(data => {
                guruData = data;
                renderGuruSelect();
            });
    }

    function loadAkunData() {
        fetch('/api/akun')
            .then(res => res.json())
            .then(data => {
                akunData = data;
                renderTable();
            });
    }

    function renderGuruSelect() {
        akunGuruSelect.innerHTML = '<option value="">-- Pilih Guru --</option>';
        guruData.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id; // simpan id guru
            opt.textContent = g.nama;
            akunGuruSelect.appendChild(opt);
        });
    }

    loadGuruData().then(() => loadAkunData());

    // ================================
    // OPEN / CLOSE FORM
    // ================================
    addAkunBtn.addEventListener('click', openForm);
    akunCancelBtn.addEventListener('click', closeForm);

    function openForm() {
        akunFormContainer.classList.add('show');
        akunFormTitle.textContent = 'Buat Akun Guru';
        akunSaveBtn.textContent = 'Buat Akun';
        clearForm();
        editIndex = null;
    }

    function closeForm() {
        akunFormContainer.classList.remove('show');
        clearForm();
        clearErrors();
        editIndex = null;
    }

    function clearForm() {
        akunGuruSelect.value = '';
        akunUsername.value = '';
        akunPassword.value = '';
    }

    // ================================
    // TOGGLE PASSWORD
    // ================================
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (akunPassword.type === 'password') {
                akunPassword.type = 'text';
                togglePasswordBtn.textContent = '🙈';
            } else {
                akunPassword.type = 'password';
                togglePasswordBtn.textContent = '🫣';
            }
        });
    }

    // ================================
    // HILANGKAN ERROR SAAT DIKETIK
    // ================================
    [akunGuruSelect, akunUsername, akunPassword].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            const msg = input.parentElement.querySelector('.error-message');
            if (msg) msg.remove();
        });
    });

    // ================================
    // SIMPAN AKUN (POST / PUT)
    // ================================
    akunSaveBtn.addEventListener('click', saveAkun);

    function saveAkun() {
        clearErrors();
        let hasError = false;

        if (!akunGuruSelect.value) {
            showError(akunGuruSelect, 'Guru wajib dipilih');
            hasError = true;
        }

        if (!akunUsername.value.trim()) {
            showError(akunUsername, 'Username wajib diisi');
            hasError = true;
        } else if (akunUsername.value.trim().length < 5) {
            showError(akunUsername, 'Username minimal 5 karakter');
            hasError = true;
        }

        if (!akunPassword.value.trim()) {
            showError(akunPassword, 'Password wajib diisi');
            hasError = true;
        } else if (akunPassword.value.trim().length < 5) {
            showError(akunPassword, 'Password minimal 5 karakter');
            hasError = true;
        }

        // cek guru sudah punya akun
        const guruExist = akunData.some(a => a.guru_id == akunGuruSelect.value && (editIndex === null || a.id != akunData[editIndex].id));
        if (guruExist) {
            showError(akunGuruSelect, 'Guru ini sudah memiliki akun');
            hasError = true;
        }

        if (hasError) {
            showNotification('Periksa kembali data akun!', 'error');
            return;
        }

        const payload = {
            guru_id: akunGuruSelect.value,
            username: akunUsername.value.trim(),
            password: akunPassword.value.trim()
        };

        let url = '/api/akun/add';
        let method = 'POST';

        if (editIndex !== null) {
            url = `/api/akun/update/${akunData[editIndex].id}`;
            method = 'PUT';
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                showNotification(res.message, 'success');
                closeForm();
                loadAkunData();
            } else {
                showNotification(res.message, 'error');
            }
        })
        .catch(err => {
            console.error(err);
            showNotification('Terjadi error server', 'error');
        });
    }

    // ================================
    // RENDER TABLE
    // ================================
    function renderTable(data = akunData) {
        akunTableBody.innerHTML = '';
        const totalPages = Math.ceil(data.length / perPage);
        if (currentPage > totalPages) currentPage = totalPages || 1;

        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = data.slice(start, end);

        pageData.forEach((akun, index) => {
            const realIndex = start + index;
            const guru = guruData.find(g => g.id == akun.guru_id)?.nama || '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${realIndex + 1}</td>
                <td>${guru}</td>
                <td>${akun.username}</td>
                <td>
                    <span class="password-text">••••••</span>
                    <span class="toggle-table-password" style="cursor:pointer; margin-left:6px;">👁</span>
                </td>
                <td style="text-align:center;">
                    <img src="/static/icons/edit.png" class="edit-btn" style="width:24px;cursor:pointer;margin-right:10px;">
                    <img src="/static/icons/delete.png" class="delete-btn" style="width:24px;cursor:pointer;">
                </td>
            `;

            // toggle password
            const pwdText = tr.querySelector('.password-text');
            const togglePwd = tr.querySelector('.toggle-table-password');
            let visible = false;
            togglePwd.addEventListener('click', () => {
                if (!visible) {
                    pwdText.textContent = akun.password;
                    togglePwd.textContent = '🙈';
                } else {
                    pwdText.textContent = '••••••';
                    togglePwd.textContent = '👁';
                }
                visible = !visible;
            });

            // edit akun
            tr.querySelector('.edit-btn').addEventListener('click', () => {
                akunFormContainer.classList.add('show');
                akunFormTitle.textContent = 'Edit Akun Guru';
                akunSaveBtn.textContent = 'Simpan Perubahan';

                akunGuruSelect.value = akun.guru_id;
                akunUsername.value = akun.username;
                akunPassword.value = akun.password;

                editIndex = realIndex;
            });

            // delete akun
            tr.querySelector('.delete-btn').addEventListener('click', () => {
                showDeleteConfirm(guru, () => {
                    fetch(`/api/akun/delete/${akun.id}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(res => {
                            if (res.status === 'success') {
                                showNotification(res.message, 'success');
                                loadAkunData();
                            } else {
                                showNotification(res.message, 'error');
                            }
                        });
                });
            });

            akunTableBody.appendChild(tr);
        });

        akunTotalData.textContent = data.length;
        renderPagination(totalPages);
    }

    // ================================
    // PAGINATION
    // ================================
    function renderPagination(totalPages) {
        akunPagination.innerHTML = '';

        const prev = document.createElement('button');
        prev.textContent = 'Prev';
        prev.disabled = currentPage === 1;
        prev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
        akunPagination.appendChild(prev);

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = i === currentPage ? 'active' : '';
            btn.addEventListener('click', () => {
                currentPage = i;
                renderTable();
            });
            akunPagination.appendChild(btn);
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
        akunPagination.appendChild(next);
    }

    // ================================
    // SEARCH
    // ================================
    akunSearchBtn.addEventListener('click', doSearch);
    akunSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doSearch();
        }
    });

    function doSearch() {
        const keyword = akunSearchInput.value.toLowerCase().trim();
        if (!keyword) {
            renderTable();
            return;
        }

        const result = akunData.filter(a => {
            const guru = guruData.find(g => g.id == a.guru_id)?.nama.toLowerCase() || '';
            return guru.includes(keyword) || a.username.toLowerCase().includes(keyword);
        });

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
            <p>Anda yakin menghapus akun <b>${nama}</b>?</p>
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
// agar bisa diakses dari main.js
window.loadGuruData = loadGuruData;
window.loadAkunData = loadAkunData;
});
    