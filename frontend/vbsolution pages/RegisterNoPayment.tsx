import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Building, User, Phone, Briefcase, Users, Target, Mail, Lock, MapPin, Globe, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RegisterData {
  personType: 'fisica' | 'juridica';
  companyName: string;
  cnpj: string;
  cpf: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  companyPhone: string;
  defaultLanguage: string;
  currency: string;
  employeesCount: string;
  targetAudience: string[];
  businessNiche: string;
  name: string;
  position: string;
  email: string;
  password: string;
  planKey?: string;
  planPaid?: boolean;
}

const positions = [
  'CEO / Diretor',
  'Coordenador / Gerente de TI',
  'Gerente de Vendas',
  'Analista de Negócios',
  'Assistente Administrativo',
  'Outros'
];

const employeesOptions = [
  'Não tenho',
  '1-3',
  '4-10',
  '11-20',
  '21-50',
  '51+'
];

const businessNiches = [
  'Tecnologia',
  'Varejo',
  'Serviços',
  'Indústria',
  'Saúde',
  'Educação',
  'Financeiro',
  'Outros'
];

const targetAudiences = [
  'Empresas',
  'Pessoas Físicas',
  'Instituições',
  'Órgãos Públicos'
];

const languages = [
  { value: 'pt-BR', label: 'Português' },
  { value: 'en-US', label: 'Inglês' },
  { value: 'es-ES', label: 'Espanhol' }
];

const currencies = [
  { value: 'BRL', label: 'Real (R$)', symbol: 'R$' },
  { value: 'USD', label: 'Dólar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' }
];

export default function RegisterNoPayment() {
  const navigate = useNavigate();
  const { signUpCompany, resendConfirmationEmail } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [cnpjSearchTimeout, setCnpjSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<RegisterData>({
    personType: 'juridica',
    companyName: '',
    cnpj: '',
    cpf: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    companyPhone: '',
    defaultLanguage: 'pt-BR',
    currency: 'BRL',
    employeesCount: '',
    targetAudience: [],
    businessNiche: '',
    name: '',
    position: '',
    email: '',
    password: '',
    planKey: undefined,
    planPaid: true
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem('vb_register_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (cnpjSearchTimeout) {
        clearTimeout(cnpjSearchTimeout);
      }
    };
  }, [cnpjSearchTimeout]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.substring(0, 2)}.${numbers.substring(2)}`;
    if (numbers.length <= 8) return `${numbers.substring(0, 2)}.${numbers.substring(2, 5)}.${numbers.substring(5)}`;
    if (numbers.length <= 12) return `${numbers.substring(0, 2)}.${numbers.substring(2, 5)}.${numbers.substring(5, 8)}/${numbers.substring(8)}`;
    return `${numbers.substring(0, 2)}.${numbers.substring(2, 5)}.${numbers.substring(5, 8)}/${numbers.substring(8, 12)}-${numbers.substring(12, 14)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.substring(0, 3)}.${numbers.substring(3)}`;
    if (numbers.length <= 9) return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6)}`;
    return `${numbers.substring(0, 3)}.${numbers.substring(3, 6)}.${numbers.substring(6, 9)}-${numbers.substring(9, 11)}`;
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.substring(0, 5)}-${numbers.substring(5, 8)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
    if (numbers.length <= 10) return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7, 11)}`;
  };

  const validateCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
      return 'CNPJ deve ter 14 dígitos';
    }
    if (cleanCNPJ === '00000000000000' || cleanCNPJ === '11111111111111' || 
        cleanCNPJ === '22222222222222' || cleanCNPJ === '33333333333333' ||
        cleanCNPJ === '44444444444444' || cleanCNPJ === '55555555555555' ||
        cleanCNPJ === '66666666666666' || cleanCNPJ === '77777777777777' ||
        cleanCNPJ === '88888888888888' || cleanCNPJ === '99999999999999') {
      return 'CNPJ inválido';
    }
    return '';
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) {
      return 'CPF deve ter 11 dígitos';
    }
    return '';
  };

  const validateCEP = (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      return 'CEP deve ter 8 dígitos';
    }
    return '';
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    const ddd = cleanPhone.substring(0, 2);
    if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
      return 'DDD inválido';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email inválido';
    }
    return '';
  };

  const fetchAddressByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return;
    setIsFetchingCep(true);
    setErrors(prev => ({ ...prev, cep: '' }));
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();
      if (data.erro) {
        setErrors(prev => ({ ...prev, cep: 'CEP não encontrado' }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        address: `${data.logradouro}, ${data.bairro}`,
        city: data.localidade,
        state: data.uf
      }));
    } catch {
      setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP. Tente novamente.' }));
    } finally {
      setIsFetchingCep(false);
    }
  };

  const fetchCompanyByCNPJ = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;
    setIsFetchingCnpj(true);
    setErrors(prev => ({ ...prev, cnpj: '' }));
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.razao_social || data.nome_fantasia) {
        setFormData(prev => ({
          ...prev,
          companyName: data.razao_social || data.nome_fantasia || prev.companyName
        }));
      } else {
        setErrors(prev => ({ ...prev, cnpj: 'CNPJ válido mas sem dados disponíveis' }));
      }
    } catch {
      try {
        const altResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
        if (altResponse.ok) {
          const altData = await altResponse.json();
          if (altData.nome || altData.fantasia) {
            setFormData(prev => ({
              ...prev,
              companyName: altData.nome || altData.fantasia || prev.companyName
            }));
          } else {
            setErrors(prev => ({ ...prev, cnpj: 'CNPJ válido mas sem dados disponíveis' }));
          }
        } else {
          throw new Error('API alternativa falhou');
        }
      } catch {
        setErrors(prev => ({ ...prev, cnpj: 'Erro ao buscar CNPJ. Verifique se o CNPJ está correto ou digite manualmente.' }));
      }
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleInputChange = (field: keyof RegisterData, value: string | string[]) => {
    let processedValue = value;
    if (field === 'cnpj' && typeof value === 'string') {
      processedValue = formatCNPJ(value);
      if (cnpjSearchTimeout) clearTimeout(cnpjSearchTimeout);
      const cleanCNPJ = value.replace(/\D/g, '');
      if (cleanCNPJ.length === 14) {
        const timeout = setTimeout(() => {
          fetchCompanyByCNPJ(value);
        }, 1000);
        setCnpjSearchTimeout(timeout);
      }
    } else if (field === 'cpf' && typeof value === 'string') {
      processedValue = formatCPF(value);
    } else if (field === 'cep' && typeof value === 'string') {
      processedValue = formatCEP(value);
      const cleanCEP = value.replace(/\D/g, '');
      if (cleanCEP.length === 8) fetchAddressByCEP(value);
    } else if (field === 'companyPhone' && typeof value === 'string') {
      processedValue = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (field === 'email' && typeof processedValue === 'string') {
      localStorage.setItem('vb_register_email', processedValue);
    }
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleTargetAudience = (audience: string) => {
    setFormData(prev => {
      const current = prev.targetAudience || [];
      const isSelected = current.includes(audience);
      return {
        ...prev,
        targetAudience: isSelected ? current.filter(a => a !== audience) : [...current, audience]
      };
    });
    if (errors.targetAudience) setErrors(prev => ({ ...prev, targetAudience: '' }));
  };

  const nextStep = () => {
    const stepErrors = calculateCurrentStepErrors();
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0 && currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    const stepErrors = calculateCurrentStepErrors();
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setIsLoading(true);
    try {
      const result = await signUpCompany({
        ...formData,
        planKey: undefined,
        planPaid: true
      });
      if (result.error) {
        alert('Erro no registro: ' + result.error.message);
        return;
      }
      try {
        await resendConfirmationEmail(formData.email);
      } catch {}
      setCurrentStep(7);
    } catch (error) {
      alert('Erro inesperado: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentStepErrors = () => {
    const newErrors: {[key: string]: string} = {};
    switch (currentStep) {
      case 1:
        if (formData.personType === 'juridica') {
          if (!formData.companyName.trim()) newErrors.companyName = 'Nome da empresa é obrigatório';
          const cnpjError = validateCNPJ(formData.cnpj);
          if (cnpjError) newErrors.cnpj = cnpjError;
        } else {
          if (!formData.companyName.trim()) newErrors.companyName = 'Nome é obrigatório';
          const cpfError = validateCPF(formData.cpf);
          if (cpfError) newErrors.cpf = cpfError;
        }
        break;
      case 2:
        const cepError = validateCEP(formData.cep);
        if (cepError) newErrors.cep = cepError;
        if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
        const phoneError = validatePhone(formData.companyPhone);
        if (phoneError) newErrors.companyPhone = phoneError;
        break;
      case 3:
        if (!formData.defaultLanguage) newErrors.defaultLanguage = 'Língua padrão é obrigatória';
        if (!formData.currency) newErrors.currency = 'Moeda é obrigatória';
        break;
      case 4:
        if (!formData.employeesCount) newErrors.employeesCount = 'Quantidade de funcionários é obrigatória';
        if (!formData.targetAudience || formData.targetAudience.length === 0) {
          newErrors.targetAudience = 'Selecione pelo menos um público-alvo';
        }
        if (!formData.businessNiche) newErrors.businessNiche = 'Nicho da empresa é obrigatório';
        break;
      case 5:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.position) newErrors.position = 'Cargo é obrigatório';
        break;
      case 6:
        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;
        if (!formData.password || formData.password.length < 6) {
          newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }
        break;
      default:
        break;
    }
    return newErrors;
  };

  const isCurrentStepValid = () => {
    const stepErrors = calculateCurrentStepErrors();
    return Object.keys(stepErrors).length === 0;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Você é Pessoa Física ou Jurídica?</h3>
                  <Label className="text-xs text-gray-600">Tipo de Cadastro</Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.personType === 'juridica' ? "default" : "outline"}
                    className={`justify-start ${formData.personType === 'juridica' ? 'bg-blue-900 text-white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, personType: 'juridica', cpf: '' }));
                      setErrors({});
                    }}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Pessoa Jurídica
                  </Button>
                  <Button
                    type="button"
                    variant={formData.personType === 'fisica' ? "default" : "outline"}
                    className={`justify-start ${formData.personType === 'fisica' ? 'bg-blue-900 text-white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, personType: 'fisica', cnpj: '' }));
                      setErrors({});
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Pessoa Física
                  </Button>
                </div>
              </CardContent>
            </Card>

            {formData.personType === 'juridica' && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-1 pt-3">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Qual o CNPJ da empresa?</h3>
                        <Label className="text-xs text-gray-600">CNPJ (buscaremos a Razão Social automaticamente)</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Input
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      maxLength={18}
                      disabled={isFetchingCnpj}
                      className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.cnpj ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {isFetchingCnpj && <p className="text-blue-600 text-xs mt-1">Buscando dados da empresa...</p>}
                    {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-1 pt-3">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">Razão Social / Nome Fantasia</h3>
                        <Label className="text-xs text-gray-600">Preenchido automaticamente pelo CNPJ</Label>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
                          if (cleanCNPJ.length === 14) {
                            fetchCompanyByCNPJ(formData.cnpj);
                          }
                        }}
                        disabled={isFetchingCnpj || formData.cnpj.replace(/\D/g, '').length !== 14}
                        className="text-xs"
                      >
                        {isFetchingCnpj ? 'Buscando...' : 'Buscar'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Input
                      placeholder="Nome da Empresa"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.companyName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  </CardContent>
                </Card>
              </>
            )}

            {formData.personType === 'fisica' && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-1 pt-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Qual o seu nome completo?</h3>
                        <Label className="text-xs text-gray-600">Nome</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Input
                      placeholder="Seu nome completo"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.companyName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-1 pt-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Qual o seu CPF?</h3>
                        <Label className="text-xs text-gray-600">CPF</Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      maxLength={14}
                      className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.cpf ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o CEP da empresa?</h3>
                    <Label className="text-xs text-gray-600">CEP</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  maxLength={9}
                  disabled={isFetchingCep}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.cep ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {isFetchingCep && <p className="text-blue-600 text-xs mt-1">Buscando endereço...</p>}
                {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Endereço</h3>
                    <Label className="text-xs text-gray-600">Rua, número, bairro</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  placeholder="Rua, número, bairro"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="Cidade"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="border-gray-200 focus:border-blue-900 focus:ring-blue-900"
                  />
                  <Input
                    placeholder="UF"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    maxLength={2}
                    className="border-gray-200 focus:border-blue-900 focus:ring-blue-900"
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Em qual telefone podemos entrar em contato?</h3>
                    <Label className="text-xs text-gray-600">Nº Celular / WhatsApp</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  placeholder="(11) 99999-9999"
                  value={formData.companyPhone}
                  onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.companyPhone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.companyPhone && <p className="text-red-500 text-xs mt-1">{errors.companyPhone}</p>}
              </CardContent>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual a língua padrão do sistema?</h3>
                    <Label className="text-xs text-gray-600">Idioma</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <Button
                      key={lang.value}
                      variant={formData.defaultLanguage === lang.value ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${formData.defaultLanguage === lang.value ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => handleInputChange('defaultLanguage', lang.value)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual a moeda utilizada?</h3>
                    <Label className="text-xs text-gray-600">Moeda</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="flex flex-wrap gap-2">
                  {currencies.map((curr) => (
                    <Button
                      key={curr.value}
                      variant={formData.currency === curr.value ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${formData.currency === curr.value ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => handleInputChange('currency', curr.value)}
                    >
                      {curr.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items:center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o tamanho da sua equipe comercial?</h3>
                    <Label className="text-xs text-gray-600">Funcionários</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="flex flex-wrap gap-1">
                  {employeesOptions.map((option) => (
                    <Button
                      key={option}
                      variant={formData.employeesCount === option ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${formData.employeesCount === option ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => handleInputChange('employeesCount', option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Para quem você vende? (múltipla escolha)</h3>
                    <Label className="text-xs text-gray-600">Público-alvo</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="grid grid-cols-2 gap-1">
                  {targetAudiences.map((audience) => (
                    <Button
                      key={audience}
                      variant={formData.targetAudience?.includes(audience) ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs ${formData.targetAudience?.includes(audience) ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => toggleTargetAudience(audience)}
                    >
                      {audience}
                    </Button>
                  ))}
                </div>
                {errors.targetAudience && <p className="text-red-500 text-xs mt-1">{errors.targetAudience}</p>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o nicho da sua empresa?</h3>
                    <Label className="text-xs text-gray-600">Setor de atuação</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="grid grid-cols-2 gap-1">
                  {businessNiches.map((niche) => (
                    <Button
                      key={niche}
                      variant={formData.businessNiche === niche ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs ${formData.businessNiche === niche ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => handleInputChange('businessNiche', niche)}
                    >
                      {niche}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o seu nome?</h3>
                    <Label className="text-xs text-gray-600">Nome completo</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o seu cargo?</h3>
                    <Label className="text-xs text-gray-600">Cargo</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="grid grid-cols-2 gap-1">
                  {positions.map((position) => (
                    <Button
                      key={position}
                      variant={formData.position === position ? "default" : "outline"}
                      size="sm"
                      className={`justify-start text-xs ${formData.position === position ? 'bg-blue-900 text:white border-blue-900' : 'border-gray-200 text-gray-700 hover:bg-blue-50'}`}
                      onClick={() => handleInputChange('position', position)}
                    >
                      {position}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Qual o seu email?</h3>
                    <Label className="text-xs text-gray-600">Endereço de email</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-1 pt-3">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Crie uma senha segura</h3>
                    <Label className="text-xs text-gray-600">Senha</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`border-gray-200 focus:border-blue-900 focus:ring-blue-900 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </CardContent>
            </Card>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Confirme seu email</h2>
                <p className="text-gray-600">Enviamos um link de confirmação para:</p>
                <p className="text-blue-600 font-semibold">{formData.email}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800"><strong>Próximos passos:</strong></p>
                <ol className="text-sm text-blue-700 mt-2 space-y-1 text-left">
                  <li>1. Verifique sua caixa de entrada</li>
                  <li>2. Clique no link de confirmação</li>
                  <li>3. Você será redirecionado para a página de login</li>
                  <li>4. Faça login com seu email e senha</li>
                </ol>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => { window.location.href = '/login'; }}
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white"
                >
                  Ir para Login
                </Button>
                <Button
                  onClick={async () => { await resendConfirmationEmail(formData.email); }}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Reenviar Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Ir para Home
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://i.imgur.com/KdKLVUV.png"
              alt="VB Logo"
              className="h-12 w-12 object-contain filter brightness-0"
            />
          </div>
          <div className="flex-1 max-w-xs mx-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-900 h-2 rounded-full transition-all duration-300"
                style={{ width: currentStep === 7 ? '100%' : `${(currentStep / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {currentStep === 7 ? 'Concluído' : `Etapa ${currentStep} de 7`}
            </p>
          </div>
          <a href="/login" className="text-blue-900 hover:underline">Sair</a>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto relative">
        <div className="w-full max-w-xl">
          {renderStep()}
        </div>
        {currentStep !== 7 && (
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-16">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                currentStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-950 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={currentStep === 6 ? handleSubmit : nextStep}
              disabled={!isCurrentStepValid() || isLoading}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto ${
                !isCurrentStepValid() || isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-950 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronRight className="h-6 w-6" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
