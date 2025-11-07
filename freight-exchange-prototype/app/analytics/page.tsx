'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const timeSeriesData = [
  { month: 'Jan', emptyMiles: 38, utilization: 65, co2: 1000 },
  { month: 'Feb', emptyMiles: 36, utilization: 67, co2: 1100 },
  { month: 'Mar', emptyMiles: 35, utilization: 68, co2: 1200 },
  { month: 'Apr', emptyMiles: 32, utilization: 70, co2: 1250 },
  { month: 'May', emptyMiles: 30, utilization: 72, co2: 1300 },
  { month: 'Jun', emptyMiles: 28, utilization: 75, co2: 1350 },
];

const roiData = [
  { category: 'Revenue', value: 450000 },
  { category: 'Cost Savings', value: 125000 },
  { category: 'CO₂ Credits', value: 35000 },
];

export default function AnalyticsPage() {
  const [disruptionSimulated, setDisruptionSimulated] = useState(false);
  const kpis = useAppStore((state) => state.kpis);

  const handleSimulateDisruption = () => {
    setDisruptionSimulated(true);
    setTimeout(() => {
      setDisruptionSimulated(false);
    }, 5000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <Button
          variant="outline"
          onClick={handleSimulateDisruption}
          disabled={disruptionSimulated}
        >
          {disruptionSimulated ? 'Simulating...' : 'Simulate Disruption'}
        </Button>
      </div>

      {disruptionSimulated && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-6"
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-semibold">Port Delay Detected</div>
                  <div className="text-sm text-muted-foreground">
                    AI agents proposing alternate route: Mumbai→Pune→Bangalore (estimated delay: 2 hours)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Series Analysis</CardTitle>
            <CardDescription>Monthly trends for key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="emptyMiles"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Empty Miles %"
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Utilization %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CO₂ Savings</CardTitle>
              <CardDescription>Monthly CO₂ reduction (kg)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="co2"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="CO₂ Saved (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI Breakdown</CardTitle>
              <CardDescription>Revenue and savings analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Empty Mile Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(kpis.emptyMileRatio * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Target: &lt;25%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(kpis.utilization * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Target: &gt;80%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total CO₂ Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {kpis.co2Saved.toLocaleString()} kg
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                This month
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

