chrome.runtime.onMessage.addListener((msg) => {
  console.log('msg', msg)
  if (msg.action !== 'downloadImages') return

  let { images = [], folder, pageId, pageUrl, meta = '' } = msg
  if (!images.length) return

  images.forEach((url, idx) => {
    const fileName = `${idx}.webp`

    chrome.downloads.download(
      {
        url,
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
  })

  meta = JSON.stringify(meta, null, 2)

  // Формируем простой HTML с ссылкой на товар и скачиваем его как product_link.html
  try {
    const safeUrl = String(pageUrl || '')
    const htmlContent = `<!doctype html>
  <meta charset="utf-8">
  <title>eBay: ссылка на товар</title>
  <body>
    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">Открыть товар на eBay</a>
    <pre>${meta}</pre>
  </body>`

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    chrome.downloads.download(
      {
        url: dataUrl,
        filename: `${folder}/product_link.html`,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка скачивания product_link.html:', chrome.runtime.lastError)
        } else {
          console.log('Скачивание product_link.html запущено:', downloadId)
        }
      }
    )
  } catch (e) {
    console.error('Не удалось подготовить product_link.html:', e)
  }

  // сохраняем только ID + дату
  chrome.storage.sync.get(['downloaded'], (res) => {
    const downloaded = res.downloaded || {}
    downloaded[pageId] = new Date().toLocaleString()
    chrome.storage.sync.set({ downloaded }, () => {
      console.log('Сохранена дата скачивания для', pageId)
    })
  })
})
