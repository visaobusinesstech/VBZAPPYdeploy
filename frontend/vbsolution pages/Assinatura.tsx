import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const defaultPlans = [
  { key: 'basic', name: 'Plano Básico', limit: 5, url: 'https://pay.cakto.com.br/yfsvcpc' },
  { key: 'pro', name: 'Plano Pro', limit: 10, url: 'https://pay.cakto.com.br/3ektfrr' },
  { key: 'business', name: 'Plano Business', limit: 15, url: 'https://pay.cakto.com.br/fnxpsti_416689' },
  { key: 'enterprise', name: 'Plano Enterprise', limit: 30, url: 'https://pay.cakto.com.br/dtkq7nr' },
  { key: 'corporate', name: 'Plano Corporate', limit: 40, url: 'https://pay.cakto.com.br/7iobe8j' },
  { key: 'custom', name: 'Plano Custom', limit: null, url: '' },
];

export default function Assinatura() {
  const [plans, setPlans] = useState(defaultPlans);
  const availablePlans = useMemo(() => plans, [plans]);

  useEffect(() => {
    let mounted = true;
    const loadPlans = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'subscription_plans')
          .maybeSingle();
        const value = Array.isArray(data?.value) ? data?.value : null;
        if (mounted && value) {
          setPlans(value.map((p: any) => ({
            key: p.key,
            name: p.name,
            limit: p.limit ?? null,
            url: p.url ?? '',
            active: p.active ?? true
          })).filter((p: any) => p.active !== false));
        }
      } catch (e) {
        setPlans(defaultPlans);
      }
    };
    loadPlans();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Selecione um plano para habilitar o acesso.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availablePlans.map((plan) => (
          <Card key={plan.key}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  {plan.limit !== null ? (
                    <span>Limite de usuários: {plan.limit}</span>
                  ) : (
                    <span>Limite de usuários: configurável</span>
                  )}
                </div>
                {plan.url ? (
                  <Button asChild className="vb-button-primary w-full">
                    <a href={plan.url} target="_blank" rel="noopener noreferrer">Assinar</a>
                  </Button>
                ) : (
                  <Button disabled className="w-full">Indisponível</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
