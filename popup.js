// Popup JavaScript for Google Maps TR Extension

document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("toggleSwitch");
  const statusDiv = document.getElementById("status");

  // Get current status
  chrome.runtime.sendMessage({ action: "getStatus" }, function (response) {
    if (response && response.enabled !== undefined) {
      toggleSwitch.checked = response.enabled;
      updateStatus(response.enabled);
    }
  });

  // Handle toggle change
  toggleSwitch.addEventListener("change", function () {
    const enabled = this.checked;

    chrome.runtime.sendMessage(
      {
        action: "toggle",
        enabled: enabled,
      },
      function (response) {
        if (response && response.success) {
          updateStatus(enabled);
        }
      }
    );
  });

  function updateStatus(enabled) {
    if (enabled) {
      statusDiv.className = "status enabled";
      statusDiv.textContent =
        "✅ Extension Aktif - KHMS istekleri MT'ye dönüştürülüyor";
    } else {
      statusDiv.className = "status disabled";
      statusDiv.textContent =
        "❌ Extension Pasif - Normal Google Maps kullanılıyor";
    }
  }
});
