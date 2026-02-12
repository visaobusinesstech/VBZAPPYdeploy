import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Key, Building2, CheckCircle, Eye, EyeOff, Copy } from 'lucide-react';

export default function AdminOnboarding() {
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ company_id?: string; user_id?: string } | null>(null);

  const getPasswordStrength = () => {
    const v = password || '';
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score;
  };
  const strengthText = ['Muito fraca', 'Fraca', 'Ok', 'Boa', 'Forte', 'Excelente'][getPasswordStrength()] || 'Muito fraca';
  const strengthColor = ['bg-red-100 text-red-700', 'bg-orange-100 text-orange-700', 'bg-yellow-100 text-yellow-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-emerald-100 text-emerald-800'][getPasswordStrength()] || 'bg-red-100 text-red-700';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !email.trim() || !password.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha organização, e-mail e senha', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const backendOrigin = (import.meta.env.VITE_BACKEND_ORIGIN as string) || '/api';
      const res = await fetch(`${backendOrigin}/admin/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_name: orgName.trim(), email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao criar organização');
      }
      setResult({ company_id: data.company_id, user_id: data.user_id });
      toast({ title: 'Organização criada', description: 'Primeiro usuário e empresa gerados com sucesso' });
      setOrgName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Erro ao criar organização', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6 text-white">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-semibold">Onboarding de Organização</div>
            <div className="text-xs opacity-80">Crie a empresa e o primeiro usuário com um clique</div>
          </div>
        </div>
        <Card className="shadow-2xl border-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="w-5 h-5 text-blue-600" />
              Criar Nova Organização
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nome da Organização</Label>
                <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Ex: Minha Empresa LTDA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail do Primeiro Usuário</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha segura" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(v => !v)} className="absolute right-1 top-1 h-8 w-8 p-0">
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                <div className={`inline-flex items-center px-2 py-1 rounded ${strengthColor} text-xs`}>{strengthText}</div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? 'Criando...' : 'Criar Organização'}
              </Button>
            </form>
            {result && (
              <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  Organização criada com sucesso
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">ID da Empresa: {result.company_id}</div>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(String(result.company_id || ''))} className="h-7">
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1">ID do Usuário: {result.user_id}</div>
                  <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(String(result.user_id || ''))} className="h-7">
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
