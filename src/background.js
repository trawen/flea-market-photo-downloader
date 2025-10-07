import { simulateClickByCoordinates, delay } from './utils/index.js'

function removeCookie(cookie) {
  // нужно указать корректный протокол, чтобы chrome.cookies.remove принял url
  const protocol = cookie.secure ? 'https://' : 'http://'
  // cookie.domain может начинаться с точки
  const domain = cookie.domain && cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain
  const url = protocol + domain + (cookie.path || '/')
  chrome.cookies.remove({ url, name: cookie.name }, (details) => {
    console.log('details', details)
  })
}

function clearCookies(host) {
  try {
    chrome.cookies.getAll({ domain: host }, (cookies) => {
      console.log('cookies1', cookies)
    })
    chrome.cookies.getAll({ domain: host }, (cookies) => {
      console.log('cookies2', cookies)
      for (const c of cookies) {
        console.log('for', c)
        try {
          removeCookie(c)
        } catch (e) {
          console.log('removeCookie error', e)
        }
      }
    })
  } catch (err) {
    // если передан некорректный URL
    console.error('Invalid URL passed to wipeCookiesForUrl:', err, tabUrl)
  }
}

chrome.runtime.onMessage.addListener(async (msg) => {
  console.log('msg', msg)
  if (msg.action !== 'downloadImages') return

  let { page, images, meta, folder, isClearCookies = false } = msg
  if (!images.length) return

  for (let i = 0; i < images.length; i++) {
    const fileName = `${i}.webp`

    chrome.downloads.download(
      {
        url: images[i],
        filename: `${folder}/${fileName}`,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка скачивания:', chrome.runtime.lastError)
        } else {
          console.log('Скачивание запущено:', downloadId, fileName)
        }
      }
    )

    await delay(500 + Math.floor(Math.random() * 2500))
    if (isClearCookies) clearCookies(page.host)
  }

  meta = JSON.stringify(meta, null, 2)

  try {
    const htmlContent = `<!doctype html>
  <meta charset="utf-8">
  <body>
    <pre>${meta}</pre>
  </body>`

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    chrome.downloads.download(
      {
        url: dataUrl,
        filename: `${folder}/item.html`,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка скачивания item.html:', chrome.runtime.lastError)
        } else {
          console.log('Скачивание item.html запущено:', downloadId)
        }
      }
    )
  } catch (e) {
    console.error('Не удалось сформировать item.html:', e)
  }

  chrome.storage.sync.get([page.host], (res) => {
    const data = res[page.host] || []

    data.push({ id: page.id, date: new Date().toLocaleString() })
    chrome.storage.sync.set({ [page.host]: data }, () => {
      console.log('Данные сохранениы', page.id)
    })
  })
})
