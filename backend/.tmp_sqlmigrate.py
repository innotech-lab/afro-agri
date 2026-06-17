import os
import subprocess
import sqlite3

os.chdir(r'c:\Users\chris\Desktop\afro-agri\backend')
print('showmigrations:')
print(subprocess.run(['python', 'manage.py', 'showmigrations'], capture_output=True, text=True).stdout)
print('--- sqlmigrate ---')
print(subprocess.run(['python', 'manage.py', 'sqlmigrate', 'users', '0001_initial'], capture_output=True, text=True).stdout)
conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
cur.execute("SELECT app, name FROM django_migrations WHERE app IN ('users','type_user') ORDER BY app, name")
print('django_migrations records:', cur.fetchall())
cur.close()
conn.close()
