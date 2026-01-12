document.addEventListener('DOMContentLoaded', () => {

    // =======================
    // KONFIRMASI CUSTOM
    // =======================
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    /**
     * Tampilkan modal konfirmasi
     * @param {string} message Pesan konfirmasi
     * @returns {Promise<boolean>} true = setuju, false = batal
     */
    function showConfirm(message) {
        return new Promise((resolve) => {
            if (!confirmModal || !confirmMessage || !confirmYes || !confirmNo) {
                console.error('Element confirm modal tidak ditemukan!');
                resolve(false);
                return;
            }

            confirmMessage.textContent = message;
            confirmModal.classList.add('show');

            function handleYes() {
                resolve(true);
                closeModal();
            }

            function handleNo() {
                resolve(false);
                closeModal();
            }

            function closeModal() {
                confirmModal.classList.remove('show');
                confirmYes.removeEventListener('click', handleYes);
                confirmNo.removeEventListener('click', handleNo);
            }

            confirmYes.addEventListener('click', handleYes);
            confirmNo.addEventListener('click', handleNo);
        });
    }

    // =======================
    // SHORTCUT ENTER
    // =======================
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;

        const activeElement = document.activeElement;

        // Abaikan ENTER di input file (ganti foto)
        if (activeElement && activeElement.type === 'file') return;
        if (activeElement && activeElement.id === 'change-photo-btn') return;

        // Prioritas modal / form yang aktif
        const modalPriority = [
            document.getElementById('confirm-modal'),
            document.getElementById('akun-form-container'),
            document.getElementById('guru-form-container'),
            document.getElementById('profile-modal')
        ];

        for (const modal of modalPriority) {
            if (modal && modal.classList.contains('show')) {
                e.preventDefault();
                const saveBtn = modal.querySelector('#akun-save, #guru-save, #save-profile, #confirm-yes');
                if (saveBtn) saveBtn.click();
                return;
            }
        }

        // Prioritas input search
        const searchInputs = [
            { input: document.getElementById('akun-search-input'), btn: document.getElementById('akun-search-btn') },
            { input: document.getElementById('guru-search-input'), btn: document.getElementById('guru-search-btn') }
        ];

        for (const s of searchInputs) {
            if (s.input && activeElement === s.input) {
                e.preventDefault();
                if (s.btn) s.btn.click();
                return;
            }
        }
    });

});
