import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
tables_to_drop = ['champs', 'plantes', 'journal_plante', 'etude_sol']
for table in tables_to_drop:
    cur.execute(f'DROP TABLE IF EXISTS {table}')
    print(f'Dropped {table} if it existed.')
conn.commit()
cur.close()
conn.close()
