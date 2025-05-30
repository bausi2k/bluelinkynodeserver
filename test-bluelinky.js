// test-bluelinky.js
const BluelinkyModule = require('bluelinky'); // Lädt das Bluelinky-Modul
console.log('--- Inhalt von require("bluelinky") ---');
console.log(BluelinkyModule); // Gibt aus, was genau von require('bluelinky') geladen wurde
console.log('--------------------------------------');

// Versucht, den Konstruktor zu finden, egal ob er direkt exportiert wird oder unter einer .default Eigenschaft liegt
const Bluelinky = BluelinkyModule.default || BluelinkyModule;

// ##########################################################################
// ### WICHTIG: Ersetze diese Platzhalter durch DEINE ECHTEN ZUGANGSDATEN! ###
// ###         (Für deinen erfolgreichen Test hattest du hier deine      ###
// ###          haus@gruber.casa etc. Daten direkt eingetragen)         ###
// ##########################################################################
const USERNAME = 'DEIN_BLUELINK_BENUTZERNAME';
const PASSWORD = 'DEIN_BLUELINK_PASSWORT';
const PIN = 'DEINE_BLUELINK_PIN'; // Deine numerische PIN
const VIN = 'DEINE_FAHRGESTELLNUMMER_DEINES_AUTOS'; // 17-stellige VIN
const REGION = 'EU'; // Für Österreich ist 'EU' korrekt.
// ##########################################################################

async function runTest() {
  console.log(`[INFO] Bluelinky Test gestartet.`);
  console.log(`[INFO] Konfigurierte Region: ${REGION}`);
  console.log(`[INFO] Konfigurierter Username: ${USERNAME}`);
  console.log(`[INFO] Konfigurierte VIN: ${VIN}`);

  // Zusätzliche Prüfung, ob Bluelinky jetzt ein gültiger Konstruktor ist
  if (typeof Bluelinky !== 'function') {
    console.error('[FATAL] Bluelinky konnte nicht als Funktion/Konstruktor geladen werden. Überprüfe die Ausgabe von "Inhalt von require(\'bluelinky\')" oben.');
    console.error('Derzeitiger Typ von Bluelinky:', typeof Bluelinky, 'Wert:', Bluelinky);
    return; // Test hier abbrechen, da eine Instanziierung fehlschlagen würde
  }

  const client = new Bluelinky({
    username: USERNAME,
    password: PASSWORD,
    region: REGION,
    pin: PIN,
    vin: VIN,
    autoLogin: false, // Wir rufen login() manuell auf für besseres Debugging
    debug: true      // Aktiviert ausführlichere Logs von der bluelinky-Bibliothek selbst
  });

  // Event-Listener für erfolgreiche Bereitschaft (nach Login)
  client.on('ready', (vehicles) => {
    console.log('[SUCCESS] Bluelinky ist bereit! Login war erfolgreich.');
    if (vehicles && vehicles.length > 0) {
      console.log(`[INFO] ${vehicles.length} Fahrzeug(e) im Account gefunden:`);
      vehicles.forEach(vehicle => {
        console.log(`  - Name: ${vehicle.name()}, VIN: ${vehicle.vin()}, ID: ${vehicle.id()}`);
      });

      // Beispiel: Status des ersten Fahrzeugs abrufen
      const firstVehicle = vehicles[0];
      console.log(`[INFO] Versuche Status für Fahrzeug ${firstVehicle.vin()} abzurufen...`);
      firstVehicle.status({ refresh: true, parsed: true }) // parsed: true für menschenlesbares Format
        .then(status => {
          console.log('[SUCCESS] Fahrzeugstatus erfolgreich abgerufen:');
          console.log(JSON.stringify(status, null, 2));
        })
        .catch(err => {
          console.error('[ERROR] Fehler beim Abrufen des Fahrzeugstatus:', err.message || err);
        });

    } else {
      console.warn('[WARN] Keine Fahrzeuge im Account gefunden, obwohl Login erfolgreich war.');
    }
  });

  // Event-Listener für Fehler
  client.on('error', (err) => {
    console.error('[FATAL] Ein schwerwiegender Fehler ist in Bluelinky aufgetreten:');
    console.error('Fehlermeldung:', err.message || err);
    if (err.context) {
      console.error('Fehlerkontext:', err.context);
    }
    // Den Stacktrace bei Bedarf einkommentieren für sehr detaillierte Fehlersuche:
    // if (err.stack) {
    //   console.error('Stacktrace:', err.stack);
    // }

    // Spezifische Hinweise basierend auf der Fehlermeldung
    if (String(err.message || err.context || '').includes('400')) {
        console.error('\n[HINWEIS] Ein "400 Bad Request" deutet SEHR STARK auf falsche Zugangsdaten hin (Username, Passwort, PIN oder VIN) oder ein Problem mit der Kombination dieser Daten und der Region. Bitte überprüfe diese nochmals ganz genau!');
    } else if (String(err.message || err.context || '').includes('region')) {
        console.error(`\n[HINWEIS] Es scheint ein Problem mit der Regionseinstellung zu geben. Aktuell ist "${REGION}" konfiguriert. Die Bibliothek unterstützt "EU", "US", "CA".`);
    }
  });

  // Manueller Login-Versuch
  try {
    console.log('[INFO] Starte manuellen Login-Versuch bei Bluelink...');
    const loginResponse = await client.login();
    // Bei Erfolg wird der 'ready' Event ausgelöst.
    console.log('[INFO] Manueller Login-Aufruf abgeschlossen. Antwort von client.login():', loginResponse);
  } catch (error) {
    // Der 'error' Event-Handler sollte die meisten Fehler bereits abfangen.
    // Dieser catch-Block fängt Fehler ab, die direkt von `await client.login()` geworfen werden könnten.
    console.error('[ERROR] Fehler direkt während des client.login() Aufrufs:');
    console.error('Fehlermeldung:', error.message || error);
    if (error.context) {
      console.error('Fehlerkontext:', error.context);
    }
  }
}

runTest();