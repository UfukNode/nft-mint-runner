const SENSITIVE_QUERY_KEYS = /(?:api|key|token|secret|auth|apikey|access|project|id)/i;

export function redactRpcUrl(input: string): string {
  try {
    const url = new URL(input);
    if (url.username) {
      url.username = "redacted";
    }
    if (url.password) {
      url.password = "redacted";
    }

    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.test(key)) {
        url.searchParams.set(key, "redacted");
      }
    }

    const pathParts = url.pathname.split("/");
    if (pathParts.length > 2) {
      const last = pathParts[pathParts.length - 1];
      if (last && last.length >= 12 && /[A-Za-z0-9_-]/.test(last)) {
        pathParts[pathParts.length - 1] = "redacted";
        url.pathname = pathParts.join("/");
      }
    }

    return url.toString();
  } catch {
    return input.replace(/[A-Za-z0-9_-]{16,}/g, "redacted");
  }
}

export function redactText(input: string): string {
  return input
    .replace(/0x[a-fA-F0-9]{64}/g, "0x[redacted-private-key]")
    .replace(/([?&](?:api|key|token|secret|apikey|access)[^=]*=)[^&\s]+/gi, "$1redacted")
    .replace(/\/[A-Za-z0-9_-]{24,}(?=\/|\s|$)/g, "/redacted");
}
