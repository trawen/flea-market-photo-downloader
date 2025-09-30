(() => {
  // src/popup.js
  document.addEventListener("DOMContentLoaded", async () => {
    const statusEl = document.getElementById("status");
    const btn = document.getElementById("downloadBtn");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      statusEl.textContent = "\u041D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u0438\u043B\u0438 \u043D\u0435\u0442 URL.";
      return;
    }
    const url = new URL(tab.url);
    let pageId = (url.pathname.match(/(\d{6,})/) || url.search.match(/itemId=(\d+)/) || []).pop?.() || url.pathname;
    chrome.storage.sync.get(["downloaded"], (res) => {
      const downloaded = res.downloaded || {};
      if (downloaded[pageId]) {
        statusEl.textContent = `\u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0438 \u0443\u0436\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u044B: ${downloaded[pageId].date}`;
      } else {
        statusEl.textContent = "\u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0438 \u0435\u0449\u0451 \u043D\u0435 \u0441\u043A\u0430\u0447\u0430\u043D\u044B.";
      }
      btn.style.display = "inline-block";
    });
    btn.addEventListener("click", () => {
      btn.disabled = true;
      statusEl.textContent = "\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D...";
      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "collectImages"
        },
        (result) => {
          if (chrome.runtime.lastError) {
            statusEl.textContent = "\u041E\u0448\u0438\u0431\u043A\u0430 chrome.tabs.sendMessage: " + chrome.runtime.lastError.message;
            btn.disabled = false;
            return;
          }
          chrome.runtime.sendMessage({
            action: "downloadImages",
            ...result,
            pageId,
            host: url.host
          });
          setTimeout(() => {
            btn.disabled = false;
            statusEl.textContent = "\u0417\u0430\u0434\u0430\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E.";
          }, 1e3);
        }
      );
    });
  });
})();
