import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { TempChart } from '@/components/charts/TempChart';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, Activity, Search, Beef, X, Clock } from 'lucide-react';
import { useAlertSystem } from '@/components/AlertToast';
import { mockCowsRealtime } from '@/lib/mockData';

interface FirebaseDataPoint {
  AcX: number;
  AcY: number;
  AcZ: number;
  DS18B20_Temp: number;
  GyX: number;
  GyY: number;
  GyZ: number;
  MPU_Temp: number;
  timestamp: number;
}

interface CowNames {
  [key: string]: string;
}

interface CowHistoryPoint extends Partial<FirebaseDataPoint> {
  id: string;
  cowId: string;
}

interface CowRecord {
  history?: Record<string, Partial<FirebaseDataPoint>>;
}

interface AlertItem {
  id: string;
  type: 'temperature' | 'activity';
  cowId: string;
  cowName: string;
  value: number;
  message: string;
  severity: 'critical' | 'warning';
  timestamp: Date;
}

interface CowStatItem {
  cowId: string;
  name: string;
  temperature: number;
  activity: number;
  isHealthy: boolean;
  lastUpdated: string;
  timestamp: number;
}

interface TempChartPoint {
  time: string;
  temperature: number;
  cowId: string;
  fullDateTime: string;
}

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatChartTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const DashboardPage = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
  const [chartData, setChartData] = useState<{ temperature: TempChartPoint[] }>({
    temperature: []
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [stats, setStats] = useState({
    totalCows: 0,
    healthyCows: 0,
    alerts: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [cowsData, setCowsData] = useState<CowHistoryPoint[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'healthy' | 'alerts'>('all');
  const [cowStats, setCowStats] = useState<CowStatItem[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);
  const [cowNames, setCowNames] = useState<CowNames>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useAlertSystem(alerts);

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
      const allCowsData: CowHistoryPoint[] = [];
      const cowsList = Object.keys(data);

      cowsList.forEach(cowId => {
        const cowHistory = data[cowId]?.history;
        if (cowHistory) {
          const dataArray: CowHistoryPoint[] = Object.entries(cowHistory).map(([key, value]) => ({
            id: key,
            cowId,
            ...(value as Partial<FirebaseDataPoint>),
          }));
          allCowsData.push(...dataArray);
        }
      });

      setCowsData(allCowsData);
      setLastUpdated(new Date());

      const cowToShow = selectedCowId || null;
      let dataForChart = allCowsData;
      if (cowToShow) dataForChart = allCowsData.filter(d => d.cowId === cowToShow);

      const sortedData = dataForChart.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)).slice(-20);
      setChartData({
        temperature: sortedData.map((item) => ({
          time: formatChartTime(item.timestamp ?? 0),
          temperature: item.DS18B20_Temp ?? 0,
          cowId: item.cowId,
          fullDateTime: formatDateTime(item.timestamp ?? 0),
        })),
      });

      const calculatedCowStats = cowsList.map(cowId => {
        const cowDataPoints = allCowsData.filter(d => d.cowId === cowId);
        if (cowDataPoints.length === 0) return null;
        const latestData = cowDataPoints.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
        const avgTemp = latestData.DS18B20_Temp ?? 0;
        const accelMagnitude = Math.sqrt((latestData.AcX ?? 0) ** 2 + (latestData.AcY ?? 0) ** 2 + (latestData.AcZ ?? 0) ** 2);
        const gyroMagnitude = Math.sqrt((latestData.GyX ?? 0) ** 2 + (latestData.GyY ?? 0) ** 2 + (latestData.GyZ ?? 0) ** 2);
        const activity = (accelMagnitude + gyroMagnitude) / 2;

        return {
          cowId,
          name: cowNames[cowId] || '',
          temperature: avgTemp,
          activity: Math.round(activity),
          isHealthy: avgTemp < 39 && activity >= 5000 && activity <= 15000,
          lastUpdated: formatDateTime(latestData.timestamp ?? 0),
          timestamp: latestData.timestamp ?? 0,
        };
      }).filter((item): item is CowStatItem => item !== null);

      setCowStats(calculatedCowStats);

      const newAlerts: AlertItem[] = [];
      calculatedCowStats.forEach(cow => {
        if (cow.temperature > 39) {
          newAlerts.push({
            id: `temp-high-${cow.cowId}`,
            type: 'temperature',
            cowId: cow.cowId,
            cowName: cowNames[cow.cowId] || cow.cowId,
            value: cow.temperature,
            message: `High Temperature Detected - ${cowNames[cow.cowId] || cow.cowId}`,
            severity: 'critical',
            timestamp: new Date(cow.timestamp * 1000),
          });
        }
      });

      const healthyCows = calculatedCowStats.filter(c => c.isHealthy).length;
      setStats({ totalCows: cowsList.length, healthyCows, alerts: newAlerts.length });
      setAlerts(newAlerts);
      return;
    }

    const cowsRef = ref(database, 'cows');
    
    const unsubscribe = onValue(cowsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, CowRecord> | null;
      
      if (data) {
        const allCowsData: CowHistoryPoint[] = [];
        const cowsList = Object.keys(data);

        // Process each cow's data
        cowsList.forEach(cowId => {
          const cowHistory = data[cowId]?.history;
          if (cowHistory) {
            const dataArray: CowHistoryPoint[] = Object.entries(cowHistory).map(([key, value]) => ({
              id: key,
              cowId,
              ...(value as Partial<FirebaseDataPoint>),
            }));
            allCowsData.push(...dataArray);
          }
        });

        setCowsData(allCowsData);
        setLastUpdated(new Date());

        // Determine which cow's data to show
        const cowToShow = selectedCowId || null;
        
        let dataForChart = allCowsData;
        if (cowToShow) {
          dataForChart = allCowsData.filter(d => d.cowId === cowToShow);
        }

        // Sort by timestamp and take last 20 entries for charts
        const sortedData = dataForChart.sort((a, b) => a.timestamp - b.timestamp).slice(-20);

        // Transform data for temperature chart
        const tempData = sortedData.map((item) => ({
          time: formatChartTime(item.timestamp),
          temperature: item.DS18B20_Temp,
          cowId: item.cowId,
          fullDateTime: formatDateTime(item.timestamp)
        }));

        setChartData({
          temperature: tempData
        });

        // Calculate stats per cow
        const calculatedCowStats = cowsList.map(cowId => {
          const cowDataPoints = allCowsData.filter(d => d.cowId === cowId);
          if (cowDataPoints.length === 0) return null;

          const latestData = cowDataPoints.sort((a, b) => b.timestamp - a.timestamp)[0];
          const avgTemp = latestData.DS18B20_Temp ?? 0;
          const accelMagnitude = Math.sqrt((latestData.AcX ?? 0) ** 2 + (latestData.AcY ?? 0) ** 2 + (latestData.AcZ ?? 0) ** 2);
          const gyroMagnitude = Math.sqrt((latestData.GyX ?? 0) ** 2 + (latestData.GyY ?? 0) ** 2 + (latestData.GyZ ?? 0) ** 2);
          const activity = (accelMagnitude + gyroMagnitude) / 2;

          return {
            cowId,
            name: cowNames[cowId] || '',
            temperature: avgTemp,
            activity: Math.round(activity),
            isHealthy: avgTemp < 39 && activity >= 5000 && activity <= 15000,
            lastUpdated: formatDateTime(latestData.timestamp),
            timestamp: latestData.timestamp
          };
        }).filter(Boolean);

        setCowStats(calculatedCowStats);

        // Generate alerts
        const newAlerts: AlertItem[] = [];
        calculatedCowStats.forEach(cow => {
          if (!cow) return;

          if (cow.temperature > 39) {
            newAlerts.push({
              id: `temp-high-${cow.cowId}`,
              type: 'temperature' as const,
              cowId: cow.cowId,
              cowName: cowNames[cow.cowId] || cow.cowId,
              value: cow.temperature,
              message: `High Temperature Detected - ${cowNames[cow.cowId] || cow.cowId}`,
              severity: 'critical' as const,
              timestamp: new Date(cow.timestamp * 1000)
            });
          }

          if (cow.activity > 15000) {
            newAlerts.push({
              id: `activity-high-${cow.cowId}`,
              type: 'activity' as const,
              cowId: cow.cowId,
              cowName: cowNames[cow.cowId] || cow.cowId,
              value: cow.activity,
              message: `Unusually High Activity - ${cowNames[cow.cowId] || cow.cowId}`,
              severity: 'warning' as const,
              timestamp: new Date(cow.timestamp * 1000)
            });
          } else if (cow.activity < 5000) {
            newAlerts.push({
              id: `activity-low-${cow.cowId}`,
              type: 'activity' as const,
              cowId: cow.cowId,
              cowName: cowNames[cow.cowId] || cow.cowId,
              value: cow.activity,
              message: `Low Activity Detected - ${cowNames[cow.cowId] || cow.cowId}`,
              severity: 'warning' as const,
              timestamp: new Date(cow.timestamp * 1000)
            });
          }
        });

        const healthyCows = calculatedCowStats.filter(c => c?.isHealthy).length;

        setStats({
          totalCows: cowsList.length,
          healthyCows,
          alerts: newAlerts.length
        });

        setAlerts(newAlerts);
      }
    });

    return () => unsubscribe();
  }, [selectedCowId, cowNames, useMockData]);

  const filteredCows = cowStats.filter(cow => {
    const searchLower = searchTerm.toLowerCase();
    const matchesId = cow.cowId.toLowerCase().includes(searchLower);
    const matchesName = (cowNames[cow.cowId] || '').toLowerCase().includes(searchLower);
    const matchesSearch = matchesId || matchesName;
    
    if (filterType === 'healthy') {
      return matchesSearch && cow.isHealthy;
    } else if (filterType === 'alerts') {
      return matchesSearch && !cow.isHealthy;
    }
    return matchesSearch;
  });

  const getHealthBadge = (isHealthy: boolean) => {
    return isHealthy ? (
      <Badge variant="default" className="capitalize">Healthy</Badge>
    ) : (
      <Badge variant="destructive" className="capitalize">Alert</Badge>
    );
  };

  const handleCowSelect = (cowId: string) => {
    if (selectedCowId === cowId) {
      setSelectedCowId(null);
    } else {
      setSelectedCowId(cowId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Real-time cattle health monitoring</p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdated.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          )}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {(filterType !== 'all' || selectedCowId) && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterType !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filterType === 'healthy' ? 'Healthy Cows' : 'Active Alerts'}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setFilterType('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedCowId && (
            <Badge variant="outline" className="gap-1">
              Viewing: {cowNames[selectedCowId] || selectedCowId}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSelectedCowId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cows</p>
              <h3 className="mt-2 text-3xl font-bold text-foreground">{stats.totalCows}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer"
          onClick={() => setFilterType(filterType === 'healthy' ? 'all' : 'healthy')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Healthy</p>
              <h3 className="mt-2 text-3xl font-bold text-primary">{stats.healthyCows}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Click to filter</p>
        </Card>

        <Card 
          className="p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer"
          onClick={() => setFilterType(filterType === 'alerts' ? 'all' : 'alerts')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
              <h3 className="mt-2 text-3xl font-bold text-destructive">{stats.alerts}</h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Click to filter</p>
        </Card>
      </div>

      {/* Cow selection grid */}
      {filteredCows.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {filterType === 'healthy' ? 'Healthy Cows' : filterType === 'alerts' ? 'Cows with Active Alerts' : 'All Cows'}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCows.map((cow) => (
              <div 
                key={cow.cowId} 
                className={`flex flex-col gap-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCowId === cow.cowId 
                    ? 'bg-primary/20 ring-2 ring-primary' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => handleCowSelect(cow.cowId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Beef className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {cowNames[cow.cowId] || cow.cowId}
                      </p>
                      {cowNames[cow.cowId] && (
                        <p className="text-xs text-muted-foreground">ID: {cow.cowId}</p>
                      )}
                    </div>
                  </div>
                  {getHealthBadge(cow.isHealthy)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {cow.temperature.toFixed(1)}°C | Activity: {cow.activity}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {cow.lastUpdated}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Temperature Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Temperature Trends {selectedCowId && `- ${cowNames[selectedCowId] || selectedCowId}`}
        </h3>
        <TempChart data={chartData.temperature} />
      </Card>
    </div>
  );
};

export default DashboardPage;
