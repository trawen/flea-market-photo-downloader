import { simulateClickByCoordinates, delay } from '../utils/index.js'

export class Olx {
  async _getImages() {
    await this._openGallery()
    let images = []
    try {
      const container = document.querySelector('[data-testid="image-galery-container"]')
      if (!container) throw new Error('Не найден контейнер data-testid="image-galery-container"')

      images = Array.from(container.querySelectorAll('.swiper-zoom-container img')).map((img) => {
        return img.src
      })
    } catch (e) {
      console.log('getImages error', e)
    }

    return images
  }

  async _getMeta() {
    const meta = {
      id: this._getId(),
      itemUrl: window.location.href,
      sellerUrl: '',
      title: '',
      address: '',
      price: '',
      description: '',
      downloadAt: new Date().toLocaleString(),
    }

    try {
      meta.title = document.querySelector('[data-testid="offer_title"]')?.innerText || document.title || 'olx-item'

      const addrEl = document.querySelector('[data-testid="map-aside-section"] section')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('[data-testid="ad-price-container"]')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.querySelector('[data-testid="ad_description"]')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('[data-testid="user-profile-link"]')
      meta.sellerUrl = sellerEl?.href
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
  }

  async _openGallery() {
    const { x, y, width, height } = document
      .querySelector('[data-testid="image-galery-container"]')
      .getBoundingClientRect()
    console.log(' _openGallery', x, y, width, height)
    simulateClickByCoordinates(x + width / 2, y + height / 2)
    await delay(500)
  }

  async _skipVideoSlide() {
    const items = document.querySelectorAll('[data-marker="image-preview/item"]')

    if (items.length > 1) {
      const firstItem = items[0]
      if (firstItem.dataset.type === 'video') {
        items[1].click()
        await delay(500)
      }
    }
  }

  async _nextImage() {
    const { x, y, width, height } = document
      .querySelector('[data-marker="extended-gallery-frame/control-right"]')
      .getBoundingClientRect()
    console.log('_nextImage', x, y, width, height, x + width / 2, y + height / 2)
    simulateClickByCoordinates(x + width / 2, y + height / 2)
  }

  _getId() {
    try {
      return window.location.href.match(/-([A-Za-z0-9]+)\.html/)[1]
    } catch (e) {
      return null
    }
  }

  _makeFolder() {
    try {
      const u = new URL(window.location.href)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      if (!lastSeg) throw new Error('Make folder get last segment error')
      return u.hostname.replace(/^www\./, '') + '/' + lastSeg
    } catch (e) {
      return null
    }
  }

  async collectData() {
    return {
      images: await this._getImages(),
      meta: await this._getMeta(),
      folder: this._makeFolder(),
    }
  }
}
