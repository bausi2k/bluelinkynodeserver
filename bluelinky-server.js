// bluelinky-server.js
const BluelinkyModule = require('bluelinky');
const Bluelinky = BluelinkyModule.default || BluelinkyModule;
const express = require('express');

// === Konfiguration über Umgebungsvariablen ===
const USERNAME = process.env.BLUELINK_USERNAME;
const PASSWORD = process.env.BLUELINK_PASSWORD;
const PIN = process.env.BLUELINK_PIN;
const VIN = process.env.BLUELINK_VIN;
const REGION = process.env.BLUELINK_REGION || 'EU';
const SERVER_PORT = process.env.PORT || 8080;

if (!USERNAME || !PASSWORD || !PIN || !VIN) {
  console.error('[FATAL] Fehlende Bluelink Umgebungsvariablen! Bitte setzen Sie BLUELINK_USERNAME, BLUELINK_PASSWORD, BLUELINK_PIN, und BLUELINK_VIN.');
  process.exit(1);
}

const app = express();
app.use(express.json());

let vehicleClient = null;

console.log(`[INFO] Initialisiere Bluelinky Client für Region: ${REGION}, User: ${USERNAME}, VIN: ${VIN}`);
const client = new Bluelinky({
  username: USERNAME,
  password: PASSWORD,
  region: REGION,
  pin: PIN,
  vin: VIN,
  autoLogin: false,
  debug: process.env.NODE_ENV !== 'production'
});

client.on('ready', (vehicles) => {
  console.log('[SUCCESS] Bluelinky ist bereit! Login war erfolgreich.');
  if (vehicles && vehicles.length > 0) {
    vehicleClient = vehicles.find(v => v.vin() === VIN);
    if (vehicleClient) {
      console.log(`[INFO] Fahrzeug ${vehicleClient.name()} (VIN: ${vehicleClient.vin()}) wurde gefunden und ausgewählt.`);
    } else {
      console.error(`[ERROR] Fahrzeug mit der konfigurierten VIN (${VIN}) wurde nicht im Account gefunden. Verfügbare Fahrzeuge:`);
      vehicles.forEach(v => console.log(`  - Name: ${v.name()} (VIN: ${v.vin()})`));
    }
  } else {
    console.warn('[WARN] Keine Fahrzeuge im Account gefunden.');
  }
});

client.on('error', (err) => {
  console.error('[FATAL] Bluelinky Client Fehler aufgetreten:');
  if (err.response) {
      console.error(`  HTTP Status Code: ${err.response.statusCode}`);
      console.error(`  Angefragte URL: ${err.response.url}`);
      console.error(`  Antwort-Body (könnte HTML sein):`, err.response.body);
  } else {
      console.error('  Fehlermeldung:', err.message || 'Unbekannter Fehler');
  }
  if (err.context) {
    console.error('  Bluelinky Fehlerkontext:', err.context);
  }
  const errString = String(err.message || err.context || (err.response ? err.response.body : '')).toLowerCase();
  if (errString.includes('400') || errString.includes('invalid') || errString.includes('bad request')) {
      console.error('\n[HINWEIS] Ein Fehler "400 Bad Request" oder "invalid" deutet oft auf Probleme mit den Zugangsdaten, der Region oder der Gültigkeit der Sitzung hin.');
  } else if (errString.includes('<!doctype html>') || errString.includes('<html')) {
      console.error('\n[HINWEIS] Die Antwort vom Server war HTML, nicht JSON. Dies deutet oft auf eine Fehlerseite oder eine abgelaufene Sitzung hin.');
  }
  vehicleClient = null;
});

function sendResponse(res, endpointName, promise) {
    if (!vehicleClient) {
        console.warn(`[API WARN] Aufruf von ${endpointName}, aber vehicleClient ist nicht bereit (Login fehlgeschlagen oder Fahrzeug nicht gefunden).`);
        return res.status(503).json({ 
            success: false, 
            command_invoked: endpointName,
            error: 'Bluelinky Client nicht bereit oder Fahrzeug nicht gefunden.' 
        });
    }
    console.log(`[API] Anfrage für ${endpointName} für VIN ${VIN}`);
    promise
        .then(result => {
            console.log(`[API] ${endpointName} für ${VIN} erfolgreich ausgeführt.`);
            res.json({ 
                success: true, 
                command_invoked: endpointName,
                message: `${endpointName} erfolgreich.`, 
                data: result 
            });
        })
        .catch(error => {
            console.error(`[API ERROR] Beim Aufruf von ${endpointName} für VIN ${VIN} ist ein Fehler aufgetreten:`);
            if (error.response) {
                console.error(`  HTTP Status Code: ${error.response.statusCode}`);
                console.error(`  Angefragte URL: ${error.response.url}`);
                console.error(`  Antwort-Body (könnte HTML sein):`, error.response.body); 
            } else {
                console.error(`  Fehlermeldung: ${error.message || 'Unbekannter Fehler'}`);
            }
            res.status(500).json({ 
                success: false, 
                command_invoked: endpointName,
                error: `Fehler bei ${endpointName}.`, 
                details: error.message 
            });
        });
}

const apiInfo = {
  description: "Bluelinky API Server für Hyundai/Kia Fahrzeuge",
  version: "0.2.1",
  endpoints: [
    { path: "/", method: "GET", description: "Zeigt eine Willkommensnachricht und Link zu /info." },
    { path: "/info", method: "GET", description: "Zeigt diese API-Information (alle verfügbaren Endpunkte)." },
    { path: "/status", method: "GET", description: "Ruft den Fahrzeugstatus ab (gecached, verwendet fullStatus mit refresh: false)." },
    { path: "/status/refresh", method: "GET", description: "Ruft den Fahrzeugstatus ab (erzwingt aktuelle Daten vom Auto, verwendet fullStatus mit refresh: true)." },
    { path: "/lock", method: "POST", description: "Verriegelt das Fahrzeug." },
    { path: "/unlock", method: "POST", description: "Entriegelt das Fahrzeug." },
    { path: "/climate/start", method: "POST", description: "Startet die Klimaanlage.", body_example: { temperature: 21.5, defrost: false, windscreenHeating: false }, notes: "Temperatur in °C (14-30)." },
    { path: "/climate/stop", method: "POST", description: "Stoppt die Klimaanlage." },
    { path: "/charge/start", method: "POST", description: "Startet den Ladevorgang (nur für EV/PHEV)." },
    { path: "/charge/stop", method: "POST", description: "Stoppt den Ladevorgang (nur für EV/PHEV)." },
    { path: "/odometer", method: "GET", description: "Ruft den Kilometerstand ab." },
    { path: "/location", method: "GET", description: "Ruft die Fahrzeugposition ab." }
  ]
};

app.get('/', (req, res) => {
  res.json({ message: 'Bluelinky Server läuft! Siehe /info für verfügbare Endpunkte.', command_invoked: 'root' });
});

app.get('/info', (req, res) => {
  res.json({ success: true, command_invoked: 'info', data: apiInfo });
});

app.get('/status', (req, res) => {
  sendResponse(res, 'status_cached', vehicleClient.fullStatus({ refresh: false }));
});

app.get('/status/refresh', (req, res) => {
    sendResponse(res, 'status_live', vehicleClient.fullStatus({ refresh: true }));
});

app.post('/lock', (req, res) => {
  sendResponse(res, 'lock', vehicleClient.lock());
});

app.post('/unlock', (req, res) => {
  sendResponse(res, 'unlock', vehicleClient.unlock());
});

app.post('/climate/start', (req, res) => {
  const { temperature, defrost, windscreenHeating } = req.body;
  if (temperature === undefined || typeof parseFloat(temperature) !== 'number' || parseFloat(temperature) < 14 || parseFloat(temperature) > 30) {
      return res.status(400).json({ success: false, command_invoked: 'climate_start_invalid_input', error: 'Ungültige oder fehlende Temperatur (erwartet: Zahl zwischen 14-30 °C).', example: apiInfo.endpoints.find(e => e.path === '/climate/start').body_example });
  }
  const options = {
      temperature: parseFloat(temperature),
      defrost: !!defrost,
      windscreenHeating: !!windscreenHeating
  };
  console.log('[API INFO] /climate/start mit Optionen:', options);
  sendResponse(res, 'climate_start', vehicleClient.start(options));
});

app.post('/climate/stop', (req, res) => {
  sendResponse(res, 'climate_stop', vehicleClient.stop());
});

app.post('/charge/start', (req, res) => {
  sendResponse(res, 'charge_start', vehicleClient.startCharge());
});

app.post('/charge/stop', (req, res) => {
  sendResponse(res, 'charge_stop', vehicleClient.stopCharge());
});

app.get('/odometer', (req, res) => {
  sendResponse(res, 'odometer', vehicleClient.odometer());
});

app.get('/location', (req, res) => {
  sendResponse(res, 'location', vehicleClient.location());
});

async function startServer() {
  try {
    console.log('[INFO] Versuche initialen Login bei Bluelink...');
    await client.login();
    app.listen(SERVER_PORT, () => {
      console.log(`[INFO] Bluelinky Server gestartet und lauscht auf Port ${SERVER_PORT}`);
      console.log(`[INFO] Erreichbar z.B. unter http://localhost:${SERVER_PORT}/info`);
      if (!vehicleClient) {
          console.warn(`[WARN] Server ist gestartet, aber Bluelinky Client ist nicht bereit.`);
      }
    });
  } catch (error) {
    console.error('[FATAL] Kritischer Fehler beim initialen Login oder Serverstart:', error.message || error);
    process.exit(1);
  }
}

startServer();

// +++ NEUE ZEILE HINZUGEFÜGT START +++
// Diese Funktion hält den Node.js Event-Loop aktiv, was helfen kann,
// dass sich der Prozess unter systemd nicht einfach beendet.
setInterval(() => {
  // Diese Funktion muss nichts Sinnvolles tun. Ihre bloße Existenz als wiederkehrender Timer
  // hält den Prozess am Leben. Du könntest hier bei Bedarf einen periodischen Check
  // oder eine Log-Meldung einbauen, ist aber nicht zwingend notwendig.
  // console.log('[HEARTBEAT] Bluelinky Server Prozess ist aktiv...');
}, 1000 * 60 * 30); // Beispiel: alle 30 Minuten eine "leere" Aktion
// +++ NEUE ZEILE HINZUGEFÜGT ENDE +++
// Wed 28. May, 2025 14:13:39