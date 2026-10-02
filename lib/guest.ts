/**
 * Guest mode for people you share the app with (e.g. your teacher).
 * Open the app once with ?guest=Name and this phone remembers it:
 *  - their voice chats are not saved into your history or weekly recap
 *  - the AI teacher doesn't use your past chats as "memory" with them
 * ?guest=off turns it off again.
 */
const KEY = 'guest-name';

export function readGuestFromUrl() {
  if (typeof window === 'undefined') return;
  try {
    const g = new URLSearchParams(window.location.search).get('guest');
    if (g === null) return;
    if (g === '' || g.toLowerCase() === 'off') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, g.slice(0, 40));
  } catch {}
}

export function guestName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
