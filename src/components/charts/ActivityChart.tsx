import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface ActivityChartProps {
  data: Array<{
    time: string;
    accelerometer: number;
    gyroscope: number;
    activity: number;
  }>;
}

export const ActivityChart = ({ data }: ActivityChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Activity Level</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar 
            dataKey="accelerometer" 
            fill="hsl(var(--chart-2))" 
            radius={[8, 8, 0, 0]}
            name="Accelerometer"
          />
          <Bar 
            dataKey="gyroscope" 
            fill="hsl(var(--chart-3))" 
            radius={[8, 8, 0, 0]}
            name="Gyroscope"
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
