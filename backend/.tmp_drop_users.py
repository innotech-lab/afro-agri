import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
cur.execute('DROP TABLE IF EXISTS users')
cur.execute('DROP TABLE IF EXISTS type_user')
conn.commit()
cur.close()
conn.close()
print('Dropped users and type_user tables if they existed.')
