import type { SVGProps } from 'react';
import {
    LayoutDashboard,
    Building2,
    BarChart3,
    Settings,
    User,
    Users,
    Clock,
    Calendar,
    Folder,
    Check,
    CheckCircle2,
    Flag,
    Filter,
    ArrowUpDown,
    LayoutGrid,
    List,
    Plus,
    Pencil,
    Share2,
    Search,
    Bell,
    Play,
    Pause,
    Trash2,
    X,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Building,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    MoreHorizontal,
    Star,
    Tag,
    ArrowUp,
    LogOut,
    KanbanSquare,
    ClipboardList,
    RefreshCw,
    Timer,
    BarChart,
    FileText,
    AlertCircle,
    Info
} from 'lucide-react';

interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number;
}

// Wrapper to adapt Lucide icons to current project interface/styling if needed
function withIcon(IconComponent: React.ComponentType<any>) {
    return ({ size = 20, ...props }: IconProps) => (
        <IconComponent size={size} {...props} />
    );
}

// GLOBAL ICONS
export const GridIcon = withIcon(LayoutGrid);
export const SearchIcon = withIcon(Search);
export const BellIcon = withIcon(Bell);
export const HelpCircleIcon = withIcon(Settings); // Placeholder
export const SettingsIcon = withIcon(Settings);
export const LayoutIcon = withIcon(LayoutDashboard);
export const BriefcaseIcon = withIcon(Building2);
export const ListIcon = withIcon(List);
export const CalendarIcon = withIcon(Calendar);
export const FileTextIcon = withIcon(FileText);
export const KanbanIcon = withIcon(KanbanSquare);
export const ChevronLeftIcon = withIcon(ChevronLeft);
export const PlusIcon = withIcon(Plus);
export const CheckCircleIcon = withIcon(CheckCircle2);
export const LogOutIcon = withIcon(LogOut);
export const ClockIcon = withIcon(Clock);

// GENERIC ICONS
export const DashboardIcon = withIcon(LayoutDashboard); // Alias for legacy
export const OrganizationsIcon = withIcon(Building2);
export const ReportsIcon = withIcon(BarChart3);
export const UserIcon = withIcon(User);
export const UsersIcon = withIcon(Users);
export const FolderIcon = withIcon(Folder);
export const CheckIcon = withIcon(Check);
export const FlagIcon = withIcon(Flag);
export const FilterIcon = withIcon(Filter);
export const SortIcon = withIcon(ArrowUpDown);
export const EditIcon = withIcon(Pencil);
export const ShareIcon = withIcon(Share2);
export const PlayIcon = withIcon(Play);
export const PauseIcon = withIcon(Pause);
export const TrashIcon = withIcon(Trash2);
export const CloseIcon = withIcon(X);
export const MailIcon = withIcon(Mail);
export const LockIcon = withIcon(Lock);
export const EyeIcon = withIcon(Eye);
export const EyeOffIcon = withIcon(EyeOff);
export const BuildingIcon = withIcon(Building);
export const ChevronRightIcon = withIcon(ChevronRight);
export const ChevronDownIcon = withIcon(ChevronDown);
export const MoreIcon = withIcon(MoreHorizontal);
export const StarIcon = withIcon(Star);
export const TagIcon = withIcon(Tag);
export const ArrowUpIcon = withIcon(ArrowUp);

// REPORTS ICONS
export const ClipboardListIcon = withIcon(ClipboardList);
export const RefreshIcon = withIcon(RefreshCw);
export const TimerIcon = withIcon(Timer);
export const ChartBarIcon = withIcon(BarChart);
export const AlertIcon = withIcon(AlertCircle);
export const InfoIcon = withIcon(Info);
