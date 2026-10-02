/**
 * Notebook page number → photo. The original notebook photos (WhatsApp, 28 Apr)
 * are in page order: page 1 is the first photo, page 2 the second, and so on.
 */
export const NOTEBOOK_PAGE_IMAGES: string[] = [
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.48.47.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.48.55.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.04.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.11.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.17.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.23.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.28.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.34.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.38.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.44.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.51.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.49.54.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.02.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.07.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.14.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.20.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.25.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.30.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.36.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.46.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.52.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.50.58.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.07.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.15.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.20.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.24.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.31.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.38.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.42.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.46.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.55.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.51.59.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.06.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.10.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.20.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.27.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.38.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.42.jpeg',
  '/notebook-pages/WhatsApp%20Image%202026-04-28%20at%2009.52.53.jpeg',
];

export function notebookPageImage(page: number): string | null {
  return NOTEBOOK_PAGE_IMAGES[page - 1] || null;
}
