from flask import Flask, request, jsonify
import subprocess
import json
from flask_cors import CORS
import os
import platform

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_cpp_executable():
    system = platform.system().lower()
    machine = platform.machine().lower()
    
    # Map machine architecture to a normalized string
    if machine in ('amd64', 'x86_64', 'x64'):
        arch = 'x86_64'
    elif machine in ('arm64', 'aarch64'):
        arch = 'arm64'
    else:
        arch = machine

    # Determine executable name based on OS and architecture
    if system == 'windows':
        exe_name = f'graph_logic_windows_{arch}.exe'
        fallback_names = ['graph_logic.exe']
    elif system == 'darwin':
        exe_name = f'graph_logic_darwin_{arch}'
        fallback_names = ['main']
    elif system == 'linux':
        exe_name = f'graph_logic_linux_{arch}'
        fallback_names = ['graph_logic']
    else:
        exe_name = f'graph_logic_{system}_{arch}'
        fallback_names = []

    exec_path = os.path.join(BASE_DIR, exe_name)
    
    # Check if architecture-specific binary exists
    if os.path.exists(exec_path):
        return exec_path

    # Check fallbacks
    for fb in fallback_names:
        fb_path = os.path.join(BASE_DIR, fb)
        if os.path.exists(fb_path):
            return fb_path

    # If no binary exists, attempt to compile from graph_logic.cpp
    cpp_source = os.path.join(BASE_DIR, 'graph_logic.cpp')
    if os.path.exists(cpp_source):
        try:
            print(f"Executable {exe_name} and fallbacks not found. Attempting to compile from source...")
            # Compile command
            compile_cmd = ['g++', '-std=c++17', '-o', exec_path, cpp_source]
            subprocess.run(compile_cmd, check=True)
            # Ensure it is executable
            os.chmod(exec_path, 0o755)
            print(f"Successfully compiled {exe_name} from source.")
            return exec_path
        except Exception as e:
            print(f"Failed to compile from source: {e}")

    # Final fallback to standard path
    return exec_path

CPP_EXEC = get_cpp_executable()

def call_cpp_graph_logic(payload):
    try:
        proc = subprocess.Popen([CPP_EXEC], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = proc.communicate(input=json.dumps(payload).encode())
        if err:
            print('C++ error:', err.decode())
        return json.loads(out.decode())
    except Exception as e:
        print(f"Error calling C++ graph logic at {CPP_EXEC}: {e}")
        return {"status": "error", "msg": f"C++ execution error: {str(e)}"}

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