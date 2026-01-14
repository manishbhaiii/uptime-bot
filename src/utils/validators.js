export function validateURL(urlString) {
  try {
    const url = new URL(urlString);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are allowed'
      };
    }

    const hostname = url.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        valid: false,
        error: 'Localhost URLs are not allowed'
      };
    }

    if (isPrivateIP(hostname)) {
      return {
        valid: false,
        error: 'Private/internal IP addresses are not allowed'
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format'
    };
  }
}

export function isPrivateIP(hostname) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  
  if (match) {
    const octets = match.slice(1).map(Number);
    
    if (octets.some(octet => octet > 255)) return true;

    if (octets[0] === 10) return true;
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    if (octets[0] === 192 && octets[1] === 168) return true;
    if (octets[0] === 169 && octets[1] === 254) return true;
    if (octets[0] === 127) return true;
  }

  if (hostname.includes(':')) {
    const lower = hostname.toLowerCase();
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    if (lower.startsWith('fe80:')) return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
  }

  return false;
}
