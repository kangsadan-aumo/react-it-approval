import type { RequestStatus } from '../types';
import { STATUS_CONFIG } from '../types';

interface StatusBadgeProps {
    status: RequestStatus;
    size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    const sizeClasses: Record<string, string> = {
        sm: 'status-badge--sm',
        md: 'status-badge--md',
        lg: 'status-badge--lg',
    };

    return (
        <span
            className={`status-badge ${sizeClasses[size]}`}
            style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderColor: config.color,
            }}
        >
            <span className="status-badge-icon">{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
