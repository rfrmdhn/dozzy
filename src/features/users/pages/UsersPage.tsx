import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganizationMembers } from '../../projects/hooks/useOrganizationMembers';
import type { OrganizationMember } from '../../projects/hooks/useOrganizationMembers';
import { UserModal } from '../components/UserModal';
import { Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../../components';
import { PlusIcon, Edit2Icon, TrashIcon, UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useOrgStore } from '../../../stores/useOrgStore';
import { useAuth } from '../../../contexts/AuthContext';

export default function UsersPage() {
    const { orgId } = useParams<{ orgId: string }>();
    const { user } = useAuth();
    const { members, isLoading, refresh, removeMember, canManageMembers: hookCanManage } = useOrganizationMembers(orgId);
    const { organizations, fetchOrganizations } = useOrgStore();

    // Ensure orgs are loaded
    useEffect(() => {
        if (organizations.length === 0) {
            fetchOrganizations();
        }
    }, [organizations.length, fetchOrganizations]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<OrganizationMember | undefined>(undefined);

    const currentOrg = organizations.find(o => o.id === orgId);

    // Robust admin check: Trust hook permissions OR check if user is Org Owner
    // This allows "Invite" buttons to show up even if the member list fails to load (e.g. strict RLS)
    const isOwner = currentOrg?.owner_id === user?.id;
    const canManageMembers = hookCanManage || isOwner;

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
        <div className="page-container h-full flex flex-col space-y-6 overflow-hidden bg-gray-50/50">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-200">
                            <UsersIcon size={24} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Team Members
                        </h1>
                    </div>
                    <p className="text-gray-500 ml-1">
                        Manage access and roles for <span className="font-medium text-gray-900">{currentOrg?.name}</span>.
                    </p>
                </div>
                {canManageMembers && (
                    <Button onClick={handleAddUser} className="gap-2 shadow-sm" variant="primary">
                        <PlusIcon size={18} />
                        Invite User
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                <TableHead className="py-4">User</TableHead>
                                <TableHead className="py-4">Role</TableHead>
                                <TableHead className="py-4">Joined</TableHead>
                                {canManageMembers && <TableHead className="text-right py-4">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={canManageMembers ? 4 : 3} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                            <div className="loading-spinner text-indigo-600 mb-2" />
                                            <span>Loading team members...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManageMembers ? 4 : 3} className="text-center py-16">
                                        <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                                <UsersIcon size={32} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No members found</h3>
                                            <p className="text-gray-500 mb-6 text-center text-sm">
                                                {canManageMembers
                                                    ? "This organization doesn't have any members yet. Invite your team for only $0.00/month!"
                                                    : "No other members are in this organization."}
                                            </p>
                                            {canManageMembers && (
                                                <Button onClick={handleAddUser} variant="secondary" className="gap-2">
                                                    <PlusIcon size={16} />
                                                    Invite First Member
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                                                    {member.user?.username?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {member.user?.username || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {member.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                member.role === 'admin' ? 'primary' :
                                                    member.role === 'editor' ? 'info' :
                                                        'neutral'
                                            }>
                                                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-gray-500 text-sm">
                                                {member.created_at ? format(new Date(member.created_at), 'MMM d, yyyy') : '-'}
                                            </span>
                                        </TableCell>
                                        {canManageMembers && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
