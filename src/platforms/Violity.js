import { simulateClickByCoordinates, delay, getCleanUrl } from '../utils/index.js'

export class Violity {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = this.pageUrl.match(/-([A-Za-z0-9]+)\.html/)[1]
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

  async _getImages() {
    const hasGallery = await this._openGallery()
    try {
      if (hasGallery) {
        return [...document.querySelectorAll('#szp img.szp_content')].map((img) => img.src || img.dataset.src)
      } else {
        return [document.querySelector('.img_big img').src]
      }
    } catch (e) {
      console.log('getImages error', e)
    }
    return []
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
      meta.title = document.querySelector('h1')?.innerText || document.title || 'violity-item'

      const addrEl = document.querySelector('.eLocation')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('.price_block')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.querySelector('.eDescription')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('a.user_seller')
      meta.sellerUrl = sellerEl?.href
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
  }

  async _openGallery() {
    const sliderEl = document.getElementById('big_img_slider')

    if (sliderEl) {
      const { x, y, width, height } = sliderEl.getBoundingClientRect()
      simulateClickByCoordinates(x + width / 2, y + height / 2)
      await delay(500)
      return true
    }
    return false
  }

  _getId() {
    try {
      const u = new URL(window.location.href)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      return lastSeg.split('-')[0]
    } catch (e) {
      return null
    }
  }

  _makeFolder() {
    const u = new URL(this.pageUrl)
    const lastSeg = u.pathname.split('/').filter(Boolean).pop()
    if (!lastSeg) return null
    return 'violity.ru/' + lastSeg
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
