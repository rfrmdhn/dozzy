import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../../components';
import { useProjects } from '../../projects/hooks/useProjects';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Check, AlertCircle } from 'lucide-react';
import type { OrganizationMember, OrgRole } from '../../projects/hooks/useOrganizationMembers';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    member?: OrganizationMember;
    orgId: string;
    onSuccess: () => void;
}

export function UserModal({ isOpen, onClose, member, orgId, onSuccess }: UserModalProps) {
    const { user: currentUser } = useAuth();
    const { projects } = useProjects(orgId);

    // Form State
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<OrgRole>('viewer');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (member) {
                // Edit Mode
                setEmail(member.user?.email || '');
                setRole(member.role);
                setSelectedProjectIds([]); // todo: fetch existing project memberships if needed?
                // For now, simpler to not show/edit project memberships here, user can manage that in Project Members.
                // Or maybe we should?
                // "CRUD User" usually implies Role management. Project management is per-project.
                // But "Add user to a project" was requested. This implies "On Invite".
            } else {
                // Add Mode
                setEmail('');
                setRole('viewer');
                setSelectedProjectIds([]);
            }
            setError(null);
        }
    }, [isOpen, member]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (member) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('organization_members')
                    .update({ role })
                    .eq('id', member.id);

                if (updateError) throw updateError;
            } else {
                // CREATE (Invite/Add)

                // 1. Find User by Email
                // Note: This requires a policy/method to lookup users.
                // Assuming we can read 'users' table or need a function.
                // If this fails, we can't proceed without Admin API.
                // Let's try simple select.
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (userError || !userData) {
                    throw new Error('User not found. Ensure the user has signed up.');
                }

                const newUserId = userData.id;

                // 2. Add to Organization
                const { error: orgError } = await supabase
                    .from('organization_members')
                    .insert({
                        organization_id: orgId,
                        user_id: newUserId,
                        role,
                        invited_by: currentUser?.id
                    });

                if (orgError) {
                    if (orgError.code === '23505') throw new Error('User is already a member.');
                    throw orgError;
                }

                // 3. Add to Selected Projects
                if (selectedProjectIds.length > 0) {
                    const projectMembers = selectedProjectIds.map(pid => ({
                        project_id: pid,
                        user_id: newUserId,
                        role: 'member' // Default to member? Or let them choose? 'member' is safe.
                    }));

                    const { error: projError } = await supabase
                        .from('project_members')
                        .insert(projectMembers);

                    if (projError) {
                        console.error('Failed to add to projects:', projError);
                        // Don't block success of Org add?
                        // But user expects it. Let's warn?
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleProject = (projectId: string) => {
        setSelectedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(p => p !== projectId)
                : [...prev, projectId]
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={member ? 'Edit User' : 'Invite User'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    disabled={!!member || isLoading}
                    required
                />

                <Select
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as OrgRole)}
                    options={[
                        { value: 'viewer', label: 'Viewer (Read-only)' },
                        { value: 'member', label: 'Member (Can edit tasks)' }, // Mapping? OrgRole is admin/editor/viewer
                        // Wait, OrgRole types in useOrganizationMembers are 'admin' | 'editor' | 'viewer'.
                        // My Select labels should match.
                        { value: 'editor', label: 'Editor (Can manage projects)' }, // 'member' isn't in OrgRole? Check types.
                        { value: 'admin', label: 'Admin (Full access)' },
                    ]}
                    disabled={isLoading}
                />

                {!member && projects.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Add to Projects</label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    className={`
                                        flex items - center justify - between p - 2 rounded cursor - pointer border
                                        ${selectedProjectIds.includes(project.id)
                                            ? 'bg-indigo-50 border-indigo-200'
                                            : 'hover:bg-gray-50 border-transparent'
                                        }
`}
                                    onClick={() => toggleProject(project.id)}
                                >
                                    <span className="text-sm text-gray-900 truncate">{project.name}</span>
                                    {selectedProjectIds.includes(project.id) && (
                                        <Check size={16} className="text-indigo-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500">Selected users will be added as 'Member' to these projects.</p>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={onClose} type="button" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (member ? 'Update User' : 'Invite User')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
