import sqlite3

db = sqlite3.connect("database.db")
c = db.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS guru (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT,
    jabatan TEXT,
    username TEXT,
    password TEXT,
    role TEXT
)
""")

c.execute("""
CREATE TABLE IF NOT EXISTS absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guru_id INTEGER,
    tanggal TEXT,
    jam_masuk TEXT,
    jam_keluar TEXT,
    keterangan TEXT
)
""")

c.execute("INSERT INTO guru VALUES (NULL,'Admin','Admin','admin','admin','admin')")

db.commit()
db.close()
