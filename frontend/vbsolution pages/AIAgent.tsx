import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Brain, Settings, Plus, Trash2, Save, Upload, FileText, User, CheckCircle, AlertCircle, Key, TestTube, Eye, EyeOff, Building, CalendarDays, UserPlus, TrendingUp, Mail, AlignJustify, Check, Loader2, Sliders, Clock, MessageSquare, X, BookOpen, Waves, LogOut, ArrowRightLeft, Timer, Zap, Globe, Lock, Maximize2 } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useAIAgentConfig, AIAgentConfigForm } from '@/hooks/useAIAgentConfig';
import { useIntelligentKnowledgeProcessor } from '@/hooks/useIntelligentKnowledgeProcessor';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  speed: string;
  quality: string;
  costLevel: 'low' | 'medium' | 'high';
  maxOutputTokens?: string;
  bestFor?: string;
  pricing?: {
    input: string;
    output: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAction {
      id: string;
      name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface ConnectionStatus {
    isConnected: boolean;
  isValidating: boolean;
  error: string | null;
  lastChecked: Date | null;
}

const OPENAI_MODELS: OpenAIModel[] = [
  { 
    id: 'gpt-4o-mini', 
    name: 'GPT-4o Mini', 
    description: 'Rápido e econômico', 
    contextWindow: '128K', 
    maxOutputTokens: '16K',
    speed: 'Muito Rápido', 
    quality: 'Alta', 
    costLevel: 'low',
    bestFor: 'Chat, automação',
    pricing: { input: '$0.15/1M', output: '$0.60/1M' }
  },
  { 
    id: 'gpt-4o', 
    name: 'GPT-4o', 
    description: 'Multimodal avançado', 
    contextWindow: '128K', 
    maxOutputTokens: '16K',
    speed: 'Rápido', 
    quality: 'Muito Alta', 
    costLevel: 'medium',
    bestFor: 'Uso geral, análise',
    pricing: { input: '$2.50/1M', output: '$10.00/1M' }
  },
  { 
    id: 'gpt-4-turbo', 
    name: 'GPT-4 Turbo', 
    description: 'Performance máxima', 
    contextWindow: '128K', 
    maxOutputTokens: '4K',
    speed: 'Médio', 
    quality: 'Muito Alta', 
    costLevel: 'high',
    bestFor: 'Tarefas complexas',
    pricing: { input: '$10.00/1M', output: '$30.00/1M' }
  },
  { 
    id: 'gpt-4', 
    name: 'GPT-4', 
    description: 'Modelo clássico', 
    contextWindow: '8K', 
    maxOutputTokens: '4K',
    speed: 'Médio', 
    quality: 'Muito Alta', 
    costLevel: 'high',
    bestFor: 'Precisão máxima',
    pricing: { input: '$30.00/1M', output: '$60.00/1M' }
  },
  { 
    id: 'gpt-3.5-turbo', 
    name: 'GPT-3.5 Turbo', 
    description: 'Equilibrado', 
    contextWindow: '16K', 
    maxOutputTokens: '4K',
    speed: 'Muito Rápido', 
    quality: 'Boa', 
    costLevel: 'low',
    bestFor: 'Conversas simples',
    pricing: { input: '$0.50/1M', output: '$1.50/1M' }
  },
  { 
    id: 'o1-preview', 
    name: 'o1 Preview', 
    description: 'Raciocínio profundo', 
    contextWindow: '128K', 
    maxOutputTokens: '32K',
    speed: 'Lento', 
    quality: 'Excepcional', 
    costLevel: 'high',
    bestFor: 'Problemas complexos',
    pricing: { input: '$15.00/1M', output: '$60.00/1M' }
  },
  { 
    id: 'o1-mini', 
    name: 'o1 Mini', 
    description: 'Raciocínio rápido', 
    contextWindow: '128K', 
    maxOutputTokens: '64K',
    speed: 'Médio', 
    quality: 'Alta', 
    costLevel: 'medium',
    bestFor: 'Código, matemática',
    pricing: { input: '$3.00/1M', output: '$12.00/1M' }
  }
];

const ChatGPTIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const AIAgent: React.FC = () => {
  const { sidebarExpanded, expandSidebarFromMenu } = useSidebar();
  const { user, session } = useAuth();
  
  const { activeConfig, loading: configLoading, saveConfig, loadConfigs } = useAIAgentConfig();
  const { processFile, scrapeWebsite, processQnA, isProcessing: isScrapingWebsite } = useIntelligentKnowledgeProcessor();

  const [activeTab, setActiveTab] = useState<'integracao' | 'cargo' | 'cerebro' | 'acoes' | 'avancado' | 'teste'>('integracao');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [fullscreenField, setFullscreenField] = useState<string | null>(null);
  const [fullscreenValue, setFullscreenValue] = useState<string>('');

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: true,
    isValidating: false,
    error: null,
    lastChecked: new Date()
  });

  interface CustomAction {
    id: string;
    name: string;
    description: string;
    trigger: string; // palavras-chave ou condição
    action: string; // criar_lead, agendar, criar_contato, etc
    parameters: Record<string, any>;
    enabled: boolean;
  }

  const [aiActions, setAiActions] = useState<CustomAction[]>([
    { id: '1', name: 'Prospecção', description: 'Identifica interesse e cria lead', trigger: 'interesse, produto, serviço, orçamento', action: 'criar_lead', parameters: {}, enabled: true },
    { id: '2', name: 'Agendamento', description: 'Agenda reunião no calendário', trigger: 'agendar, reunião, encontro, horário', action: 'criar_evento', parameters: {}, enabled: true },
    { id: '3', name: 'Criar Contato', description: 'Adiciona novo contato no CRM', trigger: 'meu nome é, sou, contato', action: 'criar_contato', parameters: {}, enabled: true }
  ]);

  const [newAction, setNewAction] = useState<{ name: string; description: string; trigger: string; action: string | string[] }>({ 
    name: '', 
    description: '', 
    trigger: '', 
    action: '' 
  });

  const [formData, setFormData] = useState({
    name: 'Assistente Virtual',
    function: 'Atendimento ao cliente via WhatsApp',
    personality: 'Sou um assistente virtual proativo e amigável.',
    responseStyle: 'professional',
    language: 'pt-BR',
    maxResponseLength: 500,
    responseSpeed: 'normal',
    advancedSettings: { tone: '', rules: '', companyContext: '', sector: '' },
    knowledgeBase: { files: [] as any[], websites: [] as any[], qa: [] as any[] },
    integration: { apiKey: '', selectedModel: 'gpt-4o-mini', isConnected: false },
    allowGroupMessages: false,
    isCompanyWide: false,
    advancedConfig: {
      conversationExamples: [] as Array<{ user: string; assistant: string }>,
      welcomeMessage: '',
      goodbyeMessage: '',
      fallbackMessage: 'Desculpe, não entendi. Pode reformular?',
      workingHours: { enabled: false, start: '09:00', end: '18:00', timezone: 'America/Sao_Paulo', outsideMessage: 'Estamos fora do horário de atendimento.' },
      inactivityTimeout: 30,
      transferToHuman: { enabled: false, keywords: ['atendente', 'humano', 'pessoa'], message: 'Vou transferir você para um atendente.' }
    },
    databaseAccess: { enabled: false, tables: ['leads', 'contacts', 'calendar_events'] }
  });

  const [newQA, setNewQA] = useState({ question: '', answer: '', category: '' });
  const [newExample, setNewExample] = useState({ user: '', assistant: '' });
  const [newWebsite, setNewWebsite] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationLoadReqId = React.useRef(0);

  const localStorageWebsitesMemo = useMemo<any[]>(() => {
    try {
      const saved = localStorage.getItem('aiAgent_websites');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);
  const dbFilesMemo = useMemo<any[]>(() => {
    const files = activeConfig?.knowledge_base?.files || [];
    return files.map((file: any) => ({
      ...file,
      id: file.id || Date.now().toString() + Math.random(),
      uploadedAt: file.uploadedAt || file.uploaded_at || new Date().toISOString()
    }));
  }, [activeConfig?.knowledge_base?.files]);
  const dbQAMemo = useMemo<any[]>(() => {
    const qa = activeConfig?.knowledge_base?.qa || [];
    return qa.map((q: any) => ({
      ...q,
      id: q.id || Date.now().toString() + Math.random(),
      category: q.category || 'geral',
      addedAt: q.addedAt || q.added_at || new Date().toISOString()
    }));
  }, [activeConfig?.knowledge_base?.qa]);
  const dbWebsitesMemo = useMemo<any[]>(() => {
    const websites = activeConfig?.knowledge_base?.websites || [];
    return websites.map((website: any) => ({
      ...website,
      id: website.id || Date.now().toString() + Math.random(),
      addedAt: website.addedAt || website.scraped_at || new Date().toISOString(),
      url: website.url || ''
    }));
  }, [activeConfig?.knowledge_base?.websites]);
  const mergedWebsitesMemo = useMemo<any[]>(() => {
    const all = [...dbWebsitesMemo];
    localStorageWebsitesMemo.forEach((localWebsite: any) => {
      const exists = all.some(w => w.url === localWebsite.url);
      if (!exists) {
        all.push(localWebsite);
      }
    });
    return all;
  }, [dbWebsitesMemo, localStorageWebsitesMemo]);

  // ✅ NOVO: Carregar histórico quando conversationId existir
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!conversationId || !user?.id) return;
      const reqId = ++conversationLoadReqId.current;
      
      try {
        const { data: messages, error } = await supabase
          .from('ai_agent_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (!error && messages) {
          if (reqId !== conversationLoadReqId.current) return;
          const historyMessages: ChatMessage[] = messages.map(msg => ({
            id: msg.id.toString(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));
          setChatMessages(historyMessages);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Erro ao carregar histórico:', error);
      }
    };
    
    loadConversationHistory();
  }, [conversationId, user?.id]);

  // Carregar websites do localStorage quando não houver activeConfig
  useEffect(() => {
    if (!activeConfig) {
      if (localStorageWebsitesMemo.length > 0) {
        setFormData(prev => ({
          ...prev,
          knowledgeBase: {
            ...prev.knowledgeBase,
            websites: localStorageWebsitesMemo
          }
        }));
      }
    }
  }, [activeConfig, localStorageWebsitesMemo]);

  // Função para salvar websites no localStorage
  const saveWebsitesToLocalStorage = (websites: any[]) => {
    try {
      localStorage.setItem('aiAgent_websites', JSON.stringify(websites));
    } catch (error) {
      console.error('Erro ao salvar websites no localStorage:', error);
    }
  };

  // Removido: validação de API Key no cliente. Conexão é validada no backend via variáveis de ambiente.

  useEffect(() => {
    if (activeConfig) {
      if (import.meta.env.DEV) console.log('🔄 Modelo do activeConfig:', activeConfig.selected_model);
      
      setFormData({
        name: activeConfig.name || 'Assistente Virtual',
        function: activeConfig.function || 'Atendimento ao cliente via WhatsApp',
        personality: activeConfig.personality || 'Sou um assistente virtual proativo.',
        responseStyle: activeConfig.response_style || 'professional',
        language: activeConfig.language || 'pt-BR',
        maxResponseLength: activeConfig.max_response_length || 500,
        responseSpeed: 'normal',
        advancedSettings: {
          tone: activeConfig.tone || '',
          rules: activeConfig.rules || '',
          companyContext: activeConfig.company_context || '',
          sector: activeConfig.sector || ''
        },
        knowledgeBase: {
          files: dbFilesMemo,
          websites: mergedWebsitesMemo,
          qa: dbQAMemo
        },
        integration: {
          selectedModel: activeConfig.selected_model || 'gpt-4o-mini',
          isConnected: activeConfig.is_connected || false
        },
        allowGroupMessages: activeConfig.allow_group_messages ?? false,
        isCompanyWide: activeConfig.is_company_wide || false,
        advancedConfig: {
          conversationExamples: (activeConfig as any).conversation_examples || [],
          welcomeMessage: (activeConfig as any).welcome_message || '',
          goodbyeMessage: (activeConfig as any).goodbye_message || '',
          fallbackMessage: (activeConfig as any).fallback_message || 'Desculpe, não entendi. Pode reformular?',
          workingHours: (activeConfig as any).working_hours || { enabled: false, start: '09:00', end: '18:00', timezone: 'America/Sao_Paulo', outsideMessage: 'Estamos fora do horário de atendimento.' },
          inactivityTimeout: (activeConfig as any).inactivity_timeout || 30,
          transferToHuman: (activeConfig as any).transfer_to_human || { enabled: false, keywords: ['atendente', 'humano', 'pessoa'], message: 'Vou transferir você para um atendente.' }
        },
        databaseAccess: (activeConfig as any).database_access || { enabled: false, tables: ['leads', 'contacts', 'calendar_events'] }
      });

      // ✅ NOVO: Log para debug da base de conhecimento
      if (import.meta.env.DEV) console.log('📚 [CÉREBRO] Knowledge base carregada:', {
        files: activeConfig.knowledge_base?.files?.length || 0,
        websites: activeConfig.knowledge_base?.websites?.length || 0,
        qa: activeConfig.knowledge_base?.qa?.length || 0,
        websitesData: mergedWebsitesMemo || []
      });

      // Carregar ações customizadas
      if ((activeConfig as any).custom_actions) {
        setAiActions((activeConfig as any).custom_actions);
      }
      
      if (import.meta.env.DEV) console.log('✅ formData atualizado com sucesso');
    } else {
      if (import.meta.env.DEV) console.log('⚠️ activeConfig é null/undefined');
    }
  }, [activeConfig, dbFilesMemo, dbQAMemo, mergedWebsitesMemo]);

  const updateFormData = (updates: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...updates }));

  const handleSaveSection = async (section: string) => {
    setSavingSection(section);
    try {
      console.log('💾 Salvando seção:', section);
      console.log('💾 Modelo atual:', formData.integration.selectedModel);
      
      // Ativar databaseAccess automaticamente se houver ações configuradas
      const databaseAccessEnabled = aiActions.length > 0 ? { ...formData.databaseAccess, enabled: true } : formData.databaseAccess;
      
      const savedData = await saveConfig({
        name: formData.name,
        function: formData.function,
        personality: formData.personality,
        response_style: formData.responseStyle,
        language: formData.language,
        max_response_length: formData.maxResponseLength,
        tone: formData.advancedSettings.tone,
        rules: formData.advancedSettings.rules,
        company_context: formData.advancedSettings.companyContext,
        sector: formData.advancedSettings.sector,
        company_description: '',
        knowledge_base: formData.knowledgeBase,
        integration: {
          selectedModel: formData.integration.selectedModel,
          isConnected: true
        },
        allow_group_messages: formData.allowGroupMessages,
        advanced_settings: { temperature: 0.7, max_tokens: 1000 },
        is_company_wide: formData.isCompanyWide,
        advancedConfig: formData.advancedConfig,
        customActions: aiActions,
        databaseAccess: databaseAccessEnabled
      } as any);
      
      console.log('✅ Dados salvos:', savedData);
      console.log('🔄 [SAVE] allow_group_messages retornado:', savedData?.allow_group_messages);
      
      // ✅ NOVO: Atualizar formData com os dados salvos para garantir sincronização
      if (savedData) {
        setFormData(prev => ({
          ...prev,
          allowGroupMessages: savedData.allow_group_messages ?? false
        }));
        
        // Recarregar configurações do banco
        await loadConfigs();
      }
      
      toast.success(`${section} salva com sucesso!`);
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
      console.error('❌ Erro ao salvar:', error);
    } finally {
      setSavingSection(null);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      
      try {
        // ✅ CORREÇÃO CRÍTICA: Processar arquivo via backend
        toast.loading('Processando arquivo com IA...', { id: 'file-upload' });
        
        console.log('📁 [UPLOAD] Processando arquivo:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        // ✅ Chamar API para processar (extrai conteúdo, analisa com OpenAI)
        const result = await processFile(file);
        
        console.log('✅ [UPLOAD] Arquivo processado:', result);
        
        // ✅ CORREÇÃO: Recarregar configuração do banco
        console.log('🔄 Recarregando configuração após upload...');
        await loadConfigs();
        
        toast.success('Arquivo processado e conhecimento integrado ao Cargo!', { id: 'file-upload' });
      } catch (error: any) {
        console.error('❌ [UPLOAD] Erro ao processar arquivo:', error);
        toast.error(error.message || 'Erro ao processar arquivo', { id: 'file-upload' });
      }
    }
  }, [processFile, loadConfigs]);

  const handleSendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    // ✅ NOVO: Criar conversationId se não existir
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      currentConversationId = `test_${user?.id}_${Date.now()}`;
      setConversationId(currentConversationId);
    }
    
    // Adicionar mensagem do usuário
    setChatMessages(prev => [...prev, { 
      id: Date.now().toString(), 
      role: 'user', 
      content: testMessage, 
      timestamp: new Date() 
    }]);
    
    const currentMessage = testMessage;
    setTestMessage('');
    setIsTyping(true);
    
    try {
      // Verificar se usuário está autenticado
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para testar o AI Agent.');
      }
      
      console.log('🔍 Testando AI Agent para usuário:', user.id);
      console.log('🔍 Conversation ID:', currentConversationId);
      
      // Chamar API de teste do AI Agent
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      // Preparar headers com token se disponível
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // ✅ NOVO: Incluir conversationId na requisição
      const response = await fetch(`${API_URL}/api/ai-agent/test-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id_usuario: user.id,
          message: currentMessage,
          conversationId: currentConversationId
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }
      
      // ✅ NOVO: Atualizar conversationId se retornado
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Adicionar resposta da IA
      setChatMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.response, 
        timestamp: new Date() 
      }]);
      
      // Mostrar informações de uso (opcional)
      if (data.usage) {
        console.log('📊 Tokens utilizados:', data.usage);
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao testar IA:', error);
      
      // Adicionar mensagem de erro
      setChatMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: `❌ Erro: ${error.message}`, 
        timestamp: new Date() 
      }]);
      
      toast.error(error.message || 'Erro ao processar mensagem');
    } finally {
      setIsTyping(false);
    }
  };

  // ✅ NOVO: Função para limpar conversa
  const handleClearConversation = () => {
    setChatMessages([]);
    setConversationId(null);
    toast.success('Conversa limpa. Nova conversa iniciada.');
  };

  const viewButtons = useMemo(() => [
    { id: 'integracao', label: 'Integração', icon: ChatGPTIcon, active: activeTab === 'integracao', isCustomIcon: true },
    { id: 'cargo', label: 'Cargo', icon: User, active: activeTab === 'cargo', isCustomIcon: false },
    { id: 'cerebro', label: 'Cérebro', icon: Brain, active: activeTab === 'cerebro', isCustomIcon: false },
    { id: 'acoes', label: 'Ações', icon: Settings, active: activeTab === 'acoes', isCustomIcon: false },
    { id: 'avancado', label: 'Avançado', icon: Sliders, active: activeTab === 'avancado', isCustomIcon: false },
    { id: 'teste', label: 'Teste', icon: TestTube, active: activeTab === 'teste', isCustomIcon: false }
  ], [activeTab]);

  const selectedModelInfo = OPENAI_MODELS.find(m => m.id === formData.integration.selectedModel) || OPENAI_MODELS[0];

  if (configLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div></div>;
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="fixed top-[38px] right-0 bg-white border-b border-gray-200 z-40 transition-all" style={{ left: sidebarExpanded ? '240px' : '64px' }}>
        <div className="w-full pl-4 pr-2 py-2">
          <div className="flex items-center gap-2">
              {!sidebarExpanded && (
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0" onClick={expandSidebarFromMenu}>
                  <AlignJustify size={14} />
                </Button>
              )}
            {viewButtons.map((button) => {
              return (
              <Button
                  key={button.id}
                variant="ghost"
                size="sm"
                  onClick={() => setActiveTab(button.id as any)}
                  className={`h-9 px-3 text-sm font-medium rounded-lg whitespace-nowrap ${
                    button.active ? 'bg-gray-50 text-slate-900 shadow-inner' : 'text-slate-700 hover:bg-gray-100'
                  }`}
                >
                  {button.isCustomIcon ? (
                    <ChatGPTIcon className="h-4 w-4 mr-2" />
                  ) : (
                    React.createElement(button.icon as any, { className: "h-4 w-4 mr-2" })
                  )}
                  {button.label}
              </Button>
              );
            })}
            </div>
        </div>
      </div>

      <div 
        className="pt-[78px] pb-3 overflow-y-auto"
        style={{ 
          marginLeft: '0px',
          marginRight: '0px',
          height: 'calc(100vh - 38px)' 
        }}
      >
        <div className="w-full pr-2 pl-4">
          
          <div className="space-y-2">
            
            {activeTab === 'integracao' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ maxHeight: 'calc(100vh - 155px)', overflowY: 'auto', paddingLeft: '0px' }}>
                {/* Coluna Esquerda - Configurações */}
                <div className="lg:col-span-2 space-y-2">
                <div className={`p-3 rounded-lg border ${connectionStatus.isConnected ? 'bg-white' : 'bg-gray-50'} border-gray-300`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {connectionStatus.isValidating ? <Loader2 className="h-4 w-4 text-gray-600 animate-spin" /> :
                       connectionStatus.isConnected ? <CheckCircle className="h-4 w-4 text-gray-600" /> :
                       <AlertCircle className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-gray-900">
                        {connectionStatus.isValidating ? 'Validando...' : connectionStatus.isConnected ? 'Ativo' : 'Inativo'}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {connectionStatus.isValidating ? 'Verificando...' : connectionStatus.isConnected ? 'Pronto' : connectionStatus.error || 'Configure'}
                      </p>
                    </div>
                    {connectionStatus.isConnected && <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></div>}
                  </div>
                  </div>

                {connectionStatus.isConnected && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Status</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs"><Check className="h-3 w-3 text-gray-600" /><span>API OK</span></div>
                      <div className="flex items-center gap-1.5 text-xs"><Check className="h-3 w-3 text-gray-600" /><span>WhatsApp OK</span></div>
                      <div className="flex items-center gap-1.5 text-xs"><Loader2 className="h-3 w-3 text-gray-600 animate-spin" /><span>Aguardando...</span></div>
                    </div>
                  </div>
                )}
              
                  

                <div className="flex items-center justify-between p-2.5 border border-gray-300 rounded-lg bg-white">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-900">Responder em grupos do WhatsApp</span>
                    <span className="text-[11px] text-gray-500">Quando desativado, o agente ignora conversas com chat_id terminando em @g.us.</span>
                  </div>
                  <button
                    onClick={() => updateFormData({ allowGroupMessages: !formData.allowGroupMessages })}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none ${formData.allowGroupMessages ? 'bg-slate-800' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition ${formData.allowGroupMessages ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">Modelo</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <ChatGPTIcon className="h-4 w-4 text-gray-500" />
                </div>
                  <select
                      value={formData.integration.selectedModel}
                      onChange={(e) => updateFormData({ integration: { ...formData.integration, selectedModel: e.target.value } })}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                    >
                      {OPENAI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} - {m.description}</option>)}
                  </select>
              </div>
            </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">Escopo</label>
                  <div className="flex items-center justify-between p-2.5 border border-gray-300 rounded-lg bg-white">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-100 rounded">
                        {formData.isCompanyWide ? <Building className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                      <span className="text-xs font-medium">{formData.isCompanyWide ? 'Empresa' : 'Pessoal'}</span>
                </div>
                    <button
                      onClick={() => updateFormData({ isCompanyWide: !formData.isCompanyWide })}
                      className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none ${formData.isCompanyWide ? 'bg-slate-800' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition ${formData.isCompanyWide ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleSaveSection('Integração')}
                    disabled={savingSection === 'Integração'}
                    className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSection === 'Integração' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvar
                  </button>
              </div>
            </div>

                {/* Coluna Direita - Informações do Modelo */}
                <div className="lg:col-span-1 space-y-2">
                  {/* Ícone e Nome do Modelo */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <ChatGPTIcon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{selectedModelInfo.name}</h4>
                        <p className="text-xs text-gray-600">{selectedModelInfo.description}</p>
                      </div>
                    </div>
                    
                    {/* Melhor uso */}
                    {selectedModelInfo.bestFor && (
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-md">
                          <span className="text-xs text-gray-600">Ideal para:</span>
                          <span className="text-xs font-medium text-gray-900">{selectedModelInfo.bestFor}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Divisor */}
                    <div className="border-t border-gray-100 my-2"></div>
                    
                    {/* Informações Técnicas */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Contexto</span>
                        <span className="text-xs font-medium text-gray-900">{selectedModelInfo.contextWindow}</span>
                      </div>
                      {selectedModelInfo.maxOutputTokens && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Saída Máx.</span>
                          <span className="text-xs font-medium text-gray-900">{selectedModelInfo.maxOutputTokens}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Velocidade</span>
                        <span className="text-xs font-medium text-gray-900">{selectedModelInfo.speed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Qualidade</span>
                        <span className="text-xs font-medium text-gray-900">{selectedModelInfo.quality}</span>
                      </div>
                      
                      {/* Custo */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-gray-600">Nível de Custo</span>
                        <div className="flex items-center gap-1">
                          {selectedModelInfo.costLevel === 'low' && (
                            <>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-200 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-200 rounded-sm"></div>
                            </>
                          )}
                          {selectedModelInfo.costLevel === 'medium' && (
                            <>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-200 rounded-sm"></div>
                            </>
                          )}
                          {selectedModelInfo.costLevel === 'high' && (
                            <>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                              <div className="w-1.5 h-3 bg-gray-700 rounded-sm"></div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preços */}
                  {selectedModelInfo.pricing && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-900 mb-2">Preços (por 1M tokens)</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Entrada</span>
                          <span className="text-xs font-medium text-gray-900">{selectedModelInfo.pricing.input}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Saída</span>
                          <span className="text-xs font-medium text-gray-900">{selectedModelInfo.pricing.output}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status da Conexão */}
                  {connectionStatus.isConnected && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></div>
                        <h4 className="text-xs font-semibold text-gray-900">Conexão Ativa</h4>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Última verificação</span>
                          <span className="text-gray-900 font-medium">
                            {connectionStatus.lastChecked ? new Date(connectionStatus.lastChecked).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Status API</span>
                          <span className="text-gray-900 font-medium">Operacional</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dica de uso */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      💡 <span className="font-medium text-gray-700">Dica:</span> Modelos mais rápidos são ideais para chat em tempo real, enquanto modelos de raciocínio (o1) são melhores para análises complexas.
                    </p>
                  </div>
                </div>
              </div>
            )}

              {activeTab === 'cargo' && (
                <div className="space-y-2" style={{ maxHeight: 'calc(100vh - 155px)', overflowY: 'auto', paddingLeft: '16px' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1">Nome do Agente</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => updateFormData({ name: e.target.value })}
                        placeholder="Ex: Assistente Virtual"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-900 mb-1">Função Principal</label>
                      <select
                        value={formData.function}
                        onChange={(e) => updateFormData({ function: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="Atendimento ao cliente via WhatsApp">Atendimento ao Cliente</option>
                        <option value="Suporte técnico">Suporte Técnico</option>
                        <option value="Vendas e prospecção">Vendas e Prospecção</option>
                        <option value="Marketing">Marketing e Comunicação</option>
                        <option value="Recursos Humanos">Recursos Humanos</option>
                        <option value="Assistente geral">Assistente Geral</option>
                      </select>
                    </div>
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-gray-900 mb-1">
                        <span>Personalidade e Comportamento</span>
                        <button
                          type="button"
                          onClick={() => { setFullscreenField('personality'); setFullscreenValue(formData.personality || ''); }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Maximizar"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </label>
                      <Textarea
                        value={formData.personality}
                        onChange={(e) => updateFormData({ personality: e.target.value })}
                        rows={3}
                        placeholder="Descreva como o agente deve se comportar e interagir..."
                        className="text-xs"
                        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                      />
                    </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                      <label className="block text-xs text-gray-700 mb-1">Estilo de Resposta</label>
                      <select
                        value={formData.responseStyle} 
                        onChange={(e) => updateFormData({ responseStyle: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="formal">🎩 Formal</option>
                        <option value="casual">👕 Casual</option>
                        <option value="friendly">😊 Amigável</option>
                        <option value="professional">💼 Profissional</option>
                        <option value="technical">⚙️ Técnico</option>
                        <option value="empathetic">💙 Empático</option>
                      </select>
                      </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Idioma</label>
                      <select
                        value={formData.language} 
                        onChange={(e) => updateFormData({ language: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="pt-PT">Português (PT)</option>
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Español</option>
                        <option value="fr-FR">Français</option>
                        <option value="de-DE">Deutsch</option>
                        <option value="it-IT">Italiano</option>
                      </select>
                    </div>
                      <div>
                      <label className="block text-xs text-gray-700 mb-1">Velocidade</label>
                        <select 
                        value={formData.responseSpeed} 
                        onChange={(e) => updateFormData({ responseSpeed: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="fast">⚡ Rápida</option>
                        <option value="normal">⏱️ Normal</option>
                        <option value="thoughtful">🤔 Reflexiva</option>
                        <option value="detailed">📋 Detalhada</option>
                        </select>
                      </div>
                      <div>
                      <label className="block text-xs text-gray-700 mb-1">Tamanho</label>
                        <select 
                        value={formData.maxResponseLength} 
                        onChange={(e) => updateFormData({ maxResponseLength: parseInt(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      >
                        <option value="150">📌 Muito Curta</option>
                        <option value="300">📝 Curta</option>
                        <option value="500">📄 Média</option>
                        <option value="800">📃 Longa</option>
                        <option value="1200">📚 Muito Longa</option>
                        </select>
                      </div>
                    </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="flex items-center justify-between text-xs text-gray-700 mb-1">
                        <span>Tom de Voz Específico</span>
                        <button
                          type="button"
                          onClick={() => { setFullscreenField('tone'); setFullscreenValue(formData.advancedSettings.tone || ''); }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Maximizar"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </label>
                      <Textarea
                        value={formData.advancedSettings.tone}
                        onChange={(e) => updateFormData({ advancedSettings: { ...formData.advancedSettings, tone: e.target.value } })}
                        rows={3}
                        placeholder="Ex: Direto e objetivo, empático..."
                        className="text-xs"
                        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs text-gray-700 mb-1">
                        <span>Regras e Restrições</span>
                        <button
                          type="button"
                          onClick={() => { setFullscreenField('rules'); setFullscreenValue(formData.advancedSettings.rules || ''); }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Maximizar"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </label>
                      <Textarea
                        value={formData.advancedSettings.rules}
                        onChange={(e) => updateFormData({ advancedSettings: { ...formData.advancedSettings, rules: e.target.value } })}
                        rows={3}
                        placeholder="Ex: Nunca responda sobre concorrentes..."
                        className="text-xs"
                        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="flex items-center justify-between text-xs text-gray-700 mb-1">
                        <span>Contexto da Empresa</span>
                        <button
                          type="button"
                          onClick={() => { setFullscreenField('companyContext'); setFullscreenValue(formData.advancedSettings.companyContext || ''); }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Maximizar"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </label>
                      <Textarea
                        value={formData.advancedSettings.companyContext}
                        onChange={(e) => updateFormData({ advancedSettings: { ...formData.advancedSettings, companyContext: e.target.value } })}
                        rows={3}
                        placeholder="Ex: Somos uma empresa de tecnologia que oferece..."
                        className="text-xs"
                        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs text-gray-700 mb-1">
                        <span>Setor de Atuação</span>
                        <button
                          type="button"
                          onClick={() => { setFullscreenField('sector'); setFullscreenValue(formData.advancedSettings.sector || ''); }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Maximizar"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                      </label>
                      <Textarea
                        value={formData.advancedSettings.sector}
                        onChange={(e) => updateFormData({ advancedSettings: { ...formData.advancedSettings, sector: e.target.value } })}
                        rows={3}
                        placeholder="Ex: Tecnologia, Varejo, Saúde..."
                        className="text-xs"
                        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                      <button
                      onClick={() => handleSaveSection('Cargo')}
                      disabled={savingSection === 'Cargo'}
                      className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingSection === 'Cargo' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Salvar
                      </button>
                    </div>
                  </div>
                    )}

            <Dialog open={!!fullscreenField} onOpenChange={(o) => { if (!o) setFullscreenField(null); }}>
              <DialogContent className="sm:max-w-[640px]">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-900">
                    {fullscreenField === 'personality' ? 'Personalidade e Comportamento' :
                     fullscreenField === 'tone' ? 'Tom de Voz Específico' :
                     fullscreenField === 'rules' ? 'Regras e Restrições' :
                     fullscreenField === 'companyContext' ? 'Contexto da Empresa' :
                     fullscreenField === 'sector' ? 'Setor de Atuação' : 'Editar'}
                  </label>
                  <Textarea
                    value={fullscreenValue}
                    onChange={(e) => setFullscreenValue(e.target.value)}
                    rows={10}
                    className="text-sm"
                    style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setFullscreenField(null)}>Fechar</Button>
                    <Button size="sm" onClick={() => {
                      if (fullscreenField === 'personality') {
                        updateFormData({ personality: fullscreenValue });
                      } else if (fullscreenField) {
                        updateFormData({ advancedSettings: { ...formData.advancedSettings, [fullscreenField]: fullscreenValue } as any });
                      }
                      setFullscreenField(null);
                    }}>Salvar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {activeTab === 'cerebro' && (
            <div className="space-y-2" style={{ maxHeight: 'calc(100vh - 155px)', overflowY: 'auto', paddingLeft: '16px' }}>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                    dragActive ? 'border-gray-500 bg-gray-100' : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 mb-2">Arraste arquivos ou clique para selecionar</p>
                  <input 
                    type="file" 
                    onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        
                        try {
                          toast.loading('Processando arquivo com IA...', { id: 'file-upload' });
                          
                          console.log('📁 [INPUT-FILE] Processando:', {
                            name: file.name,
                            type: file.type,
                            size: file.size
                          });
                          
                          // ✅ Chamar API para processar
                          const result = await processFile(file);
                          
                          console.log('✅ [INPUT-FILE] Processado:', result);
                          
                          // ✅ CORREÇÃO: Recarregar configuração do banco
                          console.log('🔄 Recarregando configuração após upload...');
                          await loadConfigs();
                          
                          toast.success('Arquivo processado!', { id: 'file-upload' });
                          
                          // Limpar input
                          e.target.value = '';
                        } catch (error: any) {
                          console.error('❌ [INPUT-FILE] Erro:', error);
                          toast.error(error.message || 'Erro ao processar', { id: 'file-upload' });
                          e.target.value = '';
                        }
                      }
                    }} 
                    className="hidden" 
                    id="file-upload" 
                  />
                  <label htmlFor="file-upload" className="inline-block px-3 py-1.5 bg-slate-800 text-white rounded-lg cursor-pointer hover:bg-slate-900 text-xs">Selecionar</label>
                            </div>

                {formData.knowledgeBase.files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <p className="text-xs font-medium truncate">{file.name}</p>
                        </div>
                              <button
                      onClick={async () => {
                        if (!confirm('Deseja remover este arquivo?')) return;
                        
                        try {
                          if (!user?.id) {
                            toast.error('Usuário não autenticado');
                            return;
                          }
                          
                          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/knowledge/${user.id}/remove-item`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'files', id: file.id })
                          });
                          
                          const result = await response.json();
                          
                          if (!response.ok) {
                            throw new Error(result.error || 'Erro ao remover');
                          }
                          
                          await loadConfigs();
                          toast.success('Arquivo removido!');
                        } catch (error: any) {
                          console.error('Erro ao remover arquivo:', error);
                          toast.error(error.message || 'Erro ao remover');
                        }
                      }}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                      <Trash2 className="h-3.5 w-3.5" />
                              </button>
                          </div>
                ))}

                {/* Web Scraping de Sites */}
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Websites para Análise (Web Scraping)
                  </label>
                  <p className="text-xs text-gray-600 mb-2">Adicione URLs de sites que a IA deve analisar e aprender</p>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newWebsite}
                        onChange={(e) => setNewWebsite(e.target.value)}
                        placeholder="https://exemplo.com"
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                      />
                      <button
                        onClick={async () => {
                          if (newWebsite.trim() && (newWebsite.startsWith('http://') || newWebsite.startsWith('https://'))) {
                            const urlToAdd = newWebsite.trim();
                            
                            // Adicionar imediatamente na lista local
                            const newWebsiteItem = {
                              id: Date.now().toString() + Math.random(),
                              url: urlToAdd,
                              addedAt: new Date().toISOString()
                            };
                            
                            const updatedWebsites = [...formData.knowledgeBase.websites, newWebsiteItem];
                            updateFormData({
                              knowledgeBase: {
                                ...formData.knowledgeBase,
                                websites: updatedWebsites
                              }
                            });
                            
                            // Salvar no localStorage
                            saveWebsitesToLocalStorage(updatedWebsites);
                            
                            setNewWebsite('');
                            toast.success('Website adicionado à lista!');
                            
                            // Fazer scraping em background (sem bloquear a UI)
                            try {
                              toast.loading('Analisando website em background...', { id: 'scraping' });
                              await scrapeWebsite(urlToAdd);
                              await loadConfigs();
                              toast.success('Website analisado com sucesso!', { id: 'scraping' });
                            } catch (error) {
                              console.error('Erro ao processar website:', error);
                              toast.error('Erro ao processar website (mas já foi adicionado à lista)', { id: 'scraping' });
                            }
                          } else {
                            toast.error('Digite uma URL válida (http:// ou https://)');
                          }
                        }}
                        disabled={isScrapingWebsite}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-xs flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                      >
                        {isScrapingWebsite ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Lista de Websites */}
                  <div className="space-y-2 mt-3">
                    {formData.knowledgeBase.websites.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Nenhum website adicionado ainda</p>
                        <p className="text-xs text-gray-400 mt-1">Adicione URLs acima para que a IA aprenda com o conteúdo</p>
                      </div>
                    ) : (
                      <>
                        {formData.knowledgeBase.websites.map(website => (
                          <div key={website.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{website.url}</p>
                                <p className="text-xs text-gray-500">Adicionado em {new Date(website.addedAt).toLocaleDateString('pt-BR')}</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!confirm('Deseja remover este website?')) return;
                                
                                // Remover imediatamente da lista local
                                const updatedWebsites = formData.knowledgeBase.websites.filter(w => w.id !== website.id);
                                updateFormData({
                                  knowledgeBase: {
                                    ...formData.knowledgeBase,
                                    websites: updatedWebsites
                                  }
                                });
                                
                                // Atualizar localStorage
                                saveWebsitesToLocalStorage(updatedWebsites);
                                
                                toast.success('Website removido!');
                                
                                // Tentar remover do banco também (se existir)
                                try {
                                  if (user?.id) {
                                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/knowledge/${user.id}/remove-item`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ type: 'websites', id: website.id })
                                    });
                                    
                                    if (response.ok) {
                                      await loadConfigs();
                                    }
                                  }
                                } catch (error: any) {
                                  console.error('Erro ao remover website do banco:', error);
                                  // Não mostrar erro, pois já removemos da lista local
                                }
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded flex-shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                          <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-1.5">Q&A</label>
                  <div className="space-y-2">
                              <input
                      value={newQA.question}
                      onChange={(e) => setNewQA({ ...newQA, question: e.target.value })}
                      placeholder="Pergunta"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400"
                    />
                                <textarea
                      value={newQA.answer}
                      onChange={(e) => setNewQA({ ...newQA, answer: e.target.value })}
                      rows={2}
                      placeholder="Resposta"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg outline-none focus:border-gray-400 resize-none"
                        />
                                  <button
                      onClick={async () => {
                        if (newQA.question && newQA.answer) {
                          try {
                            // ✅ CORREÇÃO CRÍTICA: Processar Q&A via backend
                            toast.loading('Processando Q&A com IA...', { id: 'qna' });
                            
                            console.log('❓ [Q&A] Processando:', {
                              question: newQA.question.substring(0, 50),
                              answer: newQA.answer.substring(0, 50),
                              category: newQA.category || 'geral'
                            });
                            
                            // ✅ Chamar API para processar (analisa com OpenAI)
                            const result = await processQnA(newQA.question, newQA.answer, newQA.category || 'geral');
                            
                            console.log('✅ [Q&A] Processado:', result);
                            
                            // ✅ CORREÇÃO: Recarregar configuração do banco
                            console.log('🔄 Recarregando configuração após Q&A...');
                            await loadConfigs();
                            
                            setNewQA({ question: '', answer: '', category: '' });
                            toast.success('Q&A processado e conhecimento integrado ao Cargo!', { id: 'qna' });
                          } catch (error: any) {
                            console.error('❌ [Q&A] Erro:', error);
                            toast.error(error.message || 'Erro ao processar Q&A', { id: 'qna' });
                          }
                        }
                      }}
                      className="w-full px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                                  </button>
                                </div>
                                
                  {formData.knowledgeBase.qa.map(qa => (
                    <div key={qa.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between mb-1">
                        <p className="text-xs font-medium">{qa.question}</p>
                                        <button
                          onClick={async () => {
                            if (!confirm('Deseja remover este Q&A?')) return;
                            
                            try {
                              if (!user?.id) {
                                toast.error('Usuário não autenticado');
                                return;
                              }
                              
                              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/knowledge/${user.id}/remove-item`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'qa', id: qa.id })
                              });
                              
                              const result = await response.json();
                              
                              if (!response.ok) {
                                throw new Error(result.error || 'Erro ao remover');
                              }
                              
                              await loadConfigs();
                              toast.success('Q&A removido!');
                            } catch (error: any) {
                              console.error('Erro ao remover Q&A:', error);
                              toast.error(error.message || 'Erro ao remover');
                            }
                          }}
                          className="text-gray-600 hover:bg-gray-100 rounded p-0.5"
                                        >
                          <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                      <p className="text-xs text-gray-600">{qa.answer}</p>
                                  </div>
                                ))}
                              </div>

                <div className="flex justify-end pt-2">
                                <button
                    onClick={() => handleSaveSection('Cérebro')}
                    disabled={savingSection === 'Cérebro'}
                    className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSection === 'Cérebro' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvar
                                </button>
                              </div>
                            </div>
                                )}

            {activeTab === 'acoes' && (
              <div className="flex flex-col" style={{ height: 'calc(100vh - 155px)', paddingLeft: '16px' }}>
                {/* Layout em 2 Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-hidden">
                  {/* COLUNA ESQUERDA: Ações Prontas */}
                  <div className="flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">Ações Configuradas</h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">{aiActions.length}</span>
                              </div>
                            </div>

                    <div className="flex-1 space-y-2 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 255px)' }}>
                      {aiActions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <CheckCircle className="h-6 w-6 text-gray-400" />
                            </div>
                          <p className="text-sm text-gray-600 font-medium">Nenhuma ação configurada</p>
                          <p className="text-xs text-gray-500 mt-1">Crie sua primeira ação à direita</p>
                                </div>
                      ) : (
                        aiActions.map((action, index) => (
                          <div 
                            key={action.id}
                            className={`group p-3 rounded-lg border transition-all flex-shrink-0 ${
                              action.enabled 
                                ? 'border-gray-200 bg-white shadow-sm hover:shadow' 
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">{action.name}</h4>
                                  <button
                                    onClick={() => setAiActions(prev => prev.filter((_, i) => i !== index))}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-600 mb-2 leading-relaxed">{action.description}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                                    {action.action === 'criar_lead' && 'Lead'}
                                    {action.action === 'criar_evento' && 'Evento'}
                                    {action.action === 'criar_contato' && 'Contato'}
                                    {action.action === 'atualizar_contato' && 'Atualizar'}
                                    {action.action === 'criar_atividade' && 'Atividade'}
                                    {action.action === 'criar_negocio' && 'Negócio'}
                                    {action.action === 'criar_empresa' && 'Empresa'}
                                    {action.action === 'criar_produto' && 'Produto'}
                                    {action.action === 'criar_pedido' && 'Pedido'}
                                    {action.action === 'enviar_mensagem' && 'Mensagem'}
                                  </span>
                                  {action.trigger.split(',').slice(0, 2).map((keyword, i) => (
                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-50 text-slate-600">
                                      {keyword.trim()}
                                    </span>
                                  ))}
                                  {action.trigger.split(',').length > 2 && (
                                    <span className="text-xs text-gray-500">+{action.trigger.split(',').length - 2}</span>
                                )}
                              </div>
                            </div>
                          <button
                                onClick={() => setAiActions(prev => prev.map(a => a.id === action.id ? { ...a, enabled: !a.enabled } : a))}
                                className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none flex-shrink-0 transition-colors ${
                                  action.enabled ? 'bg-slate-700' : 'bg-gray-300'
                                }`}
                              >
                                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
                                  action.enabled ? 'translate-x-4' : 'translate-x-0.5'
                                }`} />
                          </button>
                        </div>
                      </div>
                        ))
                            )}
                    </div>
                  </div>

                  {/* COLUNA DIREITA: Criar Nova Ação */}
                  <div className="flex flex-col min-h-0 overflow-hidden border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <h3 className="text-sm font-medium text-gray-900">Criar Nova Ação</h3>
                  </div>

                    <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 255px)' }}>
                      <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Nome da Ação</label>
                    <input
                      type="text"
                        value={newAction.name}
                        onChange={(e) => setNewAction({ ...newAction, name: e.target.value })}
                        placeholder="Ex: Registrar Interesse"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all flex-shrink-0"
                      />
              </div>

                      <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">O que ela faz?</label>
                      <textarea
                        value={newAction.description}
                        onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                        placeholder="Ex: Salva interesse do cliente no CRM"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 resize-none transition-all flex-shrink-0"
                      />
                  </div>

                      <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Quando ativar?</label>
                      <input
                        type="text"
                        value={newAction.trigger}
                        onChange={(e) => setNewAction({ ...newAction, trigger: e.target.value })}
                        placeholder="Ex: interesse, orçamento, preço"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all flex-shrink-0"
                      />
                        </div>
                                
                      {/* Checkboxes para escolher tipos de ações */}
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Escolha os tipos</label>
                        <div className="space-y-1 max-h-44 overflow-y-auto pr-1 border border-gray-100 rounded-lg p-2 bg-gray-50">
                          {[
                            { value: 'criar_lead', label: 'Registrar Lead', table: 'leads' },
                            { value: 'criar_contato', label: 'Adicionar Contato', table: 'contacts' },
                            { value: 'atualizar_contato', label: 'Atualizar Contato', table: 'contacts' },
                            { value: 'criar_evento', label: 'Agendar Evento', table: 'calendar_events' },
                            { value: 'criar_atividade', label: 'Criar Atividade', table: 'activities' },
                            { value: 'criar_negocio', label: 'Criar Negócio', table: 'deals' },
                            { value: 'criar_empresa', label: 'Registrar Empresa', table: 'companies' },
                            { value: 'criar_produto', label: 'Adicionar Produto', table: 'products' },
                            { value: 'criar_pedido', label: 'Registrar Pedido', table: 'orders' },
                            { value: 'enviar_mensagem', label: 'Enviar Mensagem', table: 'messages' }
                          ].map((option) => {
                            const selectedActions = Array.isArray(newAction.action) ? newAction.action : 
                              (newAction.action && typeof newAction.action === 'string') ? [newAction.action] : [];
                            const isChecked = selectedActions.includes(option.value);
                            
                            return (
                              <label
                                key={option.value}
                                className={`flex items-center gap-2.5 px-2 py-1.5 cursor-pointer rounded-md transition-all ${
                                  isChecked ? 'bg-slate-50 border border-slate-200' : 'hover:bg-white border border-transparent'
                                }`}
                              >
                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentActions = Array.isArray(newAction.action) ? newAction.action : 
                                      (newAction.action && typeof newAction.action === 'string') ? [newAction.action] : [];
                                    let updatedActions: string[];
                                    if (e.target.checked) {
                                      updatedActions = [...currentActions, option.value];
                                    } else {
                                      updatedActions = currentActions.filter(a => a !== option.value);
                                    }
                                    setNewAction({ 
                                      ...newAction, 
                                      action: updatedActions.length > 0 ? updatedActions : '' 
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-slate-700 border-gray-300 rounded focus:ring-1 focus:ring-slate-300"
                                />
                                <span className="text-xs text-gray-700 flex-1">{option.label}</span>
                              </label>
                            );
                          })}
              </div>
                    </div>

                      <button
                        onClick={() => {
                          const selectedActions = Array.isArray(newAction.action) ? newAction.action : 
                            (newAction.action && typeof newAction.action === 'string') ? [newAction.action] : [];
                          
                          if (newAction.name.trim() && newAction.description.trim() && newAction.trigger.trim() && selectedActions.length > 0) {
                            selectedActions.forEach((actionType, index) => {
                              setAiActions(prev => [...prev, {
                                id: Date.now().toString() + '-' + index + '-' + actionType,
                                name: newAction.name,
                                description: newAction.description,
                                trigger: newAction.trigger,
                                action: actionType,
                                parameters: {},
                                enabled: true
                              }]);
                            });
                            setNewAction({ name: '', description: '', trigger: '', action: '' });
                            toast.success(`${selectedActions.length} ação(ões) adicionada(s)!`);
                          } else {
                            toast.error('Preencha todos os campos e selecione pelo menos um tipo');
                          }
                        }}
                        disabled={!newAction.name.trim() || !newAction.description.trim() || !newAction.trigger.trim() || 
                                 (!newAction.action || (Array.isArray(newAction.action) && newAction.action.length === 0) || 
                                  (typeof newAction.action === 'string' && !newAction.action.trim()))}
                        className="w-full px-4 py-2.5 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors flex-shrink-0 mt-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Ação
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botão Salvar */}
                <div className="flex justify-end pt-4 flex-shrink-0">
                        <button
                    onClick={() => handleSaveSection('Ações')}
                    disabled={savingSection === 'Ações'}
                    className="px-5 py-2 text-sm font-medium bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm hover:shadow"
                        >
                    {savingSection === 'Ações' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar
                        </button>
                    </div>
                </div>
              )}

            {activeTab === 'avancado' && (
              <div className="space-y-2" style={{ maxHeight: 'calc(100vh - 155px)', overflowY: 'auto', paddingLeft: '16px' }}>
                {/* Exemplos de Conversação */}
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-4 w-4 text-slate-800" />
                  <h3 className="text-sm font-semibold text-gray-900">Exemplos de Conversação</h3>
            </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                    value={newExample.user}
                    onChange={(e) => setNewExample({ ...newExample, user: e.target.value })}
                    placeholder="Mensagem do usuário"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                  />
                      <input
                      type="text"
                    value={newExample.assistant}
                    onChange={(e) => setNewExample({ ...newExample, assistant: e.target.value })}
                    placeholder="Resposta do assistente"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                  </div>
                  <button
                  onClick={() => {
                    if (newExample.user.trim() && newExample.assistant.trim()) {
                      updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          conversationExamples: [...formData.advancedConfig.conversationExamples, { ...newExample }]
                        }
                      });
                      setNewExample({ user: '', assistant: '' });
                    }
                  }}
                  disabled={!newExample.user.trim() || !newExample.assistant.trim()}
                  className="w-full px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Exemplo
                  </button>

                {formData.advancedConfig.conversationExamples.length > 0 && formData.advancedConfig.conversationExamples.slice(0, 2).map((example, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0 text-sm">
                      <span className="text-gray-900">▸ {example.user}</span>
                      <span className="text-gray-600 ml-2">↳ {example.assistant}</span>
                  </div>
                        <button
                      onClick={() => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          conversationExamples: formData.advancedConfig.conversationExamples.filter((_, i) => i !== index)
                        }
                      })}
                      className="p-1 text-gray-600 hover:text-gray-900"
                    >
                      <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}

                {/* Mensagens Automáticas */}
                <div className="flex items-center gap-2 mb-1.5 mt-3">
                  <MessageSquare className="h-4 w-4 text-slate-800" />
                  <h3 className="text-sm font-semibold text-gray-900">Mensagens Automáticas</h3>
            </div>

                <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                    value={formData.advancedConfig.welcomeMessage}
                    onChange={(e) => updateFormData({
                      advancedConfig: { ...formData.advancedConfig, welcomeMessage: e.target.value }
                    })}
                    placeholder="Boas-vindas"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                  />
                <input
                    type="text"
                    value={formData.advancedConfig.goodbyeMessage}
                    onChange={(e) => updateFormData({
                      advancedConfig: { ...formData.advancedConfig, goodbyeMessage: e.target.value }
                    })}
                    placeholder="Despedida"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                  />
                    <input
                      type="text"
                    value={formData.advancedConfig.fallbackMessage}
                    onChange={(e) => updateFormData({
                      advancedConfig: { ...formData.advancedConfig, fallbackMessage: e.target.value }
                    })}
                    placeholder="Fallback"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                />
              </div>

                {/* Horário de Funcionamento */}
                <div className="flex items-center justify-between mb-1.5 mt-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-800" />
                    <h3 className="text-sm font-semibold text-gray-900">Horário de Funcionamento</h3>
                  </div>
                          <button
                    onClick={() => updateFormData({
                      advancedConfig: {
                        ...formData.advancedConfig,
                        workingHours: { ...formData.advancedConfig.workingHours, enabled: !formData.advancedConfig.workingHours.enabled }
                      }
                    })}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none ${
                      formData.advancedConfig.workingHours.enabled ? 'bg-slate-800' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition ${
                      formData.advancedConfig.workingHours.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                          </button>
      </div>

                {formData.advancedConfig.workingHours.enabled && (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="time"
                      value={formData.advancedConfig.workingHours.start}
                      onChange={(e) => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          workingHours: { ...formData.advancedConfig.workingHours, start: e.target.value }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                    <input
                      type="time"
                      value={formData.advancedConfig.workingHours.end}
                      onChange={(e) => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          workingHours: { ...formData.advancedConfig.workingHours, end: e.target.value }
                        }
                      })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.advancedConfig.workingHours.outsideMessage}
                      onChange={(e) => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          workingHours: { ...formData.advancedConfig.workingHours, outsideMessage: e.target.value }
                        }
                      })}
                      placeholder="Mensagem fora do horário"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                  </div>
                )}

                
                {/* Transferência para Humano */}
                <div className="flex items-center justify-between mb-1.5 mt-3">
              <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-slate-800" />
                    <h3 className="text-sm font-semibold text-gray-900">Transferência para Atendente</h3>
                  </div>
                <button
                    onClick={() => updateFormData({
                      advancedConfig: {
                        ...formData.advancedConfig,
                        transferToHuman: { ...formData.advancedConfig.transferToHuman, enabled: !formData.advancedConfig.transferToHuman.enabled }
                      }
                    })}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none ${
                      formData.advancedConfig.transferToHuman.enabled ? 'bg-slate-800' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition ${
                      formData.advancedConfig.transferToHuman.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                </button>
            </div>

                {formData.advancedConfig.transferToHuman.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.advancedConfig.transferToHuman.keywords.join(', ')}
                      onChange={(e) => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          transferToHuman: {
                            ...formData.advancedConfig.transferToHuman,
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                          }
                        }
                      })}
                      placeholder="Palavras-chave (separadas por vírgula)"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                    <input
                      type="text"
                      value={formData.advancedConfig.transferToHuman.message}
                      onChange={(e) => updateFormData({
                        advancedConfig: {
                          ...formData.advancedConfig,
                          transferToHuman: { ...formData.advancedConfig.transferToHuman, message: e.target.value }
                        }
                      })}
                      placeholder="Mensagem de transferência"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                  />
                </div>
              )}

                {/* Timeout de Inatividade */}
                <div className="flex items-center justify-between mb-1.5 mt-3">
              <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-slate-800" />
                    <h3 className="text-sm font-semibold text-gray-900">Timeout de Inatividade</h3>
                </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="120"
                      value={formData.advancedConfig.inactivityTimeout}
                      onChange={(e) => updateFormData({
                        advancedConfig: { ...formData.advancedConfig, inactivityTimeout: Math.min(120, Math.max(5, parseInt(e.target.value) || 30)) }
                      })}
                      className="w-24 px-2.5 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-gray-400"
                    />
                    <span className="text-sm text-gray-600">minutos</span>
              </div>
            </div>

                {/* Responder em Grupos */}
                <div className="flex items-center justify-between mb-1.5 mt-3">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-slate-800" />
                      <h3 className="text-sm font-semibold text-gray-900">Responder em Grupos do WhatsApp</h3>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">Quando desativado, o agente ignora mensagens de grupos (chat_id terminando em @g.us)</p>
                  </div>
                  <button
                    onClick={() => updateFormData({ allowGroupMessages: !formData.allowGroupMessages })}
                    className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full outline-none flex-shrink-0 ${
                      formData.allowGroupMessages ? 'bg-slate-800' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition ${
                      formData.allowGroupMessages ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex justify-end pt-2">
              <button
                    onClick={() => handleSaveSection('Avançado')}
                    disabled={savingSection === 'Avançado'}
                    className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingSection === 'Avançado' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar
                </button>
          </div>
        </div>
      )}

            {activeTab === 'teste' && (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm" style={{height: 'calc(100vh - 155px)', marginLeft: '16px'}}>
                <div className="h-full flex flex-col">
                  <div className="flex-1 p-3 space-y-2 bg-gray-50 overflow-y-auto">
                    {chatMessages.length === 0 && <div className="text-center py-6"><p className="text-xs text-gray-500">Inicie conversa</p></div>}
                    {chatMessages.map(message => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-2.5 py-1.5 rounded-lg ${message.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border'}`}>
                          <p className="text-xs">{message.content}</p>
              </div>
                </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="text-[11px] text-gray-500 px-2 py-1">
                          Digitando…
                        </div>
                      </div>
                    )}
              </div>

                  <div className="border-t p-2 bg-white">
                    <div className="flex gap-2">
                      <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendTestMessage()}
                        placeholder="Escreva sua mensagem de forma leve e tranquila…"
                        className="flex-1 h-8 text-xs"
                      />
                      {conversationId && (
                        <button
                          onClick={handleClearConversation}
                          className="px-2.5 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                          title="Limpar conversa"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                <button
                        onClick={handleSendTestMessage}
                        disabled={!testMessage.trim()}
                        className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50"
                      >
                        Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgent;
