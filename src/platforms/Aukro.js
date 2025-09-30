import { simulateClickByCoordinates, delay, getCleanUrl } from '../utils/index.js'

export class Aukro {
  async _getImages() {
    this._openGallery()

    let images = []
    try {
      const container = document.querySelector('div.cdk-overlay-container')
      if (!container) {
        alert('Не найден контейнер cdk-overlay-container.')
        return
      }

      images = Array.from(container.querySelectorAll('auk-media-gallery-thumb img'))
        .map((img, i) => {
          let url = img.getAttribute('src')
          if (url) {
            // Убираем сегмент с размером, например /73x73/
            url = url.replace(/\/\d+x\d+\//, '/')
            return url
          }
          return null
        })
        .filter(Boolean)

      if (images.length === 0) {
        alert('Не удалось найти картинки внутри auk-media-gallery-thumb.')
        return
      }
    } catch (e) {
      console.log('getImages error', e)
    }
    return images
  }

  async _getMeta() {
    const meta = {
      id: this._getId(),
      itemUrl: getCleanUrl(),
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
      meta.sellerUrl = sellerEl.href
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

  _getId() {
    try {
      const u = new URL(window.location.href)
      return u.pathname.split('-').pop()
    } catch (e) {
      return null
    }
  }

  _makeFolder() {
    try {
      const u = new URL(window.location.href)
      const lastSeg = u.pathname.split('/').filter(Boolean).pop()
      if (!lastSeg) return null
      return 'aukro.cz/' + lastSeg
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
