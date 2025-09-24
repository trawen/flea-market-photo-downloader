document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status')
  const btn = document.getElementById('downloadBtn')

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    statusEl.textContent = 'Неактивная вкладка или нет URL.'
    return
  }

  const url = new URL(tab.url)
  const hostname = url.hostname

  let pageId = (url.pathname.match(/(\d{6,})/) || url.search.match(/itemId=(\d+)/) || []).pop?.() || url.pathname

  console.log('PAGE ID', pageId)

  // Проверяем storage.sync
  chrome.storage.sync.get(['downloaded'], (res) => {
    const downloaded = res.downloaded || {}
    // if (downloaded[pageId]) {
    //   statusEl.textContent = `Картинки уже скачаны: ${downloaded[pageId]}`
    // } else {
    statusEl.textContent = 'Картинки ещё не скачаны.'
    btn.style.display = 'inline-block'
    // }
  })

  btn.addEventListener('click', async () => {
    btn.disabled = true
    statusEl.textContent = 'Запрос на скачивание отправлен...'

    if (hostname.includes('ebay.')) {
      // Логика eBay
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function (pageId, pageUrl) {
          const galleryButton = document.querySelector('button[aria-label="Opens image gallery"]')
          if (galleryButton) galleryButton.click()

          setTimeout(() => {
            const titleTag = document.querySelector('h1')?.innerText || document.title || 'ebay-item'
            const sanitizeFolder = (s) => s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim()

            const container = document.querySelector('div.x-photos-max-view')
            if (!container) {
              alert('Не найден контейнер с картинками (x-photos-max-view).')
              return
            }

            const imgs = Array.from(container.querySelectorAll('div[data-idx] img[data-zoom-src]'))
              .map((img) => {
                const idx = img.closest('div[data-idx]')?.getAttribute('data-idx')
                const url = img.getAttribute('data-zoom-src')
                if (idx && url && url.toLowerCase().endsWith('.webp')) {
                  return url
                }
                return null
              })
              .filter(Boolean)
              .sort((a, b) => Number(a.idx) - Number(b.idx))

            if (imgs.length === 0) {
              alert('Не удалось найти картинки .webp внутри x-photos-max-view.')
              return
            }

            const folder = `ebay-photo/${sanitizeFolder(titleTag)}` + '_' + pageId
            chrome.runtime.sendMessage({ action: 'downloadImages', images: imgs, folder, pageId, pageUrl })
          }, 1000)
        },
        args: [pageId, tab.url],
      })
    } else if (hostname.includes('aukro.cz')) {
      // Логика Aukro
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function (pageId, pageUrl) {
          // Клик в центр экрана
          document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)?.click()

          setTimeout(() => {
            const titleTag = document.querySelector('h1')?.innerText || document.title || 'aukro-item'
            const sanitizeFolder = (s) => s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim()

            const container = document.querySelector('div.cdk-overlay-container')
            if (!container) {
              alert('Не найден контейнер cdk-overlay-container.')
              return
            }

            const imgs = Array.from(container.querySelectorAll('auk-media-gallery-thumb img'))
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

            if (imgs.length === 0) {
              alert('Не удалось найти картинки внутри auk-media-gallery-thumb.')
              return
            }

            const folder = `aukro-photo/${sanitizeFolder(titleTag)}` + '_' + pageId
            chrome.runtime.sendMessage({ action: 'downloadImages', images: imgs, folder, pageId, pageUrl })
          }, 1000)
        },
        args: [pageId, tab.url],
      })
    } else if (hostname.includes('avito.ru')) {
      // Логика Aukro
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async function (pageId, pageUrl) {
          function delay(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms))
          }

          function clickAtCoordinatesWithAnimation(x, y, options = {}) {
            // Создаем визуальный индикатор клика
            const indicator = document.createElement('div')
            indicator.style.position = 'fixed'
            indicator.style.left = x - 10 + 'px'
            indicator.style.top = y - 10 + 'px'
            indicator.style.width = '20px'
            indicator.style.height = '20px'
            indicator.style.borderRadius = '50%'
            indicator.style.backgroundColor = 'rgba(255, 0, 0, 0.7)'
            indicator.style.border = '2px solid red'
            indicator.style.zIndex = '999999'
            indicator.style.pointerEvents = 'none'
            indicator.style.animation = 'clickPulse 0.5s ease-out'

            // Добавляем CSS анимацию если её нет
            if (!document.querySelector('#clickAnimationStyle')) {
              const style = document.createElement('style')
              style.id = 'clickAnimationStyle'
              style.textContent = `
                    @keyframes clickPulse {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                `
              document.head.appendChild(style)
            }

            document.body.appendChild(indicator)

            // Выполняем клик
            // const result = clickAtCoordinates(x, y, options)

            // Удаляем индикатор через 500ms
            setTimeout(() => {
              if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator)
              }
            }, 500)

            // return result
          }

          function simulateClickByCoordinates(x, y) {
            clickAtCoordinatesWithAnimation(x, y)
            const targetElement = document.elementFromPoint(x, y)

            if (targetElement) {
              // console.log(`Элемент по координатам (${x}, ${y}):`, targetElement)

              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: x,
                clientY: y,
                button: 0,
                detail: 1,
              })

              // Отправляем событие найденному элементу.
              targetElement.dispatchEvent(clickEvent)

              // console.log(`Клик успешно имитирован по элементу:`, targetElement)
            } else {
              console.warn(`Элемент по координатам (${x}, ${y}) не найден. Клик не имитирован.`)
            }
          }

          const { x, y, width, height } = document
            .querySelector('[data-marker="item-view/gallery"]')
            .getBoundingClientRect()
          simulateClickByCoordinates(x + width / 2, y + height / 2)

          const titleTag = document.querySelector('h1')?.innerText || document.title || 'avito-item'
          const sanitizeFolder = (s) => s.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim()

          await delay(500)

          const images = []
          const el = document.querySelectorAll('[data-marker="image-preview/item"]')
          const img = document.querySelector('[data-marker="extended-gallery/frame-img"]')

          console.log('img', img)

          if (img) {
            for (let a = 0; a < el.length; a += 1) {
              const { x, y, width, height } = document
                .querySelector('[data-marker="extended-gallery-frame/control-right"]')
                .getBoundingClientRect()
              simulateClickByCoordinates(x + width / 2, y + height / 2)

              const img = document.querySelector('[data-marker="extended-gallery/frame-img"]')
              images.push(img.src)
              await delay(200)
            }
            const folder = `avito-photo/${sanitizeFolder(titleTag)}` + '_' + pageId

            const addrEl = document.querySelector('[itemprop="address"]')
            const address = addrEl ? addrEl.innerText.trim() : ''

            const priceEl = document.querySelector('span[data-marker="item-view/item-price"]')
            const price = priceEl ? priceEl.innerText.trim() : ''

            const descriptionEl = document.querySelector('div[data-marker="item-view/item-description"]')
            const description = descriptionEl ? descriptionEl?.innerText.trim() : ''

            const meta = {
              address,
              price,
              description,
            }

            return { images, folder, pageUrl, meta }
          } else {
            alert('Главная картинка не найдена!')
          }
          return { images }
        },
        args: [pageId, tab.url],
      })

      console.log('result', result)

      chrome.runtime.sendMessage({
        action: 'downloadImages',
        images: result[0].result.images,
        pageUrl: result[0].result.pageUrl,
        folder: result[0].result.folder,
        meta: result[0].result.meta,
        pageId,
      })
    }

    setTimeout(() => {
      btn.disabled = false
      statusEl.textContent = 'Задание отправлено.'
    }, 1000)
  })
})
