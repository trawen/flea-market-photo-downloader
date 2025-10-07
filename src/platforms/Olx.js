import { simulateClickByCoordinates, delay } from '../utils/index.js'

export class Olx {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = this.pageUrl.match(/-([A-Za-z0-9]+)\.html/)[1]
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

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
      id: this.pageId,
      itemUrl: this.pageUrl,
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
    simulateClickByCoordinates(x + width / 2, y + height / 2)
    await delay(500)
  }

  _makeFolder() {
    try {
      const u = new URL(this.pageUrl)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      if (!lastSeg) throw new Error('Make folder get last segment error')
      return this.pageHost + '/' + lastSeg
    } catch (e) {
      return null
    }
  }

  async collectData() {
    return {
      page: {
        id: this.pageId,
        host: this.pageHost,
        url: this.pageUrl,
      },
      images: await this._getImages(),
      meta: await this._getMeta(),
      folder: this._makeFolder(),
    }
  }
}
