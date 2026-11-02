/** UI-36: short in-app messages ("You left ICONSIAM · 2 h 10 min · 60 ฿ paid"). Push notifications are out of scope (A7). */
type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function showToast(message: string) {
  listeners.forEach((l) => l(message));
}

export function onToast(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
