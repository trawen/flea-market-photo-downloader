chrome.runtime.onMessage.addListener((msg) => {
  console.log('msg', msg)
  if (msg.action !== 'downloadImages') return

  let { images = [], folder, pageId, host, meta = '' } = msg
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
    console.error('Не удалось подготовить product_link.html:', e)
  }

  // сохраняем только ID + дату
  chrome.storage.sync.get(['downloaded'], (res) => {
    const downloaded = res.downloaded || {}
    downloaded[pageId] = { date: new Date().toLocaleString(), host: host }
    chrome.storage.sync.set({ downloaded }, () => {
      console.log('Сохранена дата скачивания для', pageId)
    })
  })
})
