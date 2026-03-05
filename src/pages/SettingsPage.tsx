import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, Bell, Database, Save, CheckCircle } from 'lucide-react';

interface AppSettings {
  tempAlertEnabled: boolean;
  tempThreshold: number;
  activityAlertEnabled: boolean;
  activityThresholdLow: number;
  activityThresholdHigh: number;
  firebaseApiKey: string;
  firebaseDatabaseURL: string;
  firebaseProjectId: string;
  firebaseAuthDomain: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>({
    tempAlertEnabled: true,
    tempThreshold: 39.0,
    activityAlertEnabled: true,
    activityThresholdLow: 5000,
    activityThresholdHigh: 15000,
    firebaseApiKey: 'AIzaSyDbi8r5PT1V91oiGvTjjniZkoalYbGGTAA',
    firebaseDatabaseURL: 'https://cowfit-demo-d2364-default-rtdb.firebaseio.com',
    firebaseProjectId: 'cowfit-demo-d2364',
    firebaseAuthDomain: 'cowfit-demo-d2364.firebaseapp.com',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const checkFirebaseConnection = useCallback(async (databaseURL: string): Promise<boolean> => {
    setFirebaseStatus('checking');
    try {
      const response = await fetch(`${databaseURL}/.json?shallow=true`);
      if (response.ok) {
        setFirebaseStatus('connected');
        return true;
      } else {
        setFirebaseStatus('disconnected');
        return false;
      }
    } catch {
      setFirebaseStatus('disconnected');
      return false;
    }
  }, []);

  // Load settings from localStorage safely
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (!savedSettings) return;

    try {
      const parsed = JSON.parse(savedSettings) as Partial<AppSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      localStorage.removeItem('appSettings');
      toast.error('Invalid saved settings were reset.');
    }
  }, []);

  // Re-check connection when DB URL changes
  useEffect(() => {
    void checkFirebaseConnection(settings.firebaseDatabaseURL);
  }, [settings.firebaseDatabaseURL, checkFirebaseConnection]);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setIsSaved(true);
    toast.success('Settings saved successfully!');
    
    // Reset saved indicator after 2 seconds
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    toast.loading('Testing Firebase connection...');
    const isConnected = await checkFirebaseConnection(settings.firebaseDatabaseURL);

    if (isConnected) {
      toast.success('Firebase connection successful!');
    } else {
      toast.error('Firebase connection failed. Please check your configuration.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Configure alerts and system preferences</p>
      </div>

      {/* Alert Configuration Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Alert Configuration</h3>
        </div>

        <div className="space-y-6">
          {/* Temperature Alerts */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="temp-alert" className="text-foreground font-medium">Temperature Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when temperature exceeds threshold</p>
              </div>
              <Switch
                id="temp-alert"
                checked={settings.tempAlertEnabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, tempAlertEnabled: checked })
                }
              />
            </div>
            {settings.tempAlertEnabled && (
              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="temp-threshold" className="text-foreground">High Temperature Threshold (°C)</Label>
                <Input
                  id="temp-threshold"
                  type="number"
                  step="0.1"
                  min="35"
                  max="45"
                  value={settings.tempThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, tempThreshold: parseFloat(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">Normal cow temperature: 38.0°C - 39.0°C</p>
              </div>
            )}
          </div>

          {/* Activity Alerts */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="activity-alert" className="text-foreground font-medium">Activity Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when activity is abnormally low or high</p>
              </div>
              <Switch
                id="activity-alert"
                checked={settings.activityAlertEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, activityAlertEnabled: checked })
                }
              />
            </div>
            {settings.activityAlertEnabled && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="activity-low" className="text-foreground">Low Activity Threshold</Label>
                  <Input
                    id="activity-low"
                    type="number"
                    min="0"
                    value={settings.activityThresholdLow}
                    onChange={(e) =>
                      setSettings({ ...settings, activityThresholdLow: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when activity falls below this value</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity-high" className="text-foreground">High Activity Threshold</Label>
                  <Input
                    id="activity-high"
                    type="number"
                    min="0"
                    value={settings.activityThresholdHigh}
                    onChange={(e) =>
                      setSettings({ ...settings, activityThresholdHigh: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Alert when activity exceeds this value</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Firebase Configuration Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Firebase Configuration</h3>
          </div>
          <div className="flex items-center gap-2">
            {firebaseStatus === 'checking' && (
              <span className="text-sm text-muted-foreground">Checking...</span>
            )}
            {firebaseStatus === 'connected' && (
              <span className="flex items-center gap-1 text-sm text-primary">
                <CheckCircle className="h-4 w-4" />
                Connected
              </span>
            )}
            {firebaseStatus === 'disconnected' && (
              <span className="text-sm text-destructive">Disconnected</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-foreground">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Firebase API key"
              value={settings.firebaseApiKey}
              onChange={(e) =>
                setSettings({ ...settings, firebaseApiKey: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="auth-domain" className="text-foreground">Auth Domain</Label>
            <Input
              id="auth-domain"
              placeholder="your-project.firebaseapp.com"
              value={settings.firebaseAuthDomain}
              onChange={(e) =>
                setSettings({ ...settings, firebaseAuthDomain: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="db-url" className="text-foreground">Database URL</Label>
            <Input
              id="db-url"
              placeholder="https://your-project.firebaseio.com"
              value={settings.firebaseDatabaseURL}
              onChange={(e) =>
                setSettings({ ...settings, firebaseDatabaseURL: e.target.value })
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-id" className="text-foreground">Project ID</Label>
            <Input
              id="project-id"
              placeholder="your-project-id"
              value={settings.firebaseProjectId}
              onChange={(e) =>
                setSettings({ ...settings, firebaseProjectId: e.target.value })
              }
            />
          </div>

          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            className="mt-2"
          >
            Test Connection
          </Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" className="gap-2">
          {isSaved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
