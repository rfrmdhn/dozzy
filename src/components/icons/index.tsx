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
    BarChart
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

// Dashboard icon
export const DashboardIcon = withIcon(LayoutDashboard);

// Organizations icon
export const OrganizationsIcon = withIcon(Building2);

// Reports icon
export const ReportsIcon = withIcon(BarChart3);

// Settings icon
export const SettingsIcon = withIcon(Settings);

// Profile/User icon
export const UserIcon = withIcon(User);

// Users/Team icon
export const UsersIcon = withIcon(Users);

// Clock icon
export const ClockIcon = withIcon(Clock);

// Calendar icon
export const CalendarIcon = withIcon(Calendar);

// Folder/Project icon
export const FolderIcon = withIcon(Folder);

// Check/Done icon
export const CheckIcon = withIcon(Check);

// Check Circle icon
export const CheckCircleIcon = withIcon(CheckCircle2);

// Flag/Priority icon
export const FlagIcon = withIcon(Flag);

// Filter icon
export const FilterIcon = withIcon(Filter);

// Sort icon
export const SortIcon = withIcon(ArrowUpDown);

// Grid view icon
export const GridIcon = withIcon(LayoutGrid);

// List view icon
export const ListIcon = withIcon(List);

// Plus icon
export const PlusIcon = withIcon(Plus);

// Edit/Pencil icon
export const EditIcon = withIcon(Pencil);

// Share icon
export const ShareIcon = withIcon(Share2);

// Search icon
export const SearchIcon = withIcon(Search);

// Bell/Notification icon
export const BellIcon = withIcon(Bell);

// Play icon
export const PlayIcon = withIcon(Play);

// Pause icon
export const PauseIcon = withIcon(Pause);

// Trash/Delete icon
export const TrashIcon = withIcon(Trash2);

// Close/X icon
export const CloseIcon = withIcon(X);

// Mail/Email icon
export const MailIcon = withIcon(Mail);

// Lock/Password icon
export const LockIcon = withIcon(Lock);

// Eye icon (show password)
export const EyeIcon = withIcon(Eye);

// Eye Off icon (hide password)
export const EyeOffIcon = withIcon(EyeOff);

// Building/Company icon
export const BuildingIcon = withIcon(Building);

// Chevron Right icon
export const ChevronRightIcon = withIcon(ChevronRight);

// Chevron Left icon
export const ChevronLeftIcon = withIcon(ChevronLeft);

// Chevron Down icon
export const ChevronDownIcon = withIcon(ChevronDown);

// More/Dots icon
export const MoreIcon = withIcon(MoreHorizontal);

// Star icon
export const StarIcon = withIcon(Star);

// Tag/Label icon
export const TagIcon = withIcon(Tag);

// Arrow Up icon
export const ArrowUpIcon = withIcon(ArrowUp);

// Log out icon
export const LogOutIcon = withIcon(LogOut);

// Kanban/Board icon
export const KanbanIcon = withIcon(KanbanSquare);

// New Icons Replacing Emojis
export const ClipboardListIcon = withIcon(ClipboardList);
export const RefreshIcon = withIcon(RefreshCw);
export const TimerIcon = withIcon(Timer);
export const ChartBarIcon = withIcon(BarChart);
