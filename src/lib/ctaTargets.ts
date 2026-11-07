// Which link hosts count as a blog conversion. Shared by BlogCtaTracker (in
// the browser) and ctaClicks (on the server) so the two can't disagree.

const FUNNEL_HOST = "pregnawell.clinic";

export function isFunnelHost(host: string): boolean {
  return host === FUNNEL_HOST || host.endsWith(`.${FUNNEL_HOST}`);
}

export function isWhatsAppHost(host: string): boolean {
  return host === "wa.me" || host === "whatsapp.com" || host.endsWith(".whatsapp.com");
}
