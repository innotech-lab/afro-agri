import sys
from pathlib import Path


vendor_dir = Path(__file__).resolve().parent.parent / 'vendor'
if str(vendor_dir) not in sys.path:
    sys.path.insert(0, str(vendor_dir))

import pymysql

pymysql.install_as_MySQLdb()
