import { DDCRegistry } from "./ddcRegistry.js";

class NamespacedSettings extends DDCRegistry {
    constructor(ddcRegistry) {
        super(ddcRegistry.name, ddcRegistry.id, ddcRegistry.description, ddcRegistry.version);
        this.GUID = ddcRegistry.GUID;
        // Setting format: [name, value]
        this.settings = new Map();
        this.defaults = new Map();
    }
    Setup(settings) {
        this.settings = settings;
        this.defaults = settings;
    }
    GetSetting(name) {
        return this.settings.get(name) || this.defaults.get(name);
    }
    SetSetting(name, value) {
        this.settings.set(name, value);
    }
    ResetSettings() {
        this.settings = new Map(this.defaults);
    }
    ToggleBooleanSetting(name) {
        if(typeof(this.settings.get(name)) === "boolean") {
            this.settings.set(name, !this.settings.get(name));
        }
    }
    SaveSettings() {
        // Save settings to local storage or any other persistent storage
        localStorage.setItem("DDCSettings-" + this.id, JSON.stringify(Array.from(this.settings.entries())));
    }
}

let settings = [];

function GetNamespacedSettings(id) {
    let storedSettings = localStorage.getItem("DDCSettings-" + id);
    if (storedSettings) {
        let parsedSettings = new Map(JSON.parse(storedSettings));
        return parsedSettings;
    }
    return null;
}

function LoadNamespacedSettings(id) {
    let storedSettings = localStorage.getItem("DDCSettings-" + id);
    if (storedSettings) {
        let parsedSettings = JSON.parse(storedSettings);
        let settings = new NamespacedSettings(new DDCRegistry(parsedSettings.name, parsedSettings.id, parsedSettings.description, parsedSettings.version));
        settings.GUID = parsedSettings.GUID;
        settings.Setup(Map.parse(parsedSettings.settings));
        settings.push(settings);
    }
    return null;
}

function NewNamespacedSettings(ddcRegistry, settingsDefaults) {
    let newSettings = new NamespacedSettings(ddcRegistry);
    newSettings.Setup(settingsDefaults);
    settings.push(newSettings)
}

function GetNamespaceByName(name) {
    return settings.find(namespace => namespace.name === name) || null;
}

function GetNamespaceByID(id) {
    return settings.find(namespace => namespace.id === id) || null;
}

function GetNamespaceByRegistry(ddcRegistry) {
    return settings.find(namespace => namespace.GUID === ddcRegistry.GUID) || null;
}

export { NewNamespacedSettings, GetNamespaceByName, GetNamespaceByID, GetNamespaceByRegistry, LoadNamespacedSettings, NamespacedSettings, GetNamespacedSettings };
export default { NewNamespacedSettings, GetNamespaceByName, GetNamespaceByID, GetNamespaceByRegistry, LoadNamespacedSettings, NamespacedSettings, GetNamespacedSettings };