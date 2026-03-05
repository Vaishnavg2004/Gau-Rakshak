import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Beef, ArrowLeft, Edit2, Save, Clock } from 'lucide-react';
import { TempChart } from '@/components/charts/TempChart';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { Cow3DViewer } from '@/components/Cow3DViewer';
import { toast } from 'sonner';
import { mockCowsRealtime } from '@/lib/mockData';

interface Cow {
  id: string;
  name: string;
  temperature: number;
  activity: number;
  health: 'healthy' | 'warning' | 'critical';
  accelData: { x: number; y: number; z: number };
  gyroData: { x: number; y: number; z: number };
  lastUpdated: string;
  timestamp: number;
}

interface CowNames {
  [key: string]: string;
}

interface SensorDataPoint {
  AcX?: number;
  AcY?: number;
  AcZ?: number;
  GyX?: number;
  GyY?: number;
  GyZ?: number;
  DS18B20_Temp?: number;
  MPU_Temp?: number;
  timestamp: number;
}

interface CowRecord {
  history?: Record<string, SensorDataPoint>;
}

interface ChartTempPoint {
  time: string;
  temperature: number;
  fullDateTime: string;
}

interface ChartActivityPoint {
  time: string;
  accelerometer: number;
  gyroscope: number;
  activity: number;
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

const getHealthBadge = (health: Cow['health']) => {
  const variants = {
    healthy: 'default',
    warning: 'secondary',
    critical: 'destructive',
  } as const;

  return (
    <Badge variant={variants[health]} className="capitalize">
      {health}
    </Badge>
  );
};

const CowsPage = () => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
  const [searchTerm, setSearchTerm] = useState('');
  const [cows, setCows] = useState<Cow[]>([]);
  const [cowNames, setCowNames] = useState<CowNames>({});
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);
  const [cowChartData, setCowChartData] = useState<{
    temperature: ChartTempPoint[];
    activity: ChartActivityPoint[];
  }>({
    temperature: [],
    activity: []
  });
  const [sensorData, setSensorData] = useState<SensorDataPoint | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load cow names from localStorage
  useEffect(() => {
    const savedNames = localStorage.getItem('cowNames');
    if (savedNames) {
      setCowNames(JSON.parse(savedNames));
    }
  }, []);

  // Save cow names to localStorage
  const saveCowName = (cowId: string, name: string) => {
    const updatedNames = { ...cowNames, [cowId]: name };
    setCowNames(updatedNames);
    localStorage.setItem('cowNames', JSON.stringify(updatedNames));
    toast.success('Cow name saved successfully');
    setIsEditDialogOpen(false);
  };

  useEffect(() => {
    if (useMockData) {
      const data = mockCowsRealtime;
      const cowsList = Object.keys(data).map(cowId => {
        const cowHistory = data[cowId]?.history;
        if (!cowHistory) return null;
        const dataArray = Object.values(cowHistory) as SensorDataPoint[];
        if (dataArray.length === 0) return null;

        const latestData = dataArray.sort((a, b) => b.timestamp - a.timestamp)[0];
        const acX = latestData.AcX ?? 0;
        const acY = latestData.AcY ?? 0;
        const acZ = latestData.AcZ ?? 0;
        const gyX = latestData.GyX ?? 0;
        const gyY = latestData.GyY ?? 0;
        const gyZ = latestData.GyZ ?? 0;
        const accelMagnitude = Math.sqrt(acX ** 2 + acY ** 2 + acZ ** 2);
        const gyroMagnitude = Math.sqrt(gyX ** 2 + gyY ** 2 + gyZ ** 2);
        const activity = Math.round((accelMagnitude + gyroMagnitude) / 2);

        let health: 'healthy' | 'warning' | 'critical' = 'healthy';
        if ((latestData.DS18B20_Temp ?? 0) > 39 || activity > 15000) health = 'critical';
        else if ((latestData.DS18B20_Temp ?? 0) > 38 || activity < 5000) health = 'warning';

        return {
          id: cowId,
          name: cowNames[cowId] || '',
          temperature: latestData.DS18B20_Temp ?? 0,
          activity,
          health,
          accelData: { x: acX, y: acY, z: acZ },
          gyroData: { x: gyX, y: gyY, z: gyZ },
          lastUpdated: formatDateTime(latestData.timestamp),
          timestamp: latestData.timestamp,
        };
      }).filter((item): item is Cow => item !== null);

      setCows(cowsList);

      if (selectedCowId && data[selectedCowId]?.history) {
        const selectedCowData = data[selectedCowId].history;
        const dataArray = Object.values(selectedCowData) as SensorDataPoint[];
        const sortedData = dataArray.sort((a, b) => a.timestamp - b.timestamp).slice(-20);

        setCowChartData({
          temperature: sortedData.map((item) => ({
            time: formatChartTime(item.timestamp),
            temperature: item.DS18B20_Temp ?? 0,
            fullDateTime: formatDateTime(item.timestamp),
          })),
          activity: sortedData.map((item) => {
            const accelMagnitude = Math.sqrt((item.AcX ?? 0) ** 2 + (item.AcY ?? 0) ** 2 + (item.AcZ ?? 0) ** 2);
            const gyroMagnitude = Math.sqrt((item.GyX ?? 0) ** 2 + (item.GyY ?? 0) ** 2 + (item.GyZ ?? 0) ** 2);
            return {
              time: formatChartTime(item.timestamp),
              accelerometer: Math.round(accelMagnitude),
              gyroscope: Math.round(gyroMagnitude),
              activity: Math.round((accelMagnitude + gyroMagnitude) / 2),
              fullDateTime: formatDateTime(item.timestamp),
            };
          }),
        });

        const latestPoint = sortedData[sortedData.length - 1];
        if (latestPoint) {
          setSensorData({
            AcX: latestPoint.AcX || 0,
            AcY: latestPoint.AcY || 0,
            AcZ: latestPoint.AcZ || 0,
            GyX: latestPoint.GyX || 0,
            GyY: latestPoint.GyY || 0,
            GyZ: latestPoint.GyZ || 0,
            DS18B20_Temp: latestPoint.DS18B20_Temp || 0,
            MPU_Temp: latestPoint.MPU_Temp || 0,
            timestamp: latestPoint.timestamp,
          });
        }
      }
      return;
    }

    const cowsRef = ref(database, 'cows');
    
    const unsubscribe = onValue(cowsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, CowRecord> | null;
      
      if (data) {
        const cowsList = Object.keys(data).map(cowId => {
          const cowHistory = data[cowId]?.history;
          if (!cowHistory) return null;
          const dataArray = Object.values(cowHistory) as SensorDataPoint[];
          
          if (dataArray.length === 0) return null;

          // Get latest data point
          const latestData = dataArray.sort((a, b) => b.timestamp - a.timestamp)[0];
          
          // Calculate activity
          const acX = latestData.AcX ?? 0;
          const acY = latestData.AcY ?? 0;
          const acZ = latestData.AcZ ?? 0;
          const gyX = latestData.GyX ?? 0;
          const gyY = latestData.GyY ?? 0;
          const gyZ = latestData.GyZ ?? 0;
          const accelMagnitude = Math.sqrt(acX ** 2 + acY ** 2 + acZ ** 2);
          const gyroMagnitude = Math.sqrt(gyX ** 2 + gyY ** 2 + gyZ ** 2);
          const activity = Math.round((accelMagnitude + gyroMagnitude) / 2);
          
          // Determine health status
          let health: 'healthy' | 'warning' | 'critical' = 'healthy';
          if (latestData.DS18B20_Temp > 39 || activity > 15000) {
            health = 'critical';
          } else if (latestData.DS18B20_Temp > 38 || activity < 5000) {
            health = 'warning';
          }

          return {
            id: cowId,
            name: cowNames[cowId] || '',
            temperature: latestData.DS18B20_Temp ?? 0,
            activity,
            health,
            accelData: { x: acX, y: acY, z: acZ },
            gyroData: { x: gyX, y: gyY, z: gyZ },
            lastUpdated: formatDateTime(latestData.timestamp),
            timestamp: latestData.timestamp
          };
        }).filter(Boolean) as Cow[];

        setCows(cowsList);

        // If a cow is selected, prepare chart data for that cow
        if (selectedCowId && data[selectedCowId]?.history) {
          const selectedCowData = data[selectedCowId].history;
          const dataArray = Object.values(selectedCowData) as SensorDataPoint[];
          
          // Sort by timestamp and take last 20 entries
          const sortedData = dataArray.sort((a, b) => a.timestamp - b.timestamp).slice(-20);

          // Transform data for temperature chart
          const tempData = sortedData.map((item) => ({
            time: formatChartTime(item.timestamp),
            temperature: item.DS18B20_Temp,
            fullDateTime: formatDateTime(item.timestamp)
          }));

          // Transform data for activity chart
          const activityData = sortedData.map((item) => {
            const accelMagnitude = Math.sqrt((item.AcX ?? 0) ** 2 + (item.AcY ?? 0) ** 2 + (item.AcZ ?? 0) ** 2);
            const gyroMagnitude = Math.sqrt((item.GyX ?? 0) ** 2 + (item.GyY ?? 0) ** 2 + (item.GyZ ?? 0) ** 2);
            return {
              time: formatChartTime(item.timestamp),
              accelerometer: Math.round(accelMagnitude),
              gyroscope: Math.round(gyroMagnitude),
              activity: Math.round((accelMagnitude + gyroMagnitude) / 2),
              fullDateTime: formatDateTime(item.timestamp)
            };
          });

          setCowChartData({
            temperature: tempData,
            activity: activityData
          });

          // Set latest raw sensor data for 3D viewer
          const latestPoint = sortedData[sortedData.length - 1];
          if (latestPoint) {
            setSensorData({
              AcX: latestPoint.AcX || 0,
              AcY: latestPoint.AcY || 0,
              AcZ: latestPoint.AcZ || 0,
              GyX: latestPoint.GyX || 0,
              GyY: latestPoint.GyY || 0,
              GyZ: latestPoint.GyZ || 0,
              DS18B20_Temp: latestPoint.DS18B20_Temp || 0,
              MPU_Temp: latestPoint.MPU_Temp || 0,
            });
          }
        }
      }
    });

    return () => unsubscribe();
  }, [selectedCowId, cowNames, useMockData]);

  const filteredCows = cows.filter(cow => {
    const searchLower = searchTerm.toLowerCase();
    const matchesId = cow.id.toLowerCase().includes(searchLower);
    const matchesName = cow.name.toLowerCase().includes(searchLower);
    return matchesId || matchesName;
  });

  // If a cow is selected, show detailed view with charts
  if (selectedCowId) {
    const selectedCow = cows.find(c => c.id === selectedCowId);
    const displayName = cowNames[selectedCowId] || selectedCowId;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSelectedCowId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">
                {cowNames[selectedCowId] ? cowNames[selectedCowId] : selectedCowId}
              </h2>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditingName(cowNames[selectedCowId] || '')}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Cow Name</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Cow ID</Label>
                      <Input value={selectedCowId} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Cow Name</Label>
                      <Input 
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Enter cow name..."
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => saveCowName(selectedCowId, editingName)}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Name
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-muted-foreground">
              {cowNames[selectedCowId] && <span className="text-sm">ID: {selectedCowId} • </span>}
              Real-time monitoring and analytics
            </p>
          </div>
        </div>

        {selectedCow && (
          <Card className="p-6 shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Beef className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {cowNames[selectedCowId] || selectedCow.id}
                  </h3>
                  {cowNames[selectedCowId] && (
                    <p className="text-xs text-muted-foreground">ID: {selectedCow.id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Current Status</p>
                </div>
              </div>
              {getHealthBadge(selectedCow.health)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="rounded-lg bg-muted p-3">
                <span className="text-xs text-muted-foreground">Temperature</span>
                <p className="text-lg font-semibold text-foreground">{selectedCow.temperature.toFixed(2)}°C</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <span className="text-xs text-muted-foreground">Activity Level</span>
                <p className="text-lg font-semibold text-foreground">{selectedCow.activity}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <span className="text-xs text-muted-foreground">Accelerometer</span>
                <p className="text-xs font-medium text-foreground">
                  X: {selectedCow.accelData.x} | Y: {selectedCow.accelData.y} | Z: {selectedCow.accelData.z}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <span className="text-xs text-muted-foreground">Gyroscope</span>
                <p className="text-xs font-medium text-foreground">
                  X: {selectedCow.gyroData.x} | Y: {selectedCow.gyroData.y} | Z: {selectedCow.gyroData.z}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last data received: {selectedCow.lastUpdated}
            </div>
          </Card>
        )}

        {/* 3D Cow Visualization */}
        <Cow3DViewer 
          sensorData={sensorData} 
          cowId={selectedCowId} 
          cowName={cowNames[selectedCowId]} 
        />

        {/* Temperature Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Temperature History</h3>
          <TempChart data={cowChartData.temperature} />
        </Card>

        {/* Activity Chart */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Activity History</h3>
          <ActivityChart data={cowChartData.activity} />
        </Card>
      </div>
    );
  }

  // Default grid view
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cattle Inventory</h2>
          <p className="text-muted-foreground">Monitor individual cow health status</p>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCows.map((cow) => (
          <Card 
            key={cow.id} 
            className="p-6 shadow-card transition-all hover:shadow-elevated cursor-pointer"
            onClick={() => setSelectedCowId(cow.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Beef className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {cowNames[cow.id] || cow.id}
                  </h3>
                  {cowNames[cow.id] && (
                    <p className="text-xs text-muted-foreground">ID: {cow.id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Click to view details</p>
                </div>
              </div>
              {getHealthBadge(cow.health)}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Temperature:</span>
                <span className="text-sm font-medium text-foreground">{cow.temperature.toFixed(2)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Activity Level:</span>
                <span className="text-sm font-medium text-foreground">{cow.activity}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {cow.lastUpdated}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCows.length === 0 && (
        <div className="text-center py-12">
          <Beef className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No cows found matching your search</p>
        </div>
      )}
    </div>
  );
};

export default CowsPage;
