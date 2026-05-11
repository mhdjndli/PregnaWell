import { site } from "@/lib/site";
import { getDict, type Locale } from "@/lib/i18n";

export default function WhatsAppButton({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  return (
    <a
      href={site.ctas.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.cta.chat}
      className="group fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-[0_15px_40px_-12px_rgba(37,211,102,0.7)] transition hover:scale-105"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="h-6 w-6 fill-current"
        aria-hidden
      >
        <path d="M19.11 17.27c-.27-.14-1.61-.79-1.86-.88-.25-.09-.43-.14-.62.14-.18.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.15-.42-2.19-1.35-.81-.72-1.36-1.61-1.52-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.49-.85-2.04-.22-.54-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.99 2.66 1.13 2.84c.14.18 1.95 2.97 4.72 4.16.66.28 1.18.45 1.58.58.66.21 1.27.18 1.74.11.53-.08 1.61-.66 1.84-1.3.23-.64.23-1.18.16-1.3-.07-.12-.25-.18-.52-.32zM16 4C9.37 4 4 9.37 4 16c0 2.27.62 4.39 1.7 6.21L4 28l5.95-1.66A11.93 11.93 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 4 16 4zm0 22a9.93 9.93 0 0 1-5.18-1.45l-.37-.22-3.53.99.94-3.43-.24-.39A9.95 9.95 0 0 1 6 16c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10z" />
      </svg>
      <span className="hidden sm:inline text-sm font-semibold pe-1">{dict.cta.chat}</span>
    </a>
  );
}
