import PlatformFactory from './PlatformFactory.js'

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status')
  const btn = document.getElementById('downloadBtn')

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    statusEl.textContent = 'Неактивная вкладка или нет URL.'
    return
  }
  console.log('TAB', tab)

  const Platform = PlatformFactory.create(tab.url)

  chrome.storage.sync.get([Platform.pageHost], (res) => {
    const data = res[Platform.pageHost] || []
    console.log('DATA', data)
    const downloaded = data.find((x) => x.id === Platform.pageId)
    if (downloaded) {
      statusEl.textContent = `Картинки уже скачаны: ${downloaded?.date}`
    } else {
      statusEl.textContent = 'Картинки ещё не скачаны.'
    }
    btn.style.display = 'inline-block'
  })

  btn.addEventListener('click', () => {
    btn.disabled = true
    statusEl.textContent = 'Запрос на скачивание отправлен...'

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: 'collectImages',
      },
      (result) => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = 'Ошибка chrome.tabs.sendMessage: ' + chrome.runtime.lastError.message
          btn.disabled = false
          return
        }

        chrome.runtime.sendMessage({
          action: 'downloadImages',
          ...result,
        })

        setTimeout(() => {
          btn.disabled = false
          statusEl.textContent = 'Задание отправлено.'
        }, 1000)
      }
    )
  })
})
