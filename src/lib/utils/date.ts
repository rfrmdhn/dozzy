/**
 * Format a date string for display
 * @param dateStr ISO date string or null
 * @param options Formatting options
 */
export function formatDate(
    dateStr: string | null | undefined,
    options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
): string {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
        return '';
    }
}

/**
 * Format a date with time
 */
export function formatDateTime(
    dateStr: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }
): string {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch {
        return '';
    }
}

/**
 * Format date with year
 */
export function formatDateWithYear(dateStr: string | null | undefined): string {
    return formatDate(dateStr, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format time only
 */
export function formatTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatTimerDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get relative time description (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return formatDate(dateStr);
    } catch {
        return '';
    }
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    try {
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    } catch {
        return false;
    }
}

/**
 * Check if a date is overdue (past due date and not today)
 */
export function isOverdue(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    try {
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    } catch {
        return false;
    }
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}
