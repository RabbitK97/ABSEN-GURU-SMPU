// ======================================
// profile.js (FINAL FIXED VERSION)
// Modal Profil, Cropper, Validasi, Batas Tahun
// ======================================

document.addEventListener('DOMContentLoaded', () => {

    console.log("PROFILE.JS LOADED");

    // ================================
    // ELEMENT
    // ================================
    const profileModal = document.getElementById('profile-modal');
    const editProfileBtn = document.getElementById('edit-profile');
    const closeProfileBtn = profileModal ? profileModal.querySelector('.close') : null;

    const modalPhoto = document.getElementById('modal-photo');
    const modalUploadPhoto = document.getElementById('modal-upload-photo');
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const saveProfileBtn = document.getElementById('save-profile');

    const nicknameInput = document.getElementById('nickname');
    const fullnameInput = document.getElementById('fullname');
    const genderInput = document.getElementById('gender');
    const birthplaceInput = document.getElementById('birthplace');
    const birthdateInput = document.getElementById('birthdate');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');

    const filterTahunInput = document.getElementById('filter-tahun');

    const userPhotoHeader = document.getElementById('user-photo');
    const dropbtn = document.querySelector('.dropbtn');

    // ================================
    // CROP ELEMENT
    // ================================
    const cropperModal = document.getElementById('cropper-modal');
    const cropperImage = document.getElementById('cropper-image');
    const cropSaveBtn = document.getElementById('crop-save');
    const cropperCloseBtn = cropperModal ? cropperModal.querySelector('.close') : null;

    let cropper = null;

    // ================================
    // SET BATAS TANGGAL LAHIR (1950 - 10 TAHUN LALU)
    // ================================
    if (birthdateInput) {
        const today = new Date();
        const maxYear = today.getFullYear() - 10;
        const minYear = 1950;

        const maxDate = new Date(maxYear, 11, 31).toISOString().split('T')[0];
        const minDate = new Date(minYear, 0, 1).toISOString().split('T')[0];

        birthdateInput.setAttribute('max', maxDate);
        birthdateInput.setAttribute('min', minDate);
    }

    // ================================
    // OPEN MODAL
    // ================================
    if (editProfileBtn && profileModal) {
        editProfileBtn.addEventListener('click', () => {
            profileModal.classList.add('show');
        });
    }

    // ================================
    // CLOSE MODAL
    // ================================
    if (closeProfileBtn && profileModal) {
        closeProfileBtn.addEventListener('click', () => {
            profileModal.classList.remove('show');
            resetProfileFormError();
        });
    }

    // ================================
    // CLICK OUTSIDE TO CLOSE
    // ================================
    window.addEventListener('click', (e) => {
        if (profileModal && e.target === profileModal) {
            profileModal.classList.remove('show');
            resetProfileFormError();
        }

        if (cropperModal && e.target === cropperModal) {
            closeCropperModal();
        }
    });

    // ================================
    // CHANGE PHOTO
    // ================================
    if (changePhotoBtn && modalUploadPhoto) {
        changePhotoBtn.addEventListener('click', () => {
            modalUploadPhoto.click();
        });
    }

    if (modalUploadPhoto) {
        modalUploadPhoto.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                if (!cropperImage || !cropperModal) return;

                cropperImage.src = e.target.result;
                cropperModal.classList.add('show');

                if (cropper) {
                    cropper.destroy();
                    cropper = null;
                }

                cropper = new Cropper(cropperImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    background: false,
                    zoomable: true
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // ================================
    // SAVE CROPPED PHOTO
    // ================================
    if (cropSaveBtn) {
        cropSaveBtn.addEventListener('click', () => {
            if (!cropper) {
                alert('Silakan pilih foto terlebih dahulu!');
                return;
            }

            const canvas = cropper.getCroppedCanvas({
                width: 150,
                height: 150
            });

            const croppedDataURL = canvas.toDataURL('image/png');

            if (modalPhoto) modalPhoto.src = croppedDataURL;
            if (userPhotoHeader) userPhotoHeader.src = croppedDataURL;

            closeCropperModal();
        });
    }

    if (cropperCloseBtn) {
        cropperCloseBtn.addEventListener('click', () => {
            closeCropperModal();
        });
    }

    function closeCropperModal() {
        if (cropperModal) cropperModal.classList.remove('show');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    // ================================
    // RESET ERROR
    // ================================
    function resetProfileFormError() {
        const fields = [
            nicknameInput,
            fullnameInput,
            genderInput,
            birthplaceInput,
            birthdateInput,
            phoneInput,
            emailInput
        ];

        fields.forEach(el => {
            if (!el) return;
            el.classList.remove('error');
            const msg = el.nextElementSibling;
            if (msg && msg.classList.contains('error-message')) {
                msg.classList.remove('show');
            }
        });
    }

    // ================================
    // REMOVE ERROR ON INPUT
    // ================================
    [
        nicknameInput,
        fullnameInput,
        genderInput,
        birthplaceInput,
        birthdateInput,
        phoneInput,
        emailInput
    ].forEach(el => {
        if (!el) return;
        el.addEventListener('input', () => {
            el.classList.remove('error');
            const msg = el.nextElementSibling;
            if (msg && msg.classList.contains('error-message')) {
                msg.classList.remove('show');
            }
        });
    });

    // ================================
    // BATASI INPUT FILTER TAHUN (MAX 4 DIGIT)
    // ================================
    if (filterTahunInput) {
        filterTahunInput.addEventListener('input', function () {
            let val = this.value;

            val = val.toString().replace(/[^0-9]/g, '');

            if (val.length > 4) {
                val = val.substring(0, 4);
            }

            this.value = val;
        });
    }

    // ================================
    // SAVE PROFILE
    // ================================
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {

            let hasError = false;

            const fields = [
                { el: nicknameInput, name: 'Nama Panggilan' },
                { el: fullnameInput, name: 'Nama Lengkap' },
                { el: genderInput, name: 'Jenis Kelamin' },
                { el: birthplaceInput, name: 'Tempat Lahir' },
                { el: birthdateInput, name: 'Tanggal Lahir' },
                { el: phoneInput, name: 'No. HP' },
                { el: emailInput, name: 'Email' }
            ];

            // Reset error
            fields.forEach(f => {
                if (!f.el) return;
                f.el.classList.remove('error');
                const msg = f.el.nextElementSibling;
                if (msg && msg.classList.contains('error-message')) {
                    msg.classList.remove('show');
                }
            });

            // Validasi kosong
            fields.forEach(f => {
                if (!f.el || !f.el.value.trim()) {
                    if (f.el) f.el.classList.add('error');

                    let msg = f.el ? f.el.nextElementSibling : null;
                    if (f.el && (!msg || !msg.classList.contains('error-message'))) {
                        msg = document.createElement('div');
                        msg.classList.add('error-message');
                        f.el.insertAdjacentElement('afterend', msg);
                    }
                    if (msg) {
                        msg.textContent = `${f.name} wajib diisi!`;
                        msg.classList.add('show');
                    }
                    hasError = true;
                }
            });

            if (hasError) {
                if (typeof showNotification === 'function') {
                    showNotification('Harap isi semua data wajib!', 'error');
                }
                return;
            }

            // =========================
            // VALIDASI TAHUN LAHIR
            // =========================
            if (birthdateInput && birthdateInput.value) {
                const birthDate = new Date(birthdateInput.value);
                const year = birthDate.getFullYear();
                const today = new Date();
                const minYear = 1950;
                const maxYear = today.getFullYear() - 10;

                if (year < minYear || year > maxYear) {
                    birthdateInput.classList.add('error');

                    let msg = birthdateInput.nextElementSibling;
                    if (!msg || !msg.classList.contains('error-message')) {
                        msg = document.createElement('div');
                        msg.classList.add('error-message');
                        birthdateInput.insertAdjacentElement('afterend', msg);
                    }
                    msg.textContent = `Tahun lahir harus antara ${minYear} dan ${maxYear}`;
                    msg.classList.add('show');

                    if (typeof showNotification === 'function') {
                        showNotification('Tanggal lahir tidak valid!', 'error');
                    }
                    return;
                }
            }

            // =========================
            // VALIDASI HP
            // =========================
            if (phoneInput && phoneInput.value && !/^\+?[0-9]+$/.test(phoneInput.value.trim())) {
                phoneInput.classList.add('error');

                let msg = phoneInput.nextElementSibling;
                if (!msg || !msg.classList.contains('error-message')) {
                    msg = document.createElement('div');
                    msg.classList.add('error-message');
                    phoneInput.insertAdjacentElement('afterend', msg);
                }
                msg.textContent = 'Nomor HP hanya boleh angka dan + di awal';
                msg.classList.add('show');

                if (typeof showNotification === 'function') {
                    showNotification('Nomor HP tidak valid!', 'error');
                }
                return;
            }

            // =========================
            // VALIDASI EMAIL
            // =========================
            if (emailInput && emailInput.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailInput.value.trim())) {
                    emailInput.classList.add('error');

                    let msg = emailInput.nextElementSibling;
                    if (!msg || !msg.classList.contains('error-message')) {
                        msg = document.createElement('div');
                        msg.classList.add('error-message');
                        emailInput.insertAdjacentElement('afterend', msg);
                    }
                    msg.textContent = 'Format email tidak valid (contoh: nama@email.com)';
                    msg.classList.add('show');

                    if (typeof showNotification === 'function') {
                        showNotification('Email tidak valid!', 'error');
                    }
                    return;
                }
            }

            // =========================
            // UPDATE HEADER NICKNAME
            // =========================
            if (dropbtn && nicknameInput) {
                dropbtn.textContent = `Hai, ${nicknameInput.value.trim()} ▾`;
            }

            if (profileModal) profileModal.classList.remove('show');

            if (typeof showNotification === 'function') {
                showNotification('Perubahan profil berhasil disimpan!', 'success');
            }

        });
    }

});
