// FHIR Server /.well-known/smart-configuration endpoint
// Returns the server's metadata in a format compatible with FHIR
// This is a simplified version and may not include all FHIR configuration fields
import { AUTH_SERVER_BASE_URL } from "../env/env.js";

export const smartConfiguration = {
    issuer: AUTH_SERVER_BASE_URL,  // prefer to use the well-known URL of this for discovery
    authorization_endpoint: `${AUTH_SERVER_BASE_URL}/protocol/openid-connnect/auth`,
    token_endpoint: `${AUTH_SERVER_BASE_URL}/protocol/openid-connect/token`,
    introspection_endpoint: `${AUTH_SERVER_BASE_URL}/protocol/openid-connect/introspect`,
    scopes_supported: [
      "openid",
      "fhirUser",
      "launch",
      "launch/patient",
      "user/*.read",
      "user/Patient.read",
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
  };
  
// Note: This is a simplified version and may not include all SMART-on-FHIR configuration fields
// For a complete implementation, refer to the SMART-on-FHIR specification.