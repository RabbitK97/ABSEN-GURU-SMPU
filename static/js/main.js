// ================================
// main.js
// Navigation, Sidebar, Dropdown, Logout
// ================================

document.addEventListener('DOMContentLoaded', () => {

    // ================================
    // ELEMENT
    // ================================
    const sidebarLinks = document.querySelectorAll('.sidebar a, .bottom-nav a');
    const dropbtn = document.querySelector('.dropbtn');
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownContent = document.querySelector('.dropdown-content');

    const logoutBtn = document.querySelector('.logout');
    const sidebarLogoutBtn = document.getElementById('sidebar-logout');

    const contents = {
        dashboard: document.getElementById('dashboard-content'),
        master: document.getElementById('master-data-content'),
        guru: document.getElementById('akun-guru-content'),
        absensi: document.getElementById('absensi-content')
    };

    // ================================
    // FUNGSI TAMPILKAN KONTEN
    // ================================
    function showContent(menu) {
        Object.keys(contents).forEach(key => {
            if (contents[key]) contents[key].style.display = 'none';
        });

        if (contents[menu]) contents[menu].style.display = 'block';

        // Simpan menu aktif
        localStorage.setItem('activeMenu', menu);

        // Highlight menu aktif
        sidebarLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.icon === menu);
        });
    }

    // ================================
    // LOAD MENU TERAKHIR
    // ================================
    const activeMenu = localStorage.getItem('activeMenu') || 'dashboard';
    showContent(activeMenu);

    // ================================
    // EVENT KLIK MENU SIDEBAR & BOTTOM
    // ================================
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const menu = link.dataset.icon;
            if (!menu) return;

            e.preventDefault();
            showContent(menu);

            // ================================
            // LANGKAH 2: AUTO REFRESH DATA AKUN GURU
            // ================================
            if (menu === 'guru') {
                if (typeof loadGuruData === 'function') {
                    loadGuruData().then(() => {
                        if (typeof loadAkunData === 'function') loadAkunData();
                    });
                }
            }

            // === AUTO REFRESH DATA ===
            if (menu === 'guru') {
                // refresh dropdown & tabel akun guru
                if (typeof loadGuruData === 'function') {
                    loadGuruData().then(() => {
                        if (typeof loadAkunData === 'function') loadAkunData();
                    });
                }
            }

            if (menu === 'absensi') {
                // refresh dropdown guru dan tabel absensi
                if (typeof loadGuruToDropdown === 'function') loadGuruToDropdown();
                if (typeof loadAbsensiData === 'function') loadAbsensiData();
            }

        });
    });

    // ================================
    // DROPDOWN USER
    // ================================
    if (dropbtn && dropdownContent) {
        dropbtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
    }

    if (dropdownContent) {
        dropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Tutup dropdown jika klik di luar
    window.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target)) {
            dropdownContent?.classList.remove('show');
        }
    });

    // ================================
    // LOGOUT DROPDOWN
    // ================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('activeMenu');
            window.location.href = '/logout';
        });
    }

    // ================================
    // LOGOUT SIDEBAR
    // ================================
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('activeMenu');
            window.location.href = '/logout';
        });
    }

});
