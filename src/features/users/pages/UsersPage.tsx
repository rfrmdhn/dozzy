import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationMembers, OrganizationMember } from '../../projects/hooks/useOrganizationMembers';
import { UserModal } from '../components/UserModal';
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../../components';
import { PlusIcon, Edit2Icon, TrashIcon, UserIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useOrganizations } from '../../projects/hooks/useOrganizations';

export default function UsersPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const { members, isLoading, refresh, removeMember, canManageMembers } = useOrganizationMembers(orgId);
    const { organizations } = useOrganizations();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<OrganizationMember | undefined>(undefined);

    const currentOrg = organizations.find(o => o.id === orgId);

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

    return (
        <div className="h-full flex flex-col space-y-6 p-8 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <UsersIcon size={24} />
                        </div>
                        Team Members
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Manage users and roles for <span className="font-medium text-gray-900">{currentOrg?.name}</span>.
                    </p>
                </div>
                {canManageMembers && (
                    <Button onClick={handleAddUser} className="gap-2">
                        <PlusIcon size={16} />
                        Invite User
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={canManageMembers ? 4 : 3} className="text-center py-8 text-gray-500">
                                        Loading members...
                                    </TableCell>
                                </TableRow>
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManageMembers ? 4 : 3} className="text-center py-8 text-gray-500">
                                        No users found in this organization.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell>
                                            {/* Badge variants: 'admin' -> 'primary', 'editor' -> 'info', 'viewer' -> 'neutral' */}
                                            {/* 'info' is invalid? Check Badge.tsx again. Valid: todo, in_progress, done, active, delayed, draft, low, medium, high, primary, warning, info, neutral. */}
                                            {/* 'info' IS valid based on Badge.tsx snippet in output 543. */}
                                            <Badge variant={
                                                member.role === 'admin' ? 'primary' :
                                                    member.role === 'editor' ? 'info' :
                                                        'neutral'
                                            }>
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-500">
                                                {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : '-'}
                                            </span>
                                        </TableCell>
                                        {canManageMembers && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditUser(member)}
                                                        title="Edit Role"
                                                    >
                                                        <Edit2Icon size={16} className="text-gray-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteUser(member.id)}
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        title="Remove User"
                                                    >
                                                        <TrashIcon size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
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
