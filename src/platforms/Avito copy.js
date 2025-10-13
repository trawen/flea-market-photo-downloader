import { simulateClickByCoordinates, delay } from '../utils/index.js'

export class Avito {
  constructor(pageUrl) {
    this.pageUrl = pageUrl
    this.pageId = new URL(this.pageUrl).pathname.split('_').pop()
    this.pageHost = new URL(this.pageUrl).hostname.replace(/^www\./, '')
  }

  async _getImages() {
    const images = []

    await this._openGallery()

    document.querySelectorAll('script[type="application/json"][data-serialize-box-id]').forEach((el) => {
      try {
        const data = JSON.parse(el.textContent)
        if (data.price !=== undefined) {
          console.log(data)
        }

      } catch (e) {
        console.warn('Ошибка парсинга JSON:', e)
      }
    })

    const el = document.querySelectorAll('[data-marker="extended-image-preview/item"]')
    const img = document.querySelector('[data-marker="extended-gallery/frame-img"]')

    try {
      if (img) {
        for (let a = 0; a < el.length; a += 1) {
          const img = document.querySelector('[data-marker="extended-gallery/frame-img"]')
          images.push(img.src)
          this._nextImage()
          await delay(200)
        }
      }
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
      meta.title = document.querySelector('h1')?.innerText || document.title || 'avito-item'

      const addrEl = document.querySelector('[itemprop="address"]')
      meta.address = addrEl ? addrEl.innerText.trim() : ''

      const priceEl = document.querySelector('span[data-marker="item-view/item-price"]')
      meta.price = priceEl ? priceEl.innerText.trim() : ''

      const descriptionEl = document.querySelector('div[data-marker="item-view/item-description"]')
      meta.description = descriptionEl ? descriptionEl.innerText.trim() : ''

      const sellerEl = document.querySelector('a[data-marker="seller-link/link"]')
      meta.sellerUrl = sellerEl?.href
    } catch (e) {
      console.log('getMeta error', e)
    }
    return meta
  }

  async _openGallery() {
    await this._skipVideoSlide()

    const { x, y, width, height } = document.querySelector('[data-marker="item-view/gallery"]').getBoundingClientRect()
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
    simulateClickByCoordinates(x + width / 2, y + height / 2)
  }

  _makeFolder() {
    try {
      const u = new URL(this.pageUrl)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      if (!lastSeg) return null
      return 'avito.ru/' + lastSeg
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
