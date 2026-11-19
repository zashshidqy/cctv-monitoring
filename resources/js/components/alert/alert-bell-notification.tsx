import React, { useState, useEffect } from 'react';
import { Camera, Bell, BellOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { CameraAlert as AlertType } from '@/types';

interface AlertBellNotificationProps {
    alertCount: number;
    onNavigate: () => void;
}

export const AlertBellNotification: React.FC<AlertBellNotificationProps> = ({
    alertCount,
    onNavigate,
}) => {
    const [showBadge, setShowBadge] = useState(alertCount > 0);

    useEffect(() => {
        setShowBadge(alertCount > 0);
    }, [alertCount]);

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onNavigate}
            className={`relative hover:bg-[#EEF0F2] ${
                alertCount > 0 ? 'bg-[#FCE8EA] border-[#E60012]/50' : ''
            }`}
        >
            {alertCount > 0 && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#E60012] rounded-full border-2 border-white animate-pulse" />
            )}
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs ml-1 font-medium">
                Alert: {alertCount}
            </span>
        </Button>
    );
};

import { Badge } from '@/components/ui/badge';