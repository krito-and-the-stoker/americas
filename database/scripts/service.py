from flask import Flask
from time import sleep
import subprocess
import os

app = Flask(__name__)


@app.route('/export')
def export():
    subprocess.run(["/scripts/export.sh"])
    return "Export started."


if __name__ == '__main__':
    print("Starting backup service...")
    sleep(5)

    omit_initial_backup = os.getenv('OMIT_INITIAL_BACKUP', 'False').lower() == 'true'
    if not omit_initial_backup:
        print('creating backup...')
        export()
    else:
        print('Initial backup omitted.')

    app.run(host='0.0.0.0', port=5005)
