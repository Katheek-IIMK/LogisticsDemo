'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

interface AgentReasonCardProps {
  agentName: string;
  decision: string;
  reasoning: string[];
  factors: {
    timeCost?: string;
    fuelDelta?: string;
    driverHours?: string;
    equipmentMatch?: string;
    compliance?: string;
  };
}

export function AgentReasonCard({ agentName, decision, reasoning, factors }: AgentReasonCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {agentName} Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs font-medium mb-2 text-muted-foreground">{decision}</div>
        <ul className="text-xs space-y-1 mb-3">
          {reasoning.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-2 mt-2">
          <div className="text-xs font-medium mb-1 text-muted-foreground">Factors Considered:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {factors.timeCost && <div>⏱ Time: {factors.timeCost}</div>}
            {factors.fuelDelta && <div>⛽ Fuel: {factors.fuelDelta}</div>}
            {factors.driverHours && <div>👤 Driver: {factors.driverHours}</div>}
            {factors.equipmentMatch && <div>🚛 Equipment: {factors.equipmentMatch}</div>}
            {factors.compliance && <div>✓ Compliance: {factors.compliance}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


