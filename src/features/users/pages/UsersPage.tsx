import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationMembers, OrganizationMember } from '../../projects/hooks/useOrganizationMembers';
import { UserModal } from '../components/UserModal';
import { Button, OrgHeader, Table, Badge } from '../../../components';
import { PlusIcon, Edit2Icon, TrashIcon, UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const { members, isLoading, error, refresh, removeMember, canManageMembers } = useOrganizationMembers(orgId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<OrganizationMember | undefined>(undefined);

    const handleAddUser = () => {
        setSelectedMember(undefined);
        setIsModalOpen(true);
    };

    const handleEditUser = (member: OrganizationMember) => {
        setSelectedMember(member);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this user from the organization?')) return;
        await removeMember(memberId);
    };

    const handleModalSuccess = () => {
        refresh();
    };

    if (!orgId) return null;

    const columns = [
        {
            header: 'User',
            accessorKey: 'user',
            cell: (member: OrganizationMember) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                        <UserIcon size={16} />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {member.user?.username || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                            {member.user?.email}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Role',
            accessorKey: 'role',
            cell: (member: OrganizationMember) => {
                const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
                    admin: 'primary',
                    editor: 'success',
                    viewer: 'default'
                };
                return <Badge variant={colors[member.role] || 'default'}>{member.role}</Badge>;
            }
        },
        {
            header: 'Joined',
            accessorKey: 'created_at',
            cell: (member: OrganizationMember) => (
                <span className="text-gray-500">
                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                </span>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'id',
            cell: (member: OrganizationMember) => canManageMembers && (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(member)}
                    >
                        <Edit2Icon size={16} className="text-gray-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(member.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <TrashIcon size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="h-full flex flex-col space-y-6 p-8 overflow-hidden">
            <OrgHeader
                title="Team Members"
                subtitle="Manage your organization's users and roles."
                action={
                    canManageMembers && (
                        <Button onClick={handleAddUser} className="gap-2">
                            <PlusIcon size={16} />
                            Invite User
                        </Button>
                    )
                }
            />

            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <Table
                    data={members}
                    columns={columns}
                    isLoading={isLoading}
                    emptyMessage="No users found."
                />
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                member={selectedMember}
                orgId={orgId}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
