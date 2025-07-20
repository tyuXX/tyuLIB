/**
 * @file ddcRegistry.js
 * @description A base registry class for managing unique registrable components with versioning and metadata.
 * @module DDCRegistry
 */

import { generateGUID } from "./sharedFuncs";

/**
 * Represents a base registry entry with common metadata and identification.
 * This class serves as the foundation for all registrable components in the system.
 */
export class DDCRegistry {
    /**
     * Creates a new registry entry
     * @param {string} name - Human-readable name of the registry entry
     * @param {string} id - Unique identifier (should be URL-friendly)
     * @param {string} description - Detailed description of the registry entry
     * @param {string} version - Version string (semver recommended)
     */
    constructor(name, id, description, version) {
        if (!name || !id || !version) {
            throw new Error('DDCRegistry requires name, id, and version parameters');
        }
        
        /** @type {string} Human-readable name */
        this.name = name;
        
        /** @type {string} Unique identifier */
        this.id = id.toLowerCase().replace(/\s+/g, '-');
        
        /** @type {string} Detailed description */
        this.description = description || '';
        
        /** @type {string} Version string */
        this.version = version;
        
        /** @type {string} Globally unique identifier */
        this.GUID = generateGUID();
        
        /** @type {Date} Creation timestamp */
        this.createdAt = new Date();
        
        /** @type {Date} Last updated timestamp */
        this.updatedAt = new Date();
    }

    /**
     * Updates the registry entry's metadata
     * @param {Object} updates - Object containing properties to update
     * @param {string} [updates.name] - New name
     * @param {string} [updates.description] - New description
     * @param {string} [updates.version] - New version
     * @returns {DDCRegistry} Returns self for method chaining
     */
    update(updates = {}) {
        if (updates.name) this.name = updates.name;
        if (updates.description !== undefined) this.description = updates.description;
        if (updates.version) this.version = updates.version;
        
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Serializes the registry entry to a plain object
     * @returns {Object} Serialized registry data
     */
    toJSON() {
        return {
            name: this.name,
            id: this.id,
            description: this.description,
            version: this.version,
            GUID: this.GUID,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * Creates a registry entry from a plain object
     * @param {Object} data - Object containing registry data
     * @returns {DDCRegistry} A new DDCRegistry instance
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided to fromJSON');
        }
        
        const registry = new DDCRegistry(
            data.name,
            data.id,
            data.description,
            data.version
        );
        
        // Preserve original GUID if it exists
        if (data.GUID) registry.GUID = data.GUID;
        if (data.createdAt) registry.createdAt = new Date(data.createdAt);
        if (data.updatedAt) registry.updatedAt = new Date(data.updatedAt);
        
        return registry;
    }
}

export default DDCRegistry;