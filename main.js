// main.js
const { createApp } = Vue;

createApp({
  data() {
    return {
      title: "XML Key Extractor",
      // Handles returned by the File System Access API.
      xmlFileHandle: null,
      outputFileHandle: null,
      // For display purposes.
      xmlFileName: "",
      outputFileName: "",
      // A message for the user.
      messages: [],
      // Array of keys already processed.
      knownKeys: [],
      // polling interval ID
      pollingInterval: null,
      //
      opts: {
        suggestedName: "configurations.cs",
        types: [
          {
            description: "C-Sharp Files",
            accept: { "*/*": [".cs"] },
          },
        ],
      },
      //
      description: {
        processing: "Processing File...",
        wait: "waiting...",
      },
    };
  },
  methods: {
    // Helper method to add a log entry with a timestamp.
    logMessage(msg) {
      const timestamp = new Date().toLocaleTimeString();
      this.messages.unshift(`[${timestamp}] ${msg}`);
    },
    // Let the user pick an XML file.
    async selectXmlFile() {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: "XML Files",
              accept: { "text/xml": [".xml"] },
            },
          ],
          multiple: false,
        });
        this.xmlFileHandle = fileHandle;
        this.xmlFileName = fileHandle.name;
        this.logMessage(`Selected XML file: ${fileHandle.name}`);
      } catch (err) {
        console.error(err);
        this.logMessage("XML file selection cancelled or failed.");
      }
    },
    // Let the user pick an output file.
    async selectOutputFile() {
      try {
        // This opens the native save file picker dialog.
        this.outputFileHandle = await window.showSaveFilePicker(this.opts);
        this.outputFileName = this.outputFileHandle.name;
        this.logMessage(`Selected output file: ${this.outputFileName}`);
      } catch (err) {
        console.error(err);
        this.logMessage("Output file selection cancelled or failed.");
      }
    },
    // Process the XML file: read, extract keys, write output, and start polling for changes.
    async processFile() {
      if (!this.xmlFileHandle || !this.outputFileHandle) {
        this.logMessage("Please select both an XML file and an output file.");
        return;
      }

      try {
        // Read the XML file contents.
        const file = await this.xmlFileHandle.getFile();
        const xmlText = await file.text();

        // Extract keys from the XML.
        const keys = this.extractKeys(xmlText);
        this.knownKeys = keys.slice(); // make a copy

        // Write the keys to output.txt (one per line).
        await this.writeOutputFile(keys);

        this.logMessage("Processing complete. Output file written.");

        // Start polling the XML file for changes.
        this.startPolling();
      } catch (err) {
        console.error(err);
        this.logMessage("Error processing the XML file.");
      }
    },
    // Parse the XML text and extract the "key" attributes from <add> elements under <appSettings>.
    extractKeys(xmlText) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const appSettings = xmlDoc.getElementsByTagName("appSettings")[0];
        if (!appSettings) return [];
        const addElements = appSettings.getElementsByTagName("add");
        const keys = [];
        for (let el of addElements) {
          const key = el.getAttribute("key");
          if (key) {
            keys.push(key);
          }
        }
        return keys;
      } catch (err) {
        console.error('Error parsing XML:', err);
        return [];
      }
    },
    // Write the list of keys to the output file (overwriting any existing file).
    async writeOutputFile(keys) {
      document.title = this.description.processing;
      try {
        // If no output file has been selected yet, prompt the user.
        if (!this.outputFileHandle) {
          // This shows the native save file picker dialog.
          this.outputFileHandle = await window.showSaveFilePicker(this.opts);
        }
        // Create a writable stream for the selected file.
        const writable = await this.outputFileHandle.createWritable();
        // Join the keys with a newline separator.
        const content = keys.join("\n");

        // Build the C# class content.
        let classContent = `// Auto-generated C# class for AppSettins -Keys\n/// <summary>\n/// Beinhaltet alle 'key' -s aus der .config\n/// </summary>\npublic class ConfigurationSetting\n{\n`;
        // Loop through each key and create a corresponding const string field.
        keys.forEach((key) => {
          // Convert key to a valid C# identifier:
          // - Replace non-word characters with underscores.
          // - Prefix with an underscore if the first character is a digit.
          let constName = key.replace(/\W/g, "_");
          if (/^\d/.test(constName)) {
            constName = "_" + constName;
          }
          classContent += `\tpublic const string ${constName} = "${key}";\n`;
        });

        // Close the class and namespace brackets.
        classContent += `}\n`;

        // Write the content to the file.
        await writable.write(classContent);
        // Close the stream to save the file.
        await writable.close();
        this.logMessage("Output file written successfully.");
      } catch (err) {
        console.error("Error writing output file:", err);
        this.logMessage("Error writing output file.");
      }
      document.title = this.description.wait;
    },
    // Start a polling loop (every 5 seconds) to check if the XML file has been modified.
    // Modified startPolling method to track file changes via the lastModified timestamp.
    startPolling() {
      console.log("startPolling");
      
      // Clear any existing polling interval.
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      // Get the initial lastModified timestamp.
      let lastModifiedTime = null;
      this.xmlFileHandle
        .getFile()
        .then((file) => {
          lastModifiedTime = file.lastModified;
        })
        .catch((err) => {
          console.error("Error getting file metadata:", err);
        });

      // Start polling every 5 seconds.
      this.pollingInterval = setInterval(async () => {
        console.log("pollingInterval");
        try {
          const file = await this.xmlFileHandle.getFile();
          // Check if the file's modification time has changed.
          if (lastModifiedTime !== file.lastModified) {
            lastModifiedTime = file.lastModified;
            const xmlText = await file.text();
            const currentKeys = this.extractKeys(xmlText);

            // Determine new keys that are not already in the knownKeys array.
            const newKeys = currentKeys.filter(
              (key) => !this.knownKeys.includes(key)
            );
            // Determine keys that have been deleted (were in knownKeys but not in currentKeys).
            const deletedKeys = this.knownKeys.filter(
              (key) => !currentKeys.includes(key)
            );

            if (newKeys.length > 0 || deletedKeys.length > 0) {
              // Overwrite the output file with the current keys.
              await this.writeOutputFile(currentKeys);

              // Prepare a status message for the user.
              let status = "";
              if (newKeys.length > 0) {
                status += `New keys added: ${newKeys.join(", ")}. `;
              }
              if (deletedKeys.length > 0) {
                status += `Keys removed: ${deletedKeys.join(", ")}. `;
              }
              status += "Output file updated.";
              this.logMessage(status);

              // Update the known keys list.
              this.knownKeys = currentKeys.slice();
            }
          }
        } catch (err) {
          console.error("Error during polling:", err);
        }
      }, 2000); // Poll every 5000 milliseconds (5 seconds).
    },
    beforeUnmount() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    },
  },
  mounted() {
    document.title = "XML Key Extractor";
  }
}).mount("#app");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
