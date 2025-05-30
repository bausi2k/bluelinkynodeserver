Markdown

# Bluelinky Project: Local Test Script & API Server for Hyundai/Kia

## 1. Overview

This project includes two main components for interacting with Hyundai/Kia vehicles via the Bluelink/UVO services using the [bluelinky](https://github.com/Hacksore/bluelinky) Node.js library:

1. **Local Test Script (`test-bluelinky.js`):** A simple command-line script to quickly test the basic functionality of the `bluelinky` library using your personal credentials and to observe direct communication with the vehicle via the console. (See [test-bluelinky.js](test-bluelinky.js))
2. **API Server (`bluelinky-server.js`):** A Node.js-based HTTP server (using Express.js) that provides an API to control vehicle functions via HTTP calls and retrieve status information. This server can be set up as a systemd service for continuous operation on a system such as the Raspberry Pi. (See [bluelinky-server.js](bluelinky-server.js))

This README guides you from initial local testing to running the API server as a service.

## 2. Requirements

* A Raspberry Pi or other Linux system.
* Node.js (e.g., v18.x LTS or newer; v24.1.0 was used during the development of this project).
* npm (Node Package Manager, typically installed with Node.js).
* git (optional if you clone this repository or want to version your project).
* Login credentials for your Hyundai Bluelink / Kia UVO account (username, password, PIN, VIN).

## 3. Local Test Script (`test-bluelinky.js`)

Before setting up the API server, it's a good idea to use this simple script to test whether the `bluelinky` library is working correctly with your credentials.

### 3.1. Purpose

* Direct testing of the `bluelinky` library.
* Verification of your Bluelink/UVO credentials.
* Monitoring communication and data directly in the console.
* Troubleshooting basic connection issues.

### 3.2. Local Test Script Setup

1. **Create a project directory and change to it** (e.g., `/home/pi/blserver_test` or your main project directory `/home/pi/blserver`).
Ensure that the file [test-bluelinky.js](test-bluelinky.js) is present in this directory.
```bash
# Example:
# mkdir -p /home/pi/blserver_test
# cd /home/pi/blserver_test
# (Then place the test-bluelinky.js file here)
```

2. Initialize the Node.js project (if you haven't already):
bash
npm init -y

3. Install the bluelinky library:
bash
npm install bluelinky


3.3. Script Code (test-bluelinky.js)

The code for this script can be found in the [test-bluelinky.js](test-bluelinky.js) file in this repository.

**IMPORTANT:** Open the file `test-bluelinky.js` and replace the placeholders for `USERNAME`, `PASSWORD`, `PIN`, and `VIN` with your **real and correct** credentials before running the script. Keep this version of the script with your credentials confidential and use it only for local testing.

### 3.4. Running the Local Test Script

Run the script in the terminal (make sure you are in the correct directory):

```bash
node test-bluelinky.js
```

### 3.5. Expected Output
The script will output various log messages to the console. If successful, you should see a login confirmation, a list of your vehicles, and the vehicle status.

# 4. API Server (bluelinky-server.js)
If the local test script works successfully, you can set up the API server.

## 4.1. Purpose
Provides an HTTP API for remote control and status queries of the vehicle.
Can be configured as a background service for continuous operation.
Suitable for integration into smart home systems such as Node-RED.

## 4.2. API Server Setup
Ensure that express and bluelinky are installed:
When you are in the /home/pi/blserver directory (or your chosen directory for the server):

```Bash

npm install express bluelinky
```

Server Script (bluelinky-server.js):
The code for the API server can be found in the bluelinky-server.js file in this repository. Make sure this file is located in your project directory (/home/pi/blserver).

## 4.3. Credential Configuration File (.env for the Server)
This file is crucial if the server is running as a systemd service.

Create/edit the file /home/pi/blserver/.env:

```Bash

vi /home/pi/blserver/.env
```

Content (replace the values ​​with your data):

```Ini, TOML

BLUELINK_USERNAME=your_username@example.com
BLUELINK_PASSWORD='Your!PasswordWithSpecialCharacters' # Single quotes are good for special characters
BLUELINK_PIN=1234
BLUELINK_VIN=YOUR17-DIGIT VINXYZ
BLUELINK_REGION=EU
PORT=8080
```

Set permissions:
```Bash

chmod 600 /home/pi/blserver/.env
```
## 4.4. API Endpoints
You can get an overview of the available endpoints and their descriptions via the /info endpoint of the running server (e.g., http://<IP_YOUR_RASPBERRY_PI>:8080/info). The most important ones are:

```
GET /info: API overview.
GET /status: Cached vehicle status (refresh: false).
GET /status/refresh: Current vehicle status of the car (refresh: true).
POST /lock, POST /unlock: Lock/unlock doors.
POST /climate/start, POST /climate/stop: Control air conditioning. (Body for start: {"temperature": 22, "defrost": false, "windscreenHeating": false})
POST /charge/start, POST /charge/stop: Control charging.
GET /odometer: Odometer reading.
GET /location: Location.
4.5. Start the server manually (for testing)
Set the environment variables in the terminal and start the server:
```

... Find it with:

```Bash

which node
```

Note the path returned (e.g., /usr/bin/node or /usr/local/bin/node).

### 4.6.2. Create a systemd service unit file
Create a new service file. You need sudo privileges for this. (Reminder: You prefer vi as your editor.)

```Bash

sudo vi /etc/systemd/system/bluelinky-server.service
```

Insert the following content into this file. Important: In the ExecStart= line, replace /usr/bin/node with the path you determined in step 4.6.1!

```Ini, TOML

[Unit]
Description=Bluelinky API Server
Documentation=file:///home/pi/blserver/bluelinky-server.js
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/home/pi/blserver

# Replace '/usr/bin/node' with the actual path shown by 'which node'!
ExecStart=/usr/bin/node /home/pi/blserver/bluelinky-server.js

EnvironmentFile=/home/pi/blserver/.env
RuntimeMaxSec=6h
Restart=always
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Ensure that the file /home/pi/blserver/.env (as described in Section 4.3) exists and contains your Bluelink credentials.

### 4.6.3. Inform systemd and manage the service
After creating and saving the .service file, run the following commands in the terminal:

Instruct systemd to reload its configuration:
```Bash

sudo systemctl daemon-reload
```

Enable the service to start automatically at boot time:

```Bash

sudo systemctl enable bluelinky-server.service
```

Start the service manually immediately:

```Bash

sudo systemctl start bluelinky-server.service
```

### 4.6.4. Check the service status and logs
Display the current status of the service:

```Bash

sudo systemctl status bluelinky-server.service
View the service logs:
Recent log entries: sudo journalctl -u bluelinky-server.service -e --no-pager
View live logs: sudo journalctl -u bluelinky-server.service -f (Quit with Ctrl+C)
Logs since the last boot: sudo journalctl -u bluelinky-server.service -b
```

### 4.6.5. Important note on the bluelinky-server.js script for service operation
The setInterval(...) call at the end of the bluelinky-server.js script helps keep the Node.js process stable and running continuously under systemd.

# 5. Libraries Used / References
bluelinky: The core library for communicating with the Hyundai/Kia Bluelink/UVO services.
Express.js: Web framework for Node.js, used for the API server.

# 5. Important Notes / Troubleshooting
Credentials: Correctness is crucial (.env file for the service, direct input in test-bluelinky.js for local tests).
Editor: Be careful when copying code to avoid invisible characters or formatting errors.
Logs: Always check the server logs (journalctl or console output).
Passwords in the shell: Use single quotes for exports containing special characters (!). This is also more secure in .env files.