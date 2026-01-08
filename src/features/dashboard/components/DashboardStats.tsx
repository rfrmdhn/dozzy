import { ClockIcon, BuildingIcon, CheckCircleIcon, ArrowUpIcon, Card } from '../../../components';
import { formatDuration } from '../../../lib/utils/date';
import type { DashboardStats } from '../../../types';

interface DashboardStatsProps {
    stats: DashboardStats;
    orgCount: number;
}

export function DashboardStatsSection({ stats, orgCount }: DashboardStatsProps) {
    return (
        <div className="stats-grid">
            <Card className="stat-card">
                <div className="stat-card-header">
                    <span className="stat-card-label">Hours Logged</span>
                    <div className="stat-card-icon stat-card-icon--primary"><ClockIcon size={20} /></div>
                </div>
                <div className="stat-card-value">{formatDuration(stats.totalTime)}</div>
                <div className={`stat-card-change ${stats.weeklyChange >= 0 ? 'positive' : 'negative'}`}>
                    <ArrowUpIcon size={14} /> {stats.weeklyChange >= 0 ? '+' : ''}{stats.weeklyChange}% this week
                </div>
            </Card>

            <Card className="stat-card">
                <div className="stat-card-header">
                    <span className="stat-card-label">Active Orgs</span>
                    <div className="stat-card-icon stat-card-icon--info"><BuildingIcon size={20} /></div>
                </div>
                <div className="stat-card-value">{stats.activeOrgs}</div>
                <div className="stat-card-change">Across {orgCount > 1 ? `${orgCount} workspaces` : '1 workspace'}</div>
            </Card>

            <Card className="stat-card">
                <div className="stat-card-header">
                    <span className="stat-card-label">Pending Tasks</span>
                    <div className="stat-card-icon stat-card-icon--warning"><CheckCircleIcon size={20} /></div>
                </div>
                <div className="stat-card-value">{stats.pendingTasks}</div>
                <div className="stat-card-change">{stats.highPriorityCount} High Priority</div>
            </Card>
        </div>
    );
}
