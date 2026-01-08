import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { User, Session } from '@supabase/supabase-js';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    isLoading: boolean;
    initialize: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: true,

    initialize: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                set({ user: session.user, session, profile, isLoading: false });
            } else {
                set({ user: null, session: null, profile: null, isLoading: false });
            }

            // Listen for changes
            supabase.auth.onAuthStateChange(async (_event, session) => {
                const currentUser = session?.user ?? null;
                let profile = null;

                if (currentUser) {
                    const { data } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();
                    profile = data;
                }

                set({ user: currentUser, session, profile, isLoading: false });
            });

        } catch (error) {
            console.error('Auth initialization failed:', error);
            set({ isLoading: false });
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
    },
}));
