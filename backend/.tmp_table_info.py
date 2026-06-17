import pathlib
import sqlite3

p = pathlib.Path('db.sqlite3')
print('exists', p.exists(), p.stat().st_size if p.exists() else None)
conn = sqlite3.connect(str(p))
cur = conn.cursor()
for table in ['users', 'type_user']:
    print('---', table)
    cur.execute(f"PRAGMA table_info('{table}')")
    rows = cur.fetchall()
    if not rows:
        print('missing')
    else:
        for row in rows:
            print(row)
cur.execute("SELECT app, name FROM django_migrations WHERE app IN ('users','type_user') ORDER BY app, name")
print('migrations', cur.fetchall())
cur.close()
conn.close()
