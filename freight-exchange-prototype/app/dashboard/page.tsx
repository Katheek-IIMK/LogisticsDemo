'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { TrendingDown, TrendingUp, Leaf, DollarSign, Filter, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const kpiData = {
  week: [
    { name: 'Week 1', emptyMiles: 35, utilization: 68 },
    { name: 'Week 2', emptyMiles: 32, utilization: 71 },
    { name: 'Week 3', emptyMiles: 30, utilization: 73 },
    { name: 'Week 4', emptyMiles: 28, utilization: 75 },
  ],
  month: [
    { name: 'Jan', emptyMiles: 38, utilization: 65 },
    { name: 'Feb', emptyMiles: 36, utilization: 67 },
    { name: 'Mar', emptyMiles: 35, utilization: 68 },
    { name: 'Apr', emptyMiles: 32, utilization: 70 },
  ],
  quarter: [
    { name: 'Q1', emptyMiles: 36, utilization: 67 },
    { name: 'Q2', emptyMiles: 32, utilization: 71 },
    { name: 'Q3', emptyMiles: 30, utilization: 73 },
    { name: 'Q4', emptyMiles: 28, utilization: 75 },
  ],
};

export default function DashboardPage() {
  const kpis = useAppStore((state) => state.kpis);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    fleet: 'all',
    region: 'all',
  });

  const chartData = kpiData[timeRange];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <div className="flex items-center gap-2 border rounded-md">
            <Button
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
            <Button
              variant={timeRange === 'quarter' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('quarter')}
            >
              Quarter
            </Button>
          </div>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fleet</label>
                <select
                  value={selectedFilters.fleet}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, fleet: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Fleets</option>
                  <option value="fleet1">Fleet 1</option>
                  <option value="fleet2">Fleet 2</option>
                  <option value="fleet3">Fleet 3</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Region</label>
                <select
                  value={selectedFilters.region}
                  onChange={(e) => setSelectedFilters({ ...selectedFilters, region: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="all">All Regions</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empty Mile Ratio</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                key={kpis.emptyMileRatio}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {(kpis.emptyMileRatio * 100).toFixed(1)}%
              </motion.div>
              <p className="text-xs text-muted-foreground">
                -2.5% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                key={kpis.utilization}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {(kpis.utilization * 100).toFixed(1)}%
              </motion.div>
              <p className="text-xs text-muted-foreground">
                +3.2% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                key={kpis.co2Saved}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                {kpis.co2Saved.toLocaleString()} kg
              </motion.div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Ton-Km</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                key={kpis.avgRevenuePerTonKm}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold"
              >
                ₹{kpis.avgRevenuePerTonKm}
              </motion.div>
              <p className="text-xs text-muted-foreground">
                +₹2.5 from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Empty Miles Trend</CardTitle>
            <CardDescription>Weekly empty mile ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="emptyMiles" stroke="#8884d8" name="Empty Miles %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization Trend</CardTitle>
            <CardDescription>
              {timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Quarterly'} utilization percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" fill="#82ca9d" name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

