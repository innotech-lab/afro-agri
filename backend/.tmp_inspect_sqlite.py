import pathlib
import sqlite3

p = pathlib.Path('db.sqlite3')
print('exists', p.exists(), p.stat().st_size if p.exists() else None)
conn = sqlite3.connect(str(p))
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cur.fetchall())
cur.close()
conn.close()
