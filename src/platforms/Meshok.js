import { simulateClickByCoordinates, delay, getCleanUrl } from '../utils/index.js'

export class Meshok {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = this.pageUrl.match(/\/item\/(\d+)/)[1]
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

  async _getImages() {
    let images = []
    try {
      const img = document.querySelector('[class^="mainImage_"] img')
      if (!img) throw new Error('Не найдена главная картинка')
      images.push(this._fixImgUrl(img.src))
      const imgs = document.querySelectorAll('[class^="thumbnailImage_"] img')
      if (!imgs) throw new Error('Не найдены превью')

      images = Array.from(imgs).map((img, i) => {
        // https://meshok.net/i/345814823.0.208x208s.jpg remove .208x208s
        return this._fixImgUrl(img.src)
      })
    } catch (e) {
      console.log('getImages error', e)
    }
    return images
  }

  _fixImgUrl(url) {
    return url.replace(/\.\d+x\d+s(?=\.\w+$)/, '')
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
      meta.title = document.querySelector('[class^="titleText_"]')?.innerText || document.title || 'meshok-item'

      const addrEl = document.querySelector('div.m-seller-common-info [class^="itemText_"]')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('b[itemprop="price"]')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.querySelector('[itemprop="description"]')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('[class^="displayName_"]')
      meta.sellerUrl = sellerEl?.href
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
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
