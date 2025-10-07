(() => {
  // src/utils/index.js
  function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // src/background.js
  function removeCookie(cookie) {
    const protocol = cookie.secure ? "https://" : "http://";
    const domain = cookie.domain && cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
    const url = protocol + domain + (cookie.path || "/");
    chrome.cookies.remove({ url, name: cookie.name }, (details) => {
      console.log("details", details);
    });
  }
  function clearCookies(host) {
    try {
      chrome.cookies.getAll({ domain: host }, (cookies) => {
        console.log("cookies1", cookies);
      });
      chrome.cookies.getAll({ domain: host }, (cookies) => {
        console.log("cookies2", cookies);
        for (const c of cookies) {
          console.log("for", c);
          try {
            removeCookie(c);
          } catch (e) {
            console.log("removeCookie error", e);
          }
        }
      });
    } catch (err) {
      console.error("Invalid URL passed to wipeCookiesForUrl:", err, tabUrl);
    }
  }
  chrome.runtime.onMessage.addListener(async (msg) => {
    console.log("msg", msg);
    if (msg.action !== "downloadImages")
      return;
    let { page, images, meta, folder, isClearCookies = false } = msg;
    if (!images.length)
      return;
    for (let i = 0; i < images.length; i++) {
      const fileName = `${i}.webp`;
      chrome.downloads.download(
        {
          url: images[i],
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
      await delay(500 + Math.floor(Math.random() * 2500));
      if (isClearCookies)
        clearCookies(page.host);
    }
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
      console.error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u0442\u044C item.html:", e);
    }
    chrome.storage.sync.get([page.host], (res) => {
      const data = res[page.host] || [];
      data.push({ id: page.id, date: (/* @__PURE__ */ new Date()).toLocaleString() });
      chrome.storage.sync.set({ [page.host]: data }, () => {
        console.log("\u0414\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044B", page.id);
      });
    });
  });
})();
