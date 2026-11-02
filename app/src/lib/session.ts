import type { PublicAccount } from '../../../server/src/types';
import { storedValue } from './stored';

/** UI-21 / UI-44: the signed-in demo account, kept on the phone. Ticketless entry, wallet and history need it. */
export type Session = Pick<PublicAccount, 'id' | 'email' | 'display_name'>;

export const sessionStore = storedValue<Session>('app.session');

export function useSession() {
  const session = sessionStore.useValue();
  return {
    loading: session === undefined,
    session: session ?? null,
    signIn: (a: Session) => sessionStore.set({ id: a.id, email: a.email, display_name: a.display_name }),
    signOut: () => sessionStore.set(null),
  };
}
