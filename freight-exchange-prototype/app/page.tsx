'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Users, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const setRole = useAppStore((state) => state.setRole);

  const roles = [
    {
      id: 'load-owner' as const,
      title: 'Load Owner',
      description: 'Post loads and find optimal carriers',
      icon: Truck,
      href: '/load-owner',
    },
    {
      id: 'fleet-manager' as const,
      title: 'Fleet Manager',
      description: 'Manage fleet operations and optimize routes',
      icon: Users,
      href: '/fleet-manager',
    },
    {
      id: 'driver' as const,
      title: 'Driver',
      description: 'View assigned trips and track deliveries',
      icon: User,
      href: '/driver',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Federated AI Freight Exchange
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered platform for optimizing backhaul freight management.
            Reduce empty miles, increase utilization, and maximize revenue with
            intelligent route matching and agent-based negotiation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <Icon className="h-12 w-12 mb-4 text-primary" />
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={role.href}>
                    <Button
                      className="w-full"
                      onClick={() => setRole(role.id)}
                    >
                      Enter Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Matchmaking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Intelligent route synthesis and feasibility scoring
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Negotiation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automated negotiation with transparent reasoning
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Live KPIs and performance tracking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
