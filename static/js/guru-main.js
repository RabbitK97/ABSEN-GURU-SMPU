document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ANGRY ANIMATION (TERLAMBAT)
    // =========================
    let angryAnimation = lottie.loadAnimation({
        container: document.getElementById('angry-animation'),
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: '/static/icons/angry.json'
    });

    // =========================
    // WARNING SOUND
    // =========================
    const warningSound = new Audio('/static/sounds/warning.wav');
    warningSound.preload = 'auto';
    warningSound.loop = true;

    
    // ======================
    // GLOBAL VARIABLES
    // ======================
    const todayISO = new Date().toISOString().split('T')[0];
    const todayKey = 'absen_' + todayISO;

    const izinPulangDuluanKey = 'izin_pulang_duluan_' + todayKey;

    let absenHariIni = localStorage.getItem(todayKey);
    let izinTimerInterval = null;
    let currentAction = null;
    let absensiData = [];

    // ======================
    // Helper format 24 jam
    // ======================
    function formatJam24(inputJam) {
        // inputJam = string dari input, contoh: "7:5" atau "07:05"
        const [h, m] = inputJam.split(':');
        const jam = String(h).padStart(2,'0');
        const menit = String(m).padStart(2,'0');
        return `${jam}:${menit}`;
    }

    // ======================
    // ELEMENTS
    // ======================
    const sidebarLinks = document.querySelectorAll('.sidebar a[data-icon], .bottom-nav a[data-icon]');
    const dashboardContent = document.getElementById('dashboard-content');
    const absensiContent = document.getElementById('absensi-content');
    const izinKeluarContent = document.getElementById('izin-keluar-content');

    const jamDigital = document.getElementById('jam-digital');
    const jamIzin = document.getElementById('jam-izin');
    const tanggalIzin = document.getElementById('tanggal-izin');

    const btnAbsenMasuk = document.getElementById('btn-absen-masuk');
    const btnAbsenKeluar = document.getElementById('btn-absen-keluar');
    const btnPulangDuluan = document.getElementById('btn-pulang-duluan');
    const btnIzin = document.getElementById('btn-izin');
    const izinNotif = document.getElementById('izin-notif');
    const btnResetDev = document.getElementById('btn-reset-dev');

    const izinSubmitBtn = document.getElementById('izin-submit');
    const izinCountdown = document.getElementById('izin-countdown');
    const izinTimeWrapper = document.getElementById('izin-time-wrapper');
    const modalJamMulai = document.getElementById('modal-jam-mulai');
    const modalJamSelesai = document.getElementById('modal-jam-selesai');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalForm = document.getElementById('modal-form');
    const modalTitle = document.getElementById('modal-title');
    const modalInput = document.getElementById('modal-input');
    const modalSubmit = document.getElementById('modal-submit');
    const modalCancel = document.getElementById('modal-cancel');
    const terlambatBanner = document.getElementById('terlambat-banner');

    const absensiTableBody = document.querySelector('#absensi-table tbody');
    const izinTableBody = document.querySelector('#izin-keluar-table tbody');
    const dashboardChartCanvas = document.getElementById('grafik-absensi');

    let dashboardChart = null;

    // ======================
    // FILTER BULAN DASHBOARD
    // ======================
    const filterBulan = document.getElementById('filter-bulan-dashboard');
    let currentFilterStatus = 'all';

    filterBulan.addEventListener('change', () => {
        currentFilterStatus = filterBulan.value || 'all';
        updateDashboardChart(); // update chart saat filter berubah
    });

    // ======================
    // FILTER TAHUN DASHBOARD
    // ======================
    const filterTahunDashboard = document.getElementById('filter-tahun-dashboard');

    if (filterTahunDashboard) {
        const tahunSekarang = new Date().getFullYear();
        filterTahunDashboard.innerHTML = '<option value="">Semua Tahun</option>';

        for (let i = tahunSekarang; i >= tahunSekarang - 5; i--) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            filterTahunDashboard.appendChild(opt);
        }
    }

    let currentFilterTahun = 'all';

    if(filterTahunDashboard){
        filterTahunDashboard.addEventListener('change', () => {
            currentFilterTahun = filterTahunDashboard.value || 'all';
            updateDashboardChart();
        });
    }
    
    // ======================
    // FILTER BULAN ABSENSI
    // ======================
    const filterBulanAbsensi = document.getElementById('filter-bulan-absensi');
    const filterTahunAbsensi = document.getElementById('filter-tahun-absensi');

        if (filterTahunAbsensi) {
            const currentYear = new Date().getFullYear();
            filterTahunAbsensi.innerHTML = '<option value="">Semua Tahun</option>';

            for (let y = currentYear; y >= currentYear - 5; y--) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                filterTahunAbsensi.appendChild(opt);
            }
        }

    // ======================
    // FILTER FUNCTION ABSENSI (TABLE)
    // ======================
    function applyFilterAbsensi() {
        if (!filterBulanAbsensi || !filterTahunAbsensi || !absensiTableBody) return;

        const bulan = filterBulanAbsensi.value;
        const tahun = filterTahunAbsensi.value;

        const rows = absensiTableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const tanggalCell = row.children[1]; // kolom tanggal (index 1 karena: 0 = No, 1 = Tanggal)
            if (!tanggalCell) return;

            const tanggalText = tanggalCell.textContent.trim();
            let show = true;

            if (tanggalText) {
                const parts = tanggalText.split('-'); // format: YYYY-MM-DD
                const rowYear = parts[0];
                const rowMonth = parts[1];

                if (bulan && rowMonth !== bulan) show = false;
                if (tahun && rowYear !== tahun) show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    }

    // ======================
    // EVENT FILTER ABSENSI (TABLE)
    // ======================
    if (filterBulanAbsensi) {
        filterBulanAbsensi.addEventListener('change', applyFilterAbsensi);
    }

    if (filterTahunAbsensi) {
        filterTahunAbsensi.addEventListener('change', applyFilterAbsensi);
    }

    // ======================
    // FILTER BULAN IZIN KELUAR
    // ======================
    const filterBulanIzin = document.getElementById('filter-bulan-izin');
    const filterTahunIzin = document.getElementById('filter-tahun-izin');

        if (filterTahunIzin) {
            const currentYear = new Date().getFullYear();
            filterTahunIzin.innerHTML = '<option value="">Semua Tahun</option>';

            for (let y = currentYear; y >= currentYear - 5; y--) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                filterTahunIzin.appendChild(opt);
            }
        }

    // ======================
    // FILTER FUNCTION ABSENSI (TABLE)
    // ======================
    function applyFilterIzin() {
        if (!filterBulanIzin || !filterTahunIzin || !izinTableBody) return;

        const bulan = filterBulanIzin.value;
        const tahun = filterTahunIzin.value;

        const rows = izinTableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const tanggalCell = row.children[1];
            if (!tanggalCell) return;

            const tanggalText = tanggalCell.textContent.trim();
            let show = true;

            if (tanggalText) {
                const parts = tanggalText.split('-');
                const rowYear = parts[0];
                const rowMonth = parts[1];

                if (bulan && rowMonth !== bulan) show = false;
                if (tahun && rowYear !== tahun) show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    }

    // ======================
    // EVENT FILTER IZIN KELUAR (TABLE)
    // ======================
    if (filterBulanIzin) {
        filterBulanIzin.addEventListener('change', applyFilterIzin);
    }

    if (filterTahunIzin) {
        filterTahunIzin.addEventListener('change', applyFilterIzin);
    }

    // ======================
    // HELPER FUNCTION
    // ======================
    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch(e) {
            console.error('Gagal menyimpan status:', e);
            alert('Status absensi gagal tersimpan. Mohon bersihkan storage browser atau hubungi admin.');
            return false;
        }
    }

    function clearIzinKeluarHariIni() {
        if (izinTimerInterval) {
            clearInterval(izinTimerInterval);
            izinTimerInterval = null;
        }

        if (izinCountdown) {
            izinCountdown.textContent = '';
        }
    }

    function resetIzinKeluarUIState(){
        if (izinTimerInterval) {
            clearInterval(izinTimerInterval);
            izinTimerInterval = null;
        }

        if (izinCountdown) {
            izinCountdown.textContent = '';
        }
        localStorage.removeItem(todayKey + '_izin_selesai');
    }

    function updateIzinKeluarUI(){
        const statusHariIni = localStorage.getItem(todayKey);
        const banner = document.getElementById('izin-status-banner');
        const btn = document.getElementById('izin-submit');

        if(!banner || !btn) return;

        banner.style.display = 'block';

        const jamKeluar = localStorage.getItem(todayKey + '_jam_keluar');
        const pulangDuluan = localStorage.getItem(todayKey + '_pulang_duluan');
        const izinData = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
        const izinSelesai = localStorage.getItem(todayKey + '_izin_selesai');

        // ================================
        // 1. SUDAH KELUAR / PULANG
        // ================================
        if(jamKeluar || pulangDuluan){
            banner.className = 'izin-status-banner error';
            banner.textContent = '✅ Anda telah absen keluar. Izin keluar tidak tersedia.';
            btn.disabled = true;
            btn.style.opacity = 0.5;
            btn.style.cursor = 'not-allowed';
            return;
        }

        // ================================
        // 1.5 IZIN SUDAH BERAKHIR
        // ================================
        if(izinSelesai){
            banner.className = 'izin-status-banner error';
            banner.textContent = '⚠️ Izin keluar telah berakhir. Pastikan Anda sudah kembali ke sekolah.';
            btn.disabled = true;
            btn.style.opacity = 0.5;
            btn.style.cursor = 'not-allowed';
            return;
        }

        // ================================
        // 2. SEDANG IZIN KELUAR
        // ================================
        if(izinData.length > 0 && !localStorage.getItem(todayKey + '_izin_selesai')){
            banner.className = 'izin-status-banner warning';
            // biarkan timer yang isi text
            btn.disabled = true;
            btn.style.opacity = 0.5;
            btn.style.cursor = 'not-allowed';
            return;
        }

        // ================================
        // 3. SUDAH ABSEN MASUK / TERLAMBAT
        // ================================
        if(statusHariIni === 'masuk' || statusHariIni === 'terlambat'){
            banner.className = 'izin-status-banner success';
            banner.textContent = '✅ Anda sudah absen, silakan ajukan izin keluar.';
            btn.disabled = false;
            btn.style.opacity = 1;
            btn.style.cursor = 'pointer';
            return;
        }

        // ================================
        // 4. IZIN TIDAK MASUK
        // ================================
        if(statusHariIni === 'izin_tidak_masuk'){
            banner.className = 'izin-status-banner error';
            banner.textContent = '❌ Anda izin tidak masuk hari ini, tidak bisa izin keluar.';
            btn.disabled = true;
            btn.style.opacity = 0.5;
            btn.style.cursor = 'not-allowed';
            return;
        }

        // ================================
        // 5. BELUM ABSEN APA-APA
        // ================================
        banner.className = 'izin-status-banner warning';
        banner.textContent = '⚠️ Anda belum absen masuk, silakan absen terlebih dahulu.';
        btn.disabled = true;
        btn.style.opacity = 0.5;
        btn.style.cursor = 'not-allowed';
    }

    function handleIzinKeluarSubmit(){
        const statusHariIni = localStorage.getItem(todayKey);
        const jamKeluar = localStorage.getItem(todayKey+'_jam_keluar');
        const pulangDuluan = localStorage.getItem(todayKey+'_pulang_duluan');

        if(jamKeluar || pulangDuluan){
            alert('Absensi hari ini sudah selesai. Tidak bisa mengajukan izin keluar.');
            return;
        }

        if(statusHariIni !== 'masuk' && statusHariIni !== 'terlambat'){
            alert('Anda belum absen masuk, tidak bisa mengajukan izin keluar.');
            return;
        }

        const jamMulai = document.getElementById('izin-jam-mulai').value;   // "HH:MM"
        const jamSelesai = document.getElementById('izin-jam-selesai').value; // "HH:MM"
        const alasan = document.getElementById('izin-alasan').value.trim();

        if(!jamMulai || !jamSelesai || !alasan){
            alert('Jam mulai, jam selesai, dan alasan wajib diisi!');
            return;
        }

        if(jamSelesai <= jamMulai){
            alert('Jam selesai harus lebih besar dari jam mulai!');
            return;
        }

        let izinData = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');

        izinData.push({ jamMulai, jamSelesai, alasan });

        localStorage.setItem('izin_keluar_' + todayKey, JSON.stringify(izinData));

       // reset form
        document.getElementById('izin-jam-mulai').value = '';
        document.getElementById('izin-jam-selesai').value = '';
        document.getElementById('izin-alasan').value = '';

        startIzinBannerTimer();
        renderIzinTable();
        updateAbsensiButtons();
    }

    // ======================
    // POPUP TERLAMBAT
    // ======================
    function showTerlambatPopup(callback){
        const popup = document.getElementById('terlambat-popup');
        if(!popup) return;

        popup.classList.add('show');

        setTimeout(() => {
            popup.classList.remove('show');

            setTimeout(() => {
                if(typeof callback === 'function'){
                    callback();
                }
            }, 400);

        }, 2000); // tampil 2 detik
    }


    // ======================
    // JAM DIGITAL
    // ======================
    function updateJam() {
        const now = new Date();
        const jamDash = document.getElementById('jam-dashboard');
        const tanggalDash = document.getElementById('tanggal-dashboard');
        if(jamDash && tanggalDash){
            jamDash.textContent = now.toLocaleTimeString('id-ID', { hour12:false });
            tanggalDash.textContent = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }
        if(jamDigital){
            jamDigital.textContent = now.toLocaleTimeString('id-ID', { hour12:false });
            document.getElementById('tanggal-absensi').textContent = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }
    }
    setInterval(updateJam, 1000);
    updateJam();

    function updateJamIzin() {
        const now = new Date();
        if(jamIzin && tanggalIzin){
            jamIzin.textContent = now.toLocaleTimeString('id-ID', {hour12:false});
            tanggalIzin.textContent = now.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        }
    }
    setInterval(updateJamIzin, 1000);
    updateJamIzin();

    // ======================
    // MODAL
    // ======================
    function openModal(title, placeholder, action){
        modalTitle.textContent = title;
        modalInput.placeholder = placeholder;
        modalInput.value = '';
        currentAction = action;

        // === BANNER & ANIMASI TERLAMBAT ===
        if(action === 'terlambat'){
            terlambatBanner.style.display = 'block';

            const angryWrap = document.getElementById('angry-animation-wrapper');
            angryWrap.style.display = 'block';

            angryWrap.classList.remove('angry-shake','angry-pulse');
            void angryWrap.offsetWidth;
            angryWrap.classList.add('angry-shake','angry-pulse');

            modalForm.classList.add('warning');

            angryAnimation.goToAndPlay(0, true);

            // =========================
            // UNLOCK AUDIO (ANTI BLOKIR BROWSER)
            // =========================
            document.addEventListener('click', function unlockAudio(){
                warningSound.play().then(() => {
                    warningSound.pause();
                    warningSound.currentTime = 0;
                    warningSound.play().catch(err => {
                        console.log('Sound blocked:', err);
                    });
                }).catch(()=>{});
                document.removeEventListener('click', unlockAudio);
            });
        } else {
            terlambatBanner.style.display = 'none';

            // sembunyikan animasi
            document.getElementById('angry-animation-wrapper').style.display = 'none';
            angryAnimation.stop();
        }

        if(izinTimeWrapper){
            izinTimeWrapper.style.display = (action === 'izin_keluar') ? 'flex' : 'none';
            modalJamMulai.value = '';
            modalJamSelesai.value = '';
        }

        modalOverlay.style.display = 'block';
        modalForm.style.display = 'block';
    }

    function closeModal(){
        warningSound.pause();
        warningSound.currentTime = 0;

        modalOverlay.style.display = 'none';
        modalForm.style.display = 'none';
        modalInput.value = '';
        currentAction = null;

        terlambatBanner.style.display = 'none';

        const angryWrap = document.getElementById('angry-animation-wrapper');
        angryWrap.style.display = 'none';
        angryWrap.classList.remove('angry-shake','angry-pulse');

        modalForm.classList.remove('warning');

        angryAnimation.stop();

        // =====================
        // STOP SOUND
        // =====================
        warningSound.pause();
        warningSound.currentTime = 0;
    }

    modalCancel.addEventListener('click', () => {
        warningSound.pause();
        warningSound.currentTime = 0;
        closeModal();
    });

    modalOverlay.addEventListener('click', () => {
        warningSound.pause();
        warningSound.currentTime = 0;
        closeModal();
    });

    // ======================
    // IZIN KELUAR TABLE
    // ======================
    function renderIzinTable() {
        const data = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
        izinTableBody.innerHTML = '';
        data.forEach((row, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx+1}</td>
                <td>${new Date().toLocaleDateString('id-ID')}</td>
                <td>${row.jamMulai}</td>
                <td>${row.jamSelesai}</td>
                <td>${row.alasan}</td>
            `;
            izinTableBody.appendChild(tr);
        });
    }

    // ======================
    // COUNTDOWN IZIN KELUAR
    // ======================
    function startIzinBannerTimer() {
        if (izinTimerInterval) {
            clearInterval(izinTimerInterval);
            izinTimerInterval = null;
        }

        const data = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
        if(data.length === 0) return;

        const terakhir = data[data.length - 1];
        const banner = document.getElementById('izin-status-banner');
        if(!banner) return;

        // ======================
        // Hitung jam mulai dan selesai
        // ======================
        const now = new Date();

        const [mulaiH, mulaiM] = terakhir.jamMulai.split(':');
        const [selesaiH, selesaiM] = terakhir.jamSelesai.split(':');

        const startTime = new Date();
        startTime.setHours(parseInt(mulaiH), parseInt(mulaiM), 0, 0);

        const endTime = new Date();
        endTime.setHours(parseInt(selesaiH), parseInt(selesaiM), 0, 0);

        function updateBannerTimer() {
            const now = new Date();

            // ===== CEK PAKSA PULANG / PULANG DULUAN =====
            const jamKeluarLS = localStorage.getItem(todayKey + '_jam_keluar');
            const pulangDuluanLS = localStorage.getItem(todayKey + '_pulang_duluan');
            if(jamKeluarLS || pulangDuluanLS){
                // hentikan countdown paksa
                if(izinTimerInterval){
                    clearInterval(izinTimerInterval);
                    izinTimerInterval = null;
                }

                banner.className = 'izin-status-banner error';
                banner.textContent = '✅ Anda telah absen keluar. Izin keluar dihentikan.';
                updateIzinKeluarUI();
                updateAbsensiButtons();
                return;
            }

            // ===== SEBELUM JAM MULAI =====
            if(now < startTime){
                banner.className = 'izin-status-banner warning';
                banner.textContent = `⏳ Countdown izin akan dimulai pukul ${terakhir.jamMulai}`;
                return;
            }

            // ===== IZIN SELESAI =====
            if(now >= endTime){
                banner.className = 'izin-status-banner error';
                banner.textContent = '⚠️ Izin keluar telah berakhir. Pastikan Anda sudah kembali ke sekolah.';
                localStorage.setItem(todayKey + '_izin_selesai', '1');

                if(izinTimerInterval){
                    clearInterval(izinTimerInterval);
                    izinTimerInterval = null;
                }
                updateIzinKeluarUI();
                updateAbsensiButtons();
                return;
            }

            // ===== COUNTDOWN AKTIF =====
            const diff = endTime - now;
            const jam = Math.floor(diff / 1000 / 3600);
            const menit = Math.floor((diff / 1000 % 3600) / 60);
            const detik = Math.floor((diff / 1000) % 60);

            banner.className = 'izin-status-banner warning';
            banner.textContent = `⏳ Anda sedang izin keluar. Sisa waktu: ${jam} jam ${menit} menit ${detik} detik`;
        }

        // update pertama
        updateBannerTimer();
        // interval setiap detik
        izinTimerInterval = setInterval(updateBannerTimer, 1000);
    }


    // ======================
    // ABSENSI BUTTONS
    // ======================
    function updateAbsensiButtons() {
        // =====================
        // PROTEKSI IZIN KELUAR (ANTI DIANGGAP KELUAR)
        // =====================
        const izinKeluarDataProteksi = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
        const jamKeluarProteksi = localStorage.getItem(todayKey + '_jam_keluar');

        // Jika ada izin keluar tapi tidak ada jam keluar, JANGAN dianggap keluar
        if (izinKeluarDataProteksi.length > 0 && !jamKeluarProteksi) {
            const statusSekarang = localStorage.getItem(todayKey);

            if (statusSekarang === 'keluar') {
                // balikin ke masuk (karena ini pasti bug)
                localStorage.setItem(todayKey, 'masuk');
                absenHariIni = 'masuk';
            }
        }

        absenHariIni = localStorage.getItem(todayKey);
        const izinMasukDone = localStorage.getItem('izin_masuk_done');
        const jamKeluarLS = localStorage.getItem(todayKey+'_jam_keluar');
        const izinPulangDone = localStorage.getItem(izinPulangDuluanKey);

        if (jamKeluarLS || izinPulangDone) {
            resetIzinKeluarUIState();
        }

        const izinKeluarData = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');

        const statusHariIni = localStorage.getItem(todayKey);
        if(izinSubmitBtn){
            const izinData = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
            const izinSelesai = localStorage.getItem(todayKey + '_izin_selesai');

            if((statusHariIni === 'masuk' || statusHariIni === 'terlambat') && izinData.length === 0 && !izinSelesai){
                izinSubmitBtn.disabled = false;
                izinSubmitBtn.style.opacity = 1;
                izinSubmitBtn.style.cursor = 'pointer';
            } else {
                izinSubmitBtn.disabled = true;
                izinSubmitBtn.style.opacity = 0.5;
                izinSubmitBtn.style.cursor = 'not-allowed';
            }
        }

        const pulangDuluanDone = localStorage.getItem(todayKey+'_pulang_duluan');
        if(pulangDuluanDone){
            showAbsensiSelesai();
            return
        }

        if(jamKeluarLS){
            showAbsensiSelesai();
            return;
        }

        if(absenHariIni === 'izin_tidak_masuk'){
            btnAbsenMasuk.style.display = 'none';
            btnIzin.style.display = 'none';

            btnAbsenKeluar.style.display = 'none';
            btnPulangDuluan.style.display = 'none';
            if(izinNotif){
                izinNotif.style.display = 'block';
                izinNotif.textContent = localStorage.getItem('izin_notif_text_' + todayKey) || '';
            }
            return;
        }

        if(absenHariIni === 'masuk' || absenHariIni === 'terlambat'){
            btnAbsenMasuk.style.display = 'none';
            btnIzin.style.display = 'none';

            btnAbsenKeluar.style.display = 'inline-block';
            btnPulangDuluan.style.display = 'inline-block';
        } else if(absenHariIni === 'keluar'){
            showAbsensiSelesai();
        } else {
            btnAbsenMasuk.style.display = 'inline-block';
            btnIzin.style.display = 'inline-block';
            btnAbsenKeluar.style.display = 'none';
            btnPulangDuluan.style.display = 'none';

            if(izinMasukDone){
                btnAbsenMasuk.disabled = true;
                btnAbsenMasuk.style.opacity = 0.6;
                btnIzin.disabled = true;
                btnIzin.style.opacity = 0.6;
                if(izinNotif) izinNotif.style.display = 'block';
            } else {
                btnAbsenMasuk.disabled = false; btnAbsenMasuk.style.opacity = 1;
                btnIzin.disabled = false; btnIzin.style.opacity = 1;
                if(izinNotif){ izinNotif.style.display = 'none'; izinNotif.textContent = ''; }
            }
        }
        updateIzinKeluarUI();
    }

    function showAbsensiSelesai(){
        btnAbsenMasuk.style.display = 'none';
        btnIzin.style.display = 'none';

        btnAbsenKeluar.style.display = 'none';
        btnPulangDuluan.style.display = 'none';

        if(izinNotif){
            izinNotif.style.display = 'block';
            izinNotif.textContent = '✅ Absensi hari ini sudah selesai. Terima kasih!';
        }
    }

    // ======================
    // MODAL SUBMIT
    // ======================
    modalSubmit.addEventListener('click', () => {
        // =====================
        // STOP SOUND
        // =====================
        warningSound.pause();
        warningSound.currentTime = 0;

        const val = modalInput.value.trim();
        if(!val && currentAction !== 'izin_keluar'){ alert('Keterangan wajib diisi!'); return; }

        if(currentAction === 'izin_masuk'){
            const alasanIzin = modalInput.value.trim();
            if(!alasanIzin){ alert('Keterangan wajib diisi!'); return; }

            absenHariIni = 'izin_tidak_masuk';
            localStorage.setItem(todayKey, 'izin_tidak_masuk');
            localStorage.setItem('izin_masuk_done', '1');
            localStorage.setItem(todayKey + '_alasan_izin', alasanIzin);

            // =========================
            // SIMPAN NOTIF KE LOCALSTORAGE (INI KUNCI UTAMA)
            // =========================
            const notifText = 'Yaaaahh sayang sekali. Semoga urusanmu segeras selesai dan masuk kembali!';
            localStorage.setItem('izin_notif_text_' + todayKey, notifText);

            if(izinNotif){ 
                izinNotif.textContent = notifText;
                izinNotif.style.display = 'block'; 
            }

            updateAbsensiButtons();
            loadAbsensi().then(updateDashboardChart);
            closeModal();
        }

        if(currentAction === 'pulang_duluan'){
            const sekarang = new Date();
            const pulangDuluanData = {
                jamPulang: sekarang.toLocaleTimeString('id-ID',{hour12:false}),
                alasan: modalInput.value.trim()
            };
            
            localStorage.setItem(todayKey+'_pulang_duluan', JSON.stringify(pulangDuluanData));
            localStorage.setItem(todayKey+'_jam_keluar', pulangDuluanData.jamPulang);
            localStorage.removeItem(todayKey + '_izin_selesai');
            
            resetIzinKeluarUIState();
            updateAbsensiButtons();
            loadAbsensi().then(updateDashboardChart);
            closeModal();
        }

        if(currentAction === 'terlambat'){
            absenHariIni='terlambat';
            localStorage.setItem(todayKey,'terlambat');
            localStorage.setItem(todayKey+'_alasan', val);

            const sekarang = new Date();
            localStorage.setItem(todayKey+'_jam_masuk', sekarang.toLocaleTimeString('id-ID',{hour12:false}));

            // HILANGKAN BANNER & ANIMASI + EFFECT
            terlambatBanner.style.display = 'none';

            const angryWrap = document.getElementById('angry-animation-wrapper');
            angryWrap.style.display = 'none';
            angryWrap.classList.remove('angry-shake','angry-pulse');

            modalForm.classList.remove('warning');

            angryAnimation.stop();

            updateAbsensiButtons();
            loadAbsensi().then(updateDashboardChart);
            closeModal();
        }
    });

    // ======================
    // NAVIGATION
    // ======================
    function setActiveMenu(menu){
        // sembunyikan semua konten
        dashboardContent.style.display = 'none';
        absensiContent.style.display = 'none';
        izinKeluarContent.style.display = 'none';

        // tampilkan konten sesuai menu
        if(menu === 'dashboard') {
            dashboardContent.style.display = 'block';
            loadAbsensi().then(updateDashboardChart);
        } else if(menu === 'absensi') {
            absensiContent.style.display = 'block';
            updateAbsensiButtons();
            loadAbsensi();
        } else if(menu === 'izin-keluar') {
            izinKeluarContent.style.display = 'block';
            renderIzinTable();
            updateJamIzin();
            updateIzinKeluarUI();
            startIzinBannerTimer();
        }

        // update sidebar active class
        sidebarLinks.forEach(l => l.classList.remove('active'));
        document.querySelector(`.sidebar a[data-icon="${menu}"]`)?.classList.add('active');

        // simpan menu aktif ke localStorage
        localStorage.setItem('activeMenu', menu);
    }
    sidebarLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const menu = link.dataset.icon;
            setActiveMenu(menu);
        });
    });

    // ======================
    // LOAD ABSENSI HARI INI
    // ======================
    function loadAbsensi(){
        const today = new Date().toISOString().split('T')[0];

        return fetch('/api/absensi')
            .then(r=>r.json())
            .then(apiData=>{
                let absensiHariIni = apiData.filter(a=>a.tanggal===today);

                const statusLS = localStorage.getItem(todayKey);
                const izinAlasan = localStorage.getItem(todayKey+'_alasan_izin') || '';
                const jamMasukLS = localStorage.getItem(todayKey+'_jam_masuk') || '';
                const jamKeluarLS = localStorage.getItem(todayKey+'_jam_keluar') || '';
                const alasanTerlambat = localStorage.getItem(todayKey+'_alasan') || '';

                if(absensiHariIni.length===0) absensiHariIni.push({ tanggal: today, status:null, jamMasuk:'', jamPulang:'', alasan:'' });

                if(statusLS){
                    absensiHariIni[0].status = statusLS;
                    absensiHariIni[0].jamMasuk = jamMasukLS;
                    absensiHariIni[0].jamPulang = jamKeluarLS;
                    absensiHariIni[0].alasan = izinAlasan || alasanTerlambat;
                }

                absensiData = absensiHariIni;
                renderTable();
                renderDashboardChart();
            });
    }

    function renderTable(){
        absensiTableBody.innerHTML='';
        let nomor = 1;

        absensiData.forEach((a) => {
            const tr = document.createElement('tr');

            // Tentukan status utama
            let statusTampil='', jamMasuk=a.jamMasuk||'', jamPulang=a.jamPulang||'', keterangan=a.alasan||'';

            if(a.status==='masuk') statusTampil='Masuk';
            else if(a.status==='terlambat') statusTampil='Terlambat';
            else if(a.status==='keluar') statusTampil='keluar';
            else if(a.status==='izin_tidak_masuk') statusTampil='Izin Tidak Masuk';

            if(a.status==='izin_tidak_masuk'){
                tr.style.backgroundColor = '#f8d7da'; // merah muda aman untuk tabel
                tr.style.color = '#721c24';
            }

            if(a.status === 'terlambat'){
                tr.style.backgroundColor = '#fff5d8';
                tr.style.color = '#000000';
            }

            tr.innerHTML = `
                <td>${nomor}</td>
                <td>${a.tanggal}</td>
                <td>${statusTampil}</td>
                <td>${jamMasuk}</td>
                <td>${jamPulang}</td>
                <td>${keterangan}</td>
            `;
            absensiTableBody.appendChild(tr);
            nomor++;

            // Cek Pulang Duluan
            const pdKey = getPulangDuluanKeyFromDate(a.tanggal);
            const pulangDuluanData = JSON.parse(localStorage.getItem(pdKey) || 'null');
            if(pulangDuluanData){
                const trPulang = document.createElement('tr');
                trPulang.style.backgroundColor = '#ffe0b2';
                trPulang.innerHTML = `
                    <td>${nomor}</td>
                    <td>${a.tanggal}</td>
                    <td>Pulang Duluan</td>
                    <td></td>
                    <td>${pulangDuluanData.jamPulang}</td>
                    <td>${pulangDuluanData.alasan}</td>
                `;
                absensiTableBody.appendChild(trPulang);
                nomor++;
            }

            // Cek Izin Keluar
            const izinKey = getIzinKeluarKeyFromDate(a.tanggal);
            const izinData = JSON.parse(localStorage.getItem(izinKey) || '[]');
            izinData.forEach(iz => {
                const trIzin = document.createElement('tr');
                trIzin.style.backgroundColor = '#fff3cd';
                trIzin.innerHTML = `
                    <td>${nomor}</td>
                    <td>${a.tanggal}</td>
                    <td>Izin Keluar</td>
                    <td>${iz.jamMulai}</td>
                    <td>${iz.jamSelesai}</td>
                    <td>${iz.alasan}</td>
                `;
                absensiTableBody.appendChild(trIzin);
                nomor++;
            });

            // Jika ada Pulang Duluan, buat baris tambahan
            if(a.status === 'keluar' && a.pulangDuluan){
                const trPulang = document.createElement('tr');
                trPulang.style.backgroundColor = '#ffe0b2'; // orange muda
                trPulang.innerHTML = `
                    <td>${idx+1}</td>
                    <td>${a.tanggal}</td>
                    <td>Pulang Duluan</td>
                    <td></td>
                    <td>${a.pulangDuluan.jamPulang}</td>
                    <td>${a.pulangDuluan.alasan}</td>
                `;
                absensiTableBody.appendChild(trPulang);
            }
        });

        applyFilterAbsensi();
    }


    // ======================
    // DASHBOARD CHART
    // ======================
    function renderDashboardChart(){
        if(!dashboardChartCanvas) return;

        const masukCount = absensiData.filter(a => a.status === 'masuk').length;
        const terlambatCount = absensiData.filter(a => a.status === 'terlambat').length;
        const izinTidakMasukCount = absensiData.filter(a => a.status === 'izin_tidak_masuk').length;
        const pulangDuluanData = localStorage.getItem(todayKey+'_pulang_duluan');
        const pulangDuluanCount = pulangDuluanData ? 1 : 0;
        const izinKeluarData = JSON.parse(localStorage.getItem('izin_keluar_' + todayKey) || '[]');
        const izinKeluarCount = izinKeluarData.length;

        const data = {
            labels:['Masuk','Terlambat','Pulang Duluan','Izin Keluar','Izin Tidak Masuk'],
            datasets:[{
                label:'Absensi Hari Ini',
                data:[masukCount, terlambatCount, pulangDuluanCount, izinKeluarCount, izinTidakMasukCount],
                backgroundColor:['#4caf50','#ff9800','#ffb74d','#ffc107','#f44336']
            }]
        };

        if(dashboardChart) dashboardChart.destroy();
        dashboardChart = new Chart(dashboardChartCanvas,{
            type:'bar',
            data,
            options:{
                responsive:true,
                plugins:{
                    legend:{ display:true }
                },
                scales:{
                    y:{ beginAtZero:true, precision:0 }
                }
            }
        });
    }

    // ======================
    // ABSENSI BUTTONS
    // ======================
    btnAbsenMasuk.addEventListener('click', ()=>{
        const sekarang = new Date();
        const jam = sekarang.getHours();

        if(jam > 7){
            openModal('Keterangan Terlambat','Wajib isi alasan...', 'terlambat');
            return;
        }

        absenHariIni = 'masuk';
        localStorage.setItem(todayKey,'masuk');
        localStorage.setItem(todayKey+'_jam_masuk',sekarang.toLocaleTimeString('id-ID',{hour12:false}));
        updateAbsensiButtons();
        loadAbsensi();
    });

    btnAbsenKeluar.addEventListener('click', ()=>{
        const sekarang = new Date();
        if(sekarang.getHours()<15){
            alert('Absen keluar hanya bisa setelah jam 15:00');
            return;
        }

        const jamKeluar = sekarang.toLocaleTimeString('id-ID',{hour12:false});
        localStorage.setItem(todayKey+'_jam_keluar', jamKeluar);
        localStorage.removeItem(todayKey + '_izin_selesai');

        resetIzinKeluarUIState();

        updateAbsensiButtons();
        loadAbsensi().then(updateDashboardChart);
    });

    btnPulangDuluan.addEventListener('click', ()=> openModal('Pulang Duluan','Wajib isi alasan','pulang_duluan'));
    btnIzin.addEventListener('click', ()=> openModal('Izin Tidak Masuk','Wajib isi alasan','izin_masuk'));
    izinSubmitBtn.addEventListener('click', handleIzinKeluarSubmit);

    // ======================
    // DEV RESET FINAL
    // ======================
    btnResetDev.addEventListener('click', async () => {
        if(!confirm('DEV RESET: Yakin reset semua absensi hari ini untuk akun Anda?')) return;

        try {
            const res = await fetch('/dev-reset-guru', { method:'POST' });
            const data = await res.json();

            if(data.status === 'success'){
                alert(data.message);

                // reset UI
                absenHariIni = null;
                absensiTableBody.innerHTML = '';
                izinTableBody.innerHTML = '';
                if(izinNotif){ izinNotif.style.display='none'; izinNotif.textContent=''; }

                btnAbsenMasuk.style.display = 'inline-block'; btnAbsenMasuk.disabled=false; btnAbsenMasuk.style.opacity=1;
                btnIzin.style.display='inline-block'; btnIzin.disabled=false; btnIzin.style.opacity=1;
                btnAbsenKeluar.style.display='none';
                btnPulangDuluan.style.display='none';

                localStorage.removeItem(todayKey);
                localStorage.removeItem(todayKey+'_jam_masuk');
                localStorage.removeItem(todayKey+'_jam_keluar');
                localStorage.removeItem('izin_masuk_done');
                localStorage.removeItem(izinPulangDuluanKey);
                localStorage.removeItem('izin_notif_text_' + todayKey);
                localStorage.removeItem('izin_keluar_' + todayKey);
                localStorage.removeItem(todayKey+'_pulang_duluan');
                localStorage.removeItem(todayKey + '_izin_selesai');

            } else {
                alert('Gagal reset: ' + data.message);
            }

        } catch(err){
            console.error(err);
            alert('Terjadi error saat reset.');
        }
    });

    // ======================
    // HELPER UNTUK LOCALSTORAGE KEY
    // ======================
    function getLSKeyFromDate(dateStr){
        return 'absen_' + dateStr; // dateStr sudah ISO
    }

    function getIzinKeluarKeyFromDate(dateStr){
        return 'izin_keluar_' + dateStr;
    }

    function getPulangDuluanKeyFromDate(dateStr){
        return getLSKeyFromDate(dateStr) + '_pulang_duluan';
    }

    // ======================
    // DASHBOARD CHART UPDATE
    // ======================
    function updateDashboardChart() {
        if(!dashboardChartCanvas) return;

        let filteredData = absensiData;

        filteredData = absensiData.filter(a => {
            const dateObj = new Date(a.tanggal);
            const bulan = dateObj.getMonth() + 1;
            const tahun = dateObj.getFullYear();

            const matchBulan = (currentFilterStatus === 'all') || (bulan === parseInt(currentFilterStatus));
            const matchTahun = (currentFilterTahun === 'all') || (tahun === parseInt(currentFilterTahun));

            return matchBulan && matchTahun;
        });

        // Hitung status berdasarkan filteredData
        const masukCount = filteredData.filter(a => a.status === 'masuk').length;
        const terlambatCount = filteredData.filter(a => a.status === 'terlambat').length;
        const izinTidakMasukCount = filteredData.filter(a => a.status === 'izin_tidak_masuk').length;

        let pulangDuluanCount = 0;
        let izinKeluarCount = 0;

        filteredData.forEach(a => {
            const pdKey = getPulangDuluanKeyFromDate(a.tanggal);
            const pd = localStorage.getItem(pdKey);
            if(pd) pulangDuluanCount += 1;

            const izinKey = getIzinKeluarKeyFromDate(a.tanggal);
            const izin = JSON.parse(localStorage.getItem(izinKey) || '[]');
            if(izin.length) izinKeluarCount += izin.length;
        });

        const statusCounts = {
            'Masuk': masukCount,
            'Terlambat': terlambatCount,
            'Pulang Duluan': pulangDuluanCount,
            'Izin Keluar': izinKeluarCount,
            'Izin Tidak Masuk': izinTidakMasukCount
        };

        const labels = [];
        const data = [];
        const bgColors = [];

        const colorMap = {
            'Masuk':'#4caf50',
            'Terlambat':'#ff9800',
            'Pulang Duluan':'#ffb74d',
            'Izin Keluar':'#ffc107',
            'Izin Tidak Masuk':'#f44336'
        };

        for(const key in statusCounts){
            if(statusCounts[key] > 0){
                labels.push(key);
                data.push(statusCounts[key]);
                bgColors.push(colorMap[key]);
            }
        }

        const chartData = {
            labels,
            datasets: [{
                label: 'Absensi',
                data: data,
                backgroundColor: bgColors
            }]
        };

        if(dashboardChart) dashboardChart.destroy();
        dashboardChart = new Chart(dashboardChartCanvas, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: {
                    x: { grid: { drawTicks: false, drawBorder: false, display: false }, ticks: { display: true } },
                    y: { beginAtZero: true, grid: { drawTicks: false, drawBorder: false, display: false }, ticks: { display: true } }
                }
            }
        });
    }

    // ======================
    // LOGOUT
    // ======================
    const btnLogoutSidebar = document.getElementById('sidebar-logout');
    const btnLogoutBottom = document.getElementById('bottom-logout');
    const dropdownLogout = document.querySelector('.dropdown-item.logout');

    [btnLogoutSidebar, btnLogoutBottom, dropdownLogout].forEach(btn => {
        btn?.addEventListener('click', () => {
            localStorage.removeItem('activeMenu'); // <-- hapus menu aktif saat logout
            window.location.href = '/logout'; // redirect ke server logout
        });
    })

    // DROPDOWN HEADER USER
    const userDropdown = document.querySelector('.user-dropdown');
    const dropbtn = userDropdown.querySelector('.dropbtn');

    dropbtn.addEventListener('click', (e) => {
        e.stopPropagation(); // agar klik tidak menutup sendiri
        userDropdown.classList.toggle('show');
    });

    // Tutup dropdown jika klik di luar
    document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
    });

    // ACTION LOGOUT (jika ingin override href)
    document.querySelector('.dropdown-item.logout').addEventListener('click', () => {
        window.location.href = '/logout';
    });

    // ======================
    // INIT
    // ======================
    const activeMenu = localStorage.getItem('activeMenu') || 'dashboard';
    setActiveMenu(activeMenu);

    loadAbsensi().then(updateDashboardChart);
    updateAbsensiButtons();
    renderIzinTable();
    updateIzinKeluarUI();
    startIzinBannerTimer();
});
