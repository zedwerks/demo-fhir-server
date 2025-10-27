// environment
import dotenv from "dotenv";
dotenv.config();

 // SMART Keycloak
export const AUTH_SERVER_BASE_URL = process.env.AUTH_SERVER_BASE_URL || `https://kc.zedwerks.com/realms/smart`;

// Base URL for the FHIR server

export const SERVER_PORT = 9000; // Default port for the server

export const BASE_URL = process.env.BASE_URL || `http://localhost:${SERVER_PORT}`;

// MRN system URL
export const MRN_SYSTEM = process.env.MRN_SYSTEM || "http://hospital.example.org/mrn";


// Export the environment variables for use in other modules
export default {
  AUTH_SERVER_BASE_URL,
  BASE_URL,
  MRN_SYSTEM,
  SERVER_PORT
};