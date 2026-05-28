from flask import Flask, request, jsonify
import subprocess
import json
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CPP_EXEC = os.path.join(BASE_DIR, 'main')

def call_cpp_graph_logic(payload):
    proc = subprocess.Popen([CPP_EXEC], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = proc.communicate(input=json.dumps(payload).encode())
    if err:
        print('C++ error:', err.decode())
    return json.loads(out.decode())

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    payload = {'command': 'add_user', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    payload = {'command': 'login', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/markInfected', methods=['POST'])
def mark_infected():
    data = request.json
    payload = {'command': 'mark_infected', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/unmarkInfected', methods=['POST'])
def unmark_infected():
    data = request.json
    payload = {'command': 'unmark_infected', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/sendInfectionAlert', methods=['POST'])
def send_infection_alert():
    data = request.json
    payload = {'command': 'send_infection_alert', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/getMessages', methods=['POST'])
def get_messages():
    data = request.json
    payload = {'command': 'get_messages', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/addContact', methods=['POST'])
def add_contact():
    data = request.json
    payload = {'command': 'add_contact', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/removeContact', methods=['POST'])
def remove_contact():
    data = request.json
    payload = {'command': 'remove_contact', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

@app.route('/getExposureGraph', methods=['POST'])
def get_exposure_graph():
    data = request.json
    payload = {'command': 'get_exposure_graph', **data}
    result = call_cpp_graph_logic(payload)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')