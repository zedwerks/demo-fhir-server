// FHIR Server /metadata endpoint
// Returns the server's metadata in a format compatible with FHIR
// This is a simplified version and may not include all FHIR metadata fields
import { AUTH_SERVER_BASE_URL, BASE_URL, MRN_SYSTEM } from "../env/env.js";

export const metadata = {
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
  };
