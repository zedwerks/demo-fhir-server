import { promises as fs } from "fs";
import path from "path";

/**
 * Reads a JSON file from disk and returns its contents as a JavaScript object.
 * @param {string} filePath - Path to the JSON file (relative or absolute)
 * @returns {Promise<any>} Parsed JSON contents
 */
export async function readJsonFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const data = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Error reading JSON file: ${filePath}`, err);
    throw new Error("Failed to read JSON file");
  }
}