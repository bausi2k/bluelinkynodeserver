Markdown

# Bluelinky Projekt: Lokales Test-Skript & API-Server für Hyundai/Kia

## 1. Übersicht

Dieses Projekt umfasst zwei Hauptkomponenten zur Interaktion mit Hyundai/Kia Fahrzeugen über die Bluelink/UVO-Dienste mittels der [bluelinky](https://github.com/Hacksore/bluelinky) Node.js-Bibliothek:

1.  **Lokales Test-Skript (`test-bluelinky.js`):** Ein einfaches Kommandozeilen-Skript, um die grundlegende Funktionalität der `bluelinky`-Bibliothek schnell mit deinen persönlichen Zugangsdaten zu testen und die direkte Kommunikation mit dem Fahrzeug über die Konsole zu beobachten. (Siehe [test-bluelinky.js](test-bluelinky.js))
2.  **API-Server (`bluelinky-server.js`):** Ein Node.js-basierter HTTP-Server (mit Express.js), der eine API bereitstellt, um Fahrzeugfunktionen über HTTP-Aufrufe zu steuern und Statusinformationen abzurufen. Dieser Server kann als `systemd`-Dienst für den Dauerbetrieb auf einem System wie dem Raspberry Pi eingerichtet werden. (Siehe [bluelinky-server.js](bluelinky-server.js))

Dieses README führt dich von den ersten lokalen Tests bis zum Betrieb des API-Servers als Dienst.

## 2. Voraussetzungen

* Ein Raspberry Pi oder ein anderes Linux-System.
* Node.js (z.B. v18.x LTS oder neuer; v24.1.0 wurde während der Entwicklung dieses Projekts verwendet).
* npm (Node Package Manager, wird normalerweise mit Node.js installiert).
* `git` (optional, falls du dieses Repository klonst oder dein Projekt versionieren möchtest).
* Zugangsdaten für deinen Hyundai Bluelink / Kia UVO Account (Benutzername, Passwort, PIN, FIN).

## 3. Lokales Test-Skript (`test-bluelinky.js`)

Bevor du den API-Server einrichtest, ist es sinnvoll, mit diesem einfachen Skript zu testen, ob die `bluelinky`-Bibliothek korrekt mit deinen Zugangsdaten funktioniert.

### 3.1. Zweck

* Direkter Test der `bluelinky`-Bibliothek.
* Verifizierung deiner Bluelink/UVO-Zugangsdaten.
* Beobachtung der Kommunikation und der Daten direkt in der Konsole.
* Fehlersuche bei grundlegenden Verbindungsproblemen.

### 3.2. Setup für das lokale Test-Skript

1.  **Projektverzeichnis erstellen und dorthin wechseln** (z.B. `/home/pi/blserver_test` oder dein Hauptprojektverzeichnis `/home/pi/blserver`).
    Stelle sicher, dass die Datei [test-bluelinky.js](test-bluelinky.js) in diesem Verzeichnis vorhanden ist.
    ```bash
    # Beispiel:
    # mkdir -p /home/pi/blserver_test 
    # cd /home/pi/blserver_test 
    # (Hier dann die test-bluelinky.js Datei ablegen)
    ```

2.  **Node.js Projekt initialisieren** (falls noch nicht geschehen):
    ```bash
    npm init -y
    ```

3.  **`bluelinky`-Bibliothek installieren:**
    ```bash
    npm install bluelinky
    ```

### 3.3. Skript-Code (`test-bluelinky.js`)

Den Code für dieses Skript findest du in der Datei [test-bluelinky.js](test-bluelinky.js) in diesem Repository.

**WICHTIG:** Öffne die Datei `test-bluelinky.js` und ersetze die Platzhalter für `USERNAME`, `PASSWORD`, `PIN` und `VIN` durch deine **echten und korrekten** Zugangsdaten, bevor du das Skript ausführst. Behandle diese Version des Skripts mit deinen Zugangsdaten vertraulich und nur für lokale Tests.

### 3.4. Ausführung des lokalen Test-Skripts

Führe das Skript im Terminal aus (stelle sicher, dass du im richtigen Verzeichnis bist):

```bash
node test-bluelinky.js
```


### 3.5. Erwartete Ausgabe
Das Skript wird verschiedene Log-Meldungen in der Konsole ausgeben. Bei Erfolg solltest du eine Bestätigung des Logins, eine Liste deiner Fahrzeuge und den Fahrzeugstatus sehen.

# 4. API Server (bluelinky-server.js)
Wenn das lokale Test-Skript erfolgreich funktioniert, kannst du den API-Server einrichten.

## 4.1. Zweck
Stellt eine HTTP-API zur Fernsteuerung und Statusabfrage des Fahrzeugs bereit.
Kann als Hintergrunddienst für den Dauerbetrieb konfiguriert werden.
Geeignet zur Integration in Smarthome-Systeme wie Node-RED.

## 4.2. Setup für den API-Server
Stelle sicher, dass express und bluelinky installiert sind:
Wenn du im Verzeichnis /home/pi/blserver (oder deinem gewählten Verzeichnis für den Server) bist:

```Bash

npm install express bluelinky
```

Server-Skript (bluelinky-server.js):
Den Code für den API-Server findest du in der Datei bluelinky-server.js in diesem Repository. Stelle sicher, dass diese Datei in deinem Projektverzeichnis (/home/pi/blserver) liegt.

## 4.3. Konfigurationsdatei für Zugangsdaten (.env für den Server)
Diese Datei ist entscheidend, wenn der Server als systemd-Dienst läuft.

Erstelle/Bearbeite die Datei /home/pi/blserver/.env:

```Bash

vi /home/pi/blserver/.env
```

Inhalt (ersetze die Werte mit deinen Daten):

```Ini, TOML

BLUELINK_USERNAME=dein_benutzername@example.com
BLUELINK_PASSWORD='Dein!Passw0rtMitSonderzeichen' # Einfache Anführungszeichen sind gut bei Sonderzeichen
BLUELINK_PIN=1234
BLUELINK_VIN=DEINE17STELLIGEVINXYZ
BLUELINK_REGION=EU
PORT=8080
```

Berechtigungen setzen:
```Bash

chmod 600 /home/pi/blserver/.env
```

## 4.4. API Endpunkte
Eine Übersicht der verfügbaren Endpunkte und deren Beschreibungen erhältst du über den /info-Endpunkt des laufenden Servers (z.B. http://<IP_DEINES_RASPBERRY_PI>:8080/info). Die wichtigsten sind:

```
GET /info: Übersicht der API.
GET /status: Gecachter Fahrzeugstatus (refresh: false).
GET /status/refresh: Aktueller Fahrzeugstatus vom Auto (refresh: true).
POST /lock, POST /unlock: Türen ver-/entriegeln.
POST /climate/start, POST /climate/stop: Klimaanlage steuern. (Body für start: {"temperature": 22, "defrost": false, "windscreenHeating": false})
POST /charge/start, POST /charge/stop: Laden steuern.
GET /odometer: Kilometerstand.
GET /location: Position.
4.5. Server manuell starten (zum Testen)
Setze die Umgebungsvariablen im Terminal und starte den Server:
```

```Bash
cd /home/pi/blserver
* Umgebungsvariablen setzen (Beispiel):
 export BLUELINK_USERNAME="dein_benutzername@example.com"
# export BLUELINK_PASSWORD='Dein!Passw0rtMitSonderzeichen'
 ... (alle Variablen setzen)
node bluelinky-server.js
 ```

(Wenn der Server als Dienst konfiguriert wird, bezieht er die Variablen aus der EnvironmentFile.)

## 4.6. Server als systemd-Dienst einrichten
Damit der API-Server (bluelinky-server.js) automatisch beim Hochfahren deines Raspberry Pi startet und zuverlässig im Hintergrund läuft, konfigurieren wir ihn als systemd-Dienst.

### 4.6.1. Pfad zu Node.js ermitteln
systemd muss den genauen Pfad zu deiner Node.js-Ausführungsdatei kennen. Finde ihn mit:

```Bash

which node

Notiere dir den ausgegebenen Pfad (z.B. /usr/bin/node oder /usr/local/bin/node).

### 4.6.2. systemd-Service-Unit-Datei erstellen
Erstelle eine neue Service-Datei. Du benötigst sudo-Rechte dafür. (Erinnerung: Du bevorzugst vi als Editor.)

```Bash

sudo vi /etc/systemd/system/bluelinky-server.service
```

Füge folgenden Inhalt in diese Datei ein. Wichtig: Ersetze in der Zeile ExecStart= den Pfad /usr/bin/node durch den Pfad, den du in Schritt 4.6.1 ermittelt hast!

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

# Ersetze '/usr/bin/node' mit dem tatsächlichen Pfad, den 'which node' angezeigt hat!
ExecStart=/usr/bin/node /home/pi/blserver/bluelinky-server.js

EnvironmentFile=/home/pi/blserver/.env 
RuntimeMaxSec=6h
Restart=always
RestartSec=5s
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
Stelle sicher, dass die Datei /home/pi/blserver/.env (wie in Abschnitt 4.3 beschrieben) existiert und deine Bluelink-Zugangsdaten enthält.
```

### 4.6.3. systemd informieren und Dienst verwalten
Nachdem du die .service-Datei erstellt und gespeichert hast, führe folgende Befehle im Terminal aus:

systemd anweisen, seine Konfiguration neu zu laden:
```Bash

sudo systemctl daemon-reload
```

Den Dienst für den automatischen Start beim Booten aktivieren:

```Bash

sudo systemctl enable bluelinky-server.service
```

Den Dienst sofort manuell starten:

```Bash

sudo systemctl start bluelinky-server.service
```

### 4.6.4. Status und Logs des Dienstes prüfen
Aktuellen Status des Dienstes anzeigen:

```Bash

sudo systemctl status bluelinky-server.service
Logs des Dienstes ansehen:
Letzte Log-Einträge: sudo journalctl -u bluelinky-server.service -e --no-pager
Logs live verfolgen: sudo journalctl -u bluelinky-server.service -f (Mit Strg+C beenden)
Logs seit dem letzten Boot: sudo journalctl -u bluelinky-server.service -b
```

### 4.6.5. Wichtiger Hinweis zum bluelinky-server.js-Skript für den Dienstbetrieb
Der setInterval(...)-Aufruf am Ende des bluelinky-server.js-Skripts hilft dabei, den Node.js-Prozess unter systemd stabil und dauerhaft am Laufen zu halten.


# 5. Verwendete Bibliotheken / Referenzen
bluelinky: Die Kernbibliothek für die Kommunikation mit den Hyundai/Kia Bluelink/UVO-Diensten.
Express.js: Web-Framework für Node.js, verwendet für den API-Server.

# 5. Wichtige Hinweise / Troubleshooting
Zugangsdaten: Korrektheit ist entscheidend (.env-Datei für den Dienst, direkte Eingabe im test-bluelinky.js für lokale Tests).
Editor: Vorsicht beim Kopieren von Code, um unsichtbare Zeichen oder Formatierungsfehler zu vermeiden.
Logs: Immer die Server-Logs (journalctl oder Konsolenausgabe) prüfen.
Passwörter in der Shell: Bei Sonderzeichen (!) einfache Anführungszeichen für export nutzen. In .env-Dateien ist dies ebenfalls sicherer.