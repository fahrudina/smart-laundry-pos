import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, CheckCircle2, Circle, ArrowRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  onClick: () => void;
}

export interface QuickAction {
  id: string;
  title: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface MobileHomeViewProps {
  greeting: string;
  greetingName: string;
  storeName: string;
  storeAddress?: string;
  isLoadingData: boolean;
  todayIncome: number;
  todayIncomeChange: number;
  todayExpenses: number;
  formatCurrency: (amount: number) => string;
  showOnboarding: boolean;
  onboardingSteps: OnboardingStep[];
  completedSteps: number;
  totalSteps: number;
  onCreateOrder: () => void;
  gridActions: QuickAction[];
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  greeting,
  greetingName,
  storeName,
  storeAddress,
  isLoadingData,
  todayIncome,
  todayIncomeChange,
  todayExpenses,
  formatCurrency,
  showOnboarding,
  onboardingSteps,
  completedSteps,
  totalSteps,
  onCreateOrder,
  gridActions,
}) => {
  return (
    <div>
      {/* Hero: edge-to-edge via negative margins canceling AppLayout's padding */}
      <div className="relative -mx-4 -mt-4 overflow-hidden rounded-b-[2rem] bg-gradient-primary px-5 pt-8 pb-10 text-primary-foreground shadow-medium sm:-mx-6 sm:-mt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-8 border-primary-foreground/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 top-2 h-24 w-24 rounded-full border-4 border-primary-foreground/15"
        />

        <p className="text-sm text-primary-foreground/80">{greeting}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{greetingName}</h1>
        <p className="mt-3 truncate text-sm text-primary-foreground/90">{storeName}</p>
        {storeAddress && (
          <p className="truncate text-xs text-primary-foreground/70">{storeAddress}</p>
        )}
      </div>

      <div className="relative -mt-6 space-y-4 px-4">
        {showOnboarding ? (
          <Card className="border-0 shadow-medium">
            <CardContent className="p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Mulai Cepat</h3>
                <span className="text-xs font-medium text-primary">
                  {completedSteps}/{totalSteps} selesai
                </span>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Selesaikan langkah berikut untuk mulai menerima pesanan.
              </p>

              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>

              <div className="space-y-1">
                {onboardingSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={step.onClick}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted active:scale-[0.99]"
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-pos-success" />
                    ) : (
                      <Circle className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          step.done ? 'text-muted-foreground line-through' : 'text-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      {!step.done && (
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      )}
                    </div>
                    {!step.done && <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                  </button>
                ))}
              </div>

              <Button onClick={onCreateOrder} variant="pos" className="mt-4 w-full">
                <Plus className="mr-1 h-4 w-4" />
                Buat Pesanan Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-medium">
            <CardContent className="grid grid-cols-2 divide-x divide-border p-4">
              <div className="pr-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-muted-foreground">Pendapatan Hari Ini</p>
                  <TrendingUp className="h-4 w-4 text-pos-success" />
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {isLoadingData ? '...' : formatCurrency(todayIncome)}
                </p>
                {todayIncomeChange !== 0 && (
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      todayIncomeChange >= 0 ? 'text-pos-success' : 'text-destructive'
                    )}
                  >
                    {todayIncomeChange >= 0 ? '↑' : '↓'} {Math.abs(todayIncomeChange)}% dari kemarin
                  </p>
                )}
              </div>

              <div className="pl-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-muted-foreground">Pengeluaran Hari Ini</p>
                  <TrendingDown className="h-4 w-4 text-pos-warning" />
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {isLoadingData ? '...' : formatCurrency(todayExpenses)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!showOnboarding && (
          <Button onClick={onCreateOrder} variant="pos" size="lg" className="w-full rounded-2xl">
            <Plus className="h-5 w-5" />
            Buat Pesanan Baru
          </Button>
        )}

        <div className="grid grid-cols-3 gap-3">
          {gridActions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-medium active:scale-95"
            >
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-pos-highlight/40">
                <action.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-center text-xs font-medium leading-tight text-foreground">
                {action.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
