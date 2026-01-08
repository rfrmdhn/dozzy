import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Organization = Database['public']['Tables']['organizations']['Row'];
type Team = Database['public']['Tables']['teams']['Row'];
type CustomField = Database['public']['Tables']['custom_fields']['Row'];

interface OrgState {
    organizations: Organization[];
    currentOrg: Organization | null;
    teams: Team[];
    customFields: CustomField[];
    isLoading: boolean;

    fetchOrganizations: () => Promise<void>;
    setCurrentOrg: (org: Organization) => void;
    fetchTeams: (orgId: string) => Promise<void>;
    fetchCustomFields: (orgId: string) => Promise<void>;
    createOrganization: (name: string, ownerId: string) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set, get) => ({
    organizations: [],
    currentOrg: null,
    teams: [],
    customFields: [],
    isLoading: false,

    fetchOrganizations: async () => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            set({
                organizations: data || [],
                currentOrg: data?.[0] || null, // Default to first org
                isLoading: false
            });

            // Fetch teams and custom fields for the first org if exists
            if (data?.[0]) {
                get().fetchTeams(data[0].id);
                get().fetchCustomFields(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
            set({ isLoading: false });
        }
    },

    setCurrentOrg: (org) => {
        set({ currentOrg: org });
        get().fetchTeams(org.id);
        get().fetchCustomFields(org.id);
    },

    fetchTeams: async (orgId) => {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;

            set({ teams: data || [] });
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    },

    fetchCustomFields: async (orgId) => {
        try {
            const { data, error } = await supabase
                .from('custom_fields')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;
            set({ customFields: data || [] });
        } catch (error) {
            console.error('Failed to fetch custom fields:', error);
        }
    },

    createOrganization: async (name, ownerId) => {
        try {
            const { error } = await supabase
                .rpc('create_organization_with_owner', {
                    org_name: name,
                    owner_id: ownerId
                });

            if (error) throw error;


            // Refresh list
            await get().fetchOrganizations();
        } catch (error) {
            console.error('Failed to create organization:', error);
            throw error;
        }
    }
}));
