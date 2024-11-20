// Create a container for injected scripts
const injectorContainer = document.createElement("div");
document.body.appendChild(injectorContainer);

// Define the DDCInjector
globalThis.DDCInjector = {
  scripts: [],
  // Method to inject a script
  inject: (name = "Undefined", link, async = false) => {
    if (DDCInjector.scripts.some((script) => script.link === link)) {
      console.warn(
        `Script (${name}) is already injected. Refusing to reinject.`
      );
      return;
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
    // Append script and handle errors gracefully
    script.onload = () => console.log(`Successfully loaded: (${name})`);
    script.onerror = (e) => {
      console.error(`Failed to load script: (${name}) from link: (${link})`, e);
      DDCInjector.scripts.pop(); // Remove script from tracking on failure
    };
    injectorContainer.appendChild(script);
  },
  // Method to generate a GUID
  generateGuid: () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// Assign a unique ID to the container
const runID = DDCInjector.generateGuid();
injectorContainer.id = runID;
