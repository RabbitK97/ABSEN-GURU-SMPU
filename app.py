from flask import Flask, render_template, request, redirect, session, jsonify
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = "absensi-sekolah"


# =========================
# DATABASE HELPER
# =========================
def db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


# =========================
# INIT DATABASE
# =========================
def init_db():
    with db() as d:
        # Tabel guru
        d.execute("""
        CREATE TABLE IF NOT EXISTS guru (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            jabatan TEXT NOT NULL,
            tempat TEXT,
            tahun TEXT,
            jk TEXT,
            status TEXT,
            hp TEXT,
            alamat TEXT,
            email TEXT,
            role TEXT NOT NULL,
            password TEXT
        )
        """)

        # Tabel akun
        d.execute("""
        CREATE TABLE IF NOT EXISTS akun (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guru_id INTEGER NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            FOREIGN KEY (guru_id) REFERENCES guru(id)
        )
        """)

        # Tabel absensi
        d.execute("""
        CREATE TABLE IF NOT EXISTS absensi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guru_id INTEGER NOT NULL,
            tanggal TEXT NOT NULL,
            jam_masuk TEXT,
            jam_keluar TEXT,
            alasan TEXT,
            FOREIGN KEY (guru_id) REFERENCES guru(id)
        )
        """)

        # Tambahkan admin default
        exists = d.execute("SELECT * FROM guru WHERE nama='admin'").fetchone()
        if not exists:
            d.execute("""
            INSERT INTO guru (nama, jabatan, tempat, tahun, jk, status, hp, alamat, email, role, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "admin", "Kepala Sekolah", "Jakarta", "1980", "L", "Aktif",
                "08123456789", "Jl. Contoh No.1", "admin@email.com", "admin", "admin"
            ))

# =========================
# LOGIN
# =========================
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        d = db()

        # 1️⃣ Cek admin
        user = d.execute(
            "SELECT * FROM guru WHERE role='admin' AND nama=? AND password=?",
            (username, password)
        ).fetchone()

        if user:
            session["user_id"] = user["id"]
            session["role"] = user["role"]
            return redirect("/admin")

        # 2️⃣ Cek guru via akun
        akun = d.execute(
            "SELECT a.*, g.nama FROM akun a JOIN guru g ON a.guru_id=g.id WHERE a.username=? AND a.password=?",
            (username, password)
        ).fetchone()

        if akun:
            session["user_id"] = akun["guru_id"]
            session["role"] = "guru"
            return redirect("/guru")

        # 3️⃣ Jika keduanya gagal
        return render_template("login.html", error="Username atau password salah")

    return render_template("login.html")

# =========================
# LOGOUT
# =========================
from flask import session, redirect, url_for

@app.route('/logout')
def logout():
    session.clear()   # hapus semua session
    return redirect(url_for('login'))  # arahkan ke halaman login



# =========================
# ADMIN DASHBOARD
# =========================
@app.route("/admin")
def admin():
    if "user_id" not in session:
        return redirect("/")

    d = db()

    total_guru = d.execute(
        "SELECT COUNT(*) FROM guru WHERE role='guru'"
    ).fetchone()[0]

    total_jabatan = d.execute(
        "SELECT COUNT(DISTINCT jabatan) FROM guru"
    ).fetchone()[0]

    total_absensi = d.execute(
        "SELECT COUNT(*) FROM absensi"
    ).fetchone()[0]

    return render_template(
        "admin.html",
        total_guru=total_guru,
        total_jabatan=total_jabatan,
        total_absensi=total_absensi
    )


# =========================
# GURU PAGE
# =========================
@app.route("/guru")
def guru():
    if "user_id" not in session:
        return redirect("/")
    return render_template("guru.html")


# =========================
# API MASTER GURU (tanpa username/password)
# =========================
@app.route("/api/guru", methods=["GET"])
def api_get_guru():
    d = db()
    data = d.execute("SELECT * FROM guru WHERE role='guru'").fetchall()
    return jsonify([dict(row) for row in data])

# =========================
# API GURU UNTUK DROPDOWN ABSENSI
# =========================
@app.route("/api/guru/absensi", methods=["GET"])
def api_guru_absensi():
    d = db()
    # Ambil id & nama guru saja, urut nama
    data = d.execute("SELECT id, nama FROM guru WHERE role='guru' ORDER BY nama").fetchall()
    return jsonify([dict(row) for row in data])

@app.route("/api/guru/add", methods=["POST"])
def api_add_guru():
    data = request.json
    d = db()
    try:
        d.execute(
            "INSERT INTO guru (nama, jabatan, tempat, tahun, jk, status, hp, alamat, email, role) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (data["nama"], data["jabatan"], data.get("tempat",""), data.get("tahun",""),
            data.get("jk",""), data.get("status",""), data.get("hp",""), data.get("alamat",""), data.get("email",""), "guru")
        )
        d.commit()
        return jsonify({"status": "success", "message": "Guru berhasil ditambahkan"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route("/api/guru/update/<int:id>", methods=["PUT"])
def api_update_guru(id):
    data = request.json
    d = db()
    try:
        d.execute(
            "UPDATE guru SET nama=?, jabatan=?, tempat=?, tahun=?, jk=?, status=?, hp=?, alamat=?, email=? WHERE id=?",
            (data["nama"], data["jabatan"], data.get("tempat",""), data.get("tahun",""),
            data.get("jk",""), data.get("status",""), data.get("hp",""), data.get("alamat",""), data.get("email",""), id)
        )
        d.commit()
        return jsonify({"status": "success", "message": "Data guru berhasil diperbarui"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route("/api/guru/delete/<int:id>", methods=["DELETE"])
def api_delete_guru(id):
    d = db()
    try:
        d.execute("DELETE FROM guru WHERE id=?", (id,))
        d.commit()
        return jsonify({"status": "success", "message": "Data guru berhasil dihapus"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# =========================
# API AKUN GURU
# =========================

@app.route("/api/akun", methods=["GET"])
def api_get_akun():
    d = db()
    data = d.execute("""
        SELECT a.id, a.guru_id, a.username, a.password, g.nama
        FROM akun a
        JOIN guru g ON a.guru_id = g.id
    """).fetchall()
    return jsonify([dict(row) for row in data])


@app.route("/api/akun/add", methods=["POST"])
def api_add_akun():
    data = request.json
    d = db()
    try:
        # cek username unik
        exists_user = d.execute("SELECT * FROM akun WHERE username=?", (data["username"],)).fetchone()
        if exists_user:
            return jsonify({"status":"error","message":"Username sudah digunakan"})

        # cek guru sudah punya akun
        exists_guru = d.execute("SELECT * FROM akun WHERE guru_id=?", (data["guru_id"],)).fetchone()
        if exists_guru:
            return jsonify({"status":"error","message":"Guru ini sudah memiliki akun"})

        d.execute(
            "INSERT INTO akun (guru_id, username, password) VALUES (?,?,?)",
            (data["guru_id"], data["username"], data["password"])
        )
        d.commit()
        return jsonify({"status":"success","message":"Akun guru berhasil dibuat"})
    except Exception as e:
        return jsonify({"status":"error","message": str(e)})


@app.route("/api/akun/update/<int:id>", methods=["PUT"])
def api_update_akun(id):
    data = request.json
    d = db()
    try:
        # cek username unik kecuali akun ini
        exists_user = d.execute("SELECT * FROM akun WHERE username=? AND id!=?", (data["username"], id)).fetchone()
        if exists_user:
            return jsonify({"status":"error","message":"Username sudah digunakan"})

        # cek guru unik kecuali akun ini
        exists_guru = d.execute("SELECT * FROM akun WHERE guru_id=? AND id!=?", (data["guru_id"], id)).fetchone()
        if exists_guru:
            return jsonify({"status":"error","message":"Guru ini sudah memiliki akun"})

        d.execute(
            "UPDATE akun SET guru_id=?, username=?, password=? WHERE id=?",
            (data["guru_id"], data["username"], data["password"], id)
        )
        d.commit()
        return jsonify({"status":"success","message":"Akun guru berhasil diperbarui"})
    except Exception as e:
        return jsonify({"status":"error","message": str(e)})


@app.route("/api/akun/delete/<int:id>", methods=["DELETE"])
def api_delete_akun(id):
    d = db()
    try:
        d.execute("DELETE FROM akun WHERE id=?", (id,))
        d.commit()
        return jsonify({"status":"success","message":"Akun guru berhasil dihapus"})
    except Exception as e:
        return jsonify({"status":"error","message": str(e)})

# =========================
# API ABSENSI
# =========================

@app.route("/api/absensi", methods=["GET"])
def api_get_absensi():
    d = db()
    data = d.execute("""
        SELECT a.id, a.guru_id, g.nama, a.tanggal, a.jam_masuk, a.jam_keluar, a.alasan
        FROM absensi a
        JOIN guru g ON a.guru_id = g.id
        ORDER BY a.tanggal DESC, g.nama ASC
    """).fetchall()

    result = []
    for row in data:
        status = 'masuk'  # default

        if row['jam_masuk'] and row['jam_masuk'] > '07:00:00':
            status = 'terlambat'
        elif row['alasan'] and row['alasan'].startswith('Izin Keluar'):
            status = 'izin_keluar'
        elif row['alasan'] and not row['jam_masuk']:
            status = 'izin_masuk'
        elif row['jam_keluar'] and row['jam_keluar'] < '15:00:00':
            status = 'pulang_duluan'
        elif row['jam_keluar']:
            status = 'keluar'

        result.append({
            'id': row['id'],
            'guru_id': row['guru_id'],
            'nama': row['nama'],
            'tanggal': row['tanggal'],
            'jamMasuk': row['jam_masuk'] if row['jam_masuk'] else '',
            'jamPulang': row['jam_keluar'] if row['jam_keluar'] else '',
            'alasan': row['alasan'],
            'status': status
        })

    return jsonify(result)

@app.route("/api/absensi/guru", methods=["GET"])
def api_absensi_login_guru():
    if "user_id" not in session or session.get("role") != "guru":
        return jsonify({"status":"error","message":"Unauthorized"}), 401

    guru_id = session["user_id"]
    d = db()
    data = d.execute("""
        SELECT * FROM absensi
        WHERE guru_id=?
        ORDER BY tanggal DESC
    """, (guru_id,)).fetchall()

    result = []
    for row in data:
        result.append({
            "id": row["id"],
            "tanggal": row["tanggal"],
            "jamMasuk": row["jam_masuk"] if row["jam_masuk"] else "",
            "jamPulang": row["jam_keluar"] if row["jam_keluar"] else "",
            "alasan": row["alasan"]
        })
    return jsonify(result)

@app.route('/api/absensi/status')
def api_absensi_status():
    # pastikan guru login
    if "user_id" not in session or session.get("role") != "guru":
        return jsonify({"state": "belum_login"})

    guru_id = session["user_id"]
    today = datetime.now().date().isoformat()

    d = db()
    row = d.execute("""
        SELECT jam_masuk, jam_keluar, alasan
        FROM absensi
        WHERE guru_id=? AND tanggal=?
        LIMIT 1
    """, (guru_id, today)).fetchone()

    if not row:
        return jsonify({"state": "belum_absen"})

    jam_masuk = row["jam_masuk"]
    jam_keluar = row["jam_keluar"]
    alasan = row["alasan"]

    if jam_masuk and not jam_keluar:
        return jsonify({"state": "sudah_masuk"})
    elif jam_masuk and jam_keluar:
        return jsonify({"state": "sudah_keluar"})
    elif alasan and not jam_masuk:
        return jsonify({"state": "izin"})
    else:
        return jsonify({"state": "belum_absen"})


# =========================
# ABSEN MASUK
# =========================
@app.route('/masuk', methods=['POST'])
def absen_masuk():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()
    jam = now.strftime('%H:%M:%S')

    cek = d.execute(
        "SELECT id FROM absensi WHERE guru_id=? AND tanggal=?",
        (session['user_id'], tanggal)
    ).fetchone()

    if cek:
        return jsonify({'error': 'Sudah absen hari ini'}), 400

    d.execute("""
        INSERT INTO absensi (guru_id, tanggal, jam_masuk, jam_keluar, alasan)
        VALUES (?,?,?,?,?)
    """, (session['user_id'], tanggal, jam, '', ''))
    d.commit()

    return jsonify({'status': 'success'})


# =========================
# ABSEN KELUAR
# =========================
@app.route('/keluar', methods=['POST'])
def absen_keluar():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()
    jam = now.strftime('%H:%M:%S')

    d.execute("""
        UPDATE absensi
        SET jam_keluar=?
        WHERE guru_id=? AND tanggal=?
    """, (jam, session['user_id'], tanggal))
    d.commit()

    return jsonify({'status': 'success'})


# =========================
# IZIN TIDAK MASUK
# =========================
@app.route('/izin', methods=['POST'])
def izin_tidak_masuk():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    alasan = request.form.get('izin')
    if not alasan:
        return jsonify({'error': 'Alasan wajib'}), 400

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()

    cek = d.execute(
        "SELECT id FROM absensi WHERE guru_id=? AND tanggal=?",
        (session['user_id'], tanggal)
    ).fetchone()

    if cek:
        return jsonify({'error': 'Sudah ada data hari ini'}), 400

    d.execute("""
        INSERT INTO absensi (guru_id, tanggal, jam_masuk, jam_keluar, alasan)
        VALUES (?,?,?,?,?)
    """, (session['user_id'], tanggal, '', '', alasan))
    d.commit()

    return jsonify({'status': 'success'})


# =========================
# TERLAMBAT (ABSEN MASUK + ALASAN)
# =========================
@app.route('/terlambat', methods=['POST'])
def absen_terlambat():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    alasan = request.form.get('alasan')
    if not alasan:
        return jsonify({'error': 'Alasan wajib'}), 400

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()
    jam = now.strftime('%H:%M:%S')

    d.execute("""
        INSERT INTO absensi (guru_id, tanggal, jam_masuk, jam_keluar, alasan)
        VALUES (?,?,?,?,?)
    """, (session['user_id'], tanggal, jam, '', alasan))
    d.commit()

    return jsonify({'status': 'success'})


# =========================
# PULANG DULUAN
# =========================
@app.route('/pulang-duluan', methods=['POST'])
def pulang_duluan():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    alasan = request.form.get('alasan')
    if not alasan:
        return jsonify({'error': 'Alasan wajib'}), 400

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()
    jam = now.strftime('%H:%M:%S')

    d.execute("""
        UPDATE absensi
        SET jam_keluar=?, alasan=?
        WHERE guru_id=? AND tanggal=?
    """, (jam, alasan, session['user_id'], tanggal))
    d.commit()

    return jsonify({'status': 'success'})


# =========================
# IZIN KELUAR (JAM + ALASAN)
# =========================
@app.route('/izin-keluar', methods=['POST'])
def izin_keluar():
    if 'user_id' not in session or session.get('role') != 'guru':
        return jsonify({'error': 'unauthorized'}), 401

    jam_mulai = request.form.get('jam_mulai')
    jam_selesai = request.form.get('jam_selesai')
    alasan = request.form.get('alasan')

    if not jam_mulai or not jam_selesai or not alasan:
        return jsonify({'error': 'Lengkapi semua field'}), 400

    d = db()
    now = datetime.now()
    tanggal = now.date().isoformat()

    # gabungkan info jam & alasan
    alasan_full = f"Izin Keluar {jam_mulai}-{jam_selesai}: {alasan}"

    # cek apakah sudah ada absensi hari ini
    cek = d.execute(
        "SELECT id FROM absensi WHERE guru_id=? AND tanggal=?",
        (session['user_id'], tanggal)
    ).fetchone()

    if cek:
        # jika sudah ada record, update field alasan
        d.execute("""
            UPDATE absensi
            SET alasan=?
            WHERE guru_id=? AND tanggal=?
        """, (alasan_full, session['user_id'], tanggal))
    else:
        # jika belum ada record, buat baru
        d.execute("""
            INSERT INTO absensi (guru_id, tanggal, jam_masuk, jam_keluar, alasan)
            VALUES (?,?,?,?,?)
        """, (session['user_id'], tanggal, '', '', alasan_full))

    d.commit()

    return jsonify({'status': 'success'})

# =========================
# API ABSENSI (UNTUK GURU & ADMIN)
# =========================
@app.route("/dev-reset-guru", methods=["POST"])
def dev_reset_guru():
    # cek login guru
    if "user_id" not in session or session.get("role") != "guru":
        return jsonify({"status":"error","message":"Unauthorized"}), 401

    guru_id = session["user_id"]
    d = db()
    today = datetime.now().date().isoformat()

    # hapus absensi hari ini untuk guru ini
    d.execute("DELETE FROM absensi WHERE guru_id=? AND tanggal=?", (guru_id, today))
    d.commit()

    return jsonify({"status":"success","message":"DEV RESET untuk guru berhasil. Semua absensi hari ini dihapus."})

@app.route("/dev-reset", methods=["POST"])
def dev_reset():
    # cek login admin
    if "user_id" not in session or session.get("role") != "guru":
        return jsonify({"status":"error","message":"Unauthorized"}), 401

    guru_id = session["user_id"]
    d = db()
    today = datetime.now().date().isoformat()

    d.execute("DELETE FROM absensi WHERE tanggal=?", (guru_id, today,)).rowcount
    d.commit()

    return jsonify({"status":"success","message":"DEV RESET untuk guru berhasil. Semua absensi hari ini dihapus."})
    
# =========================
# RUN APP
# =========================
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)