import * as sha1 from "../sha1.js";
// Create a container for injected scripts
const injectorContainer = document.createElement("div");
document.body.appendChild(injectorContainer);
let lock = "";

// Define the DDCInjector
globalThis.DDCInjector = {
  config: {
    // Define the default async value
    async: false,
    // Define the default name
    name: "Undefined",
    // Define default fallbacks
    autoremove: true,
    refuseReinject: true,
  },
  scripts: [],
  styles: [],
  // Method to inject a script
  injectScript: (name = DDCInjector.config.name, link, async = DDCInjector.config.async, module = false, callback) => {
    if (DDCInjector.scripts.some((script) => script.link === link)) {
      if(DDCInjector.config.refuseReinject) {
        console.warn(
          `Script (${name}) is already injected. Refusing to reinject.`
        );
        return;
      }
      else{
        console.warn(
          `Script (${name}) is already injected. Reinjecting.`
        );
      }
    }
    const guid = DDCInjector.generateGuid();
    console.log(`Injecting (${name}) with link (${link}) and guid (${guid})`);
    // Check for invalid parameters
    if (!link) {
      console.error(`Failed to inject (${name}) due to missing link.`);
      return;
    }
    // Add script details to the scripts array
    DDCInjector.scripts.push({ name, guid, link });
    const script = document.createElement("script");
    script.src = `${link}?guid=${guid}`;
    script.async = async;
    script.type = module ? "module" : "text/javascript";
    // Append script and handle errors gracefully
    script.onload = () => {
      console.log(`Successfully loaded: (${name})`);
      if (callback) {
        console.log(`Executing callback for script: (${name})`);
        callback();
      }
    };
    script.onerror = (e) => {
      console.error(`Failed to load script: (${name}) from link: (${link})`, e);
      if(DDCInjector.config.autoremove) {
        DDCInjector.scripts.pop(); // Remove script from tracking on failure
        script.remove();
        console.log("Removed script with guid: (${guid}) due to error.");
      }
    };
    injectorContainer.appendChild(script);
    return guid;
  },
  injectStyle: (name = DDCInjector.config.name, link, callback) => {
    if (DDCInjector.styles.some((style) => style.link === link)) {
      if(DDCInjector.config.refuseReinject) {
        console.warn(
          `Style (${name}) is already injected. Refusing to reinject.`
        );
        return;
      }
      else{
        console.warn(
          `Style (${name}) is already injected. Reinjecting.`
        );
      }
    }
    const guid = DDCInjector.generateGuid();
    console.log(`Injecting (${name}) with link (${link}) and guid (${guid})`);
    // Check for invalid parameters
    if (!link) {
      console.error(`Failed to inject (${name}) due to missing link.`);
      return;
    }
    // Add style details to the styles array
    DDCInjector.styles.push({ name, guid, link });
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = `${link}?guid=${guid}`;
    // Append style and handle errors gracefully
    script.onload = () => {
      console.log(`Successfully loaded: (${name})`);
      if (callback) {
        console.log(`Executing callback for style: (${name})`);
        callback();
      }
    };
    style.onerror = (e) => {
      console.error(`Failed to load style: (${name}) from link: (${link})`, e);
      if(DDCInjector.config.autoremove) {
        DDCInjector.styles.pop(); // Remove style from tracking on failure
        style.remove();
        console.log(`Removed style with guid: (${guid}) due to error.`);
      }
    };
    injectorContainer.appendChild(style);
    return guid;
  },
  removeScript: (link) => {
    if(scripts.some((script) => script.link === link)) {
      const script = DDCInjector.scripts.find((script) => script.link === link);
      DDCInjector.scripts = DDCInjector.scripts.filter((script) => script.link !== link);
      script.remove();
      console.log(`Removed script with link: (${link})`);
      return true;
    }
    console.error(`Failed to remove script with link: (${link})`);
    return false;
  },
  removeStyle: (link) => {
    if(styles.some((style) => style.link === link)) {
      const style = DDCInjector.styles.find((style) => style.link === link);
      DDCInjector.styles = DDCInjector.styles.filter((style) => style.link !== link);
      style.remove();
      console.log(`Removed style with link: (${link})`);
      return true;
    }
    console.error(`Failed to remove style with link: (${link})`);
    return false;
  },
  removeGUID: (guid) => {
    if(styles.some((style) => style.guid === guid)) {
      const style = DDCInjector.styles.find((style) => style.guid === guid);
      DDCInjector.styles = DDCInjector.styles.filter((style) => style.guid !== guid);
      style.remove();
      console.log(`Removed style with guid: (${guid})`);
      return true;
    }
    if(scripts.some((script) => script.guid === guid)) {
      const script = DDCInjector.scripts.find((script) => script.guid === guid);
      DDCInjector.scripts = DDCInjector.scripts.filter((script) => script.guid !== guid);
      script.remove();
      console.log(`Removed script with guid: (${guid})`);
      return true;
    }
    console.error(`Failed to remove guid: (${guid})`);
    return false;
  },
  doWhenScriptLoaded: (link, callback) => {
    const script = DDCInjector.scripts.find((script) => script.link === link);
    if (script) {
      const scriptElement = document.querySelector(`script[src="${link}"]`);
      if (scriptElement) {
        scriptElement.onload = () => {
          console.log(`Script (${link}) is loaded. Executing callback.`);
          callback();
        };
      } else {
        console.error(`Script element not found for link: (${link})`);
      }
    } else {
      console.error(`Script (${link}) not found in DDCInjector.`);
    }
  },
  doWhenStyleLoaded: (link, callback) => {
    const style = DDCInjector.styles.find((style) => style.link === link);
    if (style) {
      const styleElement = document.querySelector(`link[href="${link}"]`);
      if (styleElement) {
        styleElement.onload = () => {
          console.log(`Style (${link}) is loaded. Executing callback.`);
          callback();
        };
      } else {
        console.error(`Style element not found for link: (${link})`);
      }
    } else {
      console.error(`Style (${link}) not found in DDCInjector.`);
    }
  },
  // Method to generate a GUID
  generateGuid: () => {
    return "DDC#xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  checkLock: (key) => {
    return sha1.b64hö(key) === lock;
  },
  setLock: (key) => {
    lock = sha1.sha1(key);
  }
};

// Assign a unique ID to the container
const runID = DDCInjector.generateGuid();
injectorContainer.id = runID;
