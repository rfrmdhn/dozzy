import { useState } from 'react';
import { Badge, Button, Modal } from '../../../components';
import { Project, User } from '../../../types';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useOrganizationMembers } from '../hooks/useOrganizationMembers';

// Simplified icons since they are not exported from atoms/index
const XIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const TrashIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const UserPlusIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="8.5" cy="7" r="4"></circle>
        <line x1="20" y1="8" x2="20" y2="14"></line>
        <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
);

interface ProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

export function ProjectMembersModal({ isOpen, onClose, project }: ProjectMembersModalProps) {
    const { members, isLoading, addMember, removeMember } = useProjectMembers(project.id);
    const { members: orgMembers } = useOrganizationMembers(project.organization_id);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    // Filter out users who are already members
    const availableUsers = orgMembers.filter(om =>
        !members.some(pm => pm.user_id === om.user_id)
    );

    const handleAdd = async () => {
        if (!selectedUserId) return;
        setSubmitting(true);
        await addMember(selectedUserId, 'member'); // Default to 'member'
        setSubmitting(false);
        setSelectedUserId('');
    };

    const handleRemove = async (id: string) => {
        if (confirm('Remove this member?')) {
            await removeMember(id);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Members of ${project.name}`}>
            <div className="space-y-6">

                {/* Add Member Form */}
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add organization member</label>
                        <select
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="">Select a user...</option>
                            {availableUsers.map(om => (
                                <option key={om.id} value={om.user_id}>
                                    {om.user?.username || om.user?.email || 'Unknown User'} ({om.role})
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        disabled={!selectedUserId || submitting}
                        onClick={handleAdd}
                        leftIcon={<UserPlusIcon size={16} />}
                    >
                        Add
                    </Button>
                </div>

                {/* Members List */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-4 py-2 font-medium">User</th>
                                <th className="px-4 py-2 font-medium">Role</th>
                                <th className="px-4 py-2 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">Loading members...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">No members yet</td>
                                </tr>
                            ) : (
                                members.map(m => (
                                    <tr key={m.id}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{m.user?.username || 'Unknown'}</div>
                                            <div className="text-gray-500 text-xs">{m.user?.email}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={m.role === 'lead' ? 'active' : 'neutral'}>
                                                {m.role}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleRemove(m.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Remove member"
                                            >
                                                <TrashIcon size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}

