// PlatformFactory.js
import { Avito } from './platforms/Avito.js'
import { Violity } from './platforms/Violity.js'
import { Aukro } from './platforms/Aukro.js'
import { Olx } from './platforms/Olx.js'
import { Meshok } from './platforms/Meshok.js'
import { Kufar } from './platforms/Kufar.js'

const adapters = {
  'avito.ru': Avito,
  'violity.com': Violity,
  'aukro.cz': Aukro,
  'aukro.sk': Aukro,
  'olx.ua': Olx,
  'olx.pt': Olx,
  'meshok.net': Meshok,
  'kufar.by': Kufar,
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
