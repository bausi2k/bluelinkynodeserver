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