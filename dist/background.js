(() => {
  // src/background.js
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("msg", msg);
    if (msg.action !== "downloadImages")
      return;
    let { images = [], folder, pageId, host, meta = "" } = msg;
    if (!images.length)
      return;
    images.forEach((url, idx) => {
      const fileName = `${idx}.webp`;
      chrome.downloads.download(
        {
          url,
          filename: `${folder}/${fileName}`
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F:", chrome.runtime.lastError);
          } else {
            console.log("\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043E:", downloadId, fileName);
          }
        }
      );
    });
    meta = JSON.stringify(meta, null, 2);
    try {
      const htmlContent = `<!doctype html>
  <meta charset="utf-8">
  <body>
    <pre>${meta}</pre>
  </body>`;
      const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent);
      chrome.downloads.download(
        {
          url: dataUrl,
          filename: `${folder}/item.html`
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F item.html:", chrome.runtime.lastError);
          } else {
            console.log("\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 item.html \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043E:", downloadId);
          }
        }
      );
    } catch (e) {
      console.error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C product_link.html:", e);
    }
    chrome.storage.sync.get(["downloaded"], (res) => {
      const downloaded = res.downloaded || {};
      downloaded[pageId] = { date: (/* @__PURE__ */ new Date()).toLocaleString(), host };
      chrome.storage.sync.set({ downloaded }, () => {
        console.log("\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430 \u0434\u0430\u0442\u0430 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u044F \u0434\u043B\u044F", pageId);
      });
    });
  });
})();
