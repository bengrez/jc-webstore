import { env } from '../../lib/env.js'

export const siteHost = () => new URL(env.PUBLIC_SITE_URL).host

export const portalUrl = (folio: string, token?: string | null) => {
  const url = `${env.PUBLIC_SITE_URL}/cotizacion/${folio}`
  return token ? `${url}?t=${encodeURIComponent(token)}` : url
}
