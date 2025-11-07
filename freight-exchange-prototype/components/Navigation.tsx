'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, BarChart3, Handshake, FileCheck, TrendingUp, User, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

const getNavItems = (role: string | null) => {
  const baseItems = [
    { href: '/', label: 'Home', icon: Home },
  ];

  if (role === 'load-owner') {
    return [
      ...baseItems,
      { href: '/load-owner', label: 'Load Owner Workspace', icon: Truck },
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    ];
  } else if (role === 'fleet-manager') {
    return [
      ...baseItems,
      { href: '/fleet-manager', label: 'Fleet Manager Workspace', icon: Truck },
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    ];
  } else if (role === 'driver') {
    return [
      ...baseItems,
      { href: '/driver', label: 'Driver Workspace', icon: User },
    ];
  }

  // Default navigation when no role selected
  return [
    ...baseItems,
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/matchmaking', label: 'Matchmaking', icon: Truck },
    { href: '/negotiation', label: 'Negotiation', icon: Handshake },
    { href: '/execution', label: 'Execution', icon: FileCheck },
    { href: '/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/driver', label: 'Driver', icon: User },
  ];
};

export function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const selectedRole = useAppStore((state) => state.selectedRole);
  
  // Prevent hydration mismatch by only using role after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use null role during SSR to ensure consistent initial render
  const navItems = getNavItems(mounted ? selectedRole : null);

  return (
    <nav className="border-b bg-background" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-8">
          <Link href="/" className="text-xl font-bold" aria-label="Freight Exchange Home">
            Freight Exchange
          </Link>
          <div className="flex space-x-4" role="menubar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

