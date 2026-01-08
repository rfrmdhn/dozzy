import { create } from 'zustand';
import { organizationRepository } from '../lib/repositories';
import type { Database } from '../types/supabase';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
type Team = Database['public']['Tables']['teams']['Row'];
type CustomField = Database['public']['Tables']['custom_fields']['Row'];

interface OrgState {
    organizations: Organization[];
    currentOrg: Organization | null;
    teams: Team[];
    customFields: CustomField[];
    isLoading: boolean;
    error: Error | null;

    // Actions
    fetchOrganizations: () => Promise<void>;
    setCurrentOrg: (org: Organization) => void;
    fetchTeams: (orgId: string) => Promise<void>;
    fetchCustomFields: (orgId: string) => Promise<void>;
    createOrganization: (name: string, ownerId: string) => Promise<boolean>;
    updateOrganization: (orgId: string, updates: Partial<OrganizationUpdate>) => Promise<boolean>;
    deleteOrganization: (orgId: string) => Promise<boolean>;
    clearError: () => void;
}

export const useOrgStore = create<OrgState>((set, get) => ({
    organizations: [],
    currentOrg: null,
    teams: [],
    customFields: [],
    isLoading: false,
    error: null,

    fetchOrganizations: async () => {
        set({ isLoading: true, error: null });

        const { organizations, error } = await organizationRepository.fetchAll();

        if (error) {
            set({ isLoading: false, error });
            console.error('Failed to fetch organizations:', error);
            return;
        }

        const currentOrg = organizations[0] || null;
        set({
            organizations,
            currentOrg,
            isLoading: false,
        });

        // Fetch teams and custom fields for the first org if exists
        if (currentOrg) {
            get().fetchTeams(currentOrg.id);
            get().fetchCustomFields(currentOrg.id);
        }
    },

    setCurrentOrg: (org) => {
        set({ currentOrg: org });
        get().fetchTeams(org.id);
        get().fetchCustomFields(org.id);
    },

    fetchTeams: async (orgId) => {
        const { teams, error } = await organizationRepository.fetchTeams(orgId);

        if (error) {
            console.error('Failed to fetch teams:', error);
            return;
        }

        set({ teams });
    },

    fetchCustomFields: async (orgId) => {
        const { customFields, error } = await organizationRepository.fetchCustomFields(orgId);

        if (error) {
            console.error('Failed to fetch custom fields:', error);
            return;
        }

        set({ customFields });
    },

    createOrganization: async (name, ownerId) => {
        const { orgId, error } = await organizationRepository.createWithOwner(name, ownerId);

        if (error) {
            set({ error });
            console.error('Failed to create organization:', error);
            return false;
        }

        // Refresh the list to get the new org
        await get().fetchOrganizations();
        return !!orgId;
    },

    updateOrganization: async (orgId, updates) => {
        // Optimistic update
        const currentOrgs = get().organizations;
        const updatedOrgs = currentOrgs.map((o) =>
            o.id === orgId ? { ...o, ...updates } : o
        );
        set({ organizations: updatedOrgs });

        const { data, error } = await organizationRepository.update(orgId, updates);

        if (error) {
            // Revert on error
            set({ organizations: currentOrgs, error });
            console.error('Failed to update organization:', error);
            return false;
        }

        // Update current org if it's the one being edited
        const current = get().currentOrg;
        if (current && current.id === orgId && data) {
            set({ currentOrg: { ...current, ...data } });
        }

        return true;
    },

    deleteOrganization: async (orgId) => {
        // Optimistic update
        const currentOrgs = get().organizations;
        set({ organizations: currentOrgs.filter((o) => o.id !== orgId) });

        const { success, error } = await organizationRepository.delete(orgId);

        if (error || !success) {
            // Revert on error
            set({ organizations: currentOrgs, error });
            console.error('Failed to delete organization:', error);
            return false;
        }

        // Clear current org if it was deleted
        const current = get().currentOrg;
        if (current && current.id === orgId) {
            const remaining = get().organizations;
            set({ currentOrg: remaining[0] || null });
        }

        return true;
    },

    clearError: () => set({ error: null }),
}));
