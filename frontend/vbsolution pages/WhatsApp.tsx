"use client";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";
import { MessageCircle, Search, Paperclip, Mic, Phone, MoreVertical, Square, ArrowRight, Bot, User, Settings, Save, Plus, X, Edit3, ExternalLink, Bell, Home, ChevronDown, Check, Zap, FileText, AlignJustify, Send, Clock, MessageSquare, Pencil, Trash2, CheckSquare, Users, GitBranch } from "lucide-react";
import { useOptimizedWhatsAppConversations } from "@/hooks/useOptimizedWhatsAppConversations";
import type { Conversation } from "@/hooks/useOptimizedWhatsAppConversations";
import { useContactSync } from "@/hooks/useContactSync";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppGroup } from "@/hooks/useWhatsAppGroup";
import { resolveDisplayName } from "@/utils/identity";
import { getConversationDisplayName, extractPhoneNumber, normalizePhoneNumber, normalizePhoneNumberToJID } from '@/utils/jidUtils';
import { useIdentity } from "@/state/identityStore";
import { useContactSidebarData } from "@/whatsapi/useContactSidebarData";
import { useConnections } from "@/contexts/ConnectionsContext";
import { useConversationDrafts } from "@/hooks/useConversationDrafts";
import { useGroupParticipants } from "@/hooks/useGroupParticipants";
import { useSearchParams, useNavigate } from "react-router-dom";
import MediaViewer from "../components/MediaViewer";
import { WhatsAppProfilePicture } from "../components/WhatsAppProfilePicture";
import { WhatsAppOptimizedComposer } from "../components/WhatsAppOptimizedComposer";
import ConversationsList from "../components/ConversationsList";
import { WhatsAppTransferModal } from "../components/WhatsAppTransferModal";
import { WhatsAppContactInfoModal } from "../components/WhatsAppContactInfoModal";
import CreateLeadModal from "../components/CreateLeadModal";
import { CreateCompanyModal } from "../components/CreateCompanyModal";
import RegisterContactModal from "../components/RegisterContactModal";
import { Button } from '@/components/ui/button';
import { useCompanies } from '@/hooks/useCompanies';
import WhatsAppQuickConnectModal from '@/components/WhatsAppQuickConnectModal';
import { getBackupStats } from "../utils/unreadBackup";
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppPermissions, filterConversationsByPermissions } from "@/hooks/useWhatsAppPermissions";
import { logger } from "@/utils/logging";
import "@/utils/queryDebugger"; // Debugger para capturar queries malformadas
import "@/utils/logger"; // Sistema de logging controlado
import { safeEmit, getBaileysSocket, getSocketBaseUrl } from "@/lib/socketManager";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLinkPreview } from "@/hooks/useLinkPreview";
import MessageBubble from '@/components/MessageBubble';
import { LinkPreview, TruncatedUrl } from "@/components/LinkPreview";
import TemplateMessageEditor from "@/components/whatsapp/TemplateMessageEditor";
import { buildMessagePreview } from "@/utils/messagePreview";
import { API_CONFIG } from '@/config/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { useAIAgentConfig } from '@/hooks/useAIAgentConfig';
import { resolveConversationStatus } from '@/utils/whatsappStatus';
import { useNotificationStore } from '@/state/notificationStore';
import { useMessagesStore } from '@/state/messagesStore';

/************************************
 * Layout helpers & message bubble   *
 ************************************/
function useViewportHeightFor(ref: React.RefObject<HTMLElement>) {
  const [h, setH] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const fit = () => {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const next = Math.max(0, Math.ceil(vh - top + 1));
      setH(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    window.addEventListener("resize", fit);
    return () => { window.removeEventListener("resize", fit); ro.disconnect(); };
  }, [ref]);
  return h;
}

const isSameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const dayLabel = (d: Date) => { 
  const t = new Date(); 
  const y = new Date(); 
  y.setDate(t.getDate()-1); 
  if(isSameDay(d,t)) return "Hoje"; 
  if(isSameDay(d,y)) return "Ontem"; 
  return d.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" }); 
};

function groupByDay(list: any[]) { 
  const out: {key:string;date:Date;items:any[]}[]=[]; 
  for(const m of list){ 
    const d=new Date(m.timestamp); 
    const key=d.toISOString().slice(0,10); 
    const last=out[out.length-1]; 
    if(!last||last.key!==key) out.push({ key, date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items:[m]}); 
    else last.items.push(m);
  } 
  return out; 
}

function getInitials(name: string){ 
  return (name||"?").split(" ").map(w=>w.charAt(0)).join("").toUpperCase().slice(0,2);
}

function SoundToggle() {
  const soundEnabled = useNotificationStore((s) => s.soundEnabled);
  const setSoundEnabled = useNotificationStore((s) => s.setSoundEnabled);
  return (
    <button
      className={`px-2 py-1 rounded-md text-xs border ${soundEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
      onClick={() => setSoundEnabled(!soundEnabled)}
      title={soundEnabled ? 'Som habilitado' : 'Som desabilitado'}
    >
      {soundEnabled ? '🔊 Som' : '🔇 Som'}
    </button>
  );
}

// Função para obter o ícone da plataforma baseado no tipo de conexão
const getPlatformIcon = (connectionType?: string, isWhatsApp?: boolean) => {
  // Se for uma conexão WhatsApp Web, sempre mostrar o ícone do WhatsApp
  if (isWhatsApp || connectionType === 'whatsapp') {
    return (
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      </div>
    );
  }

  // Para outros tipos de conexão, retornar ícones específicos
  switch (connectionType) {
    case 'instagram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      );
    case 'telegram':
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-500 border-2 border-white rounded-full flex items-center justify-center">
          <MessageCircle className="w-2.5 h-2.5 text-white" />
        </div>
      );
  }
};




// Função centralizada para obter o nome de exibição
function getDisplayName(conversation: any, contactInfo?: any, getIdentity?: (key: string) => { name?: string | null; avatar?: string | null; } | undefined): string {
  return getConversationDisplayName(conversation, contactInfo, getIdentity);
}

interface WhatsAppDashboardProps {
  conversations: Conversation[];
}

const WhatsAppDashboard: React.FC<WhatsAppDashboardProps> = ({ conversations }) => {
  const { user } = useAuth();
  const { users: companyUsers } = useCompanyUsers(user?.id);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [pipeline, setPipeline] = useState('Pipeline Ativa');
  const [responsibleId, setResponsibleId] = useState('Todos');
  const [period, setPeriod] = useState('Todos');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (responsibleId && responsibleId !== 'Todos') {
           queryParams.append('responsibleId', responsibleId);
        }
        
        // Handle period (simple mapping for now)
        const now = new Date();
        let startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Month start default
        let endDate = now;
        
        if (period === 'Hoje') {
           startDate = new Date();
           startDate.setHours(0,0,0,0);
        } else if (period === 'Ontem') {
           startDate = new Date();
           startDate.setDate(startDate.getDate() - 1);
           startDate.setHours(0,0,0,0);
           endDate = new Date();
           endDate.setDate(endDate.getDate() - 1);
           endDate.setHours(23,59,59,999);
        } else if (period === 'Data') {
           if (customDate) {
              startDate = new Date(customDate);
              startDate.setHours(0,0,0,0);
              endDate = new Date(customDate);
              endDate.setHours(23,59,59,999);
           }
        }
        
        queryParams.append('startDate', startDate.toISOString());
        queryParams.append('endDate', endDate.toISOString());

        const res = await fetch(`${API_CONFIG.baseUrl}/atendimento/stats?${queryParams.toString()}`, {
          headers: getStoredAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [responsibleId, period, customDate]);

  // Mock stats if null (for initial render/error) or handle loading
  const displayStats = stats || {
    totalAtendimentos: 0,
    avgResponseTime: 0,
    finalizados: 0,
    pendentes: 0,
    aiInterventions: 0,
    aiAppointments: 0,
    chartData: [],
    statusDistribution: []
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50">
      {/* Filter Bar */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input 
                type="text" 
                className="flex w-full rounded-md border-input px-4 py-2 font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 pl-10 h-8 text-sm border-0 bg-transparent focus:border-0 focus:ring-0 text-black placeholder-gray-500" 
                placeholder="Filtrar por nome do lead, empresa..." 
                autoComplete="off" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
                <select 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   value={responsibleId}
                   onChange={(e) => setResponsibleId(e.target.value)}
                >
                   <option value="Todos">Responsável</option>
                   {companyUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                   ))}
                </select>
                <button type="button" className="flex items-center justify-between rounded-md border-input px-3 py-1.5 font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left select-trigger-fixed h-7 w-32 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-0.5 hover:bg-blue-50 focus:bg-blue-50">
                  <Users className="h-3 w-3 mr-3" />
                  <span style={{pointerEvents: "none"}}>{responsibleId === 'Todos' ? 'Responsável' : companyUsers.find(u => u.id === responsibleId)?.nome || 'Responsável'}</span>
                  <ChevronDown className="h-3 w-3 ml-0.5 opacity-50" />
                </button>
            </div>

            <div className="flex items-center gap-2 relative">
               <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      className="justify-center whitespace-nowrap font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-input hover:text-accent-foreground shadow-black/5 rounded-md h-7 px-2 text-xs shadow-none border-0 bg-transparent text-black hover:bg-blue-50 focus:bg-blue-50 flex items-center gap-2" 
                      type="button"
                    >
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span className="truncate">{period === 'Data' && customDate ? customDate.toLocaleDateString() : "Período"}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarUI
                      mode="single"
                      selected={customDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomDate(date);
                          setPeriod('Data');
                          setIsCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
               </Popover>
               
               <div className="relative">
                   <select
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={period}
                      onChange={(e) => {
                        setPeriod(e.target.value);
                        if (e.target.value !== 'Data') {
                          setCustomDate(undefined);
                        }
                      }}
                   >
                      <option value="Todos">Todos</option>
                      <option value="Hoje">Hoje</option>
                      <option value="Ontem">Ontem</option>
                      {customDate && <option value="Data">Data Específica</option>}
                   </select>
                   <button type="button" className="flex items-center justify-between rounded-md border-input px-3 py-1.5 font-medium ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:text-left select-trigger-fixed h-7 w-24 border-0 bg-transparent text-black text-xs shadow-none pl-2 pr-1 hover:bg-blue-50 focus:bg-blue-50">
                      <span style={{pointerEvents: "none"}}>{period === 'Data' && customDate ? customDate.toLocaleDateString() : period}</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                   </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
           {/* Card 1: Total Atendimento */}
           <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[120px] overflow-hidden">
              <CardHeader className="pb-2 px-4">
                 <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                    <span>Total de Atendimentos</span>
                    <div className="p-2 rounded-full bg-blue-100">
                       <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                 <p className="text-2xl font-bold text-gray-900">{displayStats.totalAtendimentos}</p>
              </CardContent>
           </Card>

           {/* Card 2: Tempo Médio Resposta */}
           <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[120px] overflow-hidden">
              <CardHeader className="pb-2 px-4">
                 <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                    <span>Tempo Médio Resp.</span>
                    <div className="p-2 rounded-full bg-green-100">
                       <Clock className="w-4 h-4 text-green-600" />
                    </div>
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                 <p className="text-2xl font-bold text-gray-900">{displayStats.avgResponseTime} min</p>
              </CardContent>
           </Card>

           {/* Card 3: Finalizados / Pendentes */}
           <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[120px] overflow-hidden">
              <CardHeader className="pb-2 px-4">
                 <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                    <span>Fin. / Pendentes</span>
                    <div className="p-2 rounded-full bg-amber-100">
                       <CheckSquare className="w-4 h-4 text-amber-600" />
                    </div>
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                 <p className="text-2xl font-bold text-gray-900">{displayStats.finalizados} / {displayStats.pendentes}</p>
              </CardContent>
           </Card>

           {/* Card 4: AI Interventions */}
           <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[120px] overflow-hidden">
              <CardHeader className="pb-2 px-4">
                 <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                    <span>Intervenção AI</span>
                    <div className="p-2 rounded-full bg-purple-100">
                       <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                 <p className="text-2xl font-bold text-gray-900">{displayStats.aiInterventions}</p>
              </CardContent>
           </Card>

           {/* Card 5: AI Appointments */}
           <Card className="bg-gradient-to-br from-white to-blue-50 border shadow-md hover:shadow-lg transition-shadow duration-300 h-[120px] overflow-hidden">
              <CardHeader className="pb-2 px-4">
                 <CardTitle className="text-sm font-normal flex items-center justify-between gap-2">
                    <span>Agendamentos AI</span>
                    <div className="p-2 rounded-full bg-indigo-100">
                       <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                 </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2 px-3">
                 <p className="text-2xl font-bold text-gray-900">{displayStats.aiAppointments}</p>
              </CardContent>
           </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line Chart */}
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal flex items-center gap-2">
                     Total de Atendimentos por Dia
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-0 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={displayStats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
                        <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: '12px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12 }} />
                        <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
                     </LineChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 border overflow-hidden">
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-normal flex items-center gap-2">
                     Distribuição por Status
                  </CardTitle>
               </CardHeader>
               <CardContent className="pt-0 h-80 flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={displayStats.statusDistribution}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {displayStats.statusDistribution?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e5e7eb', color: '#111827', fontSize: 12 }}
                            formatter={(value: number, name: string, props: any) => {
                                const total = displayStats.statusDistribution.reduce((acc: number, curr: any) => acc + curr.value, 0);
                                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${value} (${percent}%)`, name];
                            }}
                        />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                           <tspan x="50%" dy="-1em" fontSize="24" fontWeight="bold" fill="#374151">
                                {displayStats.statusDistribution?.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                           </tspan>
                           <tspan x="50%" dy="1.5em" fontSize="12" fill="#6b7280">
                                Total
                           </tspan>
                        </text>
                     </PieChart>
                  </ResponsiveContainer>
               </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

// ---- Modern Right panel (ManyChat style) ----
function ContactSummaryPanel({
  ownerId,
  conversation,
  messagesCount,
  onFinalizeConversation,
  onTransferConversation,
  onConvertToLead,
  getIdentity,
  groupMeta,
}: {
  ownerId?: string;
  conversation: { 
    chat_id: string; 
    nome_cliente?: string; 
    numero_cliente?: string; 
    lastMessageAt?: string; 
    status?: string;
    profile_picture?: string;
    whatsapp_business_name?: string;
    whatsapp_business_category?: string;
    whatsapp_business_email?: string;
    whatsapp_business_website?: string;
    whatsapp_business_description?: string;
    whatsapp_verified?: boolean;
    whatsapp_is_group?: boolean;
    whatsapp_group_subject?: string;
    whatsapp_group_description?: string;
  };
  messagesCount: number;
  onFinalizeConversation: () => void;
  onTransferConversation: () => void;
  onConvertToLead?: () => void;
  getIdentity?: (key: string) => { name?: string | null; avatar?: string | null; } | undefined;
  groupMeta?: any;
}) {
  // Get activeConnection from context
  const { activeConnection } = useConnections();
  
  // Check if it's a group
  const isGroup = conversation.chat_id?.includes('@g.us');
  
  // Use our new hook for participants
  const { participants, loading: participantsLoading } = useGroupParticipants(conversation.chat_id);

  // New component to encapsulate useIdentity for each participant
  const ParticipantItem: React.FC<{ participant: { id: string; name: string; admin?: string | null; profilePicture?: string | null } }> = ({ participant }) => {
    const id = useIdentity(participant.id) || {};
    const displayName = id.name || participant.name;
    const avatar = participant.profilePicture || id.avatar;

    return (
      <div className="flex items-center gap-2 py-1">
        <WhatsAppProfilePicture 
          jid={participant.id}
          profilePicture={avatar} 
          name={displayName} 
          size="sm" 
        />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm text-gray-900 truncate">{displayName}</span>
          {participant.admin && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
              👑 Admin
            </span>
          )}
        </div>
      </div>
    );
  };

  // 🔥 GUARD - Don't render if ownerId is not available
  if (!ownerId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Carregando informações do contato...</p>
        </div>
      </div>
    );
  }

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [contactInfo, setContactInfo] = useState<any>(null);
  const loadedContactsRef = useRef<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [aiAgentMode, setAiAgentMode] = useState<'human' | 'ai'>('human');
  
  // ✅ Hook para buscar contatos
  const { getContactByJid, getContactByPhone, updateContact, createContact } = useContactSync();
  const [isRegisteringContact, setIsRegisteringContact] = useState(false);
  const [showRegisterContactModal, setShowRegisterContactModal] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const navigate = useNavigate();
  
  // 🔥 RACE CONDITION PROTECTION - prevent wrong contact data
  const activeRequestIdRef = useRef<string | null>(null);
  
  // ✅ Ref para evitar loops de carregamento de contatos
  const contactLoadingRef = useRef<Set<string>>(new Set());
  const [systemFields] = useState([
    { key: "Primeiro Nome", value: conversation.nome_cliente?.split(' ')[0] || "—" },
    { key: "Sobrenome", value: conversation.nome_cliente?.split(' ').slice(1).join(' ') || "—" }
  ]);

  // 🔥 RACE CONDITION FIX - immediate headers, cancel numsbom for outsync applies to ManyChat deterministic
  useEffect(() => {
    const abortController = new AbortController();
    const currentRequestId = `${conversation.chat_id}_${Date.now()}`;
    activeRequestIdRef.current = currentRequestId; 
    
    const loadContactInfo = async () => {
      if (!conversation.chat_id || !ownerId) return;
      
      // ✅ Evitar loops de carregamento - usar chat_id como chave única
      const contactKey = conversation.chat_id;
      if (contactLoadingRef.current.has(contactKey)) {
        return;
      }
      
      contactLoadingRef.current.add(contactKey);
      setIsLoading(true);
      
      try {
        // Check if this request is still the current one
        if (activeRequestIdRef.current !== currentRequestId) {
          return;
        }
        
        // Para grupos, buscar pelo chat_id, para contatos individuais pelo numero_cliente
        // Buscar contato usando o hook - sempre usar JID para consistência
        const contact = await getContactByJid(conversation.chat_id, activeConnection?.owner_id);
        
        // 🔒 COMMIT contact data ONLY if still current
        if (activeRequestIdRef.current !== currentRequestId || abortController.signal.aborted) {
          return;
        }
        
        if (contact) {
          setContactInfo(contact);
          setNote(contact.notes || "");
          setTags(contact.tags || []);
          setCustomFields(contact.custom_fields || customFields);
          
          // Carregar estado do agente IA do localStorage primeiro, depois do banco
          const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAiAgentMode(savedMode);
          } else {
            setAiAgentMode(contact.ai_enabled ? 'ai' : 'human');
          }
        } else {
          // Se não encontrar contato, carregar do localStorage
          const savedMode = localStorage.getItem(`ai_agent_mode_${conversation.numero_cliente}`);
          if (savedMode && (savedMode === 'human' || savedMode === 'ai')) {
            setAiAgentMode(savedMode);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) return; 
        console.error('Erro ao carregar informações do contato:', error);
      } finally {
        if (activeRequestIdRef.current === currentRequestId && !abortController.signal.aborted) {
          setIsLoading(false);
        }
        // ✅ Remover da lista de carregamento
        contactLoadingRef.current.delete(contactKey);
      }
    };

    loadContactInfo();

    return () => {
      abortController.abort(); 
      if (activeRequestIdRef.current === currentRequestId) {
        activeRequestIdRef.current = null;
      }
    };
  }, [conversation.chat_id, getContactByJid, ownerId]);

  // Função para salvar informações de negócio permanentemente
  const saveBusinessInfoPermanently = useCallback(async (chatId: string, businessInfo: any) => {
    if (!ownerId || !businessInfo) return;
    
    try {
      // Salvar no Supabase para persistência permanente
      const { error } = await supabase
        .from('whatsapp_mensagens')
        .update({
          whatsapp_business_name: businessInfo.whatsapp_business_name,
          whatsapp_business_category: businessInfo.whatsapp_business_category,
          whatsapp_business_email: businessInfo.whatsapp_business_email,
          whatsapp_business_website: businessInfo.whatsapp_business_website,
          whatsapp_business_description: businessInfo.whatsapp_business_description,
          whatsapp_verified: businessInfo.whatsapp_verified,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('owner_id', ownerId);

      if (error) {
        console.error('❌ Erro ao salvar informações de negócio:', error);
      } else {
        console.log('✅ Informações de negócio salvas permanentemente para:', chatId);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar informações de negócio:', error);
    }
  }, [ownerId]);

  // Função para carregar informações de negócio salvas
  const loadSavedBusinessInfo = useCallback(async (chatId: string) => {
    if (!ownerId) return null;
    
    try {
      const { data, error } = await supabase
        .from('whatsapp_mensagens')
        .select('whatsapp_business_name, whatsapp_business_category, whatsapp_business_email, whatsapp_business_website, whatsapp_business_description, whatsapp_verified')
        .eq('chat_id', chatId)
        .eq('owner_id', ownerId)
        .single();

      if (error) {
        console.log('ℹ️ Nenhuma informação de negócio salva para:', chatId);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao carregar informações de negócio:', error);
      return null;
    }
  }, [ownerId]);

  // Buscar informações detalhadas do WhatsApp
  useEffect(() => {
    const loadWhatsAppInfo = async () => {
      if (!conversation.chat_id || !ownerId) return;
      
      // Se já carregamos informações para este contato, não recarregar
      if (loadedContactsRef.current.has(conversation.chat_id)) {
        console.log('📁 [LOAD-INFO] Contato já carregado, pulando recarregamento');
        return;
      }
      
      try {
        // Primeiro, tentar carregar informações salvas
        const savedInfo = await loadSavedBusinessInfo(conversation.chat_id);
        if (savedInfo) {
          console.log('📁 Informações de negócio carregadas do banco:', savedInfo);
          setContactInfo((prev: any) => ({
            ...prev,
            ...savedInfo
          }));
          loadedContactsRef.current.add(conversation.chat_id);
          return;
        }
        
        // Se não há informações salvas, buscar da tabela contacts
        const { data: contactData, error: contactError } = await supabase
          .from('contacts')
          .select('whatsapp_business_name, whatsapp_business_description, whatsapp_business_category, whatsapp_business_email, whatsapp_business_website, whatsapp_verified, whatsapp_is_group, whatsapp_group_subject, whatsapp_group_description, whatsapp_group_participants, whatsapp_profile_picture, whatsapp_status')
          .eq('owner_id', ownerId)
          .eq('whatsapp_jid', conversation.chat_id)
          .single();
        
        if (contactData && !contactError) {
          console.log('📁 Informações de negócio carregadas da tabela contacts:', contactData);
          setContactInfo((prev: any) => ({
            ...prev,
            whatsapp_business_name: contactData.whatsapp_business_name,
            whatsapp_business_description: contactData.whatsapp_business_description,
            whatsapp_business_category: contactData.whatsapp_business_category,
            whatsapp_business_email: contactData.whatsapp_business_email,
            whatsapp_business_website: contactData.whatsapp_business_website,
            whatsapp_verified: contactData.whatsapp_verified,
            whatsapp_is_group: contactData.whatsapp_is_group,
            whatsapp_group_subject: contactData.whatsapp_group_subject,
            whatsapp_group_description: contactData.whatsapp_group_description,
            whatsapp_group_participants: contactData.whatsapp_group_participants,
            whatsapp_profile_picture: contactData.whatsapp_profile_picture,
            whatsapp_status: contactData.whatsapp_status
          }));
          loadedContactsRef.current.add(conversation.chat_id);
          return;
        }
        
        // Se não há informações salvas, buscar do WhatsApp
        const response = await fetch(`/api/baileys-simple/test-conversations?ownerId=${ownerId}`);
        const data = await response.json();
        
        if (data.success && data.conversations) {
          const currentConv = data.conversations.find((conv: any) => conv.chat_id === conversation.chat_id);
          if (currentConv) {
            console.log('🔍 [DEBUG] Informações de negócio encontradas:', {
              whatsapp_business_name: currentConv.whatsapp_business_name,
              whatsapp_business_category: currentConv.whatsapp_business_category,
              whatsapp_business_email: currentConv.whatsapp_business_email,
              whatsapp_business_website: currentConv.whatsapp_business_website,
              whatsapp_business_description: currentConv.whatsapp_business_description
            });
            
            // Salvar permanentemente as informações de negócio
            if (currentConv.whatsapp_business_name || currentConv.whatsapp_business_category || 
                currentConv.whatsapp_business_email || currentConv.whatsapp_business_website || 
                currentConv.whatsapp_business_description) {
              await saveBusinessInfoPermanently(conversation.chat_id, currentConv);
            }
            
            setContactInfo((prev: any) => ({
              ...prev,
              whatsapp_name: currentConv.whatsapp_name,
              whatsapp_jid: currentConv.whatsapp_jid,
              profile_picture: currentConv.profile_picture,
              whatsapp_business_name: currentConv.whatsapp_business_name,
              whatsapp_business_description: currentConv.whatsapp_business_description,
              whatsapp_business_email: currentConv.whatsapp_business_email,
              whatsapp_business_website: currentConv.whatsapp_business_website,
              whatsapp_business_category: currentConv.whatsapp_business_category,
              whatsapp_verified: currentConv.whatsapp_verified,
              whatsapp_is_group: currentConv.chat_id?.includes('@g.us'),
              whatsapp_group_subject: currentConv.whatsapp_group_subject,
              whatsapp_group_description: currentConv.whatsapp_group_description,
              whatsapp_group_participants: currentConv.whatsapp_group_participants,
              whatsapp_status: currentConv.whatsapp_status
            }));
            loadedContactsRef.current.add(conversation.chat_id);
          }
        }
      } catch (error) {
        // Silent: Erro ao carregar informações do WhatsApp
        // Se o erro for de parsing JSON (HTML retornado em vez de JSON), não quebrar a aplicação
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
          // Silent: Server returned HTML instead of JSON - continuing with empty data
        }
      }
    };

    loadWhatsAppInfo();
  }, [conversation.chat_id, ownerId]);

  // Função para alternar modo do agente IA
  const toggleAiAgentMode = async (newMode: 'human' | 'ai') => {
    console.log('🤖 Alternando modo do agente IA para:', newMode);
    setAiAgentMode(newMode);
    
    // Salvar no localStorage para persistência
    const phoneNumber = conversation.numero_cliente || contactInfo?.phone || 'default';
    localStorage.setItem(`ai_agent_mode_${phoneNumber}`, newMode);
    console.log('🤖 Estado do agente IA salvo no localStorage para:', phoneNumber);
    
    if (contactInfo?.id) {
      try {
        console.log('🤖 Salvando estado do agente IA no banco de dados...');
        console.log('🤖 Contact ID:', contactInfo.id);
        console.log('🤖 New Mode:', newMode);
        console.log('🤖 AI Enabled:', newMode === 'ai');
        
        const result = await updateContact(contactInfo.id, { ai_enabled: newMode === 'ai' });
        console.log('🤖 Resultado da atualização:', result);
        
        // ✅ NOVO: Atualizar attendance_mode na conversa (atendimento)
        if (conversation.chat_id && ownerId && activeConnection?.id) {
          try {
            // Buscar ID do atendimento pelo chat_id
            const { data: atendimento } = await supabase
              .from('whatsapp_atendimentos')
              .select('id')
              .eq('chat_id', conversation.chat_id)
              .eq('connection_id', activeConnection.id)
              .maybeSingle();
            
            if (atendimento?.id) {
              const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
              const response = await fetch(`${API_URL}/api/conversations/${atendimento.id}/attendance-mode`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': ownerId
                },
                body: JSON.stringify({ mode: newMode })
              });
              
              if (response.ok) {
                console.log('✅ attendance_mode atualizado na conversa');
              } else {
                console.warn('⚠️ Erro ao atualizar attendance_mode:', await response.text());
              }
            }
          } catch (error) {
            console.error('⚠️ Erro ao atualizar attendance_mode (não crítico):', error);
          }
        }
        
        console.log('🤖 Estado do agente IA salvo com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao alterar modo do agente:', error);
        // Reverter em caso de erro
        setAiAgentMode(aiAgentMode);
      }
    } else {
      console.log('⚠️ Contato não encontrado, não é possível salvar estado do agente IA');
    }
  };

  // Função para registrar contato
  const registerContact = async () => {
    if (!conversation.numero_cliente) return;
    
    setIsRegisteringContact(true);
    try {
      const newContact = await createContact({
        name: conversation.nome_cliente || conversation.numero_cliente,
        phone: conversation.numero_cliente,
        whatsapp_name: conversation.nome_cliente,
        email: '',
        notes: note,
        tags: tags,
        custom_fields: customFields,
        ai_enabled: aiAgentMode === 'ai'
      });
      
      setContactInfo(newContact);
      alert('Contato registrado com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      alert('Erro ao registrar contato. Tente novamente.');
    } finally {
      setIsRegisteringContact(false);
    }
  };

  // Função para navegar para a página de contatos
  const navigateToContacts = () => {
    if (contactInfo?.id) {
      // Se o contato já está registrado, navegar para a página de contatos com o ID específico
      navigate(`/contacts?edit=${contactInfo.id}`);
    } else {
      // Se não está registrado, navegar para a página de contatos para criar um novo
      navigate('/contacts?create=true');
    }
  };

  const saveNote = async () => {
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { notes: note });
        alert("Nota salva com sucesso!");
      } catch (error) {
        console.error('Erro ao salvar nota:', error);
        alert("Erro ao salvar nota. Tente novamente.");
      }
    } else {
      console.log("Nota salva localmente:", note);
      alert("Nota salva localmente!");
    }
  };

  const addTag = async () => {
    if (tagInput.trim()) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput("");
      
      if (contactInfo?.id) {
        try {
          await updateContact(contactInfo.id, { tags: newTags });
        } catch (error) {
          console.error('Erro ao salvar tags:', error);
        }
      }
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    
    if (contactInfo?.id) {
      try {
        await updateContact(contactInfo.id, { tags: newTags });
      } catch (error) {
        console.error('Erro ao remover tag:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header com foto e nome */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4">
            <WhatsAppProfilePicture
              jid={conversation.chat_id}
              name={getDisplayName(conversation, contactInfo, getIdentity)}
              size="md"
              profilePicture={conversation.profile_picture}
              showPresence={true}
              className="w-12 h-12 rounded-xl shadow-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {getDisplayName(conversation, contactInfo, getIdentity)}
              </h3>
              <p className="text-xs text-gray-600">{extractPhoneNumber(conversation.phone || conversation.numero_cliente)}</p>
              
              {/* Business Email */}
              {contactInfo?.whatsapp_business_email && (
                <p className="text-xs text-gray-500 truncate">📧 {contactInfo?.whatsapp_business_email}</p>
              )}
              
              {/* Business Website */}
              {contactInfo?.whatsapp_business_website && (
                <p className="text-xs text-blue-600 hover:text-blue-800 truncate">
                  <a href={contactInfo?.whatsapp_business_website} target="_blank" rel="noopener noreferrer">
                    🌐 {contactInfo?.whatsapp_business_website}
                  </a>
                </p>
              )}
              
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5"/>
            </button>
            <SoundToggle />
          </div>
        </div>
        
        {/* Status badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            contactInfo 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              contactInfo ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            {contactInfo ? 'Contato Registrado' : 'Não Registrado'}
          </span>
          
          {/* Group Badge - Removido conforme solicitado */}
          
          {/* Business Badge */}
          {contactInfo?.whatsapp_business_name && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              {contactInfo?.whatsapp_business_category || 'Negócio'}
            </span>
          )}
          
          {/* Verified Badge */}
          {conversation.whatsapp_verified && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              ✅ Verificado
            </span>
          )}
          
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            WhatsApp
          </span>
        </div>


      </div>

      {/* Conteúdo scrollável */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        





        {/* Group Description Section */}
        {isGroup && (groupMeta?.description || conversation.whatsapp_group_description) && (
          <section className="p-3 border-b border-slate-200">
            <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Descrição do Grupo
            </h4>
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {groupMeta?.description || conversation.whatsapp_group_description}
              </p>
            </div>
          </section>
        )}

        {/* Group Participants Section */}
        {isGroup && participants.length > 0 && (
          <section className="p-3 border-b border-slate-200">
            <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              Participantes ({participants.length})
            </h4>
            
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {participants.map((participant, index) => (
                  <div key={`${participant.jid}-${participant.admin}-${index}`} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <WhatsAppProfilePicture
                      jid={participant.jid}
                      name={participant.name || participant.phone}
                      size="sm"
                      className="w-7 h-7"
                      profilePicture={participant.profilePicture}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {participant.name || `+${participant.phone}`}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {participant.name ? `+${participant.phone}` : 'Usuário'}
                      </p>
                    </div>
                    {participant.admin && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        participant.admin === 'superadmin'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {participant.admin === 'superadmin' ? '👑 Admin' : '⭐ Mod'}
                      </span>
                    )}
                  </div>
              ))}
            </div>
          </section>
        )}

        {/* Business Info */}
        {(() => {
          const hasBusinessInfo = contactInfo?.whatsapp_business_name || contactInfo?.whatsapp_business_category || contactInfo?.whatsapp_business_email || contactInfo?.whatsapp_business_website || contactInfo?.whatsapp_business_description;
          return hasBusinessInfo;
        })() && (
          <section className="p-3 border-b border-slate-200">
            <h4 className="text-xs font-semibold text-slate-900 mb-2">Informações do Negócio</h4>
            <div className="space-y-2">
              {contactInfo?.whatsapp_business_name && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500">Nome do Negócio</p>
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {contactInfo.whatsapp_business_name}
                    </p>
                  </div>
                </div>
              )}

              {contactInfo?.whatsapp_business_category && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500">Categoria</p>
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {contactInfo.whatsapp_business_category}
                    </p>
                  </div>
                </div>
              )}

              {contactInfo?.whatsapp_business_email && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500">Email</p>
                    <a 
                      href={`mailto:${contactInfo.whatsapp_business_email}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 truncate block"
                    >
                      {contactInfo.whatsapp_business_email}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo?.whatsapp_business_website && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500">Website</p>
                    <a 
                      href={contactInfo.whatsapp_business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 truncate block"
                    >
                      {contactInfo.whatsapp_business_website}
                    </a>
                  </div>
                </div>
              )}

              {contactInfo?.whatsapp_business_description && (
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500">Descrição</p>
                    <p className="text-xs font-medium text-slate-900 line-clamp-2">
                      {contactInfo.whatsapp_business_description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tags Section */}
        <section className="p-3 border-b border-slate-200">
          <h4 className="text-xs font-semibold text-slate-900 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhuma tag adicionada</p>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          
          {tagInput !== "" && (
            <div className="flex gap-1.5">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Nova tag..."
                className="flex-1 px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag();
                  }
                }}
              />
              <button
                onClick={addTag}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs"
              >
                +
              </button>
            </div>
          )}
          
          {tagInput === "" && (
            <button
              onClick={() => setTagInput(" ")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              + Adicionar Tag
            </button>
          )}
        </section>

        {/* Notes Section */}
        <section className="p-3">
          <h4 className="text-xs font-semibold text-slate-900 mb-2">Notas</h4>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicionar notas..."
            className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-none"
          />
          <button
            onClick={() => {
              if (contactInfo?.id) {
                updateContact(contactInfo.id, { notes: note });
                // toast.success('Nota salva!');
              }
            }}
            className="mt-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium"
          >
            Salvar Nota
          </button>
        </section>

      </div>

      {/* Footer com ações */}
      <div className="p-4 border-t bg-gray-50 space-y-2">
        {!contactInfo && (
          <button 
            onClick={registerContact}
            disabled={isRegisteringContact}
            className="w-full text-white rounded-md py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 hover:opacity-90"
            style={{ backgroundColor: '#4A5477' }}
          >
            {isRegisteringContact ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Registrando...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Contato</span>
              </>
            )}
          </button>
        )}
        

        <button 
          onClick={onFinalizeConversation} 
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-md py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Finalizar Conversa</span>
        </button>
        
        <button 
          onClick={onConvertToLead} 
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Converter em Lead</span>
        </button>
      </div>
    </div>
  );
}

/************************************
 * Page component                    *
 ************************************/


// Function to render messages with clickable links (fallback)
// Componente da seção Disparo
interface DisparoSectionProps {
  activeConnection: any;
  sendMessageTo: (chatId: string, text: string, uiType?: string, mediaUrl?: string) => Promise<void>;
  user: any;
  onDisparoSuccess: (payload: { chatId: string; contact: any; text: string; type: 'text' | 'image' | 'video' | 'document'; mediaUrl?: string | null }) => void;
}

function DisparoSection({ activeConnection, sendMessageTo, user, onDisparoSuccess }: DisparoSectionProps) {
  const { topBarColor } = useTheme();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateMessage, setTemplateMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'document' | null>(null);
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [searchContact, setSearchContact] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const API_URL = API_CONFIG.API_URL;

  // Helper para headers
  const buildDisparoHeaders = () => {
    const headers: Record<string, string> = {};
    if (companyId) headers['x-company-id'] = companyId;
    if (user?.id) headers['x-user-id'] = user.id;
    return headers;
  };

  // Função de envio de MÍDIA (separada)
  const sendDisparoMedia = async (chatId: string, text: string, type: string, file: File | null, url: string | null) => {
    if (!activeConnection?.id) throw new Error("Nenhuma conexão ativa");
    
    // Se tiver arquivo, usar FormData
    if (file) {
      const formData = new FormData();
      formData.append('connectionId', activeConnection.id);
      formData.append('jid', chatId);
      formData.append('type', type);
      formData.append('caption', text);
      formData.append('file', file);
      
      const headers = buildDisparoHeaders();
      
      const res = await fetch(`${API_URL}/api/baileys-simple/send-media`, {
        method: "POST",
        headers: headers,
        body: formData
      });
      
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || j.message || "Erro ao enviar mídia");
      return j;
    } 
    // Se for URL (template)
    else if (url) {
      const headers = buildDisparoHeaders();
      headers['Content-Type'] = 'application/json';
      
      // Usar endpoint de mídia também, pois suporta URL
      const res = await fetch(`${API_URL}/api/baileys-simple/send-media`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          connectionId: activeConnection.id,
          jid: chatId,
          type: type,
          caption: text,
          url: url
        })
      });
      
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || j.message || "Erro ao enviar mídia por URL");
      return j;
    }
    
    throw new Error("Mídia inválida (sem arquivo nem URL)");
  };

  // Função de envio de TEXTO (separada)
  const sendDisparoText = async (chatId: string, text: string) => {
    if (!activeConnection?.id) throw new Error("Nenhuma conexão ativa");
    
    const headers = buildDisparoHeaders();
    headers['Content-Type'] = 'application/json';
    
    const res = await fetch(`${API_URL}/api/baileys-simple/connections/${activeConnection.id}/send-message`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        chatId,
        text,
        type: 'text'
      })
    });
    
    const j = await res.json();
    if (!res.ok || (j.success === false)) throw new Error(j.error || "Erro ao enviar mensagem");
    return j;
  };

  // Carregar templates salvos
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user?.id) return;
      
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id_empresa')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.id_empresa) {
          console.error('Erro ao buscar id_empresa do usuário:', userError);
          return;
        }

        // Set companyId for Disparo headers
        setCompanyId(userData.id_empresa);

        const { data, error } = await supabase
          .from('whatsapp_message_templates')
          .select('*')
          .eq('id_empresa', userData.id_empresa)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setTemplates(data);
        } else if (error) {
          console.error('Erro ao carregar templates:', error);
        }
      } catch (err) {
        console.error('Erro ao carregar templates:', err);
      }
    };

    loadTemplates();
  }, [user]);

  // Carregar contatos
  useEffect(() => {
    const loadContacts = async () => {
      if (!user?.id) return;
      
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id_empresa')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.id_empresa) {
          console.error('Erro ao buscar id_empresa do usuário:', userError);
          return;
        }

        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id_empresa', userData.id_empresa)
          .order('name', { ascending: true });

        if (!error && data) {
          setContacts(data);
        } else if (error) {
          console.error('Erro ao carregar contatos:', error);
          setContacts([]);
        }
      } catch (err) {
        console.error('Erro ao carregar contatos:', err);
        setContacts([]);
      }
    };

    loadContacts();
  }, [user]);

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTemplateMessage(template.message);
      setTemplateName(template.name);
      setMediaPreview(template.media_url || null);
      setMediaType(template.media_type as any || null);
      setMediaFile(null); // Reset file input as we are using stored URL
      setIsCreatingTemplate(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setTemplateName("");
    setTemplateMessage("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setIsCreatingTemplate(true);
  };

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTemplateMessage(template.message);
      setTemplateName(template.name);
      setMediaPreview(template.media_url || null);
      setMediaType(template.media_type as any || null);
      setMediaFile(null);
      setIsCreatingTemplate(true);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este template?')) {
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: userData } = await supabase
        .from('users')
        .select('id_empresa')
        .eq('id', user.id)
        .single();

      if (!userData?.id_empresa) {
        throw new Error('Não foi possível obter id_empresa do usuário');
      }

      const { error } = await supabase
        .from('whatsapp_message_templates')
        .delete()
        .eq('id', templateId)
        .eq('id_empresa', userData.id_empresa);

      if (error) throw error;

      const { data } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('id_empresa', userData.id_empresa)
        .order('created_at', { ascending: false });

      if (data) {
        setTemplates(data);
        if (selectedTemplate === templateId) {
          handleCreateTemplate();
        }
      }

      toast({ title: "Sucesso", description: "Template excluído com sucesso" });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao excluir template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
      
      if (file.type.startsWith('image/')) setMediaType('image');
      else if (file.type.startsWith('video/')) setMediaType('video');
      else setMediaType('document');
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateMessage.trim() && !mediaFile && !mediaPreview) {
      toast({
        title: "Erro",
        description: "Adicione uma mensagem ou arquivo",
        variant: "destructive"
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do template é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) return;

    try {
      setLoading(true);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id_empresa')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.id_empresa) {
        throw new Error('Não foi possível obter id_empresa do usuário');
      }

      let mediaUrl = mediaPreview; // Use existing URL if editing and no new file
      let type = mediaType;

      if (mediaFile) {
        console.log('📤 [TEMPLATE] Iniciando upload de arquivo:', mediaFile.name);
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `templates/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('whatsapp-media')
          .upload(filePath, mediaFile, {
            upsert: true
          });

        if (uploadError) {
          console.error('❌ [TEMPLATE] Erro no upload:', uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('whatsapp-media')
          .getPublicUrl(filePath);
        
        if (!data.publicUrl) {
          console.error('❌ [TEMPLATE] Erro ao obter URL pública');
          throw new Error('Não foi possível obter URL do arquivo');
        }

        mediaUrl = data.publicUrl;
        console.log('✅ [TEMPLATE] Upload concluído, URL:', mediaUrl);
      }

      const templateData = {
        id_empresa: userData.id_empresa,
        name: templateName,
        message: templateMessage,
        media_url: mediaUrl,
        media_type: type,
        created_by: user.id
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from('whatsapp_message_templates')
          .update({
            name: templateName,
            message: templateMessage,
            media_url: mediaUrl,
            media_type: type,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate)
          .eq('id_empresa', userData.id_empresa);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Template atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('whatsapp_message_templates')
          .insert(templateData);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Template salvo com sucesso" });
      }

      const { data, error: loadError } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('id_empresa', userData.id_empresa)
        .order('created_at', { ascending: false });

      if (data) {
        setTemplates(data);
        handleCreateTemplate();
      }
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message || "Erro ao salvar template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = (contact: any) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };
  
  const handleToggleSelectAll = () => {
    const allSelected = filteredContacts.length > 0 && filteredContacts.every(fc => selectedContacts.some(sc => sc.id === fc.id));
    if (allSelected) {
      const filteredIds = new Set(filteredContacts.map(fc => fc.id));
      setSelectedContacts(selectedContacts.filter(sc => !filteredIds.has(sc.id)));
    } else {
      const merged = [...selectedContacts];
      filteredContacts.forEach(fc => {
        if (!merged.some(sc => sc.id === fc.id)) merged.push(fc);
      });
      setSelectedContacts(merged);
    }
  };

  const handleSendMessages = async (immediate: boolean = true) => {
    if (!activeConnection?.id) {
      toast({ title: "Erro", description: "Nenhuma conexão ativa", variant: "destructive" });
      return;
    }

    if (!templateMessage.trim() && !mediaPreview) {
      toast({ title: "Erro", description: "Selecione ou crie um template", variant: "destructive" });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um contato", variant: "destructive" });
      return;
    }

    if (!immediate) {
      if (!scheduledDate || !scheduledTime) {
        toast({ title: "Erro", description: "Preencha data e hora", variant: "destructive" });
        return;
      }
      setShowScheduleModal(false);
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const contact of selectedContacts) {
      const phone = normalizePhoneNumber(contact.phone || '');
      const contactName = contact.name || contact.phone || "Contato";

      if (!phone) {
        toast({
            title: "Erro",
            description: `Contato ${contactName} não possui telefone válido.`,
            variant: "destructive"
        });
        errorCount++;
        continue;
      }

      const chatId = normalizePhoneNumberToJID(phone);
      const type = mediaType === 'image' ? 'image' : 
                   mediaType === 'video' ? 'video' : 
                   mediaType === 'document' ? 'document' : 'text';

      try {
        if (immediate) {
          if (type !== 'text') {
            const msg = formatTemplateMessage(templateMessage, contact);
            await sendDisparoMedia(chatId, msg, type, mediaFile, mediaPreview || null);
          } else {
            const msg = formatTemplateMessage(templateMessage, contact);
            await sendDisparoText(chatId, msg);
          }
        } else {
          if (type !== 'text') {
            const msg = formatTemplateMessage(templateMessage, contact);
            await sendDisparoMedia(chatId, msg, type, mediaFile, mediaPreview || null);
          } else {
            const msg = formatTemplateMessage(templateMessage, contact);
            await sendDisparoText(chatId, msg);
          }
        }

        // Alerta de Sucesso Individual
        toast.success(`Disparo efetuado com sucesso á ${contactName}`);
        successCount++;
        onDisparoSuccess({
          chatId,
          contact,
          text: formatTemplateMessage(templateMessage, contact),
          type,
          mediaUrl: mediaPreview || null
        });

      } catch (err: any) {
        console.error(`Erro ao enviar para ${contactName}:`, err);
        // Alerta de Erro Individual
        toast({
          title: "Erro no envio",
          description: `Falha ao enviar para ${contactName}: ${err.message || "Erro desconhecido"}`,
          variant: "destructive"
        });
        errorCount++;
      }
    }

    setLoading(false);
    setSelectedContacts([]);

    // Resumo final apenas se houve múltiplos envios para não poluir
    if (selectedContacts.length > 1) {
      toast({
        title: "Disparo Finalizado",
        description: `${successCount} enviados com sucesso, ${errorCount} falhas.`,
      });
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchContact.toLowerCase()) ||
    contact.phone?.includes(searchContact)
  );

  const formatTemplateMessage = useCallback((msg: string, contact: any) => {
    if (!msg) return msg;
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    let out = msg;
    const base: Record<string, string> = {
      '@nome': contact?.name || '',
      '@telefone': contact?.phone || '',
      '@empresa': contact?.company || contact?.company_name || '',
      '@hoje': `${dd}/${mm}/${yyyy}`
    };
    for (const k in base) {
      out = out.replace(new RegExp(k, 'g'), base[k]);
    }
    out = out.replace(/@([a-zA-Z0-9_]+)/g, (m, p1) => {
      const v = contact && contact[p1];
      return v != null ? String(v) : m;
    });
    return out;
  }, []);

  return (
    <div className="flex h-full font-sans bg-gray-50 text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif' }}>
      {/* Left: Templates */}
      <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
          <Button 
            onClick={handleCreateTemplate} 
            size="sm" 
            className="h-9 text-white"
            style={{ backgroundColor: topBarColor }}
          >
            Criar Novo
          </Button>
        </div>
        
        {isCreatingTemplate ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Promoção Mensal"
                className="bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              {/*
                Editor rico com variáveis/emoji/preview
              */}
              <TemplateMessageEditor
                value={templateMessage}
                onChange={setTemplateMessage}
                variables={['@nome','@telefone','@empresa','@hoje']}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anexo</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="template-file-upload"
                  accept="image/*,video/*,application/*"
                />
                <label
                  htmlFor="template-file-upload"
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm"
                >
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  {mediaFile ? mediaFile.name : "Anexar arquivo/foto"}
                </label>
                {(mediaPreview || mediaFile) && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setMediaFile(null);
                    setMediaPreview(null);
                    setMediaType(null);
                  }}>
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
              {mediaPreview && mediaType === 'image' && (
                <img src={mediaPreview} alt="Preview" className="mt-2 h-32 object-contain rounded border" />
              )}
            </div>
            <div className="pt-2 flex gap-2">
              <Button 
                onClick={handleSaveTemplate} 
                disabled={loading} 
                className="flex-1 h-9 text-white"
                style={{ backgroundColor: topBarColor }}
              >
                Salvar Template
              </Button>
              <Button 
                onClick={() => setIsCreatingTemplate(false)} 
                className="h-9 text-white"
                style={{ backgroundColor: topBarColor }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum template encontrado.</div>
            ) : (
              templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedTemplate === template.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-blue-900">{template.name}</h3>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEditTemplate(template.id); }} className="p-1 hover:text-blue-600 text-gray-400" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }} className="p-1 hover:text-red-600 text-gray-400" title="Excluir">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.message}</p>
                  {template.media_url && (
                    <div className="mt-2 text-xs text-blue-900">
                      Arquivo anexado
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Contacts */}
      <div className="w-1/2 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Contatos</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {selectedContacts.length} selecionados
              </span>
              <Button 
                size="sm" 
                className="h-8 px-3 text-white flex items-center gap-2" 
                style={{ backgroundColor: topBarColor }}
                onClick={handleToggleSelectAll}
                title="Selecionar todos"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="text-xs">Selecionar Todos</span>
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Buscar contatos..."
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum contato encontrado.</div>
          ) : (
            filteredContacts.map(contact => {
              const isSelected = selectedContacts.some(c => c.id === contact.id);
              return (
                <div
                  key={contact.id}
                  onClick={() => isSelected ? handleRemoveContact(contact.id) : handleAddContact(contact)}
                  className={`p-3 mb-1 rounded-md cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div>
                    <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{contact.name}</div>
                    <div className="text-xs text-gray-500">{contact.phone}</div>
                  </div>
                  {isSelected && <div className="text-xs text-blue-900">Selecionado</div>}
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            <Button
              onClick={() => handleSendMessages(true)}
              disabled={loading || selectedContacts.length === 0}
              className="flex-1 h-9 text-white"
              style={{ backgroundColor: topBarColor }}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Agora
            </Button>
            
            <Popover open={showScheduleModal} onOpenChange={setShowScheduleModal}>
              <PopoverTrigger asChild>
                <Button
                  disabled={loading || selectedContacts.length === 0}
                  className="flex-1 h-9 text-white"
                  style={{ backgroundColor: topBarColor }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Agendado
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-3" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-blue-900 text-sm">Agendar Envio</h4>
                  <CalendarUI
                    mode="single"
                    selected={scheduledDate ? new Date(scheduledDate + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                        setScheduledDate(d);
                      }
                    }}
                    className="rounded-md border p-0 w-full"
                    classNames={{
                      head_cell: "text-[11px] text-gray-500 font-normal",
                      cell: "text-center text-[12px] p-0 relative",
                      day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md",
                      day_selected: "bg-blue-900 text-white hover:bg-blue-900 focus:bg-blue-900",
                      day_today: "bg-gray-100 text-gray-900",
                    }}
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-8 text-[12px]"
                  />
                  <Button 
                    onClick={() => handleSendMessages(false)}
                    disabled={!scheduledDate || !scheduledTime}
                    size="sm" 
                    className="w-full text-white h-8"
                    style={{ backgroundColor: topBarColor }}
                  >
                    Confirmar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMessageWithLinks(text: string) {
  if (!text) return text;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function WhatsAppPage() {
  const { activeConnection, loadConnections, updateConnectionStatus } = useConnections();
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { createCompany } = useCompanies();
  const permissions = useWhatsAppPermissions();
  const [searchParams] = useSearchParams();
  const { activeConfig } = useAIAgentConfig();
  const aiAgentName = activeConfig?.name;
  const {
    conversations, messages, selectedChatId, loading,
    selectConversation, sendMessageTo, markConversationRead,
    connectSocket, disconnectSocket, loadConversations,
    setConversations, setSelectedChatId, setMessages,
    loadMessages, loadOlderMessages, getIdentity,
    updateConversationStatus
  } = useOptimizedWhatsAppConversations();
  
  const groupedMessages = useMemo(() => groupByDay(messages), [messages]);
  const storeGetMessages = useMessagesStore((s) => s.getMessages);
  const storeBulkSet = useMessagesStore((s) => s.bulkSet);
  
  // Hook para identidade da conversa atual
  const currentConversationIdentity = useIdentity(selectedChatId);
  useEffect(() => {
    const listener = (ev: Event) => {
      const detail: any = (ev as CustomEvent).detail;
      const msg = detail?.message;
      if (!msg) return;
      const chatId = msg.chat_id;
      if (!chatId || String(chatId) !== String(selectedChatId)) return;
      const ts = msg.timestamp || msg.created_at || new Date().toISOString();
      const id = msg.id || msg.message_id || `${ts}-${String(msg.conteudo || msg.content || msg.text || '').trim()}`;
      const nextMsg = { ...(msg || {}), chat_id: chatId, timestamp: ts, id };
      setMessages((prev: any[]) => {
        const keyOf = (m: any) => String(m.id || m.message_id || `${m.timestamp}-${String(m.conteudo || m.content || m.text || '').trim()}`);
        const k = keyOf(nextMsg);
        const exists = prev.some((m) => keyOf(m) === k);
        const arr = exists ? prev : [...prev, nextMsg];
        return arr.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });
    };
    window.addEventListener('wpp:global-message', listener as EventListener);
    return () => window.removeEventListener('wpp:global-message', listener as EventListener);
  }, [selectedChatId, setMessages]);
  useEffect(() => {
    if (selectedChatId) {
      const seeded = storeGetMessages(selectedChatId);
      if (Array.isArray(seeded) && seeded.length > 0) {
        setMessages(seeded as any);
      }
    }
  }, [selectedChatId]);
  useEffect(() => {
    if (selectedChatId && Array.isArray(messages)) {
      storeBulkSet(selectedChatId, messages as any);
    }
  }, [selectedChatId, messages]);

  // ✅ NOVO: Verificar se acabou de conectar via QR Code e fazer reload completo para limpar cache
  useEffect(() => {
    try {
      const justConnected = sessionStorage.getItem('whatsapp_just_connected');
      const connectionId = sessionStorage.getItem('whatsapp_connection_id');
      
      if (justConnected === 'true') {
        console.log('🔄 [WhatsApp] Conexão recém-estabelecida detectada. Fazendo reload completo (F5) para limpar cache de conversas...');
        
        // Limpar cache de conversas do localStorage antes do reload
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('whatsapp_messages_cache') || 
                key.startsWith('whatsapp_selected_chat') ||
                (connectionId && key.includes(connectionId))) {
              localStorage.removeItem(key);
              console.log(`🗑️ [WhatsApp] Cache removido: ${key}`);
            }
          });
        } catch (cacheErr) {
          console.warn('⚠️ [WhatsApp] Erro ao limpar cache do localStorage:', cacheErr);
        }
        
        // Limpar o flag ANTES do reload para evitar loop
        sessionStorage.removeItem('whatsapp_just_connected');
        sessionStorage.removeItem('whatsapp_connection_id');
        
        // Fazer reload completo (F5) - isso limpa todo o cache do navegador
        setTimeout(() => {
          window.location.reload();
        }, 300); // Pequeno delay para garantir que os caches foram limpos
      }
    } catch (err) {
      console.error('❌ [WhatsApp] Erro ao verificar flag de conexão:', err);
    }
  }, []); // Executar apenas uma vez ao montar o componente

  // DEBUG: Log conversations quando mudarem
  useEffect(() => {
    console.log('🔍 [DEBUG-WhatsApp] Conversas atualizadas:', {
      total: conversations.length,
      conversations: conversations.map(c => ({
        id: c.chat_id,
        nome: c.nome_cliente,
        lastMessage: c.lastMessagePreview,
        unread: c.unread
      }))
    });
  }, [conversations]);

  // ✅ BUGFIX 2: Restaurar mensagens quando a página volta ao foco
  // ✅ CORREÇÃO: Recarregar conversas e mensagens quando página volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeConnection?.id) {
        // Página voltou ao foco
        console.log('👁️ [VISIBILITY] Página voltou ao foco, recarregando conversas e mensagens');
        
        // ✅ NOVO: Recarregar conversas do Supabase primeiro
        if (activeConnection?.id_usuario || activeConnection?.owner_id) {
          const ownerId = activeConnection.id_usuario || activeConnection.owner_id;
          loadConversations(ownerId).catch(error => {
            console.error('❌ [VISIBILITY] Erro ao recarregar conversas do Supabase:', error);
          });
        }
        
        // ✅ Se há conversa selecionada, restaurar mensagens também
        if (selectedChatId && activeConnection?.id) {
          // ✅ PRIMEIRO: Tentar carregar do localStorage (instantâneo)
          try {
            const MESSAGES_CACHE_KEY = 'whatsapp_messages_cache';
            const cacheKey = `${MESSAGES_CACHE_KEY}_${activeConnection.id}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
              const parsed = JSON.parse(cached);
              const storedMessages = parsed?.data?.[selectedChatId] || [];
              
              if (storedMessages.length > 0) {
                console.log(`💾 [VISIBILITY] ${storedMessages.length} mensagens restauradas do localStorage`);
                setMessages(storedMessages);
                
                // Scroll para o final
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    const messagesContainer = document.querySelector('[data-messages-container]') as HTMLElement;
                    if (messagesContainer) {
                      messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                  }, 100);
                });
              }
            }
          } catch (err) {
            console.error('❌ [VISIBILITY] Erro ao carregar do localStorage:', err);
          }
          
          // ✅ DEPOIS: Recarregar do backend para sincronizar (background)
          loadMessages(selectedChatId, false).catch(error => {
            console.error('❌ [VISIBILITY] Erro ao recarregar mensagens:', error);
          });
        }
      }
    };

    // ✅ Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // ✅ Também restaurar quando a página volta do "back" do navegador
    const handleFocus = () => {
      if (activeConnection?.id) {
        console.log('🔍 [FOCUS] Página recebeu foco, recarregando conversas e mensagens');
        
        // ✅ NOVO: Recarregar conversas do Supabase primeiro
        if (activeConnection?.id_usuario || activeConnection?.owner_id) {
          const ownerId = activeConnection.id_usuario || activeConnection.owner_id;
          loadConversations(ownerId).catch(error => {
            console.error('❌ [FOCUS] Erro ao recarregar conversas do Supabase:', error);
          });
        }
        
        // ✅ Se há conversa selecionada, restaurar mensagens também
        if (selectedChatId && activeConnection?.id) {
          // ✅ PRIMEIRO: Tentar carregar do localStorage (instantâneo)
          try {
            const MESSAGES_CACHE_KEY = 'whatsapp_messages_cache';
            const cacheKey = `${MESSAGES_CACHE_KEY}_${activeConnection.id}`;
            const cached = localStorage.getItem(cacheKey);
            
            if (cached) {
              const parsed = JSON.parse(cached);
              const storedMessages = parsed?.data?.[selectedChatId] || [];
              
              if (storedMessages.length > 0) {
                console.log(`💾 [FOCUS] ${storedMessages.length} mensagens restauradas do localStorage`);
                setMessages(storedMessages);
                
                // Scroll para o final
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    const messagesContainer = document.querySelector('[data-messages-container]') as HTMLElement;
                    if (messagesContainer) {
                      messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                  }, 100);
                });
              }
            }
          } catch (err) {
            console.error('❌ [FOCUS] Erro ao carregar do localStorage:', err);
          }
          
          // ✅ DEPOIS: Recarregar do backend para sincronizar (background)
          loadMessages(selectedChatId, false).catch(error => {
            console.error('❌ [FOCUS] Erro ao recarregar mensagens:', error);
          });
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedChatId, activeConnection?.id, activeConnection?.id_usuario, activeConnection?.owner_id, loadMessages, loadConversations, setMessages]);

  const { syncWhatsAppContact, getContactByPhone, getContactByJid, updateContact } = useContactSync();
  const { meta: groupMeta, participants } = useWhatsAppGroup(selectedChatId, getIdentity);
  const { sidebarExpanded, setSidebarExpanded, expandSidebarFromMenu } = useSidebar();
  
  // Estado para controlar visibilidade do painel de contato
  const [showContactPanel, setShowContactPanel] = useState(false);
  
  // Estados para transferência de conversa
  const [showQuickConnectModal, setShowQuickConnectModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  
  // Estado para modal de informações do contato
  const [showContactInfoModal, setShowContactInfoModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  // Estados para modais de conversão
  const [showConvertToLeadModal, setShowConvertToLeadModal] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [showRegisterContactModal, setShowRegisterContactModal] = useState(false);

  // 🔥 GUARD - don't spam connections durante renders
  const hasValidConnection = activeConnection?.owner_id && activeConnection?.id;
  
  // Ref for messages container
  const listRef = useRef<HTMLDivElement>(null);
  
  // Track whether user is "stuck" to bottom
  const isStuckToBottomRef = useRef(true);
  
  // True only while fetching older messages
  const loadingOlderRef = useRef(false);
  
  // Set when we send a message ourselves
  const justSentRef = useRef(false);
  
  // Helpers for scroll control
  const isNearBottom = (el: HTMLElement, threshold = 80) =>
    el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };
  
  // Scroll listener to update "stickiness"
  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isStuckToBottomRef.current = isNearBottom(el); // true when user is at bottom
  }, []);

  // Scroll handler for loading older messages
  const onScrollLoadOlder = useCallback(async () => {
    const el = listRef.current;
    if (!el || loadingOlderRef.current) return;
    if (el.scrollTop <= 80) {
      loadingOlderRef.current = true;
      
      const prevScrollHeight = el.scrollHeight;
      const prevTop = el.scrollTop;
      
      await loadOlderMessages(selectedChatId!);
      
      // After React renders, restore position
      requestAnimationFrame(() => {
        const newScrollHeight = el.scrollHeight;
        el.scrollTop = newScrollHeight - prevScrollHeight + prevTop;
        loadingOlderRef.current = false;
      });
    }
  }, [loading, selectedChatId, activeConnection?.owner_id, loadOlderMessages]);

  // Função para toggle da sidebar
  const handleSidebarToggle = () => {
    if (expandSidebarFromMenu) {
      expandSidebarFromMenu();
    } else {
      setSidebarExpanded(true);
    }
  };

  // Add scroll listeners
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scroll', onScrollLoadOlder, { passive: true });
    
    // initialize stickiness
    requestAnimationFrame(() => (isStuckToBottomRef.current = isNearBottom(el)));
    
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scroll', onScrollLoadOlder);
    };
  }, [onScroll, onScrollLoadOlder]);
  
  // Validação de conexão silenciosa
  
  // ✅ Callbacks estáveis para evitar re-renderizações
  const handleMessage = useCallback((message: any) => {
    // ✅ VALIDAÇÃO CRÍTICA: Verificar se mensagem é pós-conexão ANTES de adicionar
    const connectedAt = activeConnection?.whatsappInfo?.connectedAt || activeConnection?.connectedAt;
    if (connectedAt) {
      const messageTimestamp = new Date(message.timestamp || new Date().toISOString()).getTime();
      const connectionTimestamp = new Date(connectedAt).getTime();
      const margin = 5000; // 5 segundos de margem
      
      if (messageTimestamp < (connectionTimestamp - margin)) {
        console.log('🚫 [HANDLE-MESSAGE] Mensagem pré-conexão ignorada:', {
          messageTimestamp: new Date(message.timestamp).toISOString(),
          connectionTimestamp: new Date(connectedAt).toISOString(),
          diff: messageTimestamp - connectionTimestamp
        });
        return; // Ignorar mensagens pré-conexão
      }
    } else {
      // Se não tem connectedAt mas está conectado, aceitar apenas mensagens das últimas 24h
      const isConnected = activeConnection?.isConnected || 
                          activeConnection?.connectionState === 'open' || 
                          activeConnection?.connectionState === 'connected';
      
      if (isConnected) {
        const yesterday = Date.now() - (24 * 60 * 60 * 1000);
        const messageTimestamp = new Date(message.timestamp || new Date().toISOString()).getTime();
        
        if (messageTimestamp < yesterday) {
          console.log('🚫 [HANDLE-MESSAGE] Mensagem muito antiga (mais de 24h), ignorando:', {
            messageTimestamp: new Date(message.timestamp).toISOString()
          });
          return; // Ignorar mensagens muito antigas
        }
      }
    }
    
    // Silent: Nova mensagem recebida
    setMessages(prev => {
      // ✅ CORREÇÃO CRÍTICA: Filtrar mensagens antigas do estado ANTES de adicionar nova
      const filteredPrev = prev.filter((m: any) => {
        if (!m?.timestamp) return false;
        const msgTimestamp = new Date(m.timestamp).getTime();
        const connectedAt = activeConnection?.whatsappInfo?.connectedAt || activeConnection?.connectedAt;
        const connectionTimestamp = connectedAt ? new Date(connectedAt).getTime() : 0;
        const margin = 5000;
        
        if (connectionTimestamp && connectionTimestamp > 0) {
          return msgTimestamp >= (connectionTimestamp - margin);
        } else {
          const isConnected = activeConnection?.isConnected || 
                              activeConnection?.connectionState === 'open' || 
                              activeConnection?.connectionState === 'connected';
          if (isConnected) {
            const yesterday = Date.now() - (24 * 60 * 60 * 1000);
            return msgTimestamp >= yesterday;
          }
        }
        return false;
      });
      
      // ✅ CORREÇÃO CRÍTICA: Remover mensagens temporárias correspondentes
      // Isso evita duplicação quando a mensagem real chega via socket
      const finalPrev = filteredPrev.filter((m: any) => {
        const isTemp = m.id?.startsWith?.('temp-') || m.id?.startsWith?.('temp_');
        if (!isTemp) return true;

        if (m.chat_id === message.chat_id && (message.fromMe || message.isFromMe || message.remetente === 'ATENDENTE')) {
          if (message.tempId && (m.id === message.tempId || m.message_id === message.tempId)) {
            return false;
          }

          const messageMediaUrl =
            message.media_url ||
            message.mediaUrl ||
            message.imageUrl ||
            message.videoUrl ||
            message.audioUrl ||
            message.documentUrl ||
            message.stickerUrl;

          const tempMediaUrl =
            m.media_url ||
            m.mediaUrl ||
            m.imageUrl ||
            m.videoUrl ||
            m.audioUrl ||
            m.documentUrl ||
            m.stickerUrl;

          const hasMedia = !!messageMediaUrl;
          const tempHasMedia = !!tempMediaUrl;

          if (hasMedia && tempHasMedia) {
            const sameMedia = messageMediaUrl === tempMediaUrl;
            const timeDiff = Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime());
            if (sameMedia || timeDiff < 60000) {
              console.log('🗑️ [HANDLE-MESSAGE] Substituindo mensagem temporária de mídia:', m.id);
              return false;
            }
          }

          if (!hasMedia && m.conteudo === message.conteudo) {
            const timeDiff = Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime());
            if (timeDiff < 5000) {
              console.log('🗑️ [HANDLE-MESSAGE] Substituindo mensagem temporária de texto:', m.id);
              return false;
            }
          }
        }
        return true;
      });

      // Verificar se a mensagem já existe para evitar duplicatas (na lista limpa)
      const exists = finalPrev.some(m => {
        // Check by ID first
        if (m.id === message.id || (m.tempId && m.tempId === message.tempId)) {
          return true;
        }

        // ✅ NEW: Check by message_id (Baileys ID) para evitar duplicidade de áudios/mídias
        if (m.message_id && message.message_id && m.message_id === message.message_id) {
          return true;
        }

        // Check by content and timestamp for duplicates
        const sameContent = m.conteudo === message.conteudo;
        const sameTime = Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 30000;
        const sameSender = m.remetente === message.remetente;
        return sameContent && sameTime && sameSender;
      });
      if (exists) {
        // Silent: Mensagem duplicada ignorada
        return finalPrev;
      }
      
      const newMessages = [...finalPrev, message];
      // Sort messages by timestamp to maintain chronological order
      return newMessages.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });
    });
    
    // Scroll para baixo automaticamente quando receber nova mensagem
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 100);
  }, [activeConnection?.whatsappInfo?.connectedAt, activeConnection?.connectedAt, activeConnection?.isConnected, activeConnection?.connectionState, scrollToBottom]);

  const handleMessageUpdate = useCallback((messageId: string, update: any) => {
    setMessages(prev => {
      const updatedMessages = prev.map(m => m.id === messageId || m.tempId === messageId ? { ...m, ...update } : m);
      // Sort messages by timestamp to maintain chronological order after updates
      return updatedMessages.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampA - timestampB;
      });
    });
  }, []);

  const handleTyping = useCallback((chatId: string, isTyping: boolean) => {
    if (chatId === selectedChatId) {
      // TODO: Show typing indicator
    }
  }, [selectedChatId]);

  

  const pageRef = useRef<HTMLDivElement>(null);
  const pageH = useViewportHeightFor(pageRef);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const { drafts, setDraft, getDraft, clearDraft } = useConversationDrafts();
  const [statusFilter, setStatusFilter] = useState<"ATENDENDO"|"AGUARDANDO"|"FINALIZADO">("AGUARDANDO");
  
  // Estado para controlar a seção atual (Atendendo, Disparo)
  const [currentSection, setCurrentSection] = useState<'atendendo' | 'disparo'>('atendendo');
  
  // Estados para os dropdowns do top bar
  const [closeOpenDropdown, setCloseOpenDropdown] = useState(false);
  const [attendanceModeDropdown, setAttendanceModeDropdown] = useState(false);
  const [closingNotesModal, setClosingNotesModal] = useState(false);
  const [closingNotesSummary, setClosingNotesSummary] = useState("");
  const [conversationCategory, setConversationCategory] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<'human' | 'ai'>('human');
  const [showClosingNotesBox, setShowClosingNotesBox] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState<Array<{ id: string; name?: string; phone?: string; whatsapp_name?: string; whatsapp_jid?: string }>>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const q = search.trim();
      if (!q) {
        setContactSuggestions([]);
        return;
      }
      setSuggestionsLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          setContactSuggestions([]);
          return;
        }
        let companyId: string | null = null;
        try {
          const { data } = await supabase
            .from('users')
            .select('id_empresa')
            .eq('id', userId)
            .maybeSingle();
          companyId = (data as any)?.id_empresa || null;
        } catch {}
        if (!companyId) {
          try {
            const { data: orgRow } = await supabase
              .from('organizations')
              .select('id_empresa')
              .eq('id_usuario', userId)
              .maybeSingle();
            companyId = (orgRow as any)?.id_empresa || companyId;
          } catch {}
        }
        if (!companyId) {
          try {
            const { data: ownerRow } = await supabase
              .from('owner_users')
              .select('id_empresa')
              .eq('id_usuario', userId)
              .maybeSingle();
            companyId = (ownerRow as any)?.id_empresa || companyId;
          } catch {}
        }
        let query = supabase
          .from('contacts')
          .select('id, name, phone, whatsapp_name, whatsapp_jid');
        if (companyId) {
          query = query.eq('id_empresa', companyId);
        }
        const like = `%${q}%`;
        query = query.or(`name.ilike.${like},whatsapp_name.ilike.${like},phone.ilike.${like}`);
        const { data, error } = await query.limit(10);
        if (!cancelled) {
          if (error) {
            setContactSuggestions([]);
          } else {
            setContactSuggestions(data || []);
          }
        }
      } catch {
        if (!cancelled) setContactSuggestions([]);
      } finally {
        if (!cancelled) setSuggestionsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [search, user?.id]);

  // 🔥 INSTANT CONVERSATION SELECTION - Immediate lookup without delays 
  const currentConversation = useMemo(() => {
    const result = selectedChatId ? conversations.find(c=>c.chat_id===selectedChatId) || null : null;
    // Debug log removido para console silencioso
    return result;
  }, [selectedChatId, conversations]);

  // ✅ NOVO: Carregar estado inicial do attendanceMode baseado na hierarquia
  useEffect(() => {
    const loadAttendanceMode = async () => {
      if (!currentConversation || !activeConnection?.id) {
        setAttendanceMode('human');
        return;
      }

      if (activeConnection?.attendance_type === 'ai') {
        setAttendanceMode('ai');
        return;
      }

      const ownerId = activeConnection?.owner_id || activeConnection?.id_usuario;
      if (!ownerId) {
        setAttendanceMode('human');
        return;
      }

      try {
        // 1. Verificar attendance_mode da conversa (prioridade máxima)
        const { data: atendimento } = await supabase
          .from('whatsapp_atendimentos')
          .select('id, attendance_mode')
          .eq('chat_id', currentConversation.chat_id)
          .eq('connection_id', activeConnection.id)
          .maybeSingle();

        if (atendimento?.attendance_mode) {
          console.log('✅ Modo carregado da conversa:', atendimento.attendance_mode);
          setAttendanceMode(atendimento.attendance_mode as 'human' | 'ai');
          return;
        }

        // 2. Se não tem configuração específica, verificar attendance_type da conexão
        const { data: session } = await supabase
          .from('whatsapp_sessions')
          .select('attendance_type')
          .eq('connection_id', activeConnection.id)
          .eq('id_usuario', ownerId)
          .maybeSingle();

        if (session?.attendance_type) {
          console.log('✅ Modo carregado da conexão:', session.attendance_type);
          setAttendanceMode(session.attendance_type as 'human' | 'ai');
          return;
        }

        // 3. Fallback para 'human'
        console.log('✅ Usando modo padrão: human');
        setAttendanceMode('human');
      } catch (error) {
        console.error('⚠️ Erro ao carregar modo de atendimento:', error);
        setAttendanceMode('human');
      }
    };

    loadAttendanceMode();
  }, [currentConversation?.chat_id, activeConnection?.id, activeConnection?.owner_id, activeConnection?.id_usuario]);

  // Ref para evitar sincronização duplicada
  const conversationsSyncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (!detail) return;
      const { connectionId, attendanceType } = detail;
      if (activeConnection?.id && connectionId === activeConnection.id) {
        setAttendanceMode(attendanceType === 'ai' ? 'ai' : 'human');
      }
    };
    window.addEventListener('attendance-type-changed', handler as EventListener);
    return () => {
      window.removeEventListener('attendance-type-changed', handler as EventListener);
    };
  }, [activeConnection?.id, currentConversation?.chat_id]);

  // Sincronizar contatos do WhatsApp com a tabela de contatos - UMA VEZ APENAS
  useEffect(() => {
    if (activeConnection?.owner_id && conversations.length > 0) {
      // Sync only new conversations (not in cache)
      const syncQueue = conversations.filter(conv => 
        !conversationsSyncedRef.current.has(conv.chat_id)
      );
      
      syncQueue.forEach(async (conv) => {
        try {
          await syncWhatsAppContact({
            chat_id: conv.chat_id,
            name: conv.nome_cliente || conv.numero_cliente,
            phone: conv.numero_cliente,
            whatsapp_name: conv.nome_cliente,
            last_message_at: conv.lastMessageAt,
            unread_count: conv.unread,
            owner_id: activeConnection.owner_id,
          });
          conversationsSyncedRef.current.add(conv.chat_id);
        } catch (error) {
          // Silent error
        }
      });
    }
  }, [activeConnection?.owner_id]); // Only run when owner changes

  // ✅ CORREÇÃO: Carregar estado do attendanceMode baseado na hierarquia correta
  useEffect(() => {
    const loadAttendanceMode = async () => {
      if (!currentConversation || !activeConnection?.id) {
        setAttendanceMode('human');
        return;
      }

      if (activeConnection?.attendance_type === 'ai') {
        setAttendanceMode('ai');
        return;
      }

      const ownerId = activeConnection?.owner_id || activeConnection?.id_usuario;
      if (!ownerId) {
        setAttendanceMode('human');
        return;
      }

      try {
        // 1. Verificar attendance_mode da conversa (prioridade máxima)
        const { data: atendimento } = await supabase
          .from('whatsapp_atendimentos')
          .select('id, attendance_mode')
          .eq('chat_id', currentConversation.chat_id)
          .eq('connection_id', activeConnection.id)
          .maybeSingle();

        if (atendimento?.attendance_mode) {
          console.log('✅ Modo carregado da conversa:', atendimento.attendance_mode);
          setAttendanceMode(atendimento.attendance_mode as 'human' | 'ai');
          return;
        }

        // 2. Se não tem configuração específica, verificar attendance_type da conexão
        const { data: session } = await supabase
          .from('whatsapp_sessions')
          .select('attendance_type')
          .eq('connection_id', activeConnection.id)
          .eq('id_usuario', ownerId)
          .maybeSingle();

        if (session?.attendance_type) {
          console.log('✅ Modo carregado da conexão:', session.attendance_type);
          setAttendanceMode(session.attendance_type as 'human' | 'ai');
          return;
        }

        // 3. Fallback para 'human'
        console.log('✅ Usando modo padrão: human');
        setAttendanceMode('human');
      } catch (error) {
        console.error('⚠️ Erro ao carregar modo de atendimento:', error);
        setAttendanceMode('human');
      }
    };

    loadAttendanceMode();
  }, [currentConversation?.chat_id, activeConnection?.id, activeConnection?.owner_id, activeConnection?.id_usuario]);

  // ✅ NOVO: Persistir conversa selecionada no localStorage
  useEffect(() => {
    if (selectedChatId && activeConnection?.id) {
      const storageKey = `whatsapp_selected_chat_${activeConnection.id}`;
      try {
        localStorage.setItem(storageKey, selectedChatId);
        console.log('💾 [PERSISTENCE] Conversa selecionada salva:', selectedChatId);
      } catch (e) {
        // localStorage cheio - limpar chaves antigas
        console.warn('⚠️ [PERSISTENCE] localStorage cheio, limpando dados antigos...');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('whatsapp_selected_chat_') && key !== storageKey) {
            localStorage.removeItem(key);
          }
        });
        // Tentar novamente
        try {
          localStorage.setItem(storageKey, selectedChatId);
        } catch (e2) {
          console.error('❌ [PERSISTENCE] Não foi possível salvar mesmo após limpar');
        }
      }
    }
  }, [selectedChatId, activeConnection?.id]);

  // ✅ NOVO: Restaurar conversa selecionada ao carregar página
  useEffect(() => {
    if (!activeConnection?.id || selectedChatId) return; // Já tem conversa selecionada ou sem conexão
    
    const storageKey = `whatsapp_selected_chat_${activeConnection.id}`;
    const savedChatId = localStorage.getItem(storageKey);
    
    if (savedChatId && conversations.length > 0) {
      // Verificar se a conversa ainda existe
      const conversationExists = conversations.some(c => c.chat_id === savedChatId);
      if (conversationExists) {
        console.log('🔄 [PERSISTENCE] Restaurando conversa selecionada:', savedChatId);
        selectConversation(savedChatId);
      } else {
        // Limpar se a conversa não existe mais
        localStorage.removeItem(storageKey);
      }
    }
  }, [activeConnection?.id, conversations, selectConversation, selectedChatId]);

  // ✅ NOVO: Persistir mensagens no localStorage sempre que mudarem
  useEffect(() => {
    if (!selectedChatId || !activeConnection?.id || messages.length === 0) return;
    
    try {
      const MESSAGES_CACHE_KEY = 'whatsapp_messages_cache';
      const cacheKey = `${MESSAGES_CACHE_KEY}_${activeConnection.id}`;
      
      // Carregar cache existente
      let cachedData: Record<string, any[]> = {};
      try {
        const existing = localStorage.getItem(cacheKey);
        if (existing) {
          const parsed = JSON.parse(existing);
          cachedData = parsed?.data || {};
        }
      } catch (e) {
        console.warn('⚠️ [PERSISTENCE] Erro ao carregar cache existente:', e);
      }
      
      // Filtrar apenas mensagens válidas
      const validMessages = messages.filter(m => m.timestamp && m.chat_id === selectedChatId);
      
      if (validMessages.length > 0) {
        // Atualizar mensagens desta conversa
        cachedData[selectedChatId] = validMessages;
        
        // Salvar de volta no localStorage
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: cachedData,
            timestamp: Date.now(),
            connectionId: activeConnection.id
          }));
          console.log(`💾 [PERSISTENCE] ${validMessages.length} mensagens salvas no localStorage para:`, selectedChatId);
        } catch (quotaError) {
          // localStorage cheio - limpar cache de mensagens antigas
          console.warn('⚠️ [PERSISTENCE] localStorage cheio ao salvar mensagens, limpando cache...');
          // Remover TODAS as chaves de cache antigas
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('whatsapp_messages_cache_') && key !== cacheKey) {
              localStorage.removeItem(key);
            }
          });
          // Tentar salvar novamente (só conversas mais recentes)
          try {
            const limitedCache: Record<string, any[]> = {};
            limitedCache[selectedChatId] = validMessages.slice(-50); // Só últimas 50 mensagens
            localStorage.setItem(cacheKey, JSON.stringify({
              data: limitedCache,
              timestamp: Date.now(),
              connectionId: activeConnection.id
            }));
            console.log(`💾 [PERSISTENCE] Cache limitado salvo (últimas 50 mensagens)`);
          } catch (e2) {
            console.error('❌ [PERSISTENCE] Não foi possível salvar mesmo após limpar');
          }
        }
      }
    } catch (err) {
      console.error('❌ [PERSISTENCE] Erro ao salvar mensagens no localStorage:', err);
    }
  }, [messages, selectedChatId, activeConnection?.id]);

  // ✅ NOVO: Carregar mensagens do localStorage quando conversa é selecionada/restaurada
  useEffect(() => {
    if (!selectedChatId || !activeConnection?.id) return;
    
    // Função para carregar do localStorage (mesma lógica do hook)
    const loadFromStorage = () => {
      try {
        const MESSAGES_CACHE_KEY = 'whatsapp_messages_cache';
        const cacheKey = `${MESSAGES_CACHE_KEY}_${activeConnection.id}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (!cached) return;
        
        const parsed = JSON.parse(cached);
        const storedMessages = parsed?.data?.[selectedChatId] || [];
        
        if (storedMessages.length > 0 && messages.length === 0) {
          console.log(`💾 [PERSISTENCE] ${storedMessages.length} mensagens encontradas no localStorage para:`, selectedChatId);
          // Se não tem mensagens no estado, carregar do localStorage imediatamente
          setMessages(storedMessages);
          // Scroll para o final após carregar
          requestAnimationFrame(() => {
            setTimeout(() => {
              const messagesContainer = document.querySelector('[data-messages-container]') as HTMLElement;
              if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            }, 100);
          });
        }
      } catch (err) {
        console.error('❌ [PERSISTENCE] Erro ao carregar mensagens do localStorage:', err);
      }
    };
    
    // Carregar apenas se não tem mensagens ainda
    if (messages.length === 0) {
      loadFromStorage();
    }
  }, [selectedChatId, activeConnection?.id]);

  // Processar parâmetros de URL para seleção automática de contato
  useEffect(() => {
    const contactId = searchParams.get('contact');
    const phone = normalizePhoneNumber(searchParams.get('phone') || '');
    const urlChatId = searchParams.get('chat');
    const jid = (urlChatId && urlChatId.includes('@')) ? normalizePhoneNumberToJID(urlChatId) : (phone ? normalizePhoneNumberToJID(phone) : null);

    if (!jid) return;

    (async () => {
      let resolvedName: string | undefined;
      let resolvedAvatar: string | undefined;
      try {
        if (contactId) {
          const { data } = await supabase
            .from('contacts')
            .select('name, whatsapp_name, profile_image_url')
            .eq('id', contactId)
            .maybeSingle();
          if (data) {
            resolvedName = data.whatsapp_name || data.name || undefined;
            resolvedAvatar = data.profile_image_url || undefined;
          }
        }
      } catch {}

      setConversations(prev => {
        const exists = prev.find(conv => conv.chat_id === jid);
        if (exists) return prev;
        const now = new Date().toISOString();
        const nameGuess = resolvedName || extractPhoneNumber(jid);
        const newConv = {
          id: jid,
          chat_id: jid,
          nome_cliente: nameGuess,
          wpp_name: nameGuess,
          numero_cliente: extractPhoneNumber(jid),
          status: 'AGUARDANDO',
          lastMessageAt: now,
          unread: 0,
          connection_id: activeConnection?.id,
          profile_picture: resolvedAvatar,
        };
        const merged = [newConv, ...prev];
        return merged.sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });
      });

      selectConversation(jid);
    })();
  }, [searchParams, activeConnection?.id, selectConversation, setConversations]);
  const [noteMode, setNoteMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);

  // ✅ REMOVED: Duplicate scrollToBottom function - using the new one from scroll anchoring
  const onMediaLoaded = useCallback(() => {
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  // Buscar atendentes disponíveis
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('id, nome, email, avatar_url')
          .neq('id', user?.id);
        
        if (!error && users) {
          setAvailableAgents(users);
        }
      } catch (error) {
        console.error('Erro ao buscar atendentes:', error);
      }
    };
    
    if (user?.id && showTransferModal) {
      loadAgents();
    }
  }, [user?.id, showTransferModal]);
  
  // Função para transferir conversa
  const transferirConversa = async () => {
    if (!selectedAgent || !selectedChatId || !activeConnection?.id) return;
    
    setTransferring(true);
    try {
      const response = await fetch('http://localhost:3000/api/baileys-simple/conversas/transferir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChatId,
          fromUserId: user?.id,
          toUserId: selectedAgent,
          connectionId: activeConnection.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConversations(prev => prev.filter(c => c.chat_id !== selectedChatId));
        setSelectedChatId(null);
        setShowTransferModal(false);
        setSelectedAgent(null);
        alert('✅ Conversa transferida com sucesso!');
      } else {
        alert('❌ Erro: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Erro ao transferir:', error);
      alert('❌ Erro ao transferir conversa');
    } finally {
      setTransferring(false);
    }
  };

  // Finalizar conversa
  const finalizarConversa = useCallback(async (chatId: string) => {
    if (!activeConnection?.id) return;
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection?.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/finalizar-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"FINALIZADO" } : c));
      setStatusFilter("FINALIZADO");
      setSelectedChatId(null); setMessages([]); setInput("");
    } catch (e) { console.error("finalizarConversa", e); }
  }, [activeConnection?.id, conversations, setConversations, setSelectedChatId, setMessages]);

  // Função para gerar resumo da conversa com IA (últimas 100 mensagens)
  const generateConversationSummary = async () => {
    if (!currentConversation || messages.length === 0) return;
    
    try {
      // Pegar apenas as últimas 100 mensagens
      const recentMessages = messages.slice(-100);
      const conversationText = recentMessages
        .map(m => `${m.remetente}: ${m.conteudo}`)
        .join('\n');
      
      const response = await fetch('/api/ai/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Gere um resumo profissional e claro desta conversa de atendimento. Destaque os pontos principais, problemas resolvidos e próximos passos. Seja conciso mas completo:\n\n${conversationText}`,
          model: 'gpt-4o-mini'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setClosingNotesSummary(result.result || '');
      }
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    }
  };

  // Função para abrir conversa
  const openConversation = useCallback(async (chatId: string) => {
    try {
      const conversation = conversations.find(c => c.chat_id === chatId);
      const connectionId = conversation?.connection_id || activeConnection?.id;
      await fetch(`/api/baileys-simple/connections/${connectionId}/abrir-conversa`, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ chatId }) });
      setConversations(conversations.map(c => c.chat_id === chatId ? { ...c, status:"ATENDENDO" } : c));
      setStatusFilter("ATENDENDO");
    } catch (e) { console.error("openConversation", e); }
  }, [activeConnection?.id, conversations, setConversations]);

  

  // Open chat with instant switching and race condition prevention
  const openChat = useCallback((chatId: string) => {
    if (selectedChatId === chatId) {
      return;
    }
    
    // Draft workaround for inputs during switching
    if (selectedChatId && input.trim()) {
      setDraft(selectedChatId, input);
    }
    setInput(getDraft(chatId));
    
    // trigger fast immediate conversation switching from hook directly
    selectConversation(chatId, { localMarkRead: false });
    
    // scroll fixtures for new load bounce on ya
    setTimeout(() => {
      scrollToBottom("auto");
    }, 100);
    
    setTimeout(() => {
      scrollToBottom("auto");
    }, 500);
  }, [selectedChatId, input, setDraft, getDraft, selectConversation, markConversationRead, scrollToBottom]);

  // Only scroll to bottom when appropriate
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    // If we're loading older, NEVER force bottom.
    if (loadingOlderRef.current) return;

    // If we just sent or we are stuck to bottom, keep bottom sticky.
    if (justSentRef.current || isStuckToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'));
      // clear the flag after one tick
      justSentRef.current = false;
    }
  }, [messages.length]); // depend on count (not array ref)

  // ✅ REMOVED: This was causing unwanted scroll jumps

  // Uploads
  async function fakeUpload(file: File): Promise<string> { return URL.createObjectURL(file); }
  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !selectedChatId) return;
    const url = await fakeUpload(file);
    const kind = file.type.startsWith("image/")?"IMAGEM": file.type.startsWith("video/")?"VIDEO":"ARQUIVO";
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, message_id: tempId, chat_id:selectedChatId, conteudo:file.name, message_type:kind as any, media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any;
    setMessages([...messages, optimistic]); 
    justSentRef.current = true;
    requestAnimationFrame(() => scrollToBottom('auto'));
    try { 
      const sentMessage = await sendMessageTo(selectedChatId, file.name, kind as any, url);
      // ✅ CORREÇÃO CRÍTICA: Substituir mensagem otimista com dados reais (incluindo TODOS os campos de mídia)
          if (sentMessage) {
            setMessages(prev => prev.map(msg => {
          // Encontrar mensagem otimista por tempId OU por correspondência de tipo/tempo
          if (msg.id === tempId || msg.message_id === tempId) {
            console.log('✅ [HANDLE-ATTACH] Atualizando mensagem otimista com dados reais:', {
              tempId,
              realId: sentMessage.id || sentMessage.message_id,
              hasMediaUrl: !!sentMessage.media_url,
              hasImageUrl: !!sentMessage.imageUrl
            });
            // ✅ GARANTIR: Preservar todos os campos de mídia do backend
            return {
              ...msg,
              ...sentMessage,
              id: sentMessage.id || sentMessage.message_id || tempId,
              message_id: sentMessage.message_id || sentMessage.id || tempId,
              // ✅ Campos de mídia explícitos (garantir que estão presentes)
              media_url: sentMessage.media_url || sentMessage.mediaUrl || msg.media_url,
              imageUrl: sentMessage.imageUrl || (kind === 'IMAGEM' ? (sentMessage.media_url || sentMessage.mediaUrl) : undefined) || msg.imageUrl,
              videoUrl: sentMessage.videoUrl || (kind === 'VIDEO' ? (sentMessage.media_url || sentMessage.mediaUrl) : undefined) || msg.videoUrl,
              audioUrl: sentMessage.audioUrl || (kind === 'AUDIO' ? (sentMessage.media_url || sentMessage.mediaUrl) : undefined) || msg.audioUrl,
              documentUrl: sentMessage.documentUrl || (kind === 'ARQUIVO' ? (sentMessage.media_url || sentMessage.mediaUrl) : undefined) || msg.documentUrl,
              media_mime: sentMessage.media_mime || sentMessage.mimeType || msg.media_mime,
              media_file_name: sentMessage.media_file_name || sentMessage.fileName || msg.media_file_name,
              message_type: sentMessage.message_type || sentMessage.type || msg.message_type,
              fromMe: true,
              isFromMe: true,
              remetente: 'ATENDENTE'
            };
          }
          return msg;
        }));
        if (selectedChatId) {
          markConversationRead(selectedChatId).catch(() => {});
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar anexo:', error);
      
      // ✅ Verificar se é proteção anti-spam do WhatsApp
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAntiSpam = errorMessage.includes('Proteção de Segurança do WhatsApp') || 
                         errorMessage.includes('muito rapidamente');
      
      // Mostrar notificação amigável
      if (isAntiSpam) {
        alert('🛡️ Proteção de Segurança do WhatsApp\n\n' +
              'Você está enviando mensagens muito rapidamente!\n\n' +
              'Por segurança da sua conta, o WhatsApp bloqueia envios muito rápidos para evitar spam.\n\n' +
              '⏱️ Aguarde alguns segundos e tente enviar novamente.');
      } else {
        alert('❌ Erro ao enviar arquivo:\n\n' + errorMessage);
      }
      
      // Remover mensagem otimista se falhou
      setMessages(prev => prev.filter(msg => msg.id !== tempId && msg.message_id !== tempId));
    }
  }

  function startRecording(){ 
    if(!navigator.mediaDevices||recording) return; 
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{ 
      const rec=new MediaRecorder(stream); 
      setRecording(rec); 
      setChunks([]); 
      rec.ondataavailable=e=>setChunks(p=>[...p,e.data]); 
      rec.onstop=async()=>{ 
        const blob=new Blob(chunks,{type:"audio/webm"}); 
        const file=new File([blob],`audio-${Date.now()}.webm`,{type:"audio/webm"}); 
        const url=await fakeUpload(file); 
        if(selectedChatId){ 
          const tempId = `temp-${Date.now()}`;
          const optimistic={ id: tempId, message_id: tempId, chat_id:selectedChatId, conteudo:"Áudio", message_type:"AUDIO", media_url:url, remetente:"OPERADOR", timestamp:new Date().toISOString(), lida:true } as any; 
          setMessages([...messages,optimistic]); 
          justSentRef.current = true;
          requestAnimationFrame(() => scrollToBottom('auto')); 
          try{ 
            const sentMessage = await sendMessageTo(selectedChatId, "Áudio", "AUDIO", url);
            // ✅ CORREÇÃO CRÍTICA: Substituir mensagem otimista com dados reais (incluindo TODOS os campos de mídia)
            if (sentMessage) {
              setMessages(prev => prev.map(msg => {
                // Encontrar mensagem otimista por tempId OU por correspondência de tipo/tempo
                if (msg.id === tempId || msg.message_id === tempId) {
                  console.log('✅ [START-RECORDING] Atualizando mensagem otimista com dados reais:', {
                    tempId,
                    realId: sentMessage.id || sentMessage.message_id,
                    hasMediaUrl: !!sentMessage.media_url,
                    hasAudioUrl: !!sentMessage.audioUrl
                  });
                  // ✅ GARANTIR: Preservar todos os campos de mídia do backend
                  return {
                    ...msg,
                    ...sentMessage,
                    id: sentMessage.id || sentMessage.message_id || tempId,
                    message_id: sentMessage.message_id || sentMessage.id || tempId,
                    // ✅ Campos de mídia explícitos (garantir que estão presentes)
                    media_url: sentMessage.media_url || sentMessage.mediaUrl || msg.media_url,
                    audioUrl: sentMessage.audioUrl || sentMessage.media_url || sentMessage.mediaUrl || msg.audioUrl,
                    media_mime: sentMessage.media_mime || sentMessage.mimeType || msg.media_mime,
                    media_file_name: sentMessage.media_file_name || sentMessage.fileName || msg.media_file_name,
                    message_type: sentMessage.message_type || sentMessage.type || 'AUDIO',
                    fromMe: true,
                    isFromMe: true,
                    remetente: 'ATENDENTE'
                  };
                }
                return msg;
              }));
              if (selectedChatId) {
                markConversationRead(selectedChatId).catch(() => {});
              }
            }
          } catch (error) {
            console.error('❌ Erro ao enviar áudio:', error);
            
            // ✅ Verificar se é proteção anti-spam do WhatsApp
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isAntiSpam = errorMessage.includes('Proteção de Segurança do WhatsApp') || 
                               errorMessage.includes('muito rapidamente');
            
            // Mostrar notificação amigável
            if (isAntiSpam) {
              alert('🛡️ Proteção de Segurança do WhatsApp\n\n' +
                    'Você está enviando mensagens muito rapidamente!\n\n' +
                    'Por segurança da sua conta, o WhatsApp bloqueia envios muito rápidos para evitar spam.\n\n' +
                    '⏱️ Aguarde alguns segundos e tente enviar novamente.');
            } else {
              alert('❌ Erro ao enviar áudio:\n\n' + errorMessage);
            }
            
            // Remover mensagem otimista se falhou
            setMessages(prev => prev.filter(msg => msg.id !== tempId && msg.message_id !== tempId));
          }
        } 
      }; 
      rec.start(); 
    }).catch(console.error);
  } 
  
  function stopRecording(){ recording?.stop(); setRecording(null); }

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedChatId || !activeConnection?.id) return;

    // ✅ OTIMIZAÇÃO: Verificar conexão sem delay desnecessário
    const isConnected = 
      activeConnection?.isConnected || 
      activeConnection?.connectionState === 'open' || 
      activeConnection?.connectionState === 'connected';
    
    if (!isConnected) {
      // ✅ Tentar atualizar status apenas se não estiver conectado (sem bloquear)
      updateConnectionStatus(activeConnection.id).catch(() => {});
      
      console.error('❌ [HANDLE-SEND] Conexão não está conectada:', {
        isConnected: activeConnection?.isConnected,
        connectionState: activeConnection?.connectionState
      });
      // Usar toast se disponível
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error('Conexão não está conectada. Aguarde alguns segundos e tente novamente.');
      }
      return;
    }

    // ✅ MUDANÇA DE STATUS: AGUARDANDO → ATENDENDO ao enviar mensagem
    const currentConv = conversations.find(c => c.chat_id === selectedChatId);
    if (currentConv && currentConv.status === 'AGUARDANDO') {
      console.log('🔄 [HANDLE-SEND] Mudando status AGUARDANDO → ATENDENDO ao enviar mensagem');
      console.log('📊 [HANDLE-SEND] Conversa antes:', { 
        chat_id: currentConv.chat_id, 
        status: currentConv.status,
        id_usuario_antes: currentConv.id_usuario
      });
      console.log('👤 [HANDLE-SEND] User ID atual:', user?.id);
      
      // Atualizar estado local imediatamente (UX instantânea)
      const userId = profile?.id_usuario || user?.id;
      console.log('👤 [HANDLE-SEND] User ID que será usado:', userId);
      
      setConversations(prev => {
        const updated = prev.map(c => 
          c.chat_id === selectedChatId 
            ? { ...c, status: resolveConversationStatus(c.status as any, 'ATENDENDO'), id_usuario: userId }
            : c
        );
        const updatedConv = updated.find(c => c.chat_id === selectedChatId);
        console.log('📊 [HANDLE-SEND] Conversa depois:', {
          chat_id: updatedConv?.chat_id,
          status: updatedConv?.status,
          id_usuario_depois: updatedConv?.id_usuario
        });
        return updated;
      });
      
      console.log('✅ [HANDLE-SEND] Status atualizado para ATENDENDO');
      
      // Mudar filtro para ATENDENDO automaticamente para ver a conversa na nova aba
      setStatusFilter('ATENDENDO');
      console.log('📂 [HANDLE-SEND] Filtro mudado para ATENDENDO');

      // Atualizar no backend (não bloquear envio)
      fetch('/api/baileys-simple/conversas/atender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChatId,
          connectionId: activeConnection.id,
          userId: userId
        })
      }).catch(err => console.warn('⚠️ [HANDLE-SEND] Erro ao atualizar status:', err));
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimistic = {
          id: tempId,
          message_id: tempId,
          chat_id: selectedChatId,
          conteudo: text,
          message_type: 'TEXTO',
          remetente: 'ATENDENTE', // Mudança para ATENDENTE para aparecer como mensagem enviada
          timestamp: new Date().toISOString(),
          lida: true,
          status: 'sending'
        };


    // Silent: Enviando mensagem otimista

    // Debug logs removed for production

    setInput('');
    clearDraft?.(selectedChatId);

        // Add optimistic message to the hook's message state
        setMessages(prev => {
          const newMessages = [...prev, optimistic].sort((a,b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          console.log('📝 [HANDLE-SEND] Added optimistic message, total messages:', newMessages.length);
          return newMessages;
        });

    // Mark that we just sent a message
    justSentRef.current = true;
    requestAnimationFrame(() => scrollToBottom('auto'));

    // ✅ Enviar via socket do Baileys (que já tem listener configurado)
    const baileysSocket = getBaileysSocket();
    if (baileysSocket && baileysSocket.connected) {
      baileysSocket.emit(
        'send:message',
        {
          connectionId: activeConnection.id,
          chatId: selectedChatId,
          content: text,
          tempId: tempId
        },
        (serverMessage?: any) => {
          // ✅ CORREÇÃO: Verificar se é erro real ou apenas ausência de resposta
          if (serverMessage && serverMessage.error && serverMessage.success === false) {
            // ✅ Erro real - mostrar apenas se for erro crítico
            console.error('❌ [HANDLE-SEND] Erro ao enviar mensagem:', serverMessage.error);
            // ✅ NÃO mostrar toast aqui - a mensagem pode ter sido enviada via broadcast
            return;
          }
          
          // ✅ Se não tem serverMessage, não é erro - apenas aguardar broadcast
          if (!serverMessage) {
            console.log('ℹ️ [HANDLE-SEND] No server message in ACK, waiting for socket event (normal)');
            return; // fallback to socket broadcast via new_message
          }
          
          console.log('✅ [HANDLE-SEND] Received server ACK:', serverMessage);
          
          // ACK recebido: apenas remove o temp, e deixa o broadcast adicionar a final
          setMessages(prev => prev.filter(m =>
            m.id !== tempId &&
            m.message_id !== tempId &&
            (m as any).tempId !== tempId
          ));
          // ✅ Após enviar, marcar conversa como lida para zerar badge
          if (selectedChatId) {
            markConversationRead(selectedChatId).catch(() => {});
          }
        }
      );
    } else {
      // Fallback: usar safeEmit se socket Baileys não estiver disponível
      safeEmit(
        'send:message',
        {
          chatId: selectedChatId,
          content: text,
          message_type: 'TEXTO',
          tempId: tempId,
          ownerId: user?.id,
          connectionId: activeConnection.id
        },
        (serverMessage?: any) => {
          // ✅ CORREÇÃO: Verificar se é erro real ou apenas ausência de resposta
          if (serverMessage && serverMessage.error && serverMessage.success === false) {
            // ✅ Erro real - mostrar apenas se for erro crítico
            console.error('❌ [HANDLE-SEND] Erro ao enviar mensagem:', serverMessage.error);
            // ✅ NÃO mostrar toast aqui - a mensagem pode ter sido enviada via broadcast
            return;
          }
          
          // ✅ Se não tem serverMessage, não é erro - apenas aguardar broadcast
          if (!serverMessage) {
            console.log('ℹ️ [HANDLE-SEND] No server message in ACK, waiting for socket event (normal)');
            return; // fallback to socket broadcast
          }
          
          console.log('✅ [HANDLE-SEND] Received server ACK:', serverMessage);
          
          // ACK recebido: apenas remove o temp, e deixa o broadcast adicionar a final
          setMessages(prev => prev.filter(m =>
            m.id !== tempId &&
            m.message_id !== tempId &&
            (m as any).tempId !== tempId
          ));
          if (selectedChatId) {
            markConversationRead(selectedChatId).catch(() => {});
          }
        }
      );
    }
  }, [input, selectedChatId, activeConnection, updateConnectionStatus, clearDraft, setMessages]);

  // 🧹 LIMPEZA: Limpar localStorage antigo ao montar componente
  useEffect(() => {
    const cleanOldLocalStorage = () => {
      try {
        console.log('🧹 [CLEANUP] Limpando dados antigos do localStorage...');
        let removedCount = 0;
        const keysToRemove: string[] = [];
        
        // Encontrar chaves antigas
        Object.keys(localStorage).forEach(key => {
          // Remover chaves de conexões antigas (com timestamp)
          if (key.match(/whatsapp_selected_chat_connection_.*_\d{13}/)) {
            keysToRemove.push(key);
          }
          // Remover caches de mensagens muito antigos (mais de 7 dias)
          if (key.startsWith('whatsapp_messages_cache_')) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              const age = Date.now() - (data.timestamp || 0);
              const sevenDays = 7 * 24 * 60 * 60 * 1000;
              if (age > sevenDays) {
                keysToRemove.push(key);
              }
            } catch (e) {
              // Se não conseguir parsear, remover
              keysToRemove.push(key);
            }
          }
        });
        
        // Remover chaves identificadas
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          removedCount++;
        });
        
        if (removedCount > 0) {
          console.log(`✅ [CLEANUP] ${removedCount} chaves antigas removidas do localStorage`);
        }
      } catch (e) {
        console.error('❌ [CLEANUP] Erro ao limpar localStorage:', e);
      }
    };
    
    cleanOldLocalStorage();
  }, []); // Rodar apenas uma vez na montagem

  // Load connections when user is available
  useEffect(() => {
    if (user?.id) {
      // Silent: Loading connections for user
      loadConnections(user.id);
    }
  }, [user?.id, loadConnections]);

  // Socket.IO connection is handled by useOptimizedWhatsAppConversations hook
  // No need to duplicate the connection logic here

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setAttendanceModeDropdown(false);
        setCloseOpenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filters & selection
  const filteredConversations = useMemo(()=>{
    console.log('🔍 [FILTER-DEBUG] Filtrando conversas:', { 
      total: conversations?.length,
      statusFilter, 
      search: search.trim(),
      conversationsRaw: conversations
    });
    
    // 🔥 FORÇA EXIBIÇÃO: Se tem conversas, tentar mostrar sempre
    if (!conversations || conversations.length === 0) {
      console.log('⚠️ [FILTER-DEBUG] Nenhuma conversa no state');
      return [];
    }
    
    // Filtrar por permissões primeiro
    const permissionFilteredList = filterConversationsByPermissions(
      conversations || [],
      statusFilter,
      permissions
    );
    
    console.log('🔍 [FILTER-DEBUG] Após filtro de permissões:', permissionFilteredList.length);
    console.log('🔍 [FILTER-DEBUG] Conversas após permissões:', permissionFilteredList);
    
    // Aplicar busca por texto
    const q = search.trim().toLowerCase(); 
    let result = permissionFilteredList;
    
    if(q) {
      result = permissionFilteredList.filter(conv => {
        const fields = [
          conv.nome_cliente,
          conv.wpp_name,
          conv.whatsapp_group_subject,
          conv.numero_cliente,
          conv.lastMessagePreview,
          conv.lastMessage?.conteudo,
          String(conv.chat_id || '').split('@')[0]
        ];
        return fields.some(f => (f || '').toLowerCase().includes(q));
      });
    }
    
    // ✅ ORDENAÇÃO: Ordenar por data mais recente primeiro (DESC)
    const sorted = result.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA; // DESC: Mais recente primeiro
    });
    
    console.log('✅ [FILTER-DEBUG] Retornando', sorted.length, 'conversas ordenadas por data');
    return sorted;
  }, [conversations, search, statusFilter, permissions]);

  const countsByStatus = useMemo(() => {
    const q = search.trim().toLowerCase();
    const compute = (st: "ATENDENDO"|"AGUARDANDO"|"FINALIZADO") => {
      let list = filterConversationsByPermissions(conversations || [], st, permissions);
      if (q) {
        list = list.filter(conv => {
          const fields = [
            conv.nome_cliente,
            conv.wpp_name,
            conv.whatsapp_group_subject,
            conv.numero_cliente,
            conv.lastMessagePreview,
            conv.lastMessage?.conteudo,
            String(conv.chat_id || '').split('@')[0]
          ];
          return fields.some(f => (f || '').toLowerCase().includes(q));
        });
      }
      return list.length;
    };
    return {
      ATENDENDO: compute("ATENDENDO"),
      AGUARDANDO: compute("AGUARDANDO"),
      FINALIZADO: compute("FINALIZADO")
    };
  }, [conversations, permissions, search]);

  // Status de conexão - sempre mostrar a página
  const connectionStatus = hasValidConnection ? 'Conectado' : 'Desconectado';
  const connectionStatusColor = hasValidConnection ? 'text-green-600' : 'text-red-600';
  const connectionStatusBg = hasValidConnection ? 'bg-green-50' : 'bg-red-50';
  

  return (
    <div ref={pageRef} style={pageH ? { height: pageH } : undefined} className="w-full overflow-hidden bg-gray-50 dark:bg-black">
      {/* Global scroll fix + Compact mode CSS */}
      <style>{`
        html, body, #__next { height: 100%; overflow: hidden; } 
        .app-content, .page-container { min-height: 0; }
        /* Modo compacto para caber em 100% */
        .compact-mode { font-size: 13px; }
        .compact-mode h1 { font-size: 1.25rem; line-height: 1.5rem; }
        .compact-mode h2 { font-size: 1.125rem; line-height: 1.5rem; }
        .compact-mode h3 { font-size: 1rem; line-height: 1.25rem; }
        .compact-mode p, .compact-mode span { font-size: 0.875rem; }
        .compact-mode button { font-size: 0.8125rem; }
      `}</style>

      {/* Navbar de seções - igual à página Activities */}
      <div 
        className="fixed top-[38px] right-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-40 transition-all duration-300"
        style={{
          left: sidebarExpanded ? '240px' : '64px'
        }}
      >
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={handleSidebarToggle}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {/* Botões de seção */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSection('atendendo')}
                className={`
                  h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                  ${currentSection === 'atendendo' 
                    ? 'bg-gray-50 text-slate-900 shadow-inner' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                  }
                `}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Atendendo
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentSection('disparo')}
                className={`
                  h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                  ${currentSection === 'disparo' 
                    ? 'bg-gray-50 text-slate-900 shadow-inner' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                  }
                `}
              >
                <Send className="h-4 w-4 mr-2" />
                Disparo
              </Button>
              
              
            </div>
          </div>
        </div>
      </div>

      {/* Layout com 3 colunas principais - Ajustado para começar abaixo da navbar */}
      <div 
        className="flex compact-mode fixed inset-0 bg-gray-50 overflow-hidden" 
        style={{ 
          top: '102px',
          left: sidebarExpanded ? '240px' : '64px',
          right: '0',
          height: 'calc(100vh - 102px)'
        }}
      >
        {/* LEFT – conversations list - só aparece na seção Atendendo */}
        {currentSection === 'atendendo' && (
          <aside className="w-[320px] h-full min-h-0 border-r border-gray-200 bg-white flex flex-col" style={{ marginLeft: '8px' }}>
            <div className="p-2 border-b border-gray-200 bg-transparent flex-shrink-0 pt-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-sm font-semibold text-gray-900 pl-2">Conversas</h1>
                <div className="flex items-center gap-1">
                  <div className={`flex items-center gap-0.5 px-1 py-0.5 rounded-full transition-all duration-300 ${connectionStatusBg}`}>
                    <span className={`w-1 h-1 rounded-full ${hasValidConnection ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}/>
                    <span className={`text-[9px] font-bold ${connectionStatusColor}`}>{connectionStatus}</span>
                  </div>
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                <input 
                  value={search} 
                  onChange={(e)=>setSearch(e.target.value)} 
                  placeholder="Buscar conversas..." 
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent text-xs"
                />
              </div>
              <div className="flex gap-1.5 justify-center">
              {(["ATENDENDO","AGUARDANDO","FINALIZADO"] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={()=>setStatusFilter(s)} 
                    className={`relative px-2 pr-4 py-0.5 rounded-md text-[10px] font-bold transition-all duration-200 ${
                      statusFilter===s 
                        ? (s==="AGUARDANDO"?"bg-orange-500 text-white":"bg-blue-500 text-white")
                        : "bg-transparent text-gray-600 hover:bg-gray-100/50 border border-gray-200"
                    }`}
                  >
                  {s==="ATENDENDO"?"Atendendo":s==="AGUARDANDO"?"Aguardando":"Finalizados"}
                  <span className={`absolute bottom-[2px] right-[2px] text-[8px] font-bold ${statusFilter===s ? 'text-white' : 'text-gray-700'}`}>
                    {s==="ATENDENDO" ? countsByStatus.ATENDENDO : s==="AGUARDANDO" ? countsByStatus.AGUARDANDO : countsByStatus.FINALIZADO}
                  </span>
                </button>
              ))}
            </div>
          </div>
            <div className="flex-1 overflow-y-auto min-h-0 bg-white mt-2">
              {filteredConversations.map(conv => (
                <button
                  key={conv.chat_id}
                  onClick={() => openChat(conv.chat_id)}
                  className={`w-full text-left transition-all duration-200 ${
                    selectedChatId === conv.chat_id 
                      ? 'bg-gray-100' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {/* Avatar com imagem de perfil */}
                      <div className="relative flex-shrink-0">
                        <WhatsAppProfilePicture
                          jid={conv.chat_id}
                          name={conv.nome_cliente || conv.numero_cliente}
                          size="md"
                          profilePicture={conv.profile_picture}
                          className="w-10 h-10 rounded-full"
                        />
                        {/* Ícone do WhatsApp */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate text-xs">
                              {getDisplayName(conv)}
                            </h3>
                            {/* ✅ CORREÇÃO: Mostrar preview de mídia se a última mensagem for imagem/vídeo */}
                            {conv.lastMessage && (
                              (conv.lastMessage.message_type === 'IMAGEM' || 
                               conv.lastMessage.message_type === 'IMAGE' || 
                               conv.lastMessage.type === 'image') && 
                              (conv.lastMessage.imageUrl || conv.lastMessage.media_url) ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <img 
                                    src={conv.lastMessage.imageUrl || conv.lastMessage.media_url} 
                                    alt="Preview"
                                    className="w-5 h-5 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      // Se a imagem falhar ao carregar, mostrar apenas o texto
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <p className="text-[10px] text-gray-700 truncate flex-1">
                                    {conv.lastMessage.caption || conv.lastMessagePreview || "📷 Foto"}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-700 truncate mt-1">
                                  {conv.lastMessagePreview || conv.lastMessage?.conteudo || "Nenhuma mensagem"}
                                </p>
                              )
                            )}
                            {!conv.lastMessage && (
                              <p className="text-[10px] text-gray-700 truncate mt-1">
                                {conv.lastMessagePreview || "Nenhuma mensagem"}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-0.5 ml-2 flex-shrink-0">
                            <span className="text-[9px] text-gray-500">
                              {conv.lastMessageAt ? (() => {
                                const date = new Date(conv.lastMessageAt);
                                const now = new Date();
                                const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
                                
                                if (diffInHours < 24) {
                                  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                } else if (diffInHours < 48) {
                                  return 'Ontem';
                                } else {
                                  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                }
                              })() : ""}
                            </span>
                            {conv.unread > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-green-500 text-white text-[9px] px-1 py-0.5 min-w-[14px] h-3.5 font-medium">
                                {conv.unread > 99 ? '99+' : conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="p-2">
                  <div className="flex flex-col items-center justify-center h-28 text-gray-500">
                    <MessageCircle className="w-8 h-8 mb-2 opacity-50"/>
                    <p className="text-sm">Nenhuma conversa encontrada</p>
                    {search && (
                      <p className="text-xs text-gray-400 mt-1">
                        Tente ajustar os filtros ou termo de busca
                      </p>
                    )}
                  </div>
                  {!!search.trim() && (
                    <div>
                      <div className="px-2 py-1 text-[11px] text-gray-600">Contatos</div>
                      {suggestionsLoading && (
                        <div className="px-3 py-2 text-[11px] text-gray-400">Carregando...</div>
                      )}
                      {!suggestionsLoading && contactSuggestions.length === 0 && (
                        <div className="px-3 py-2 text-[11px] text-gray-400">Nenhum contato correspondente</div>
                      )}
                          {!suggestionsLoading && contactSuggestions.map(c => {
                            const name = c.whatsapp_name || c.name || 'Contato';
                            const phone = normalizePhoneNumber(c.phone || '');
                            const jid = c.whatsapp_jid ? normalizePhoneNumberToJID(c.whatsapp_jid) : (phone ? normalizePhoneNumberToJID(phone) : '');
                            const isValid = !!jid;
                            return (
                              <div
                                key={c.id}
                                className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  if (!isValid) return;
                                  // Criar conversa local se não existir e selecionar
                                  setConversations(prev => {
                                    const exists = prev.find(conv => conv.chat_id === jid);
                                    if (exists) {
                                      return prev;
                                    }
                                    const now = new Date().toISOString();
                                    const newConv = {
                                      id: jid,
                                      chat_id: jid,
                                      nome_cliente: name,
                                      wpp_name: name,
                                      numero_cliente: extractPhoneNumber(jid),
                                      status: 'AGUARDANDO',
                                      lastMessageAt: now,
                                      unread: 0,
                                      connection_id: activeConnection?.id,
                                      profile_picture: undefined,
                                    };
                                    const merged = [newConv, ...prev];
                                    return merged.sort((a, b) => {
                                      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                                      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                                      return tb - ta;
                                    });
                                  });
                                  selectConversation(jid);
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <WhatsAppProfilePicture
                                    jid={jid}
                                    profilePicture={undefined}
                                    name={name}
                                    size="sm"
                                    showPresence={false}
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <div>
                                    <div className="text-xs font-medium text-gray-900">{name}</div>
                                    <div className="text-[10px] text-gray-500">{extractPhoneNumber(jid)}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  disabled={!isValid}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isValid) return;
                                    setConversations(prev => {
                                      const exists = prev.find(conv => conv.chat_id === jid);
                                      if (exists) {
                                        return prev;
                                      }
                                      const now = new Date().toISOString();
                                      const newConv = {
                                        id: jid,
                                        chat_id: jid,
                                        nome_cliente: name,
                                        wpp_name: name,
                                        numero_cliente: extractPhoneNumber(jid),
                                        status: 'AGUARDANDO',
                                        lastMessageAt: now,
                                        unread: 0,
                                        connection_id: activeConnection?.id,
                                        profile_picture: undefined,
                                      };
                                      const merged = [newConv, ...prev];
                                      return merged.sort((a, b) => {
                                        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                                        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                                        return tb - ta;
                                      });
                                    });
                                    selectConversation(jid);
                                  }}
                                >
                                  Abrir
                                </Button>
                              </div>
                            );
                          })}
                    </div>
                  )}
                </div>
              )}
          </div>
        </aside>
        )}

        {/* CENTER – thread ou seções */}
          <main className={`${currentSection === 'atendendo' ? 'flex-1' : 'w-full'} h-full min-h-0 flex flex-col bg-white shadow-lg`}>
          {currentSection === 'atendendo' && currentConversation ? (
            <>
              <div className="shrink-0 border-b border-gray-200 px-3 py-2 bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  {/* Foto de perfil do contato */}
                  <WhatsAppProfilePicture
                    jid={currentConversation.chat_id}
                    profilePicture={currentConversationIdentity?.avatar || currentConversation.profile_picture}
                    name={getDisplayName(currentConversation, undefined, getIdentity)}
                    size="lg"
                    showPresence={true}
                    className="w-8 h-8 rounded-full shadow-lg"
                  />
                  
                  {/* Nome do contato - Clicável para abrir informações */}
                  <button 
                    onClick={() => setShowContactPanel(!showContactPanel)}
                    className="flex-1 text-left hover:bg-gray-50 rounded px-2 py-1 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {getDisplayName(currentConversation, undefined, getIdentity)}
                    </h3>
                  </button>

                  

                  {/* Botão Fechar removido conforme solicitado */}

                  {/* Menu de 3 pontos */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      title="Mais opções"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showActionsMenu && (
                      <>
                        {/* Overlay para fechar ao clicar fora */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowActionsMenu(false)}
                        />
                        
                        {/* Menu dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                          {/* Cabeçalho do menu */}
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900">Opções da Conversa</h3>
                          </div>
                          
                          {/* Opções principais */}
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setShowContactInfoModal(true);
                                setShowActionsMenu(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                            >
                              <User className="w-4 h-4 text-purple-600" />
                              <span className="text-sm">Informações do Contato</span>
                            </button>
                            

                            <button
                              onClick={() => {
                                setShowClosingNotesBox(!showClosingNotesBox);
                                setShowActionsMenu(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                              <span className="text-sm">Finalizar Conversa</span>
                            </button>
                          </div>
                          
                          {/* Divisor */}
                          <div className="border-t border-gray-200"></div>
                          
                          {/* Ações Rápidas */}
                          <div className="py-2">
                            <div className="px-4 py-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações Rápidas</span>
                            </div>
                            
                            <button
                              onClick={() => {
                                setShowConvertToLeadModal(true);
                                setShowActionsMenu(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                            >
                              <Zap className="w-4 h-4 text-emerald-600" />
                              <span className="text-sm">Converter para Lead</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowRegisterContactModal(true);
                                setShowActionsMenu(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                            >
                              <Save className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">Salvar Contato</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowCreateCompanyModal(true);
                                setShowActionsMenu(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                            >
                              <Home className="w-4 h-4 text-indigo-600" />
                             <span className="text-sm">Criar Empresa</span>
                            </button>
                            
                            
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Closing Notes Box Inline */}
              {showClosingNotesBox && (
                <div className="border-b border-gray-200 bg-white shadow-sm">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Nota de Fechamento</h2>
                      <button
                        onClick={() => setShowClosingNotesBox(false)}
                        className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria da Conversa
                        </label>
                        <select
                          value={conversationCategory}
                          onChange={(e) => setConversationCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Selecione a categoria da conversa</option>
                          <option value="support">Suporte</option>
                          <option value="sales">Vendas</option>
                          <option value="billing">Cobrança</option>
                          <option value="technical">Técnico</option>
                          <option value="general">Geral</option>
                        </select>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Resumo
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={generateConversationSummary}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Gerar Resumo com IA"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1 text-blue-600 hover:text-blue-800 border-2 border-red-500 rounded"
                              title="Resumo Manual"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500">
                            Para economizar tempo, use o recurso Resumir para gerar um resumo claro e profissional da conversa com IA
                          </p>
                        </div>
                        <textarea
                          value={closingNotesSummary}
                          onChange={(e) => setClosingNotesSummary(e.target.value)}
                          placeholder="Adicione um resumo da conversa..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          // Aqui você pode salvar as notas e fechar a conversa
                          finalizarConversa(currentConversation.chat_id);
                          setShowClosingNotesBox(false);
                          setClosingNotesSummary("");
                          setConversationCategory("");
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Fechar Conversa
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div 
                ref={listRef} 
                className="flex-1 overflow-y-auto px-6 py-6 min-h-0" 
                data-messages-container
                style={{
                  backgroundImage: `url(/assets/WhatsApp/whatsapp-bg-light.svg)`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'repeat'
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50"/>
                    <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                    <button className="mt-2 text-xs px-3 py-1.5 rounded-full border">Conversas anteriores</button>
                  </div>
                ) : (
                  <div className="flex flex-col justify-end min-h-full">
                    <div className="space-y-6 pb-6">
                      {groupedMessages.map(group => (
                        <div key={group.key}>
                          <div className="sticky top-2 z-10 w-full flex justify-center">
                            <span className="text-[11px] bg-white/80 backdrop-blur px-3 py-1 rounded-full border text-gray-600">{dayLabel(group.date)}</span>
                          </div>
                          <div className="mt-2 space-y-4">
                            {group.items.map((m:any, index: number) => {
                              // Determinar se é a última mensagem do mesmo remetente
                              const nextMessage = group.items[index + 1];
                          const isLastFromSender = !nextMessage || nextMessage.remetente !== m.remetente;
                              
                          return (
                              <MessageBubble 
                                key={m.id || m.message_id || `${m.chat_id || ''}|${m.timestamp || ''}|${index}`} 
                                message={m} 
                                onMediaLoaded={onMediaLoaded} 
                                isGroup={currentConversation?.chat_id?.includes('@g.us') || false}
                                isLastFromSender={isLastFromSender}
                                connectionId={activeConnection?.id}
                                chatId={currentConversation?.chat_id}
                                aiAgentName={aiAgentName}
                                attendanceMode={attendanceMode}
                              />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Avançado */}
              <div className="shrink-0">
                <WhatsAppOptimizedComposer
                  jid={selectedChatId || ''}
                  onStatusChange={(chatId, newStatus) => {
                    // ✅ NOVO: Atualizar status localmente quando enviar mensagem
                    updateConversationStatus(chatId, newStatus);
                  }}
                  onMessageSent={(sentMessage: any) => {
                    if (!sentMessage) return;

                    const rawMessageType = (sentMessage.message_type || sentMessage.type || 'TEXTO').toUpperCase();
                  const normalizedMessageType = rawMessageType === 'IMAGEM' ? 'IMAGE' :
                      rawMessageType === 'ARQUIVO' || rawMessageType === 'DOCUMENTO' ? 'DOCUMENT' :
                        rawMessageType === 'TEXTO' ? 'TEXT' :
                          rawMessageType;

                    const isMediaMessage = ['IMAGE', 'VIDEO', 'AUDIO', 'STICKER', 'DOCUMENT'].includes(normalizedMessageType);

                  const messageContent =
                      normalizedMessageType === 'TEXT'
                        ? (sentMessage.conteudo || sentMessage.content || sentMessage.text || '')
                        : (sentMessage.caption || '');

                  const hasAnyMediaUrl =
                      Boolean(
                        sentMessage.media_url ||
                        sentMessage.mediaUrl ||
                        sentMessage.imageUrl ||
                        sentMessage.videoUrl ||
                        sentMessage.audioUrl ||
                        sentMessage.documentUrl ||
                        sentMessage.stickerUrl
                      );
                  if (isMediaMessage && !hasAnyMediaUrl) {
                    return;
                  }

                  const normalizedMessage = {
                      ...sentMessage,
                      tempId: sentMessage.tempId,
                      id: sentMessage.id || sentMessage.message_id || `msg_${Date.now()}`,
                      message_id: sentMessage.message_id || sentMessage.id,
                      chat_id: sentMessage.chat_id || selectedChatId,
                      connection_id: sentMessage.connection_id || activeConnection?.id,
                      conteudo: messageContent,
                      content: messageContent,
                      text: messageContent,
                      message_type: normalizedMessageType,
                      type: normalizedMessageType,
                      remetente: sentMessage.remetente || 'ATENDENTE',
                      timestamp: sentMessage.timestamp || new Date().toISOString(),
                      lida: sentMessage.lida ?? true,
                      status: sentMessage.status || 'sent',
                      fromMe: true,
                      isFromMe: true,
                      media_url:
                        sentMessage.media_url ||
                        sentMessage.mediaUrl ||
                        sentMessage.imageUrl ||
                        sentMessage.videoUrl ||
                        sentMessage.audioUrl ||
                        sentMessage.documentUrl ||
                        sentMessage.stickerUrl,
                      imageUrl:
                        sentMessage.imageUrl ||
                        ((normalizedMessageType === 'IMAGE' || normalizedMessageType === 'IMAGEM') &&
                          (sentMessage.media_url || sentMessage.mediaUrl)
                          ? sentMessage.media_url || sentMessage.mediaUrl
                          : undefined),
                      videoUrl:
                        sentMessage.videoUrl ||
                        (normalizedMessageType === 'VIDEO' &&
                          (sentMessage.media_url || sentMessage.mediaUrl)
                          ? sentMessage.media_url || sentMessage.mediaUrl
                          : undefined),
                      audioUrl:
                        sentMessage.audioUrl ||
                        (normalizedMessageType === 'AUDIO' &&
                          (sentMessage.media_url || sentMessage.mediaUrl)
                          ? sentMessage.media_url || sentMessage.mediaUrl
                          : undefined),
                      documentUrl:
                        sentMessage.documentUrl ||
                        ((normalizedMessageType === 'DOCUMENT' || normalizedMessageType === 'ARQUIVO') &&
                          (sentMessage.media_url || sentMessage.mediaUrl)
                          ? sentMessage.media_url || sentMessage.mediaUrl
                          : undefined),
                      stickerUrl:
                        sentMessage.stickerUrl ||
                        (normalizedMessageType === 'STICKER' &&
                          (sentMessage.media_url || sentMessage.mediaUrl)
                          ? sentMessage.media_url || sentMessage.mediaUrl
                          : undefined),
                      mimeType: sentMessage.mimeType || sentMessage.media_mime || sentMessage.mediaMime,
                      media_mime: sentMessage.media_mime || sentMessage.mimeType || sentMessage.mediaMime,
                      media_file_name: sentMessage.media_file_name || sentMessage.fileName,
                      fileName: sentMessage.fileName || sentMessage.media_file_name,
                      caption: sentMessage.caption
                    };

                    const tempId =
                      sentMessage.tempId ||
                      (typeof sentMessage.id === 'string' && sentMessage.id.startsWith('temp')
                        ? sentMessage.id
                        : undefined);

                    setMessages(prev => {
                      const normalizeContent = (m: any) =>
                        String(m.conteudo || m.content || m.text || m.caption || '').trim();
                      const normalizedTimestamp = (val: any) =>
                        new Date(val || 0).getTime();
                      let base = prev;
 
                      if (tempId && typeof normalizedMessage.id === 'string' && !normalizedMessage.id.startsWith('temp')) {
                        const replaced = base.map(m => {
                          const isTempMatch =
                            m.id === tempId ||
                            m.message_id === tempId ||
                            (m as any).tempId === tempId;
                          if (isTempMatch) {
                            return { ...m, ...normalizedMessage };
                          }
                          return m;
                        });
                        base = replaced;
                      }
 
                      const exists = base.some(m => {
                        const sameId =
                          (m.id && normalizedMessage.id && m.id === normalizedMessage.id) ||
                          (m.message_id && normalizedMessage.message_id && m.message_id === normalizedMessage.message_id);
                        const sameChat = m.chat_id === normalizedMessage.chat_id;
                        const sameContent = normalizeContent(m) === normalizeContent(normalizedMessage);
                        const dt = Math.abs(normalizedTimestamp(m.timestamp) - normalizedTimestamp(normalizedMessage.timestamp));
                        return sameId || (sameChat && sameContent && dt < 30000);
                      });
 
                      if (!exists) {
                        base = [...base, normalizedMessage];
                      }
 
                      const sorted = base.sort((a, b) => {
                        const timeA = new Date(a.timestamp || 0).getTime();
                        const timeB = new Date(b.timestamp || 0).getTime();
                        return timeA - timeB;
                      });
 
                      const seen = new Set<string>();
                      const unique = sorted.filter(m => {
                        const t = Math.floor(new Date(m.timestamp || 0).getTime() / 30000) * 30000;
                        const sender = String(m.remetente || '').trim();
                        const content = String(m.conteudo || m.content || m.text || m.caption || '').trim();
                        const key = (m.message_id || m.id)
                          ? String(m.message_id || m.id)
                          : `${m.chat_id}|${t}|${sender}|${content}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });
                      return unique;
                    });

                    clearDraft(selectedChatId || '');
                    setInput('');

                    justSentRef.current = true;

                    requestAnimationFrame(() => {
                      scrollToBottom('auto');
                      justSentRef.current = false;
                    });

                    // ✅ NOVO: Atualizar lista de conversas IMEDIATAMENTE (Optimistic Update)
                    // Isso garante que o preview da conversa reflita a última mensagem enviada sem precisar de F5
                    setConversations(prev => {
                      const existingConv = prev.find(c => c.chat_id === sentMessage.chat_id);
                      if (existingConv) {
                        const updatedConv = {
                          ...existingConv,
                          lastMessage: normalizedMessage,
                          lastMessageAt: normalizedMessage.timestamp,
                          lastMessagePreview: buildMessagePreview({
                            type: normalizedMessage.message_type || 'TEXTO',
                            text: normalizedMessage.conteudo || normalizedMessage.caption || '',
                            caption: normalizedMessage.caption || normalizedMessage.conteudo || null,
                            fileName: normalizedMessage.fileName || null,
                            mimetype: normalizedMessage.mimeType || null
                          }),
                          // Mover para o topo
                        };
                        
                        const rest = prev.filter(c => c.chat_id !== sentMessage.chat_id);
                        return [updatedConv, ...rest];
                      }
                      return prev;
                    });
                  }}
                  onNoteAdded={async (noteText) => {
                    // Nota adicionada
                  }}
                  onDraftChange={(jid, draft) => {
                    // Atualizar preview da conversa com rascunho
                    setConversations(conversations.map(c=> 
                      c.chat_id===jid ? {
                        ...c, 
                        lastMessagePreview: draft.trim() ? `Rascunho: ${draft}` : (c.lastMessagePreview || "Nenhuma mensagem")
                      } : c
                    ));
                  }}
                />
              </div>
            </>
          ) : currentSection === 'atendendo' ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500 max-w-md mx-auto px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Selecione uma conversa</h3>
                <p className="text-sm text-gray-500">Escolha uma conversa da lista ao lado para começar a enviar mensagens.</p>
              </div>
            </div>
          ) : currentSection === 'disparo' ? (
            <DisparoSection 
              activeConnection={activeConnection}
              sendMessageTo={sendMessageTo}
              user={user}
              onDisparoSuccess={({ chatId, contact, text, type, mediaUrl }) => {
                const nowIso = new Date().toISOString();
                const preview = buildMessagePreview({
                  type: type === 'text' ? 'TEXTO' : type.toUpperCase(),
                  text,
                  caption: type !== 'text' ? text : null,
                  fileName: null,
                  mimetype: null
                });
                setConversations(prev => {
                  const existingConv = prev.find(c => c.chat_id === chatId);
                  if (existingConv) {
                    const updatedConv = {
                      ...existingConv,
                      status: 'ATENDENDO',
                      lastMessageAt: nowIso,
                      lastMessage: {
                        chat_id: chatId,
                        conteudo: text,
                        message_type: type === 'text' ? 'TEXTO' : type.toUpperCase(),
                        timestamp: nowIso,
                        remetente: 'ATENDENTE',
                        lida: true
                      },
                      lastMessagePreview: preview,
                      unread: 0
                    };
                    const rest = prev.filter(c => c.chat_id !== chatId);
                    return [updatedConv, ...rest];
                  } else {
                    const newConv = {
                      id: chatId,
                      owner_id: activeConnection?.owner_id,
                      connection_id: activeConnection?.id,
                      chat_id: chatId,
                      nome_cliente: contact?.name || contact?.phone || chatId,
                      numero_cliente: contact?.phone || chatId,
                      status: 'ATENDENDO',
                      lastMessageAt: nowIso,
                      lastMessage: {
                        chat_id: chatId,
                        conteudo: text,
                        message_type: type === 'text' ? 'TEXTO' : type.toUpperCase(),
                        timestamp: nowIso,
                        remetente: 'ATENDENTE',
                        lida: true
                      },
                      lastMessagePreview: preview,
                      unread: 0,
                      total_messages: 1,
                      profile_picture: null
                    };
                    return [newConv as any, ...prev];
                  }
                });
              }}
            />
          ) : null}
        </main>


        {/* RIGHT – contact details - Only show when a conversation is selected AND user clicked to open */}
        {currentConversation && showContactPanel && (
          <aside className="w-96 h-full min-h-0 border-l border-gray-200 bg-white shadow-lg flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <ContactSummaryPanel
                ownerId={activeConnection?.owner_id}
                conversation={{
                  chat_id: currentConversation.chat_id,
                  nome_cliente: currentConversation.nome_cliente,
                  numero_cliente: currentConversation.numero_cliente,
                  lastMessageAt: currentConversation.lastMessageAt,
                  status: currentConversation.status,
                  profile_picture: currentConversation.profile_picture,
                  whatsapp_business_name: currentConversation.whatsapp_business_name,
                  whatsapp_business_category: currentConversation.whatsapp_business_category,
                  whatsapp_business_email: currentConversation.whatsapp_business_email,
                  whatsapp_business_website: currentConversation.whatsapp_business_website,
                  whatsapp_business_description: currentConversation.whatsapp_business_description,
                  whatsapp_verified: currentConversation.whatsapp_verified,
                  whatsapp_is_group: currentConversation.whatsapp_is_group,
                  whatsapp_group_subject: currentConversation.whatsapp_group_subject,
                  whatsapp_group_description: currentConversation.whatsapp_group_description,
                }}
                messagesCount={messages.length}
                onFinalizeConversation={() => finalizarConversa(currentConversation.chat_id)}
                onTransferConversation={() => setShowTransferModal(true)}
                onConvertToLead={() => setShowConvertToLeadModal(true)}
                getIdentity={getIdentity}
                groupMeta={groupMeta}
              />
            </div>
          </aside>
        )}
      </div>
      
      {/* Modal de Transferência de Conversa */}
      <WhatsAppQuickConnectModal
        open={showQuickConnectModal}
        onOpenChange={setShowQuickConnectModal}
      />

      <WhatsAppTransferModal
        isOpen={showTransferModal}
        onClose={() => {
                  setShowTransferModal(false);
                  setSelectedAgent(null);
                }}
        atendimentoId={currentConversation?.id || ''}
        chatName={currentConversation ? getDisplayName(currentConversation, undefined, getIdentity) : ''}
        onTransferComplete={() => {
          // Recarregar conversas após transferência
          if (activeConnection?.owner_id) {
            loadConversations(activeConnection.owner_id);
          }
          setSelectedChatId(null);
        }}
      />

      {/* Modal de Informações do Contato */}
      {currentConversation && (
        <WhatsAppContactInfoModal
          isOpen={showContactInfoModal}
          onClose={() => setShowContactInfoModal(false)}
          chatId={currentConversation.chat_id}
          contactName={getDisplayName(currentConversation, undefined, getIdentity)}
          contactPhone={currentConversation.numero_cliente}
          profilePicture={currentConversationIdentity?.avatar || currentConversation.profile_picture}
          connectionId={activeConnection?.id}
        />
      )}

      {/* Modal de Converter para Lead */}
      {currentConversation && (
        <CreateLeadModal
          isOpen={showConvertToLeadModal}
          onClose={() => setShowConvertToLeadModal(false)}
          onLeadCreated={async (leadData?: any) => {
            // Disparar evento para atualizar leads em outras páginas
            // O leadData pode conter informações sobre o lead criado, incluindo pipeline_id
            const leadCreatedEvent = new CustomEvent('leadCreated', {
              detail: { 
                source: 'whatsapp',
                pipelineId: leadData?.pipeline_id || leadData?.pipelineId
              }
            });
            window.dispatchEvent(leadCreatedEvent);
            
            toast({
              title: "Sucesso!",
              description: "Lead criado com sucesso!",
            });
          }}
          initialData={{
            name: getDisplayName(currentConversation, undefined, getIdentity),
            phone: currentConversation.numero_cliente || '',
            source: 'whatsapp',
            chatId: currentConversation.chat_id
          }}
        />
      )}

      {/* Modal de Criar Contato */}
      {currentConversation && (
        <RegisterContactModal
          isOpen={showRegisterContactModal}
          onClose={() => setShowRegisterContactModal(false)}
          initialName={getDisplayName(currentConversation, undefined, getIdentity)}
          initialPhone={currentConversation.numero_cliente || ''}
          onContactCreated={(contact) => {
            setShowRegisterContactModal(false);
            navigate('/contacts');
          }}
        />
      )}

      {/* Modal de Criar Empresa */}
      {currentConversation && (
        <CreateCompanyModal
          isOpen={showCreateCompanyModal}
          onClose={() => setShowCreateCompanyModal(false)}
          initialData={{
            fantasy_name: getDisplayName(currentConversation, undefined, getIdentity),
            company_name: getDisplayName(currentConversation, undefined, getIdentity),
            phone: currentConversation.numero_cliente || '',
            description: `Empresa criada a partir do WhatsApp (Chat ID: ${currentConversation.chat_id})`
          }}
          onSubmit={async (formData) => {
            try {
              await createCompany(formData);
              
              toast({
                title: "Sucesso!",
                description: "Empresa criada com sucesso!",
              });
            } catch (error) {
              console.error('Erro ao criar empresa:', error);
              toast({
                title: "Erro",
                description: "Não foi possível criar a empresa.",
                variant: "destructive",
              });
            }
          }}
        />
      )}
                        </div>
  );
}
