<script setup>
import { ref, onMounted, onUnmounted, watch, defineEmits } from "vue";

const emit = defineEmits(["processing"]);

const processingInterval = ref(null);
const title = ref("XML Key Extractor");
const xmlFileHandle = ref(null);
const outputFileHandle = ref(null);
const xmlFileName = ref("");
const outputFileName = ref("");
const messages = ref([]);
const knownKeys = ref([]);
const pollingInterval = ref(null);

const processingIntervalLength = 1900;

const opts = {
  suggestedName: "configurations.cs",
  types: [
    {
      description: "C-Sharp Files",
      accept: { "*/*": [".cs"] },
    },
  ],
};

const description = {
  processing: "Processing File...",
  wait: "waiting...",
};


// Helper method to add a log entry with a timestamp.
const logMessage = (msg) => {
  const timestamp = new Date().toLocaleTimeString();
  //messages.value.unshift(`[${timestamp}] ${msg}`);
  //messages.value.push(`[${timestamp}] ${msg}`);
  messages.value.push({ timestamp: new Date(), message: msg });
};

// Let the user pick an XML file.
const selectXmlFile = async () => {
  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "XML Files",
          accept: { "text/xml": [".xml", ".config"] },
        },
      ],
      multiple: false,
    });
    xmlFileHandle.value = fileHandle;
    xmlFileName.value = fileHandle.name;
    logMessage(`Selected XML file: ${fileHandle.name}`);



  } catch (err) {
    console.error(err);
    logMessage("XML file selection cancelled or failed.");
  }
};

// Let the user pick an output file.
const selectOutputFile = async () => {

  try {
    outputFileHandle.value = await window.showSaveFilePicker(opts);
    outputFileName.value = outputFileHandle.value.name;
    logMessage(`Selected output file: ${outputFileName.value}`);


  } catch (err) {
    console.error(err);
    logMessage("Output file selection cancelled or failed.");
  }
};

// Parse the XML text and extract the "key" attributes from <add> elements under <appSettings>.
const extractKeys = (xmlText) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const appSettings = xmlDoc.getElementsByTagName("appSettings")[0];
    if (!appSettings) return [];
    const addElements = appSettings.getElementsByTagName("add");
    return [...addElements].map((el) => {
      return { key: el.getAttribute("key"), value: el.getAttribute("value"), toString: function () { return this.key; } };
    }).filter(Boolean);
  } catch (err) {
    console.error("Error parsing XML:", err);
    return [];
  }
};

// Write the list of keys to the output file (overwriting any existing file).
const writeOutputFile = async (keys) => {
  document.title = description.processing;
  try {
    if (!outputFileHandle.value) {
      outputFileHandle.value = await window.showSaveFilePicker(opts);
    }
    const writable = await outputFileHandle.value.createWritable();
    let classContent = `// Auto-generated C# class for AppSettins -Keys\n\npublic class ConfigurationSetting\n{\n`;
    keys.forEach((item) => {
      let constName = item.key.replace(/\W/g, "_");
      if (/^\d/.test(constName)) {
        constName = "_" + constName;
      }

      classContent += `\t/// <summary>\n`;
      classContent += `\t/// Contains ${item.value}\n`;
      classContent += `\t/// <summary>\n`;
      classContent += `\tpublic const string ${constName} = ConfigurationManager.AppSettings["${item.key}"];\n`;
    });
    classContent += `}\n`;
    await writable.write(classContent);
    await writable.close();
    logMessage("Output file written successfully.");
  } catch (err) {
    console.error("Error writing output file:", err);
    logMessage("Error writing output file.");
  }
  document.title = description.wait;
};

// Process the XML file: read, extract keys, write output, and start polling for changes.
const processFile = async () => {
  if (!xmlFileHandle.value || !outputFileHandle.value) {
    logMessage("Please select both an XML file and an output file.");
    return;
  }
  try {
    if (processingInterval.value) clearInterval(processingInterval.value);
    emit("processing", true);

    const file = await xmlFileHandle.value.getFile();
    const xmlText = await file.text();
    const keys = extractKeys(xmlText);
    knownKeys.value = [...keys];
    await writeOutputFile(keys);


    processingInterval.value = setTimeout(() => {
      emit("processing", false);
    }, processingIntervalLength)

    logMessage("Processing complete. Output file written.");
    startPolling();
  } catch (err) {
    console.error(err);
    logMessage("Error processing the XML file.");
  }
};

// Start a polling loop (every 5 seconds) to check if the XML file has been modified.
const startPolling = () => {
  if (pollingInterval.value) clearInterval(pollingInterval.value);
  let lastModifiedTime = null;

  xmlFileHandle.value.getFile().then((file) => {
    lastModifiedTime = file.lastModified;
  });

  pollingInterval.value = setInterval(async () => {
    // emit("processing", true);
    try {
      const file = await xmlFileHandle.value.getFile();
      if (lastModifiedTime !== file.lastModified) {
        lastModifiedTime = file.lastModified;
        const xmlText = await file.text();
        const currentKeys = extractKeys(xmlText);

        const newKeys = currentKeys.filter((key) =>
          !knownKeys.value.some((obj2) => key.key === obj2.key)
        );
        const deletedKeys = knownKeys.value.filter((key) =>
          !currentKeys.some((obj2) => key.key === obj2.key)
        );



        if (newKeys.length > 0 || deletedKeys.length > 0) {

          if (processingInterval.value) clearInterval(processingInterval.value);
          emit("processing", true);

          await writeOutputFile(currentKeys);
          let status = "";


          if (newKeys.length > 0) status += `New keys added: ${newKeys.join(", ")}. `;
          if (deletedKeys.length > 0) status += `Keys removed: ${deletedKeys.join(", ")}. `;
          status += "Output file updated.";
          logMessage(status);
          knownKeys.value = [...currentKeys];

          processingInterval.value = setTimeout(() => {
            emit("processing", false);
          }, processingIntervalLength)

        }
      }
    } catch (err) {
      console.error("Error during polling:", err);
    }

    // 

  }, 2000);
};


// Watcher: Runs processFile() when both files are selected
watch([xmlFileHandle, outputFileHandle], ([xml, output]) => {
  if (xml && output) {
    processFile();
  }
});

onMounted(() => {
  document.title = "XML Key Extractor";

  if (processingInterval.value) clearInterval(processingInterval.value);
  emit("processing", true);

  processingInterval.value = setTimeout(() => {
    emit("processing", false);
  }, processingIntervalLength)


});

onUnmounted(() => {
  if (pollingInterval.value) clearInterval(pollingInterval.value);
});

</script>

<template>
  <div class="card">
    <button class="me-2" @click="selectXmlFile" title="Select Configuration File" type="button">
      {{ xmlFileName || "Configuration.config" }}
    </button>
    <!-- XML File selection -->
    <button class="" @click="selectOutputFile" title="Select Class File" type="button">
      {{ outputFileName || "Class.cs" }}
    </button>

  </div>

  <div class="box">
    <transition-group name="log" tag="ul">
      <li v-for="(item, index) in messages" :key="index"><strong>{{ item.timestamp.toLocaleTimeString() }}</strong> : {{ item.message }}</li>
    </transition-group>
  </div>
</template>

<style scoped>
.box {
  box-shadow: 0px 0px 10px 10px inset #fff;
  position: relative;
  z-index: 2;

}

.me-2 {
  margin-right: 2rem;
}

ul {
  list-style-type: none;
}

li {
  text-align: left;
  border-left: 1px solid #aaa;
  padding: 5px 20px 10px 10px;

}

li::before {
  margin-left: -16.5px;
  margin-top: -5px;
  content: ' ';
  width: 10px;
  height: 10px;
  position: absolute;
  border-radius: 50%;
  border: 1px solid #aaa;
  background-color: #eee;

}

li:last-child {
  color: #8b5bb8;

}

li:last-child::before {
  width: 6px;
  height: 6px;
  background-color: #fff;
  border: 3px solid #8b5bb8;
  box-shadow: 0 0 5px 0 rgba(100, 100, 100, .5);
}


.log-enter-active,
.log-leave-active {
  transition: opacity 0.5s, transform 0.5s ease-in-out;
}

.log-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.log-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
