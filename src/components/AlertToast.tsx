import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, ThermometerSun, Activity } from 'lucide-react';

interface Alert {
  id: string;
  type: 'temperature' | 'activity';
  cowId: string;
  cowName?: string;
  value: number;
  message: string;
  severity: 'warning' | 'critical';
  timestamp?: Date;
}

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'temperature':
      return ThermometerSun;
    case 'activity':
      return Activity;
  }
};

const formatAlertTime = (timestamp?: Date) => {
  if (!timestamp) return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const useAlertSystem = (alerts: Alert[]) => {
  const shownAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    alerts.forEach((alert) => {
      // Only show each alert once
      if (shownAlerts.current.has(alert.id)) return;
      shownAlerts.current.add(alert.id);

      const Icon = getAlertIcon(alert.type);
      const alertTime = formatAlertTime(alert.timestamp);
      const cowDisplay = alert.cowName || alert.cowId;
      
      if (alert.severity === 'critical') {
        toast.error(alert.message, {
          description: (
            <div className="space-y-1">
              <p>Cow: {cowDisplay} (ID: {alert.cowId})</p>
              <p>Value: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</p>
              <p className="text-xs opacity-75">Detected: {alertTime}</p>
            </div>
          ),
          icon: <Icon className="h-5 w-5" />,
          duration: 10000,
        });
      } else {
        toast.warning(alert.message, {
          description: (
            <div className="space-y-1">
              <p>Cow: {cowDisplay} (ID: {alert.cowId})</p>
              <p>Value: {typeof alert.value === 'number' ? alert.value.toFixed(2) : alert.value}</p>
              <p className="text-xs opacity-75">Detected: {alertTime}</p>
            </div>
          ),
          icon: <Icon className="h-5 w-5" />,
          duration: 5000,
        });
      }
    });
  }, [alerts]);
};
