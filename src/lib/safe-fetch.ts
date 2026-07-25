import * as dns from 'node:dns'
import * as http from 'node:http'
import * as https from 'node:https'

// Blocks Server-Side Request Forgery (SSRF): without this, fetchMetadata()
// would let anyone who can save a link make our server issue a request to
// anywhere it can reach — cloud instance metadata (169.254.169.254),
// localhost, or internal-network services — and read the response back via
// the scraped title/caption. Validation happens inside the DNS `lookup`
// used to establish the actual TCP connection (not a separate pre-check),
// so the address that gets validated is the address that gets connected to
// — closing the DNS-rebinding gap where a hostname resolves differently
// between a check and a later real request.

const MAX_REDIRECTS = 5
const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB
const REQUEST_TIMEOUT_MS = 8000

export class UnsafeUrlError extends Error {}

function isPrivateOrReservedIPv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true // unparseable — fail closed
  }
  const [a, b] = parts
  if (a === 0) return true // "this" network
  if (a === 10) return true // RFC1918
  if (a === 127) return true // loopback
  if (a === 169 && b === 254) return true // link-local, incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true // RFC1918
  if (a === 192 && b === 168) return true // RFC1918
  if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT (RFC6598)
  if (a >= 224) return true // multicast / reserved / broadcast
  return false
}

function isPrivateOrReservedIPv6(address: string): boolean {
  const addr = address.toLowerCase().split('%')[0] // strip zone id
  if (addr === '::' || addr === '::1') return true

  const v4Mapped = addr.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/)
  if (v4Mapped) return isPrivateOrReservedIPv4(v4Mapped[1])

  const firstGroup = (addr.split('::')[0].split(':')[0] || '0') || '0'
  const first = parseInt(firstGroup, 16)
  if (!Number.isNaN(first)) {
    if (first >= 0xfe80 && first <= 0xfebf) return true // link-local fe80::/10
    if (first >= 0xfc00 && first <= 0xfdff) return true // unique local fc00::/7
  }
  return false
}

function isPrivateOrReservedIp(address: string, family: number): boolean {
  return family === 6 ? isPrivateOrReservedIPv6(address) : isPrivateOrReservedIPv4(address)
}

// Matches Node's `dns.lookup` callback signature — passed as the `lookup`
// option to http(s).request, which uses it to resolve the address it then
// connects to. Rejecting here aborts the connection before it opens.
function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
): void {
  dns.lookup(hostname, {}, (err, address, family) => {
    if (err) return callback(err, '', 0)
    if (isPrivateOrReservedIp(address, family)) {
      return callback(
        Object.assign(new UnsafeUrlError(`Blocked request to disallowed address: ${address}`), {
          code: 'EBLOCKEDADDR',
        }),
        '',
        0
      )
    }
    callback(null, address, family)
  })
}

function requestOnce(url: URL, redirectsLeft: number): Promise<{ html: string; finalUrl: string }> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return Promise.reject(new UnsafeUrlError(`Disallowed protocol: ${url.protocol}`))
  }

  const requestFn = url.protocol === 'https:' ? https.request : http.request

  return new Promise((resolve, reject) => {
    const req = requestFn(
      url,
      {
        method: 'GET',
        lookup: safeLookup,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LinkVaultBot/1.0; +https://linkvault.app)',
          Accept: 'text/html',
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume() // discard redirect body
          if (redirectsLeft <= 0) {
            reject(new Error('Too many redirects'))
            return
          }
          try {
            const nextUrl = new URL(res.headers.location, url)
            resolve(requestOnce(nextUrl, redirectsLeft - 1))
          } catch {
            reject(new Error(`Invalid redirect location: ${res.headers.location}`))
          }
          return
        }

        if (status < 200 || status >= 300) {
          res.resume()
          reject(new Error(`Failed to fetch ${url}: ${status}`))
          return
        }

        let bytes = 0
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > MAX_BODY_BYTES) {
            req.destroy(new Error('Response body too large'))
            return
          }
          chunks.push(chunk)
        })
        res.on('end', () => {
          resolve({ html: Buffer.concat(chunks).toString('utf-8'), finalUrl: url.toString() })
        })
        res.on('error', reject)
      }
    )

    req.on('timeout', () => req.destroy(new Error('Request timed out')))
    req.on('error', reject)
    req.end()
  })
}

// Fetches a URL's HTML with SSRF protections: http/https only, private and
// reserved IP ranges (including cloud metadata addresses) blocked at the
// point of connection, redirects re-validated on every hop, and a capped
// response size.
export async function safeFetchHtml(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  const url = new URL(rawUrl)
  return requestOnce(url, MAX_REDIRECTS)
}
