(() => {
  // src/utils/index.js
  function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  function animateClick(x, y) {
    const indicator = document.createElement("div");
    indicator.style.position = "fixed";
    indicator.style.left = x - 10 + "px";
    indicator.style.top = y - 10 + "px";
    indicator.style.width = "20px";
    indicator.style.height = "20px";
    indicator.style.borderRadius = "50%";
    indicator.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
    indicator.style.border = "2px solid red";
    indicator.style.zIndex = "999999";
    indicator.style.pointerEvents = "none";
    indicator.style.animation = "clickPulse 0.5s ease-out";
    if (!document.querySelector("#clickAnimationStyle")) {
      const style = document.createElement("style");
      style.id = "clickAnimationStyle";
      style.textContent = `
          @keyframes clickPulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        `;
      document.head.appendChild(style);
    }
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 500);
  }
  function simulateClickByCoordinates(x, y) {
    console.log("simulateClickByCoordinates", x, y);
    animateClick(x, y);
    const targetElement = document.elementFromPoint(x, y);
    console.log("targetElement", targetElement);
    if (targetElement) {
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0,
        detail: 1
      });
      targetElement.dispatchEvent(clickEvent);
    }
  }
  function getCleanUrl() {
    const url = new URL(window.location.href);
    return url.host + url.pathname;
  }

  // src/platforms/Avito.js
  var Avito = class {
    async _getImages() {
      const images = [];
      await this._openGallery();
      const el = document.querySelectorAll('[data-marker="extended-image-preview/item"]');
      const img = document.querySelector('[data-marker="extended-gallery/frame-img"]');
      console.log("el", el);
      console.log("img", img);
      try {
        if (img) {
          for (let a = 0; a < el.length; a += 1) {
            const img2 = document.querySelector('[data-marker="extended-gallery/frame-img"]');
            images.push(img2.src);
            this._nextImage();
            await delay(200);
          }
        }
      } catch (e) {
        console.log("getImages error", e);
      }
      return images;
    }
    async _getMeta() {
      const meta = {
        id: this._getId(),
        itemUrl: window.location.href,
        sellerUrl: "",
        title: "",
        address: "",
        price: "",
        description: "",
        downloadAt: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      try {
        meta.title = document.querySelector("h1")?.innerText || document.title || "avito-item";
        const addrEl = document.querySelector('[itemprop="address"]');
        meta.address = addrEl ? addrEl.innerText.trim() : "";
        const priceEl = document.querySelector('span[data-marker="item-view/item-price"]');
        meta.price = priceEl ? priceEl.innerText.trim() : "";
        const descriptionEl = document.querySelector('div[data-marker="item-view/item-description"]');
        meta.description = descriptionEl ? descriptionEl.innerText.trim() : "";
        const sellerEl = document.querySelector('a[data-marker="seller-link/link"]');
        meta.sellerUrl = sellerEl?.href;
      } catch (e) {
        console.log("getMeta error", e);
      }
      return meta;
    }
    async _openGallery() {
      await this._skipVideoSlide();
      const { x, y, width, height } = document.querySelector('[data-marker="item-view/gallery"]').getBoundingClientRect();
      console.log(" _openGallery", x, y, width, height);
      simulateClickByCoordinates(x + width / 2, y + height / 2);
      await delay(500);
    }
    async _skipVideoSlide() {
      const items = document.querySelectorAll('[data-marker="image-preview/item"]');
      if (items.length > 1) {
        const firstItem = items[0];
        if (firstItem.dataset.type === "video") {
          items[1].click();
          await delay(500);
        }
      }
    }
    async _nextImage() {
      const { x, y, width, height } = document.querySelector('[data-marker="extended-gallery-frame/control-right"]').getBoundingClientRect();
      console.log("_nextImage", x, y, width, height, x + width / 2, y + height / 2);
      simulateClickByCoordinates(x + width / 2, y + height / 2);
    }
    _getId() {
      try {
        const u = new URL(window.location.href);
        return u.pathname.split("_").pop();
      } catch (e) {
        return null;
      }
    }
    _makeFolder() {
      try {
        const u = new URL(window.location.href);
        const lastSeg = u.pathname.split("/").filter(Boolean).pop();
        if (!lastSeg)
          return null;
        return "avito.ru/" + lastSeg;
      } catch (e) {
        return null;
      }
    }
    async collectData() {
      return {
        images: await this._getImages(),
        meta: await this._getMeta(),
        folder: this._makeFolder()
      };
    }
  };

  // src/platforms/Violity.js
  var Violity = class {
    async _getImages() {
      const hasGallery = await this._openGallery();
      try {
        if (hasGallery) {
          return [...document.querySelectorAll("#szp img.szp_content")].map((img) => img.src || img.dataset.src);
        } else {
          return [document.querySelector(".img_big img").src];
        }
      } catch (e) {
        console.log("getImages error", e);
      }
      return [];
    }
    async _getMeta() {
      const meta = {
        id: this._getId(),
        itemUrl: getCleanUrl(),
        sellerUrl: "",
        title: "",
        address: "",
        price: "",
        description: "",
        downloadAt: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      try {
        meta.title = document.querySelector("h1")?.innerText || document.title || "violity-item";
        const addrEl = document.querySelector(".eLocation");
        meta.address = addrEl ? addrEl.innerText.trim() : "";
        const priceEl = document.querySelector(".price_block");
        meta.price = priceEl ? priceEl.innerText.trim() : "";
        const descriptionEl = document.querySelector(".eDescription");
        meta.description = descriptionEl ? descriptionEl.innerText.trim() : "";
        const sellerEl = document.querySelector("a.user_seller");
        meta.sellerUrl = sellerEl?.href;
      } catch (e) {
        console.log("getMeta error", e);
      }
      return meta;
    }
    // about_lot_img
    async _openGallery() {
      const sliderEl = document.getElementById("big_img_slider");
      if (sliderEl) {
        const { x, y, width, height } = sliderEl.getBoundingClientRect();
        simulateClickByCoordinates(x + width / 2, y + height / 2);
        await delay(500);
        return true;
      }
      return false;
    }
    _getId() {
      try {
        const u = new URL(window.location.href);
        const lastSeg = u.pathname.split("/").filter(Boolean).pop();
        return lastSeg.split("-")[0];
      } catch (e) {
        return null;
      }
    }
    _makeFolder() {
      const u = new URL(window.location.href);
      const lastSeg = u.pathname.split("/").filter(Boolean).pop();
      if (!lastSeg)
        return null;
      return "violity.ru/" + lastSeg;
    }
    async collectData() {
      return {
        images: await this._getImages(),
        meta: await this._getMeta(),
        folder: this._makeFolder()
      };
    }
  };

  // src/platforms/Aukro.js
  var Aukro = class {
    async _getImages() {
      await this._openGallery();
      let images = [];
      try {
        const container = document.querySelector("div.cdk-overlay-container");
        if (!container)
          throw new Error("\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 cdk-overlay-container.");
        images = Array.from(container.querySelectorAll("auk-media-gallery-thumb img")).map((img, i) => {
          return img.src.replace(/\/\d+x\d+\//, "/");
        });
      } catch (e) {
        console.log("getImages error", e);
      }
      return images;
    }
    async _getMeta() {
      const meta = {
        id: this._getId(),
        itemUrl: getCleanUrl(),
        sellerUrl: "",
        title: "",
        address: "",
        price: "",
        description: "",
        downloadAt: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      try {
        meta.title = document.querySelector("auk-translation-box-content")?.innerText || document.title || "aukro-item";
        const addrEl = document.querySelector(".location-text");
        meta.address = addrEl ? addrEl.innerText.trim() : "";
        const priceEl = document.querySelector('auk-item-detail-main-item-panel-price span[aria-live="polite"]');
        meta.price = priceEl ? priceEl.innerText.trim() : "";
        const descriptionEl = document.getElementById("user-field");
        meta.description = descriptionEl ? descriptionEl.innerText.trim() : "";
        const sellerEl = document.querySelector("auk-user-chip a");
        meta.sellerUrl = sellerEl?.href;
      } catch (e) {
        console.log("getMeta error", e);
      }
      return meta;
    }
    async _openGallery() {
      const { x, y, width, height } = document.querySelector("auk-item-detail-current-media").getBoundingClientRect();
      simulateClickByCoordinates(x + width / 2, y + height / 2);
      await delay(500);
    }
    _getId() {
      try {
        const u = new URL(window.location.href);
        return u.pathname.split("-").pop();
      } catch (e) {
        return null;
      }
    }
    _makeFolder() {
      try {
        const u = new URL(window.location.href);
        const lastSeg = u.pathname.split("/").filter(Boolean).pop();
        if (!lastSeg)
          return null;
        return "aukro.cz/" + lastSeg;
      } catch (e) {
        return null;
      }
    }
    async collectData() {
      return {
        images: await this._getImages(),
        meta: await this._getMeta(),
        folder: this._makeFolder()
      };
    }
  };

  // src/platforms/Olx.js
  var Olx = class {
    async _getImages() {
      await this._openGallery();
      let images = [];
      try {
        const container = document.querySelector('[data-testid="image-galery-container"]');
        if (!container)
          throw new Error('\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 data-testid="image-galery-container"');
        images = Array.from(container.querySelectorAll('[data-testid="swiper-image"]')).map((img) => {
          return img.src;
        });
      } catch (e) {
        console.log("getImages error", e);
      }
      return images;
    }
    async _getMeta() {
      const meta = {
        id: this._getId(),
        itemUrl: window.location.href,
        sellerUrl: "",
        title: "",
        address: "",
        price: "",
        description: "",
        downloadAt: (/* @__PURE__ */ new Date()).toLocaleString()
      };
      try {
        meta.title = document.querySelector('[data-testid="offer_title"]')?.innerText || document.title || "olx-item";
        const addrEl = document.querySelector('[data-testid="map-aside-section"] section');
        meta.address = addrEl ? addrEl.innerText.trim() : "";
        const priceEl = document.querySelector('[data-testid="ad-price-container"]');
        meta.price = priceEl ? priceEl.innerText.trim() : "";
        const descriptionEl = document.querySelector('[data-testid="ad_description"]');
        meta.description = descriptionEl ? descriptionEl.innerText.trim() : "";
        const sellerEl = document.querySelector('[data-testid="user-profile-link"]');
        meta.sellerUrl = sellerEl?.href;
      } catch (e) {
        console.log("getMeta error", e);
      }
      return meta;
    }
    async _openGallery() {
      const { x, y, width, height } = document.querySelector('[data-testid="image-galery-container"]').getBoundingClientRect();
      console.log(" _openGallery", x, y, width, height);
      simulateClickByCoordinates(x + width / 2, y + height / 2);
      await delay(500);
    }
    async _skipVideoSlide() {
      const items = document.querySelectorAll('[data-marker="image-preview/item"]');
      if (items.length > 1) {
        const firstItem = items[0];
        if (firstItem.dataset.type === "video") {
          items[1].click();
          await delay(500);
        }
      }
    }
    async _nextImage() {
      const { x, y, width, height } = document.querySelector('[data-marker="extended-gallery-frame/control-right"]').getBoundingClientRect();
      console.log("_nextImage", x, y, width, height, x + width / 2, y + height / 2);
      simulateClickByCoordinates(x + width / 2, y + height / 2);
    }
    _getId() {
      try {
        return window.location.href.match(/-([A-Za-z0-9]+)\.html/)[1];
      } catch (e) {
        return null;
      }
    }
    _makeFolder() {
      try {
        const u = new URL(window.location.href);
        const lastSeg = u.pathname.split("/").filter(Boolean).pop();
        if (!lastSeg)
          throw new Error("Make folder get last segment error");
        return u.hostname.replace(/^www\./, "") + "/" + lastSeg;
      } catch (e) {
        return null;
      }
    }
    async collectData() {
      return {
        images: await this._getImages(),
        meta: await this._getMeta(),
        folder: this._makeFolder()
      };
    }
  };

  // src/PlatformFactory.js
  var adapters = {
    "avito.ru": Avito,
    "violity.com": Violity,
    "aukro.cz": Aukro,
    "olx.ua": Olx
  };
  var PlatformFactory = class {
    static create(url) {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      console.log("Avito", Avito);
      console.log("hostname", hostname);
      const Adapter = adapters[hostname];
      console.log("Adapter", Adapter);
      return Adapter ? new Adapter() : null;
    }
  };
  new URL(window.location.href).hostname;

  // src/content.js
  var Platform = PlatformFactory.create(window.location.href);
  console.log("Platform", Platform);
  if (Platform) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === "collectImages") {
        Platform.collectData().then((result) => {
          sendResponse(result);
        });
        return true;
      }
    });
  } else {
    throw new Error("Platform not found!");
  }
})();
