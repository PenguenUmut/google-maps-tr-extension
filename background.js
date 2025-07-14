// Google Maps TR Extension - Background Script

// Extension installation
chrome.runtime.onInstalled.addListener(async () => {
  // Clear any existing rules on installation
  try {
    const allRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (allRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: allRules.map((r) => r.id),
      });
    }
  } catch (error) {
    // No existing rules to clear
  }

  // Create new rules after a short delay
  setTimeout(() => {
    createRedirectRules();
  }, 500);
});

// Monitor Google Maps tabs and ensure rules are active
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("maps.google.com")
  ) {
    // Check if rules are active
    chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
      if (rules.length === 0) {
        createRedirectRules();
      }
    });
  }
});

// Create redirect rules dynamically
async function createRedirectRules() {
  const khmsHosts = [
    "khms0.google.com",
    "khms1.google.com",
    "khms2.google.com",
    "khms3.google.com",
    "khms.google.com",
    "khms0.google.com.tr",
    "khms1.google.com.tr",
    "khms2.google.com.tr",
    "khms3.google.com.tr",
  ];

  try {
    // Clear existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    if (existingRules.length > 0) {
      const ruleIdsToRemove = existingRules.map((rule) => rule.id);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIdsToRemove,
      });
      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error) {
    // Continue if cleanup fails
  }

  // Create redirect rules
  const rules = khmsHosts.map((host, index) => {
    const serverMatch = host.match(/khms(\d+|\.)/);
    const serverNum = serverMatch
      ? serverMatch[1] === "."
        ? ""
        : serverMatch[1]
      : "";

    return {
      id: index + 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: `https://mt${serverNum}.google.com/vt/lyrs=s&x=\\1&y=\\2&z=\\3`,
        },
      },
      condition: {
        regexFilter: `^https?://${host.replace(
          ".",
          "\\."
        )}/.*[?&]x=([0-9]+).*[?&]y=([0-9]+).*[?&]z=([0-9]+)`,
        resourceTypes: ["xmlhttprequest", "image"],
      },
    };
  });

  try {
    // Add the new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  } catch (error) {
    throw error;
  }
}

// Extension enable/disable functionality
async function toggleExtension(enabled) {
  try {
    if (enabled) {
      await createRedirectRules();
    } else {
      // Remove all dynamic rules
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = existingRules.map((rule) => rule.id);

      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
        });
      }
    }
  } catch (error) {
    // Handle error silently
  }
}

// Storage initialization
chrome.storage.sync.get(["extensionEnabled"], function (result) {
  if (result.extensionEnabled === undefined) {
    chrome.storage.sync.set({ extensionEnabled: true });
  }
});

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    chrome.storage.sync.set({ extensionEnabled: request.enabled });
    toggleExtension(request.enabled);
    sendResponse({ success: true });
  } else if (request.action === "getStatus") {
    chrome.storage.sync.get(["extensionEnabled"], function (result) {
      sendResponse({ enabled: result.extensionEnabled !== false });
    });
    return true; // Will respond asynchronously
  }
});

// Check extension status on startup
setTimeout(() => {
  chrome.storage.sync.get(["extensionEnabled"], function (result) {
    const enabled = result.extensionEnabled !== false;
    if (enabled) {
      // Only enable if not already enabled to avoid duplicate rules
      chrome.declarativeNetRequest.getDynamicRules().then((rules) => {
        if (rules.length === 0) {
          toggleExtension(enabled);
        }
      });
    }
  });
}, 1000);
