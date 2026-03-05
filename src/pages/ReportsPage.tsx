import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText, AlertTriangle, ThermometerSun, Activity, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mockCowsRealtime } from '@/lib/mockData';

interface ReportEntry {
  id: string;
  cowId: string;
  cowName: string;
  type: 'temperature' | 'health_alert' | 'abnormal_detection';
  title: string;
  description: string;
  value: number;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

interface CowNames {
  [key: string]: string;
}

interface FirebaseReportPoint {
  id: string;
  cowId: string;
  cowName: string;
  AcX?: number;
  AcY?: number;
  AcZ?: number;
  DS18B20_Temp?: number;
  GyX?: number;
  GyY?: number;
  GyZ?: number;
  MPU_Temp?: number;
  timestamp?: number;
}

interface CowRecord {
  history?: Record<string, Omit<FirebaseReportPoint, 'id' | 'cowId' | 'cowName'>>;
}

const ReportsPage = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [firebaseData, setFirebaseData] = useState<FirebaseReportPoint[]>([]);
  const [recentReports, setRecentReports] = useState<ReportEntry[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportEntry | null>(null);
  const [cowNames, setCowNames] = useState<CowNames>({});
  const [stats, setStats] = useState({
    totalCows: 0,
    healthScore: 0,
    criticalAlerts: 0
  });

  // Load cow names from localStorage
  useEffect(() => {
    const savedNames = localStorage.getItem('cowNames');
    if (savedNames) {
      setCowNames(JSON.parse(savedNames));
    }
  }, []);

  useEffect(() => {
    if (useMockData) {
      const data = mockCowsRealtime;
      const allCowsData: FirebaseReportPoint[] = [];
      const cowsList = Object.keys(data);

      Object.keys(data).forEach(cowId => {
        const cowHistory = data[cowId]?.history;
        if (cowHistory) {
          Object.entries(cowHistory).forEach(([key, value]) => {
            allCowsData.push({
              id: key,
              cowId,
              cowName: cowNames[cowId] || cowId,
              ...(value as Omit<FirebaseReportPoint, 'id' | 'cowId' | 'cowName'>),
            });
          });
        }
      });
      setFirebaseData(allCowsData);

      const reports: ReportEntry[] = [];
      allCowsData.forEach((dataPoint) => {
        if (!dataPoint.timestamp) return;
        const timestamp = new Date(dataPoint.timestamp * 1000);
        const cowDisplayName = cowNames[dataPoint.cowId] || dataPoint.cowId;

        if ((dataPoint.DS18B20_Temp ?? 0) > 39) {
          reports.push({
            id: `temp-${dataPoint.id}`,
            cowId: dataPoint.cowId,
            cowName: cowDisplayName,
            type: 'temperature',
            title: 'High Temperature Alert',
            description: `${cowDisplayName} recorded a high temperature of ${(dataPoint.DS18B20_Temp ?? 0).toFixed(2)}°C`,
            value: dataPoint.DS18B20_Temp ?? 0,
            timestamp,
            severity: 'critical',
          });
        }
      });

      const sortedReports = reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
      setRecentReports(sortedReports);

      const healthyCows = cowsList.filter(cowId => {
        const cowDataPoints = allCowsData.filter(d => d.cowId === cowId);
        if (cowDataPoints.length === 0) return true;
        const latest = cowDataPoints.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
        const accel = Math.sqrt((latest.AcX ?? 0) ** 2 + (latest.AcY ?? 0) ** 2 + (latest.AcZ ?? 0) ** 2);
        const gyro = Math.sqrt((latest.GyX ?? 0) ** 2 + (latest.GyY ?? 0) ** 2 + (latest.GyZ ?? 0) ** 2);
        const act = (accel + gyro) / 2;
        return (latest.DS18B20_Temp ?? 0) < 39 && act >= 5000 && act <= 15000;
      }).length;

      const criticalCount = reports.filter(r => r.severity === 'critical').length;
      setStats({
        totalCows: cowsList.length,
        healthScore: cowsList.length > 0 ? Math.round((healthyCows / cowsList.length) * 100) : 0,
        criticalAlerts: criticalCount,
      });
      return;
    }

    const cowsRef = ref(database, 'cows');
    
    const unsubscribe = onValue(cowsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, CowRecord> | null;
      if (data) {
        const allCowsData: FirebaseReportPoint[] = [];
        const cowsList = Object.keys(data);
        
        Object.keys(data).forEach(cowId => {
          const cowHistory = data[cowId]?.history;
          if (cowHistory) {
            Object.entries(cowHistory).forEach(([key, value]) => {
              allCowsData.push({
                id: key,
                cowId,
                cowName: cowNames[cowId] || cowId,
                ...(value as Omit<FirebaseReportPoint, 'id' | 'cowId' | 'cowName'>),
              });
            });
          }
        });
        setFirebaseData(allCowsData);

        // Generate recent reports from data
        const reports: ReportEntry[] = [];
        
        allCowsData.forEach((dataPoint) => {
          if (!dataPoint.timestamp) return;
          const timestamp = new Date(dataPoint.timestamp * 1000);
          const cowDisplayName = cowNames[dataPoint.cowId] || dataPoint.cowId;
          
          // Temperature alerts
          if (dataPoint.DS18B20_Temp > 39) {
            reports.push({
              id: `temp-${dataPoint.id}`,
              cowId: dataPoint.cowId,
              cowName: cowDisplayName,
              type: 'temperature',
              title: 'High Temperature Alert',
              description: `${cowDisplayName} recorded a high temperature of ${(dataPoint.DS18B20_Temp ?? 0).toFixed(2)}°C`,
              value: dataPoint.DS18B20_Temp,
              timestamp,
              severity: 'critical'
            });
          } else if (dataPoint.DS18B20_Temp > 38.5) {
            reports.push({
              id: `temp-warn-${dataPoint.id}`,
              cowId: dataPoint.cowId,
              cowName: cowDisplayName,
              type: 'temperature',
              title: 'Elevated Temperature',
              description: `${cowDisplayName} has elevated temperature of ${(dataPoint.DS18B20_Temp ?? 0).toFixed(2)}°C`,
              value: dataPoint.DS18B20_Temp,
              timestamp,
              severity: 'warning'
            });
          }

          // Activity alerts
          const accelMagnitude = Math.sqrt((dataPoint.AcX ?? 0) ** 2 + (dataPoint.AcY ?? 0) ** 2 + (dataPoint.AcZ ?? 0) ** 2);
          const gyroMagnitude = Math.sqrt((dataPoint.GyX ?? 0) ** 2 + (dataPoint.GyY ?? 0) ** 2 + (dataPoint.GyZ ?? 0) ** 2);
          const activity = (accelMagnitude + gyroMagnitude) / 2;

          if (activity > 15000) {
            reports.push({
              id: `activity-high-${dataPoint.id}`,
              cowId: dataPoint.cowId,
              cowName: cowDisplayName,
              type: 'abnormal_detection',
              title: 'Unusually High Activity',
              description: `${cowDisplayName} showing unusually high activity level of ${Math.round(activity)}`,
              value: Math.round(activity),
              timestamp,
              severity: 'warning'
            });
          } else if (activity < 5000) {
            reports.push({
              id: `activity-low-${dataPoint.id}`,
              cowId: dataPoint.cowId,
              cowName: cowDisplayName,
              type: 'health_alert',
              title: 'Low Activity Detected',
              description: `${cowDisplayName} showing low activity level of ${Math.round(activity)}. May need health check.`,
              value: Math.round(activity),
              timestamp,
              severity: 'warning'
            });
          }
        });

        // Sort by timestamp (most recent first) and take top 10
        const sortedReports = reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
        setRecentReports(sortedReports);

        // Calculate stats
        const healthyCows = cowsList.filter(cowId => {
          const cowDataPoints = allCowsData.filter(d => d.cowId === cowId);
          if (cowDataPoints.length === 0) return true;
          const latest = cowDataPoints.sort((a, b) => b.timestamp - a.timestamp)[0];
          const accel = Math.sqrt((latest.AcX ?? 0) ** 2 + (latest.AcY ?? 0) ** 2 + (latest.AcZ ?? 0) ** 2);
          const gyro = Math.sqrt((latest.GyX ?? 0) ** 2 + (latest.GyY ?? 0) ** 2 + (latest.GyZ ?? 0) ** 2);
          const act = (accel + gyro) / 2;
          return latest.DS18B20_Temp < 39 && act >= 5000 && act <= 15000;
        }).length;

        const criticalCount = reports.filter(r => r.severity === 'critical').length;

        setStats({
          totalCows: cowsList.length,
          healthScore: cowsList.length > 0 ? Math.round((healthyCows / cowsList.length) * 100) : 0,
          criticalAlerts: criticalCount
        });
      }
    });

    return () => unsubscribe();
  }, [cowNames, useMockData]);

  const handleExport = (type: 'pdf' | 'csv') => {
    if (firebaseData.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const filteredData = firebaseData;

    if (type === 'csv') {
      exportCSV(filteredData);
    } else {
      exportPDF(filteredData);
    }
  };

  const exportCSV = (data: FirebaseReportPoint[]) => {
    const headers = ['Cow Name', 'Cow ID', 'Date & Time', 'Temperature (°C)', 'AcX', 'AcY', 'AcZ', 'GyX', 'GyY', 'GyZ', 'MPU Temp'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        cowNames[row.cowId] || row.cowId,
        row.cowId,
        new Date(row.timestamp * 1000).toLocaleString(),
        row.DS18B20_Temp,
        row.AcX,
        row.AcY,
        row.AcZ,
        row.GyX,
        row.GyY,
        row.GyZ,
        row.MPU_Temp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = dateFrom && dateTo ? `${format(dateFrom, 'yyyy-MM-dd')}-to-${format(dateTo, 'yyyy-MM-dd')}` : 'all-data';
    a.download = `cow-health-report-${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV file downloaded successfully');
  };

  const exportPDF = (data: FirebaseReportPoint[]) => {
    const dateRangeText = dateFrom && dateTo 
      ? `Date Range: ${format(dateFrom, 'PPP')} - ${format(dateTo, 'PPP')}`
      : 'All Available Data';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cow Health Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Cow Health Report</h1>
        <p>${dateRangeText}</p>
        <table>
          <thead>
            <tr>
              <th>Cow Name</th>
              <th>Cow ID</th>
              <th>Date & Time</th>
              <th>Temperature (°C)</th>
              <th>AcX</th>
              <th>AcY</th>
              <th>AcZ</th>
              <th>GyX</th>
              <th>GyY</th>
              <th>GyZ</th>
              <th>MPU Temp</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${cowNames[row.cowId] || row.cowId}</td>
                <td>${row.cowId}</td>
                <td>${new Date(row.timestamp * 1000).toLocaleString()}</td>
                <td>${row.DS18B20_Temp}</td>
                <td>${row.AcX}</td>
                <td>${row.AcY}</td>
                <td>${row.AcZ}</td>
                <td>${row.GyX}</td>
                <td>${row.GyY}</td>
                <td>${row.GyZ}</td>
                <td>${row.MPU_Temp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        toast.success('PDF ready - use browser print dialog to save');
      };
    }
  };

  const getReportIcon = (type: ReportEntry['type']) => {
    switch (type) {
      case 'temperature':
        return <ThermometerSun className="h-4 w-4" />;
      case 'health_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'abnormal_detection':
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: ReportEntry['severity']) => {
    const variants = {
      info: 'secondary',
      warning: 'secondary',
      critical: 'destructive'
    } as const;
    return <Badge variant={variants[severity]} className="capitalize">{severity}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate and export health reports</p>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Date Range Selection</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-foreground">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-foreground">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => handleExport('pdf')} className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Health Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium text-foreground">Total Cows Monitored</span>
              <span className="text-sm font-bold text-primary">{stats.totalCows}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium text-foreground">Average Health Score</span>
              <span className="text-sm font-bold text-primary">{stats.healthScore}%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3">
              <span className="text-sm font-medium text-foreground">Critical Alerts</span>
              <span className="text-sm font-bold text-destructive">{stats.criticalAlerts}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Recent Reports</h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between rounded-lg bg-muted p-3 cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`p-1.5 rounded ${
                      report.severity === 'critical' ? 'bg-destructive/20 text-destructive' : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {getReportIcon(report.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.cowName} • {format(report.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent reports</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && getReportIcon(selectedReport.type)}
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cow</span>
                <span className="font-medium">{selectedReport.cowName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cow ID</span>
                <span className="font-medium">{selectedReport.cowId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Report Type</span>
                <Badge variant="outline" className="capitalize">
                  {selectedReport.type.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Severity</span>
                {getSeverityBadge(selectedReport.severity)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-medium">
                  {selectedReport.type === 'temperature' 
                    ? `${selectedReport.value.toFixed(2)}°C` 
                    : selectedReport.value}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date & Time</span>
                <span className="font-medium">{format(selectedReport.timestamp, 'PPpp')}</span>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{selectedReport.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportsPage;
