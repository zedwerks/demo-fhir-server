import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const AUTH_SERVER_BASE_URL = process.env.AUTH_SERVER_BASE_URL || BASE_URL;

// ---- SUPER SIMPLE BEARER CHECK ----
function requireBearer(req, res, next) {
  const auth = req.headers.authorization || "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || token !== DEMO_BEARER_TOKEN) {
    return res.status(401).json({
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "login",
          diagnostics:
            "Invalid or missing bearer token. Provide Authorization: Bearer <token>."
        }
      ]
    });
  }
  next();
}

// ---- IN-MEMORY FHIR STORE (SUPER LIGHT) ----
const MRN_SYSTEM = process.env.MRN_SYSTEM || "http://hospital.example.org/mrn";

/** Simple helpers to keep indices by id and MRN */
const patientsById = new Map();     // id -> Patient
const patientsByMrn = new Map();    // mrn string -> Patient

function addPatient(p) {
  patientsById.set(p.id, p);
  // index all MRN-like identifiers
  (p.identifier || [])
    .filter(id => !id.system || id.system === MRN_SYSTEM) // index plain or our MRN system
    .forEach(id => {
      if (id.value) patientsByMrn.set(id.value, p);
    });
}

// Seed two example patients
addPatient({
  resourceType: "Patient",
  id: "pat-123",
  active: true,
  identifier: [
    { system: MRN_SYSTEM, value: "123456" }
  ],
  name: [{ use: "official", family: "Fitzgerald", given: ["Alexandra", "Maximiliana"] }],
  gender: "female",
  birthDate: "1980-12-01"
});

addPatient({
  resourceType: "Patient",
  id: "pat-654",
  active: true,
  identifier: [
    { system: MRN_SYSTEM, value: "654321" }
  ],
  name: [{ use: "official", family: "Montagne-Bellerose", given: ["Elizabeth"] }],
  gender: "female",
  birthDate: "1982-05-14"
});

// ---- SMART WELL-KNOWN & CAPABILITY ----
app.get("/.well-known/smart-configuration", (req, res) => {
  res.json({
    issuer: AUTH_SERVER_BASE_URL,
    authorization_endpoint: `${AUTH_SERVER_BASE_URL}/oauth2/authorize`,
    token_endpoint: `${AUTH_SERVER_BASE_URL}/oauth2/token`,
    introspection_endpoint: `${AUTH_SERVER_BASE_URL}/oauth2/introspect`,
    scopes_supported: [
      "openid",
      "fhirUser",
      "launch",
      "launch/patient",
      "patient/*.read",
      "offline_access"
    ],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token", "client_credentials"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
    capabilities: [
      "context-ehr",
      "permission-patient",
      "permission-offline"
    ]
  });
});

app.get("/metadata", (req, res) => {
  res.json({
    resourceType: "CapabilityStatement",
    status: "active",
    date: new Date().toISOString(),
    kind: "instance",
    fhirVersion: "4.0.1",
    format: ["json"],
    rest: [
      {
        mode: "server",
        security: {
          service: [{
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/restful-security-service",
              code: "SMART-on-FHIR"
            }]
          }],
          extension: [
            {
              url: "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris",
              extension: [
                { url: "authorize", valueUri: `${AUTH_SERVER_BASE_URL}/oauth2/authorize` },
                { url: "token", valueUri: `${AUTH_SERVER_BASE_URL}/oauth2/token` }
              ]
            }
          ]
        },
        resource: [
          { type: "Patient", interaction: [{ code: "read" }, { code: "search-type" }] }
        ]
      }
    ]
  });
});

// ---- PATIENT READ (BY ID) ----
app.get("/Patient/:id", requireBearer, (req, res) => {
  const p = patientsById.get(req.params.id);
  if (!p) {
    return res.status(404).json({
      resourceType: "OperationOutcome",
      issue: [{ severity: "error", code: "not-found", diagnostics: "Patient not found" }]
    });
  }
  res.json(p);
});

// ---- PATIENT SEARCH (BY MRN via identifier) ----
// Supports:
//   /Patient?identifier=123456
//   /Patient?identifier=http://hospital.example.org/mrn|123456
app.get("/Patient", requireBearer, (req, res) => {
  const identifierParam = req.query.identifier;

  let matches = [];
  if (identifierParam) {
    // handle repeated identifier parameters (?identifier=...&identifier=...)
    const idParams = Array.isArray(identifierParam) ? identifierParam : [identifierParam];

    const wantedMrns = idParams.map(s => {
      // format system|value -> extract value; if no pipe, treat as plain MRN
      const pipe = String(s).indexOf("|");
      return pipe >= 0 ? String(s).slice(pipe + 1) : String(s);
    });

    // dedupe & lookup
    const seen = new Set();
    wantedMrns.forEach(mrn => {
      const p = patientsByMrn.get(mrn);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        matches.push(p);
      }
    });
  } else {
    // No params -> return nothing (or list all—keeping minimal)
    matches = [];
  }

  const bundle = {
    resourceType: "Bundle",
    type: "searchset",
    total: matches.length,
    entry: matches.map(p => ({
      fullUrl: `${BASE_URL}/Patient/${p.id}`,
      resource: p,
      search: { mode: "match" }
    }))
  };

  res.json(bundle);
});

// ---- ROOT ----
app.get("/", (req, res) => {
  res.json({
    message: "SMART-on-FHIR stub is running",
    wellKnown: `${BASE_URL}/.well-known/smart-configuration`,
    metadata: `${BASE_URL}/metadata`,
    samplePatientById: `${BASE_URL}/Patient/pat-123`,
    exampleSearchByMrn: [
      `${BASE_URL}/Patient?identifier=${encodeURIComponent(MRN_SYSTEM)}|123456`,
      `${BASE_URL}/Patient?identifier=654321`
    ],
    tokenHint: `POST ${AUTH_SERVER_BASE_URL}/oauth2/token to get a bearer token`
  });
});

app.listen(PORT, () => {
  console.log(`SMART FHIR stub listening on ${BASE_URL}`);
  console.log(`MRN system: ${MRN_SYSTEM}`);
  console.log(`Auth server base URL: ${AUTH_SERVER_BASE_URL}`);
});