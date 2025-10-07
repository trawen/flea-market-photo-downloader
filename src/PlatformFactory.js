// PlatformFactory.js
import { Avito } from './platforms/Avito.js'
import { Violity } from './platforms/Violity.js'
import { Aukro } from './platforms/Aukro.js'
import { Olx } from './platforms/Olx.js'

const adapters = {
  'avito.ru': Avito,
  'violity.com': Violity,
  'aukro.cz': Aukro,
  'olx.ua': Olx,
  'olx.pt': Olx,
}

export default class PlatformFactory {
  static create(url) {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    console.log('hostname', hostname)
    const Adapter = adapters[hostname]
    console.log('Adapter', Adapter)
    return Adapter ? new Adapter(url) : null
  }
}

new URL(window.location.href).hostname
