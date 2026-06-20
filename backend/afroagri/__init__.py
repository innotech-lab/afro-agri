import sys
from pathlib import Path


vendor_dir = Path(__file__).resolve().parent.parent / 'vendor'
if str(vendor_dir) not in sys.path:
    sys.path.insert(0, str(vendor_dir))

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# Patch Django's MySQL features to disable RETURNING clause for compatibility with MariaDB < 10.5 (e.g. 10.4)
try:
    from django.db.backends.mysql.features import DatabaseFeatures
    DatabaseFeatures.can_return_columns_from_insert = property(lambda self: False)
except Exception:
    pass
