import ptBR from './pt-BR'

export function t(path) {
  const keys = String(path || '').split('.').filter(Boolean)
  let current = ptBR
  for (const key of keys) {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      current = current[key]
    } else {
      return path
    }
  }
  return current
}

export const i18n = ptBR
