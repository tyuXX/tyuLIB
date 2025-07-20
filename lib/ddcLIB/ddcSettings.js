/**
 * @file ddcSettings.js
 * @description A namespaced settings management system that extends DDCRegistry
 * @module DDCSettings
 */

import { DDCRegistry } from "./ddcRegistry.js";
import { LZString } from "../external/lz-string.min.js";
import { str_sha1 } from "../sha1.js";

// Current version of the settings format
const SETTINGS_VERSION = 1;

/**
 * Represents a namespaced settings container that extends DDCRegistry.
 * Provides methods to manage application settings with default values and persistence.
 * @extends DDCRegistry
 */
class NamespacedSettings extends DDCRegistry {
    /**
     * Creates a new NamespacedSettings instance
     * @param {DDCRegistry} ddcRegistry - The registry entry this settings object belongs to
     * @throws {Error} If ddcRegistry is not an instance of DDCRegistry
     */
    constructor(ddcRegistry) {
        if (!(ddcRegistry instanceof DDCRegistry)) {
            throw new Error('NamespacedSettings requires a valid DDCRegistry instance');
        }
        
        super(ddcRegistry.name, ddcRegistry.id, ddcRegistry.description, ddcRegistry.version);
        
        /** @type {Map<string, any>} Current settings values */
        this.settings = new Map();
        
        /** @type {Map<string, any>} Default settings values */
        this.defaults = new Map();
        
        /** @type {boolean} Whether changes should be automatically persisted */
        this.autoSave = true;
        
        // Preserve GUID from the original registry
        this.GUID = ddcRegistry.GUID;
    }
    
    /**
     * Initializes settings with default values
     * @param {Object.<string, any>} settingsObj - Object containing default settings
     * @returns {NamespacedSettings} Returns self for method chaining
     */
    setup(settingsObj) {
        if (!settingsObj || typeof settingsObj !== 'object') {
            throw new Error('Settings must be an object');
        }
        
        this.defaults = new Map(Object.entries(settingsObj));
        this.reset();
        
        // Load any previously saved settings
        this.load();
        
        return this;
    }
    
    /**
     * Gets a setting value by name
     * @param {string} name - Setting name
     * @param {*} [fallback] - Optional fallback value if setting doesn't exist
     * @returns {*} The setting value or fallback
     */
    get(name, fallback = undefined) {
        if (this.settings.has(name)) {
            return this.settings.get(name);
        }
        return this.defaults.has(name) ? this.defaults.get(name) : fallback;
    }
    
    /**
     * Sets a setting value
     * @param {string} name - Setting name
     * @param {*} value - Setting value
     * @param {boolean} [temporary=false] - If true, doesn't trigger auto-save
     * @returns {NamespacedSettings} Returns self for method chaining
     */
    set(name, value, temporary = false) {
        this.settings.set(name, value);
        
        if (this.autoSave && !temporary) {
            this.save();
        }
        
        return this;
    }
    
    /**
     * Resets all settings to their default values
     * @returns {NamespacedSettings} Returns self for method chaining
     */
    reset() {
        this.settings = new Map(this.defaults);
        if (this.autoSave) {
            this.save();
        }
        return this;
    }
    
    /**
     * Toggles a boolean setting
     * @param {string} name - Name of the boolean setting
     * @returns {boolean} The new value of the setting
     * @throws {Error} If the setting is not a boolean
     */
    toggle(name) {
        const current = this.get(name);
        if (typeof current !== 'boolean') {
            throw new Error(`Cannot toggle non-boolean setting: ${name}`);
        }
        
        const newValue = !current;
        this.set(name, newValue);
        return newValue;
    }
    
    /**
     * Saves current settings to persistent storage with compression
     * @returns {boolean} True if save was successful
     */
    save() {
        try {
            const data = {
                ...this.toJSON(),
                settings: Object.fromEntries(this.settings),
                _version: SETTINGS_VERSION,
                _timestamp: new Date().toISOString()
            };
            
            // Convert to JSON and compress
            const jsonString = JSON.stringify(data);
            const compressed = LZString.compressToBase64(jsonString);
            
            // Add integrity check
            const saveString = `${compressed}\n${str_sha1(compressed)}`;
            
            // Save to localStorage
            localStorage.setItem(`DDCSettings-${this.id}`, saveString);
            this.emit('save', this.settings);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.emit('error', error);
            return false;
        }
    }
    
    /**
     * Loads settings from persistent storage with decompression
     * @returns {boolean} True if load was successful
     */
    load() {
        try {
            const saveString = localStorage.getItem(`DDCSettings-${this.id}`);
            if (!saveString) return false;
            
            // Handle both compressed and uncompressed formats for backward compatibility
            let parsed;
            if (saveString.includes('\n')) {
                // Compressed format with checksum
                const [compressed, checksum] = saveString.split('\n');
                if (str_sha1(compressed) !== checksum) {
                    throw new Error('Settings integrity check failed');
                }
                
                const jsonString = LZString.decompressFromBase64(compressed);
                if (!jsonString) {
                    throw new Error('Failed to decompress settings');
                }
                
                parsed = JSON.parse(jsonString);
            } else {
                // Legacy uncompressed format
                parsed = JSON.parse(saveString);
            }
            
            if (parsed.settings && typeof parsed.settings === 'object') {
                // Handle migration if needed
                if (parsed._version === 1) {
                    // Current version, no migration needed
                }
                
                this.settings = new Map(Object.entries(parsed.settings));
                this.emit('load', this.settings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.emit('error', error);
            return false;
        }
    }
    
    /**
     * Converts settings to a plain object
     * @returns {Object} Plain object representation of settings
     */
    toJSON() {
        return {
            ...super.toJSON(),
            settings: Object.fromEntries(this.settings)
        };
    }
}

// Global settings registry
const settingsRegistry = new Map();

/**
 * Creates a new namespaced settings instance
 * @param {DDCRegistry} registry - The registry entry for these settings
 * @param {Object} defaults - Default settings values
 * @returns {NamespacedSettings} The created settings instance
 */
function createNamespace(registry, defaults = {}) {
    if (settingsRegistry.has(registry.id)) {
        throw new Error(`Settings namespace '${registry.id}' already exists`);
    }
    
    const settings = new NamespacedSettings(registry);
    settings.setup(defaults);
    settingsRegistry.set(registry.id, settings);
    
    return settings;
}

/**
 * Gets a namespaced settings instance by ID
 * @param {string} id - The namespace ID
 * @returns {NamespacedSettings|null} The settings instance or null if not found
 */
function getNamespace(id) {
    return settingsRegistry.get(id) || null;
}

/**
 * Gets or creates a namespaced settings instance
 * @param {DDCRegistry} registry - The registry entry for these settings
 * @param {Object} [defaults={}] - Default settings values (used if creating new)
 * @returns {NamespacedSettings} The settings instance
 */
function ensureNamespace(registry, defaults = {}) {
    return getNamespace(registry.id) || createNamespace(registry, defaults);
}

/**
 * Loads all settings from persistent storage
 * @returns {Map<string, NamespacedSettings>} Map of loaded settings
 */
function loadAllNamespaces() {
    const loaded = new Map();
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('DDCSettings-')) {
            try {
                const saveString = localStorage.getItem(key);
                let data;
                
                // Handle both compressed and uncompressed formats
                if (saveString.includes('\n')) {
                    // Compressed format with checksum
                    const [compressed, checksum] = saveString.split('\n');
                    if (str_sha1(compressed) !== checksum) {
                        console.warn(`Integrity check failed for settings: ${key}`);
                        continue;
                    }
                    
                    const jsonString = LZString.decompressFromBase64(compressed);
                    if (!jsonString) {
                        console.warn(`Decompression failed for settings: ${key}`);
                        continue;
                    }
                    
                    data = JSON.parse(jsonString);
                } else {
                    // Legacy uncompressed format
                    data = JSON.parse(saveString);
                }
                
                if (data && data.id) {
                    const registry = new DDCRegistry(
                        data.name || data.id,
                        data.id,
                        data.description || '',
                        data.version || '1.0.0'
                    );
                    
                    const settings = new NamespacedSettings(registry);
                    if (data.settings) {
                        settings.settings = new Map(Object.entries(data.settings));
                        
                        // If this was loaded from uncompressed format, save it compressed
                        if (!saveString.includes('\n')) {
                            settings.save();
                        }
                    }
                    
                    settingsRegistry.set(data.id, settings);
                    loaded.set(data.id, settings);
                }
            } catch (error) {
                console.error(`Failed to load settings from ${key}:`, error);
            }
        }
    }
    
    return loaded;
}

// Export public API
export {
    NamespacedSettings,
    createNamespace,
    getNamespace,
    ensureNamespace,
    loadAllNamespaces
};

export default {
    NamespacedSettings,
    createNamespace,
    getNamespace,
    ensureNamespace,
    loadAllNamespaces
};