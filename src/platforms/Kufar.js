import { simulateClickByCoordinates, delay, getCleanUrl } from '../utils/index.js'

export class Kufar {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = decodeURIComponent(this.pageUrl).match(/\/item\/(\d+)/)[1]
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

  async _getImages() {
    let images = []
    try {
      const imgs = document.querySelectorAll('img[alt="gallery-thumb"]')
      if (!imgs) throw new Error('Превью не найдены')

      images = Array.from(imgs).map((img, i) => {
        // replace https://rms.kufar.by/v1/prc_thumbs/adim1/1e00729e-1b22-45c5-bad5-cd2d0451e5ec.jpg to https://rms6.kufar.by/v1/gallery/adim1/567fb56c-865f-4d8c-a39e-a6672a4ab178.jpg
        return this._fixImgUrl(img.src)
      })
    } catch (e) {
      console.log('getImages error', e)
    }
    return images
  }

  _fixImgUrl(url) {
    return 'https://rms6.kufar.by/v1/gallery/adim1/' + url.split('/').filter(Boolean).pop()
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
      meta.title = document.querySelector('h1')?.innerText || document.title || 'meshok-item'

      const addrEl = document.querySelector('[class^="styles_address__"]')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('[class*="styles_brief_wrapper__price__"]')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.querySelector('[itemprop="description"]')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('[data-name="seller-block"]')
      meta.sellerUrl = sellerEl?.getAttribute('data-link')
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
  }

  _makeFolder() {
    try {
      const u = new URL(this.pageUrl)
      const lastSeg = decodeURIComponent(u.pathname).split('/').filter(Boolean).pop()
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
