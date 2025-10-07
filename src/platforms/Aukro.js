import { simulateClickByCoordinates, delay, getCleanUrl } from '../utils/index.js'

export class Aukro {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = new URL(this.pageUrl).pathname.split('-').pop()
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

  async _getImages() {
    await this._openGallery()

    let images = []
    try {
      // <pinch-zoom
      const container = document.querySelector('.auk-media-gallery')
      if (!container) throw new Error('Не найден контейнер cdk-overlay-container.')

      images = Array.from(container.querySelectorAll('auk-media-gallery-thumb img')).map((img, i) => {
        // remove from url 73x73
        return img.src.replace(/\/\d+x\d+\//, '/')
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
      meta.title = document.querySelector('auk-translation-box-content')?.innerText || document.title || 'aukro-item'

      const addrEl = document.querySelector('.location-text')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('auk-item-detail-main-item-panel-price span[aria-live="polite"]')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.getElementById('user-field')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('auk-user-chip a')
      meta.sellerUrl = sellerEl?.href
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
  }

  async _openGallery() {
    const { x, y, width, height } = document.querySelector('auk-item-detail-current-media').getBoundingClientRect()
    simulateClickByCoordinates(x + width / 2, y + height / 2)
    await delay(500)
  }

  _makeFolder() {
    try {
      const u = new URL(this.pageUrl)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      if (!lastSeg) return null
      return u.host + '/' + lastSeg
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
