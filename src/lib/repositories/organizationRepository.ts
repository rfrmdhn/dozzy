import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
type Team = Database['public']['Tables']['teams']['Row'];
type CustomField = Database['public']['Tables']['custom_fields']['Row'];

export interface OrganizationWithStats extends Organization {
    projectCount?: number;
    memberCount?: number;
}

export interface FetchOrganizationsResult {
    organizations: Organization[];
    error: Error | null;
}

export interface OrganizationOperationResult {
    data: Organization | null;
    error: Error | null;
}

/**
 * Repository for Organization data access operations.
 * Centralizes all Supabase queries for organizations.
 */
export const organizationRepository = {
    /**
     * Fetch all organizations for the current user
     */
    async fetchAll(): Promise<FetchOrganizationsResult> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { organizations: data || [], error: null };
        } catch (err) {
            return { organizations: [], error: err as Error };
        }
    },

    /**
     * Fetch organization with project and member counts
     */
    async fetchWithStats(orgIds: string[]): Promise<{ stats: Record<string, { projectCount: number; memberCount: number }>; error: Error | null }> {
        try {
            const { data: projects, error } = await supabase
                .from('projects')
                .select('organization_id')
                .in('organization_id', orgIds);

            if (error) throw error;

            const stats: Record<string, { projectCount: number; memberCount: number }> = {};

            orgIds.forEach(id => {
                stats[id] = {
                    projectCount: (projects || []).filter(p => p.organization_id === id).length,
                    memberCount: 1, // TODO: Fetch from organization_members when available
                };
            });

            return { stats, error: null };
        } catch (err) {
            return { stats: {}, error: err as Error };
        }
    },

    /**
     * Fetch teams for an organization
     */
    async fetchTeams(orgId: string): Promise<{ teams: Team[]; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;
            return { teams: data || [], error: null };
        } catch (err) {
            return { teams: [], error: err as Error };
        }
    },

    /**
     * Fetch custom fields for an organization
     */
    async fetchCustomFields(orgId: string): Promise<{ customFields: CustomField[]; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('custom_fields')
                .select('*')
                .eq('organization_id', orgId);

            if (error) throw error;
            return { customFields: data || [], error: null };
        } catch (err) {
            return { customFields: [], error: err as Error };
        }
    },

    /**
     * Create a new organization using RPC (with owner association)
     */
    async createWithOwner(name: string, ownerId: string): Promise<{ orgId: string | null; error: Error | null }> {
        try {
            const { data, error } = await supabase.rpc('create_organization_with_owner', {
                org_name: name,
                owner_id: ownerId,
            });

            if (error) throw error;
            return { orgId: data as string, error: null };
        } catch (err) {
            return { orgId: null, error: err as Error };
        }
    },

    /**
     * Create organization directly (for simpler cases)
     */
    async create(org: OrganizationInsert): Promise<OrganizationOperationResult> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .insert(org)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Update an existing organization
     */
    async update(orgId: string, updates: OrganizationUpdate): Promise<OrganizationOperationResult> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .update(updates)
                .eq('id', orgId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    },

    /**
     * Delete an organization
     */
    async delete(orgId: string): Promise<{ success: boolean; error: Error | null }> {
        try {
            const { error } = await supabase
                .from('organizations')
                .delete()
                .eq('id', orgId);

            if (error) throw error;
            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    },
};

export default organizationRepository;
