// PlatformFactory.js
import { Avito } from './platforms/Avito.js'
import { Violity } from './platforms/Violity.js'
import { Aukro } from './platforms/Aukro.js'

const adapters = {
  'avito.ru': Avito,
  'violity.com': Violity,
  'aukro.cz': Aukro,
}

export default class PlatformFactory {
  static create(url) {
    const hostname = new URL(url).hostname
    console.log('Avito', Avito)
    console.log('hostname', hostname)
    const Adapter = adapters[hostname]
    console.log('Adapter', Adapter)
    return Adapter ? new Adapter() : null
  }
}

new URL(window.location.href).hostname
