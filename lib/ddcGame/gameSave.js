/**
 * @file gameSave.js
 * @description Game save/load functionality with compression and integrity checking
 * @module GameSave
 */

import { generateGUID } from "../ddcLIB/sharedFuncs.js";
import { LZString } from "../external/lz-string.min.js";
import { str_sha1 } from "../sha1.js";

/** Current version of the save file format */
const DDCSaveVersion = 2;

/** Maximum size of a save file in bytes (5MB) */
const MAX_SAVE_SIZE = 5 * 1024 * 1024;

/** Default save metadata */
const DEFAULT_METADATA = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: DDCSaveVersion,
  size: 0
};
/**
 * Represents a game save with versioning and integrity checking
 */
class DDCSave {
  /**
   * Creates a new DDCSave instance
   * @param {Object} data - The game data to save
   * @param {string} gameVersion - Current game version
   * @param {number} saveVersion - Save format version
   * @param {string} GUID - Unique identifier for this save
   * @param {string} saveID - User-facing save slot identifier
   * @param {Object} [metadata] - Optional metadata about the save
   */
  constructor(data, gameVersion, saveVersion, GUID, saveID, metadata = {}) {
    if (!data || typeof data !== 'object') {
      throw new Error('Save data must be an object');
    }
    
    this.data = data;
    this.gameVersion = gameVersion;
    this.saveVersion = saveVersion;
    this.GUID = GUID || generateGUID();
    this.saveID = saveID;
    this.metadata = { ...DEFAULT_METADATA, ...metadata };
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Serializes and compresses the save data
   * @returns {string} Compressed and checksummed save string
   */
  toString() {
    try {
      // Update metadata
      this.metadata.updatedAt = new Date().toISOString();
      this.metadata.size = JSON.stringify(this.data).length;
      
      // Serialize and compress
      const jsonString = JSON.stringify(this);
      if (jsonString.length > MAX_SAVE_SIZE) {
        throw new Error(`Save data exceeds maximum size of ${MAX_SAVE_SIZE} bytes`);
      }
      
      const compressed = LZString.compressToBase64(jsonString);
      if (!compressed) {
        throw new Error('Failed to compress save data');
      }
      
      // Add integrity check
      return `${compressed}\n${str_sha1(compressed)}`;
    } catch (error) {
      console.error('Failed to serialize save data:', error);
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Saves the current state to localStorage
   * @returns {boolean} True if save was successful
   */
  saveToLocal() {
    try {
      if (!this.saveID) {
        throw new Error('Cannot save: Missing saveID');
      }
      
      const saveString = this.toString();
      localStorage.setItem(`DDCSave-${this.saveID}`, saveString);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }
  
  /**
   * Updates the save data and metadata
   * @param {Object} newData - New save data
   * @param {Object} [newMetadata] - Optional metadata updates
   */
  update(newData, newMetadata = {}) {
    if (newData) {
      this.data = { ...this.data, ...newData };
    }
    if (newMetadata) {
      this.metadata = { ...this.metadata, ...newMetadata };
    }
    this.metadata.updatedAt = new Date().toISOString();
  }
}

/**
 * Loads a save from a string
 * @param {string} str - The save string to load
 * @returns {DDCSave|null} The loaded save or null if invalid
 */
function loadStringSave(str) {
  if (typeof str !== 'string') {
    console.error('Invalid save string: not a string');
    return null;
  }
  
  const result = checkSaveIntegrity(str);
  if (!result.success) {
    console.warn('Save integrity check failed');
    return null;
  }
  
  const save = result.save;
  if (!isValidSave(save)) {
    console.warn('Invalid save structure');
    return null;
  }
  
  try {
    return new DDCSave(
      save.data,
      save.gameVersion,
      save.saveVersion,
      save.GUID,
      save.saveID,
      save.metadata
    );
  } catch (error) {
    console.error('Failed to create save instance:', error);
    return null;
  }
}

/**
 * Loads a save from localStorage
 * @param {string} saveID - The ID of the save to load
 * @returns {DDCSave|null} The loaded save or null if not found or invalid
 */
function loadLocalSave(saveID) {
  try {
    if (typeof saveID !== 'string' || !saveID.trim()) {
      throw new Error('Invalid save ID');
    }
    
    const saveString = localStorage.getItem(`DDCSave-${saveID}`);
    if (!saveString) {
      return null;
    }
    
    return loadStringSave(saveString);
  } catch (error) {
    console.error(`Failed to load save '${saveID}':`, error);
    return null;
  }
}

/**
 * Creates a new save with default metadata
 * @param {Object} data - The game data to save
 * @param {string} gameVersion - Current game version
 * @param {string} saveID - Unique identifier for this save slot
 * @param {Object} [metadata] - Optional metadata to include
 * @returns {DDCSave} A new save instance
 */
function newSave(data, gameVersion, saveID, metadata = {}) {
  return new DDCSave(
    data,
    gameVersion,
    DDCSaveVersion,
    generateGUID(),
    saveID,
    { ...metadata, createdAt: new Date().toISOString() }
  );
}

/**
 * Checks the integrity of a save string
 * @param {string} saveStr - The save string to check
 * @returns {{success: boolean, save: Object|null}} Result with success status and parsed save
 */
function checkSaveIntegrity(saveStr) {
  try {
    if (typeof saveStr !== 'string') {
      throw new Error('Save string must be a string');
    }
    
    const [compressed, checksum] = saveStr.split('\n');
    if (!compressed || !checksum) {
      throw new Error('Invalid save format');
    }
    
    // Verify checksum
    if (str_sha1(compressed) !== checksum) {
      throw new Error('Checksum verification failed');
    }
    
    // Decompress and parse
    const jsonString = LZString.decompressFromBase64(compressed);
    if (!jsonString) {
      throw new Error('Failed to decompress save data');
    }
    
    const save = JSON.parse(jsonString);
    return { success: true, save };
    
  } catch (error) {
    console.error('Save integrity check failed:', error);
    return { success: false, save: null, error: error.message };
  }
}

/**
 * Validates the structure of a save object
 * @param {Object} save - The save object to validate
 * @returns {boolean} True if the save is valid
 */
function isValidSave(save) {
  return !!(save && 
    typeof save === 'object' &&
    save.data &&
    typeof save.data === 'object' &&
    save.gameVersion &&
    typeof save.saveVersion === 'number' &&
    save.GUID &&
    save.saveID
  );
}

/**
 * Gets an array of all available save slots
 * @returns {Array<{id: string, metadata: Object}>} Array of save metadata
 */
function listSaves() {
  const saves = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('DDCSave-')) {
      try {
        const saveID = key.replace('DDCSave-', '');
        const save = loadLocalSave(saveID);
        if (save) {
          saves.push({
            id: saveID,
            metadata: {
              ...save.metadata,
              size: JSON.stringify(save.data).length
            }
          });
        }
      } catch (error) {
        console.warn(`Error reading save ${key}:`, error);
      }
    }
  }
  
  return saves;
}

/**
 * Deletes a save from localStorage
 * @param {string} saveID - The ID of the save to delete
 * @returns {boolean} True if the save was deleted successfully
 */
function deleteSave(saveID) {
  try {
    localStorage.removeItem(`DDCSave-${saveID}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete save '${saveID}':`, error);
    return false;
  }
}

export { 
  DDCSave, 
  loadLocalSave, 
  newSave, 
  checkSaveIntegrity, 
  loadStringSave,
  listSaves,
  deleteSave
};

export default { 
  DDCSave, 
  loadLocalSave, 
  loadStringSave, 
  newSave,
  listSaves,
  deleteSave
};