import { useState, useEffect } from 'react';
import { ClockIcon, PlayIcon, PauseIcon, Card, Input } from '../../../components';
import { formatTimerDuration } from '../../../lib/utils/date';

export function QuickTimer() {
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerDescription, setTimerDescription] = useState('');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (timerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    const handleToggleTimer = () => {
        if (timerRunning) {
            // TODO: Save time log when stopping
            console.log('Timer stopped. Duration:', timerSeconds, 'Description:', timerDescription);
        }
        setTimerRunning(!timerRunning);
    };

    const handleReset = () => {
        setTimerRunning(false);
        setTimerSeconds(0);
        setTimerDescription('');
    };

    return (
        <Card className="timer-card">
            <div className="timer-header">
                <ClockIcon size={20} />
                <span>Track Time</span>
                <button className="timer-menu-btn" onClick={handleReset} title="Reset">
                    •••
                </button>
            </div>
            <Input
                className="timer-input"
                placeholder="What are you working on?"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
            />
            <div className="timer-display">{formatTimerDuration(timerSeconds)}</div>
            <button
                className={`timer-btn ${timerRunning ? 'running' : ''}`}
                onClick={handleToggleTimer}
            >
                {timerRunning ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>
        </Card>
    );
}
