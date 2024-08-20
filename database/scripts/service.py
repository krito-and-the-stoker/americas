from flask import Flask
from time import sleep
import subprocess

app = Flask(__name__)


@app.route('/export')
def export():
    subprocess.run(["/scripts/export.sh"])
    return "Export started."


if __name__ == '__main__':
    print("Starting backup service...")
    sleep(5)
    print('creating backup...')
    export()
    app.run(host='0.0.0.0', port=5005)
