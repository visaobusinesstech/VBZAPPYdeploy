import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Building2, 
  Users, 
  Shield, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronUp,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Trash2 as TrashIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  User,
  Briefcase,
  MapPin,
  Lock,
  Key,
  AlertTriangle,
  Link,
  QrCode,
  MessageSquare,
  Webhook,
  Cloud,
  AlignJustify,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSocketBaseUrl } from '@/lib/socketManager';

// Environment fallbacks alinhadas ao socket Baileys
const getApiBase = () => getSocketBaseUrl();

const FALLBACK_ENV_COMPANY_ID =
  import.meta.env.VITE_DEFAULT_COMPANY_ID ||
  import.meta.env.VITE_COMPANY_ID ||
  import.meta.env.VITE_FALLBACK_COMPANY_ID ||
  null;

const FALLBACK_ENV_LEGACY_USER_ID =
  import.meta.env.VITE_DEFAULT_USER_LEGACY_ID ||
  import.meta.env.VITE_USER_LEGACY_ID ||
  import.meta.env.VITE_FALLBACK_USER_LEGACY_ID ||
  null;

const FALLBACK_ENV_AUTH_USER_ID =
  import.meta.env.VITE_DEFAULT_AUTH_USER_ID ||
  import.meta.env.VITE_AUTH_USER_ID ||
  import.meta.env.VITE_FALLBACK_AUTH_USER_ID ||
  null;

// Connection state type
type ConnState = 'idle' | 'qr' | 'connected' | 'error';

import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useToast } from '@/hooks/useToast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConnections } from '@/contexts/ConnectionsContext';
import { isFetchNetworkError } from '@/utils/network';
import ConnectionDetailsModal from '@/components/ConnectionDetailsModal';
import { AddItemModal } from '@/components/AddItemModal';
import { AddUserModal } from '@/components/AddUserModal';
import CompanyUserForm from '@/components/CompanyUserForm';
import CompanyUserEditModal from '@/components/CompanyUserEditModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import { EditItemModal } from '@/components/EditItemModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ToastContainer } from '@/components/ui/toast';
import ButtonTheme from '@/components/ButtonTheme';
import OptimizedQRModal from '@/components/OptimizedQRModal';
import DisconnectConfirmModal from '@/components/DisconnectConfirmModal';
import ConnectionsOptionsGrid from '@/components/ConnectionsOptionsGrid';
import RolePermissionsManagerNew from '@/components/RolePermissionsManagerNew';
import { EmailSettingsForm } from '@/components/EmailSettingsForm';
import { RightDrawerModal, ModalSection } from '@/components/ui/right-drawer-modal';
import { useTranslation } from 'react-i18next';
import { ExpandedColorPicker } from '@/components/ExpandedColorPicker';
import { CompanyLogoUpload } from '@/components/CompanyLogoUpload';
import { useNavigate } from 'react-router-dom';

type IdentitySnapshot = {
  authUserId: string | null;
  id_empresa: string | null;
  id_usuario: string | null;
};

const INITIAL_CONNECTION_FORM = {
  name: '',
  type: 'whatsapp_baileys',
  description: '',
  webhookUrl: '',
  webhookToken: ''
};

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { sidebarExpanded, setSidebarExpanded, showMenuButtons, expandSidebarFromMenu } = useSidebar();
  const { user } = useAuth();
  const { success, error: showError, toasts, removeToast } = useToast();
  const { profile, loadProfile } = useUserProfile();
  const { refreshUserData } = useUser();
  const {
    settings,
    areas,
    roles,
    users,
    loading,
    error,
    saveCompanySettings,
    addArea,
    editArea,
    deleteArea,
    addRole,
    editRole,
    deleteRole,
    saveRolePermissions,
    addUser,
    editUser,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    loadData,
  } = useCompanySettings(user?.id);

  const {
    connections,
    addConnection,
    updateConnection,
    deleteConnection,
    generateQRCode,
    connectWhatsApp,
    disconnectWhatsApp,
    loadConnections,
    updateConnectionStatus
  } = useConnections();

  const [activeTab, setActiveTab] = useState('profile');
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    telefone: '',
    cnpj: '',
    cpf: '',
    tipo_pessoa: '',
    cep: '',
    endereco: '',
    cidade: '',
    estado: '',
    nicho: '',
    default_language: '',
    default_timezone: '',
    default_currency: '',
    datetime_format: '',
  });

  const [themeColors, setThemeColors] = useState({
    sidebar_color: '#dee2e3',
    topbar_color: '#0f172a', // Cor padrão original azul escuro do sistema
    button_color: '#4A5477',
  });

  // Sincronizar themeColors com settings quando carregados
  useEffect(() => {
    if (settings) {
      setThemeColors({
        sidebar_color: settings.sidebar_color || '#dee2e3',
        topbar_color: settings.topbar_color || '#0f172a', // Cor padrão original azul escuro
        button_color: settings.button_color || '#4A5477',
      });
    }
  }, [settings]);

  const getUserIdentity = useCallback(() => {
    let storedProfile: any = {};
    try {
      if (typeof window !== 'undefined') {
        storedProfile = JSON.parse(window.localStorage.getItem('user_profile') || '{}');
      }
    } catch {
      storedProfile = {};
    }

    const userMeta: any = (user as any)?.user_metadata || {};

    let lastCompanyId: string | null = null;
    try {
      if (typeof window !== 'undefined') {
        lastCompanyId = window.localStorage.getItem('vb_last_company_id');
      }
    } catch {
      lastCompanyId = null;
    }

    let manualCompanyId: string | null = null;
    let manualLegacyId: string | null = null;
    let manualAuthId: string | null = null;

    try {
      if (typeof window !== 'undefined') {
        manualCompanyId = window.localStorage.getItem('vb_manual_company_id');
        manualLegacyId = window.localStorage.getItem('vb_manual_user_legacy_id');
        manualAuthId = window.localStorage.getItem('vb_manual_auth_user_id');
      }
    } catch {
      manualCompanyId = null;
      manualLegacyId = null;
      manualAuthId = null;
    }

    const idEmpresa =
      (profile as any)?.id_empresa ||
      userMeta?.id_empresa ||
      userMeta?.companyId ||
      storedProfile?.id_empresa ||
      storedProfile?.company_id ||
      lastCompanyId ||
      manualCompanyId ||
      FALLBACK_ENV_COMPANY_ID ||
      (settings as any)?.id_empresa ||
      null;

    const idUsuario =
      (profile as any)?.id_usuario ||
      userMeta?.id_usuario ||
      userMeta?.legacyUserId ||
      storedProfile?.id_usuario ||
      storedProfile?.legacy_user_id ||
      manualLegacyId ||
      FALLBACK_ENV_LEGACY_USER_ID ||
      null;

    const authUserId =
      (profile as any)?.id ||
      storedProfile?.id ||
      storedProfile?.auth_id ||
      user?.id ||
      manualAuthId ||
      FALLBACK_ENV_AUTH_USER_ID ||
      null;

    try {
      if (typeof window !== 'undefined') {
        const updatedProfile = {
          ...storedProfile,
          id: authUserId || storedProfile?.id || null,
          auth_id: authUserId || storedProfile?.auth_id || null,
          id_empresa: idEmpresa || storedProfile?.id_empresa || null,
          company_id: idEmpresa || storedProfile?.company_id || null,
          id_usuario: idUsuario || storedProfile?.id_usuario || null,
          legacy_user_id: idUsuario || storedProfile?.legacy_user_id || null
        };
        window.localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
        if (idEmpresa) {
          window.localStorage.setItem('vb_last_company_id', String(idEmpresa));
        }
        if (idEmpresa && !manualCompanyId) {
          window.localStorage.setItem('vb_manual_company_id', String(idEmpresa));
        }
        if (idUsuario && !manualLegacyId) {
          window.localStorage.setItem('vb_manual_user_legacy_id', String(idUsuario));
        }
        if (authUserId && !manualAuthId) {
          window.localStorage.setItem('vb_manual_auth_user_id', String(authUserId));
        }
      }
    } catch {
      // armazenamento opcional
    }

    return {
      authUserId: authUserId ? String(authUserId) : null,
      id_empresa: idEmpresa ? String(idEmpresa) : null,
      id_usuario: idUsuario ? String(idUsuario) : null
    };
  }, [profile, user, settings]);

  const buildAuthHeaders = useCallback((identityOverride?: IdentitySnapshot) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const { authUserId, id_empresa, id_usuario } = identityOverride || getUserIdentity();

    if (authUserId) {
      headers['x-user-id'] = String(authUserId);
    }

    if (id_empresa) {
      headers['x-company-id'] = String(id_empresa);
    }

    if (id_usuario) {
      headers['x-user-legacy-id'] = String(id_usuario);
    }

    return headers;
  }, [getUserIdentity]);

  const [securitySettings, setSecuritySettings] = useState({
    enable_2fa: false,
    password_policy: {
      min_length: 8,
      require_numbers: true,
      require_uppercase: true,
      require_special: true,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para seção de Segurança
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<any[]>([]);
  const [isLoadingLoginAttempts, setIsLoadingLoginAttempts] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  // Estados para perfil do usuário
  const [profileForm, setProfileForm] = useState({
    name: '',
    position: '',
    department: '',
    avatar_url: ''
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Estados para modais de conexões
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showConnectionDetailsModal, setShowConnectionDetailsModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [createTypeLocked, setCreateTypeLocked] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    connecting: true,
    lastError: null,
    sessionName: null
  });
  const [connectionForm, setConnectionForm] = useState({ ...INITIAL_CONNECTION_FORM });

  // Helper to open the existing "Nova Conexão" modal preset with a type
  const openCreateModal = (type: 'whatsapp_baileys' | 'webhook') => {
    setConnectionForm({ ...INITIAL_CONNECTION_FORM, type });
    setCreateTypeLocked(true);
    setShowConnectionModal(true);
  };

  // If the user closes the modal, unlock the selector for legacy flow
  const closeCreateModal = () => {
    setShowConnectionModal(false);
    setCreateTypeLocked(false);
    setEditingConnection(null);
    setConnectionForm({ ...INITIAL_CONNECTION_FORM });
  };

  const handleCloseQRModal = useCallback(() => {
    clearCreateConnectionRetry();
    setShowQRModal(false);
    setBaileysConnectionId(null);
    setQrModalError(null);
    setQrModalStatus(null);
    setQrModalForceOffline(false);
  }, []);

  // QR Connection states
  const [showQRModal, setShowQRModal] = useState(false);
  const [baileysConnectionId, setBaileysConnectionId] = useState<string | null>(null);
  const [qrModalError, setQrModalError] = useState<string | null>(null);
  const [qrModalStatus, setQrModalStatus] = useState<string | null>(null);
  const [qrModalForceOffline, setQrModalForceOffline] = useState(false);
  const createConnectionRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_BACKEND_RETRIES = 5;
  const BASE_BACKEND_RETRY_DELAY = 2000;
  
  // Open QR modal when baileysConnectionId is set
  useEffect(() => {
    if (baileysConnectionId && !showQRModal) {
      setShowQRModal(true);
    }
  }, [baileysConnectionId, showQRModal]);

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Disconnect confirmation modal states
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<any>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Refs for timers and socket
  const lastCreatedNameRef = useRef<string>('');
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingStatusRef = useRef(false);
  // const socketRef = useRef<Socket | null>(null);
  
  // Control multiple pairing attempts
  const pairingInstances = useRef<Set<string>>(new Set());

  // Helper function to clear timers
  function clearTimers() {
    if (refreshTimerRef.current) { 
      clearInterval(refreshTimerRef.current); 
      refreshTimerRef.current = null; 
    }
    if (expiryTimerRef.current) { 
      clearInterval(expiryTimerRef.current); 
      expiryTimerRef.current = null; 
    }
  }

  function clearCreateConnectionRetry() {
    if (createConnectionRetryRef.current) {
      clearTimeout(createConnectionRetryRef.current);
      createConnectionRetryRef.current = null;
    }
  }

  // Funções para gerenciar perfil do usuário
  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro específico quando usuário começar a digitar
    if (profileErrors[field]) {
      setProfileErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar se é um arquivo de imagem
    if (!file.type.startsWith('image/')) {
      showError('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    // Validar tamanho do arquivo (máx 100MB)
    if (file.size > 100 * 1024 * 1024) {
      showError('O arquivo deve ter no máximo 100MB.');
      return;
    }

    try {
      setIsLoadingProfile(true);
      
      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Atualizar estado local
      setProfileForm(prev => ({
        ...prev,
        avatar_url: publicUrl
      }));

      // Atualizar user_metadata para sincronizar com a topbar
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) {
        // Silent: Erro ao atualizar user_metadata
      }

      // Atualizar também a tabela profiles
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (profileUpdateError) {
        // Erro ao atualizar perfil - silencioso
      }

      // Forçar atualização do perfil para sincronizar com a topbar
      await loadProfile();

      success('Foto de perfil carregada com sucesso!');
    } catch (error: any) {
      // Silent: Erro ao fazer upload da foto
      showError('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setIsLoadingProfile(false);
      // Limpar o input para permitir upload do mesmo arquivo novamente
      event.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    // Validação
    const errors: Record<string, string> = {};
    
    if (!profileForm.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    try {
      setIsLoadingProfile(true);
      setProfileErrors({});

      // Atualizar perfil na tabela users (ambas as colunas para compatibilidade)
      const { error: userError } = await supabase
        .from('users')
        .update({
          nome: profileForm.name.trim(),
          full_name: profileForm.name.trim(),
          avatar_url: profileForm.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) {
        // Se der erro, tentar atualizar na tabela profiles
        console.log('Erro ao atualizar users, tentando profiles:', userError);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: profileForm.name.trim(),
            avatar_url: profileForm.avatar_url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);

        if (profileError) {
          throw profileError;
        }
      }

      // Atualizar também o user_metadata do Supabase Auth
      await supabase.auth.updateUser({
        data: {
          name: profileForm.name.trim(),
          avatar_url: profileForm.avatar_url || null
        }
      });

      // Atualizar o UserContext para refletir as mudanças na saudação do dashboard
      await refreshUserData();

      success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      showError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Carregar dados do perfil do usuário
  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      // Buscar dados na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, cargo, area, avatar_url')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar usuário:', userError);
      }

      if (userData) {
        setProfileForm({
          name: userData.full_name || '',
          position: userData.cargo || '',
          department: userData.area || '',
          avatar_url: userData.avatar_url || ''
        });
      } else {
        // Se não encontrar na tabela users, buscar na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('nome, position, department, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          // Erro ao buscar perfil - silencioso
        }

        if (profileData) {
          setProfileForm({
            name: profileData.nome || '',
            position: profileData.position || '',
            department: profileData.department || '',
            avatar_url: profileData.avatar_url || ''
          });
        } else {
          // Se não existe perfil, criar um com dados básicos do usuário
          setProfileForm({
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
            position: '',
            department: '',
            avatar_url: user.user_metadata?.avatar_url || ''
          });
        }
      }
    } catch (error: any) {
      // Erro ao carregar perfil - silencioso
    }
  };

  // Carregar configurações de email
  const loadEmailSettings = async () => {
    if (!user?.id) return;

    try {
      // Buscar configurações SMTP do usuário na tabela configuracoes
      const { data: smtpData, error: smtpError } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (smtpData && !smtpError) {
        console.log("✅ Configurações SMTP carregadas:", {
          host: smtpData.smtp_host,
          port: smtpData.email_porta,
          user: smtpData.email_usuario,
          hasPassword: !!smtpData.smtp_pass
        });

        setEmailSettings({
          provider: 'gmail', // Padrão
          smtp_host: smtpData.smtp_host || '',
          smtp_port: smtpData.email_porta || 587,
          email: smtpData.email_usuario || '',
          password: smtpData.smtp_pass || '', // ✅ MOSTRAR SENHA SALVA
          use_tls: smtpData.smtp_seguranca === 'tls',
          from_name: smtpData.smtp_from_name || ''
        });
      } else {
        // Tabela users não tem configurações SMTP
        // SMTP deve estar apenas em configuracoes
        console.log("ℹ️ Configurações SMTP não encontradas em configuracoes, usando padrões");
        
        // Configurações padrão se não encontrar nada
        setEmailSettings({
          provider: 'gmail',
          smtp_host: '',
          smtp_port: 587,
          email: '',
          password: '', // ✅ Campo vazio se não há senha
          use_tls: true,
          from_name: ''
        });
      }
    } catch (error: any) {
      console.error("❌ Erro ao carregar configurações SMTP:", error);
      // Silent: Erro ao carregar configurações de email
    }
  };

  // Salvar configurações de email
  const saveEmailSettings = async () => {
    if (!user?.id) return;

    // Validação
    const errors: Record<string, string> = {};
    if (!emailSettings.email) errors.email = 'Email é obrigatório';
    if (!emailSettings.smtp_host) errors.smtp_host = 'Host SMTP é obrigatório';
    if (!emailSettings.password) errors.password = 'Senha é obrigatória';

    if (Object.keys(errors).length > 0) {
      setEmailSettingsErrors(errors);
      return;
    }

    setIsLoadingEmailSettings(true);
    setEmailSettingsErrors({});

    try {
      // 1. Salvar em users (compatibilidade)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          smtp_host: emailSettings.smtp_host,
          email_porta: emailSettings.smtp_port,
          email_usuario: emailSettings.email,
          smtp_pass: emailSettings.password,
          smtp_from_name: emailSettings.from_name || 'Sistema',
          smtp_seguranca: emailSettings.use_tls ? 'tls' : 'ssl',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Erro ao salvar em users:', profileError);
        throw profileError;
      }

      // 2. Salvar/Atualizar em configuracoes (tabela unificada)
      const { data: existingConfig } = await supabase
        .from('configuracoes')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingConfig) {
        // Atualizar configuração existente
        const { error: updateError } = await supabase
          .from('configuracoes')
          .update({
            smtp_host: emailSettings.smtp_host,
            email_porta: emailSettings.smtp_port,
            email_usuario: emailSettings.email,
            smtp_pass: emailSettings.password,
            smtp_from_name: emailSettings.from_name || 'Sistema',
            smtp_seguranca: emailSettings.use_tls ? 'tls' : 'ssl',
            use_smtp: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.warn('Erro ao atualizar configuracoes:', updateError);
        } else {
          console.log('✅ Configurações SMTP atualizadas na tabela configuracoes');
        }
      } else {
        // Criar nova configuração
        const { error: insertError } = await supabase
          .from('configuracoes')
          .insert({
            user_id: user.id,
            smtp_host: emailSettings.smtp_host,
            email_porta: emailSettings.smtp_port,
            email_usuario: emailSettings.email,
            smtp_pass: emailSettings.password,
            smtp_from_name: emailSettings.from_name || 'Sistema',
            smtp_seguranca: emailSettings.use_tls ? 'tls' : 'ssl',
            use_smtp: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.warn('Erro ao criar configuracoes:', insertError);
        } else {
          console.log('✅ Configurações SMTP criadas na tabela configuracoes');
        }
      }

      // 3. Verificação final - garantir que salvou corretamente
      const { data: finalCheck } = await supabase
        .from('configuracoes')
        .select('id, smtp_host, email_porta, email_usuario, use_smtp')
        .eq('user_id', user.id)
        .single();

      if (finalCheck) {
        console.log('✅ Configurações SMTP confirmadas:', {
          host: finalCheck.smtp_host,
          port: finalCheck.email_porta,
          user: finalCheck.email_usuario,
          active: finalCheck.use_smtp
        });
      }

      success('Configurações de email salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações de email:', error);
      showError('Erro ao salvar configurações de email. Tente novamente.');
    } finally {
      setIsLoadingEmailSettings(false);
    }
  };

  // Connect to Baileys backend and get real QR code
  async function connectToBaileys(instanceId: string) {
    try {
      // Silent: Connecting to Baileys backend
      
      // Create connection in Baileys backend
      const requestBody = {
        connectionId: instanceId,
        name: lastCreatedNameRef.current || 'WhatsApp Web',
        phoneNumber: null
      };
      // Silent: Request body logged
      
      // ✅ BACKEND FUNCIONANDO: Usando servidor WhatsApp Baileys dedicado
      console.log('🔧 Conectando ao servidor WhatsApp Baileys...');
      
      // First, login the user to the WhatsApp server
      const apiBase = getApiBase();
      const identity = getUserIdentity();

      if (!identity.id_empresa || !identity.id_usuario) {
        throw new Error('Usuário sem id_empresa/id_usuario configurados');
      }

      const loginBody = {
        user_id: identity.authUserId,
        id_empresa: identity.id_empresa,
        id_usuario: identity.id_usuario
      };

      const loginResponse = await fetch(`${apiBase}/api/baileys-simple/login`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(loginBody)
      });
      
      if (!loginResponse.ok) {
        throw new Error('Failed to login to WhatsApp server');
      }
      
      console.log('✅ Logged in to WhatsApp server');
      
      // Now create the connection with auth headers
      const connectionBody = {
        ...requestBody,
        name: lastCreatedNameRef.current || 'WhatsApp Web',
        user_id: identity.authUserId,
        id_empresa: identity.id_empresa,
        id_usuario: identity.id_usuario
      };

      const response = await fetch(`${apiBase}/api/baileys-simple/connections`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(connectionBody)
      });

      const data = await response.json();
      
      if (data.success) {
        const connectionId = data.data.connectionId || data.data.id;
        console.log('Baileys connection created:', connectionId);
        
        // ✅ ensure modal tracks the server-side id too
        setBaileysConnectionId(connectionId);
        
        return connectionId;
      } else {
        // Verificar se é erro de conexão duplicada
        if (data.code === 'CONNECTION_ALREADY_EXISTS') {
          throw new Error('Já existe uma conexão WhatsApp ativa. Desconecte a conexão atual antes de criar uma nova.');
        }
        throw new Error(data.error || 'Erro ao criar conexão Baileys');
      }
    } catch (error) {
      console.error('Error creating Baileys connection:', error);
      throw error;
    }
  }


  // Socket attachment function with real Baileys QR
  async function attachSocket(instanceId: string) {
    try {
      console.log('AttachSocket called for:', instanceId);
      
      // Connect to Baileys backend (Baileys já inicia automaticamente ao criar a conexão)
      const connectionId = await connectToBaileys(instanceId);
      console.log('✅ Baileys connection created e iniciado:', connectionId);
      console.log('🔧 Baileys já está rodando e gerando QR code...');
      console.log('🔧 Abrindo modal QR com connectionId:', connectionId);
      
      // O OptimizedQRModal fará o polling automático do QR code
      // O Baileys já foi iniciado no createWhatsAppConnection, então o QR code será gerado em segundos
      
    } catch (error) {
      console.error('Error in attachSocket:', error);
      showError('Erro ao criar conexão WhatsApp');
    }
  }

  // Start pairing function with QR refresh
  function startPairing(instanceId: string) {
    try {
      console.log('StartPairing called for:', instanceId);
      
      // Check if already pairing this instance
      if (pairingInstances.current.has(instanceId)) {
        console.log('Already pairing this instance, skipping...');
        return;
      }
      
      // Mark as pairing
      pairingInstances.current.add(instanceId);
      
      // Clear any existing pairing for this connection
      pairingInstances.current.forEach((id) => {
        if (id !== instanceId) {
          pairingInstances.current.delete(id);
        }
      });
      
      attachSocket(instanceId);

      // Clear any existing timers
      clearTimers();
      
      // QR refresh timer DESABILITADO - O Baileys gera QR automaticamente
      // O OptimizedQRModal faz polling a cada 2 segundos e pega o QR code atualizado
      // refreshTimerRef.current = setInterval(() => {
      //   // Não precisa refresh manual, Baileys gera automaticamente
      // }, 20000);
      
      // 90s expiry timer - handled by OptimizedQRModal
      expiryTimerRef.current = setInterval(() => {
        // Timer logic moved to OptimizedQRModal
      }, 1000);
    } catch (error) {
      console.error('Error in startPairing:', error);
      // Error handling moved to OptimizedQRModal
    }
  }

  // Handle form submission for both Enter key and button click
  async function handleFormSubmit() {
    try {
      if (editingConnection) {
        await updateConnection(editingConnection.id, connectionForm);
        closeCreateModal();
        success('Conexão atualizada com sucesso!');
      } else {
        // Use new handleSaveCreate function for Baileys connections
        if (connectionForm.type === 'whatsapp_baileys') {
          // Creating Baileys connection
          await handleSaveCreate({
            name: connectionForm.name,
            notes: connectionForm.description
          });
          // QR modal log removed for quiet console
        } else {
          // For other types, use the old method
          const result = await addConnection({
            ...connectionForm,
            status: 'disconnected'
          });
          
          if (result.success) {
            closeCreateModal();
            success('Conexão criada com sucesso!');
          } else {
            error(result.error || 'Erro ao criar conexão');
          }
        }
      }
    } catch (err) {
      console.error('Erro ao salvar conexão:', err);
      error('Erro ao salvar conexão');
    }
  }

  const handleTestWebhook = useCallback(async () => {
    if (!connectionForm.webhookUrl) {
      return;
    }

    try {
      const result = await testWebhook(
        connectionForm.webhookUrl || '',
        connectionForm.webhookToken
      );

      if (result.success) {
        success('✅ Webhook testado com sucesso! Resposta recebida.');
      } else {
        error(result.error || 'Erro ao testar webhook');
      }
    } catch (err) {
      error('Erro ao testar webhook');
    }
  }, [connectionForm.webhookUrl, connectionForm.webhookToken, success, error]);

  // Finalize connection function - now handled by OptimizedQRModal
  async function finalizeConnection() {
    console.log('finalizeConnection called');
    // Connection finalization moved to OptimizedQRModal
    try {
      console.log('Finalizing connection');
      
      success('✅ WhatsApp conectado com sucesso!');
      clearTimers();
      
      console.log('About to call loadConnections');
      await loadConnections(user?.id);
      console.log('loadConnections completed');
      
    } catch (e: any) {
      console.error('Error finalizing connection:', e);
      // Error handling moved to OptimizedQRModal
      clearTimers();
    }
    console.log('finalizeConnection completed');
  }

  function scheduleBackendRetry(name: string, identity: IdentitySnapshot, attempt: number, lastError: Error | null) {
    if (attempt >= MAX_BACKEND_RETRIES) {
      const finalMessage =
        lastError?.message ||
        'Não foi possível conectar ao servidor WhatsApp (Baileys). Verifique se o backend está rodando na porta 3000.';
      setQrModalError(finalMessage);
      setQrModalStatus(null);
      setQrModalForceOffline(true);
      showError(finalMessage);
      return;
    }

    const nextAttempt = attempt + 1;
    const delay = Math.min(10000, BASE_BACKEND_RETRY_DELAY * nextAttempt);
    setQrModalForceOffline(true);
    setQrModalError(
      `Servidor WhatsApp indisponível. Tentando novamente em ${(delay / 1000).toFixed(0)}s (tentativa ${nextAttempt}/${MAX_BACKEND_RETRIES}).`
    );
    setQrModalStatus(`Aguardando servidor ficar disponível... nova tentativa em ${(delay / 1000).toFixed(0)}s`);

    clearCreateConnectionRetry();
    createConnectionRetryRef.current = setTimeout(() => {
      attemptCreateBaileysConnection(name, identity, nextAttempt);
    }, delay);
  }

  async function attemptCreateBaileysConnection(
    name: string,
    identity: IdentitySnapshot,
    attempt = 1
  ): Promise<void> {
      const apiBase = getApiBase();
    const authHeaders = buildAuthHeaders(identity);

    clearCreateConnectionRetry();
    setQrModalStatus(`Conectando ao servidor WhatsApp... (tentativa ${attempt}/${MAX_BACKEND_RETRIES})`);

    try {
      const loginResponse = await fetch(`${apiBase}/api/baileys-simple/login`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          user_id: identity.authUserId,
          id_empresa: identity.id_empresa,
          id_usuario: identity.id_usuario
        })
      });

      if (!loginResponse.ok) {
        const errorPayload = await loginResponse.json().catch(() => null);
        throw new Error(errorPayload?.error || `Falha ao autenticar no servidor WhatsApp (status ${loginResponse.status})`);
      }
    } catch (loginError: any) {
      console.warn('⚠️ Erro ao autenticar no Baileys:', loginError);
      if (isFetchNetworkError(loginError)) {
        scheduleBackendRetry(name, identity, attempt, loginError);
        return;
      }
      setQrModalForceOffline(false);
      setQrModalStatus(null);
      setQrModalError(loginError?.message || 'Erro ao autenticar no servidor WhatsApp.');
      showError(loginError?.message || 'Erro ao autenticar no servidor WhatsApp.');
        return;
      }

    setQrModalStatus('Criando conexão WhatsApp...');

    const requestPayload = {
      name,
      user_id: identity.authUserId,
      id_empresa: identity.id_empresa,
      id_usuario: identity.id_usuario
    };

    console.log('📤 Enviando requisição para criar conexão:', {
      url: `${apiBase}/api/baileys-simple/connections`,
      headers: Object.keys(authHeaders),
      payload: requestPayload
    });

        try {
      const response = await fetch(`${apiBase}/api/baileys-simple/connections`, {
            method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestPayload)
          });
          
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseError) {
        const text = await response.text().catch(() => 'Resposta vazia');
        console.error('❌ Erro ao parsear resposta do backend:', text);
        throw new Error(`Erro ao processar resposta do servidor (status ${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok || !data?.success) {
        const backendError = data?.error || data?.details || `Erro ao criar conexão (status ${response.status})`;
        const errorCode = data?.code || 'UNKNOWN_ERROR';
        console.error('❌ Backend retornou erro:', {
          status: response.status,
          error: backendError,
          code: errorCode,
          fullResponse: data
        });
        throw new Error(`${backendError} (${errorCode})`);
      }

          const connectionId = data.data.connectionId || data.data.id;

      setQrModalStatus('Conexão criada. Aguardando QR Code...');
      setQrModalError(null);
      setQrModalForceOffline(false);
          setBaileysConnectionId(connectionId);
      lastCreatedNameRef.current = name;
          
          const selectedConn = {
            id: connectionId,
        name,
            type: 'whatsapp_baileys',
            status: 'disconnected',
            qrCode: null
          };
          setSelectedConnection(selectedConn);
    } catch (createError: any) {
      console.error('❌ Erro ao criar conexão Baileys:', {
        error: createError,
        message: createError?.message,
        stack: createError?.stack,
        isNetworkError: isFetchNetworkError(createError)
      });
      
      if (isFetchNetworkError(createError)) {
        scheduleBackendRetry(name, identity, attempt, createError);
        return;
      }
      
      // NÃO FECHAR O MODAL - apenas mostrar o erro dentro dele
      setQrModalStatus(null);
      setQrModalForceOffline(false);
      const errorMessage = createError?.message || 'Erro ao criar conexão WhatsApp. Verifique os logs do console para mais detalhes.';
      setQrModalError(errorMessage);
      showError(errorMessage);
      
      // Log detalhado para debug
      console.error('❌ Detalhes completos do erro:', {
        name,
        identity,
        attempt,
        error: createError
      });
    }
  }

  // Handle save create function
  async function handleSaveCreate(values: { name: string; notes?: string }) {
    try {
      console.log('🔍 handleSaveCreate called with:', values);
      const name = values?.name?.trim();
      if (!name) {
        showError('Nome da conexão é obrigatório');
        return;
      }

      lastCreatedNameRef.current = name;
      console.log('🔍 handleSaveCreate - Nome salvo:', lastCreatedNameRef.current);

      const identity = getUserIdentity();

      console.log('🔍 Identity obtida:', {
        id_empresa: identity.id_empresa,
        id_usuario: identity.id_usuario,
        authUserId: identity.authUserId,
        hasIdEmpresa: !!identity.id_empresa,
        hasIdUsuario: !!identity.id_usuario
      });

      if (!identity.id_empresa || !identity.id_usuario) {
        const missingFields = [];
        if (!identity.id_empresa) missingFields.push('id_empresa');
        if (!identity.id_usuario) missingFields.push('id_usuario');
        
        const errorMsg = `Campos obrigatórios ausentes: ${missingFields.join(', ')}. Configure estes valores antes de criar a conexão.`;
        console.error('❌ Validação falhou:', errorMsg);
        showError(errorMsg);
        setShowQRModal(false);
        return;
      }

      setShowConnectionModal(false);
      setShowQRModal(true);
      setQrModalError(null);
      setQrModalStatus('Iniciando conexão com WhatsApp...');
      setQrModalForceOffline(false);
      clearCreateConnectionRetry();

      await attemptCreateBaileysConnection(name, identity, 1);
      console.log('handleSaveCreate completed com fluxo Baileys');
      return;
    } catch (error) {
      console.error('Error in handleSaveCreate:', error);
      showError('Erro ao criar conexão: ' + (error as Error).message);
    }
  }


  // Debug QR modal state changes - silenced for quiet console
  useEffect(() => {
    // QR Modal state logging removed for quiet console
  }, [showQRModal, baileysConnectionId]);

  // Atualizar formulários quando settings mudar
  useEffect(() => {
    if (settings && settings.company_name) {
      console.log('📊 ===== CARREGANDO DADOS DA TABELA ORGANIZATIONS =====');
      console.log('Nome:', settings.company_name);
      console.log('Tipo Pessoa:', settings.tipo_pessoa);
      console.log('CPF:', settings.cpf);
      console.log('CNPJ:', settings.cnpj);
      console.log('Telefone:', settings.telefone);
      console.log('Cidade:', settings.cidade);
      console.log('Estado:', settings.estado);
      console.log('Nicho:', settings.nicho);
      
      setCompanyForm({
        company_name: settings.company_name,
        telefone: settings.telefone || '',
        cnpj: settings.cnpj || '',
        cpf: settings.cpf || '',
        tipo_pessoa: settings.tipo_pessoa || 'PJ',
        cep: settings.cep || '',
        endereco: settings.endereco || '',
        cidade: settings.cidade || '',
        estado: settings.estado || '',
        nicho: settings.nicho || '',
        default_language: settings.default_language || 'pt-BR',
        default_timezone: settings.default_timezone || 'America/Sao_Paulo',
        default_currency: settings.default_currency || 'BRL',
        datetime_format: settings.datetime_format || 'DD/MM/YYYY HH:mm',
      });
      
      console.log('✅ companyForm atualizado com dados reais!');
      
      setThemeColors({
        sidebar_color: settings.sidebar_color || '#dee2e3',
        topbar_color: settings.topbar_color || '#0f172a', // Cor padrão original azul escuro
        button_color: settings.button_color || '#4A5477',
      });
      setSecuritySettings({
        enable_2fa: settings.enable_2fa || false,
        password_policy: settings.password_policy || {
          min_length: 8,
          require_numbers: true,
          require_uppercase: true,
          require_special: true,
        },
      });
    }
  }, [settings]);

  // Load connections when component mounts
  useEffect(() => {
    if (user?.id) {
      loadConnections(user.id);
    }
  }, [user?.id, loadConnections]);

  // Carregar dados do perfil quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  // Carregar configurações de email quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id) {
      loadEmailSettings();
    }
  }, [user?.id]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      clearCreateConnectionRetry();
    };
  }, []);

  // Gerar QR Code automaticamente quando o modal for aberto
  useEffect(() => {
    if (showQRModal && selectedConnection && !selectedConnection.qrCode) {
      generateQRCode(selectedConnection.id).then(result => {
        if (result.success && result.qrCode) {
          setSelectedConnection(prev => prev ? { ...prev, qrCode: result.qrCode } : null);
        }
      });
    }
  }, [showQRModal, selectedConnection, generateQRCode]);

  // Verificar status da conexão periodicamente quando o modal estiver aberto
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let resumeTimeout: NodeJS.Timeout | null = null;
    let pausePolling = false;

    function scheduleResume() {
      if (resumeTimeout) {
        return;
      }

      resumeTimeout = setTimeout(() => {
        pausePolling = false;
        resumeTimeout = null;
        checkConnectionStatus();
      }, 5000);
    }

    const checkConnectionStatus = async () => {
      if (pausePolling || isCheckingStatusRef.current) {
        return;
      }
      
      isCheckingStatusRef.current = true;

      try {
        const connId = selectedConnection?.id;
        if (!connId) {
          isCheckingStatusRef.current = false;
          return;
        }

        console.log(`🔍 Verificando status para connectionId: "${connId}" (tipo: ${typeof connId})`);
        const encodedConnId = encodeURIComponent(connId);
        const apiBase = getApiBase();
        const headers = buildAuthHeaders();
        const response = await fetch(`${apiBase}/api/baileys-simple/connections/${encodedConnId}`, {
          signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const isConnected = data.data.isConnected;
            const connectionState = data.data.connectionState;
            const currentQrCode = data.data.qrCode;
            
            // Atualizar QR code se mudou
            if (currentQrCode && currentQrCode !== selectedConnection?.qrCode) {
              console.log('🔄 QR Code atualizado');
              setSelectedConnection(prev => prev ? { ...prev, qrCode: currentQrCode } : null);
            }
            
            // Se não tem QR code ainda, tentar buscar
            if (!currentQrCode && !isConnected && selectedConnection) {
              try {
                const connIdForQR = selectedConnection.id;
                console.log(`🔍 Buscando QR code para: "${connIdForQR}" (tipo: ${typeof connIdForQR})`);
                const encodedForQR = encodeURIComponent(connIdForQR);
                const headers = buildAuthHeaders();
                const qrResponse = await fetch(`${apiBase}/api/baileys-simple/connections/${encodedForQR}/qr`, {
                  signal: AbortSignal.timeout(5000),
                  headers
                });
                
                if (qrResponse.ok) {
                  const qrData = await qrResponse.json();
                  if (qrData.success && qrData.data?.qrCode) {
                    console.log('✅ QR Code obtido');
                    setSelectedConnection(prev => prev ? { ...prev, qrCode: qrData.data.qrCode } : null);
                  }
                } else if (qrResponse.status === 404) {
                  // 404 significa que a conexão não foi encontrada - pode ser que ainda esteja sendo criada
                  // Não fazer nada, o polling vai tentar novamente
                }
              } catch (qrError) {
                if (!isFetchNetworkError(qrError)) {
                  // Apenas logar erros reais, não problemas de rede temporários
                  console.warn('⚠️ Erro ao buscar QR Code secundário', qrError);
                } else {
                  pausePolling = true;
                  scheduleResume();
                }
              }
            }
            
            setConnectionStatus(prev => {
              const newStatus = {
                ...prev,
                connected: isConnected,
                connecting: connectionState === 'connecting',
                lastError: isConnected ? null : prev.lastError,
                sessionName: data.data.name
              };

              // Se conectou com sucesso, fechar o modal após 3 segundos
              if (isConnected && !prev.connected) {
                if (selectedConnection) {
                  updateConnectionStatus(selectedConnection.id);
                }
                
                setTimeout(() => {
                  handleCloseQRModal();
                  setSelectedConnection(null);
                  success('✅ WhatsApp conectado com sucesso!');
                  loadConnections();
                }, 3000);
              }

              return newStatus;
            });
          }
        }
      } catch (error) {
        if (isFetchNetworkError(error)) {
          pausePolling = true;
          setConnectionStatus(prev => ({
            ...prev,
            lastError: 'Servidor do WhatsApp (Baileys) indisponível. Verifique o backend e tente novamente.'
          }));
          scheduleResume();
        } else if (error instanceof Error && !error.message.includes('aborted')) {
          console.warn('⚠️ Erro temporário ao verificar status');
        }
      } finally {
        isCheckingStatusRef.current = false;
      }
    };

    if (showQRModal && selectedConnection) {
      checkConnectionStatus();
      intervalId = setInterval(() => {
        if (document.hidden) return;
        void checkConnectionStatus();
      }, 1500);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }
    };
  }, [showQRModal, selectedConnection, loadConnections, success, updateConnectionStatus, setConnectionStatus]);

  // Validar formulário da empresa
  const validateCompanyForm = () => {
    const errors: Record<string, string> = {};
    
    if (!companyForm.company_name.trim()) {
      errors.company_name = 'Nome da empresa é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers para formulários
  const handleCompanyFormChange = (field: string, value: string) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário digita
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSecurityChange = (field: string, value: any) => {
    if (field === 'password_policy') {
      setSecuritySettings(prev => ({ 
        ...prev, 
        password_policy: { ...prev.password_policy, ...value } 
      }));
    } else {
      setSecuritySettings(prev => ({ ...prev, [field]: value }));
    }
  };

  // ============================================
  // FUNÇÕES DA SEÇÃO DE SEGURANÇA
  // ============================================

  // Salvar configurações de segurança no Supabase
  const saveSecuritySettings = async () => {
    try {
      setIsLoadingSecurity(true);
      
      // Obter id_empresa do usuário logado
      const identity = getUserIdentity();
      const idEmpresa = identity.id_empresa;

      if (!idEmpresa) {
        showError('Erro', 'Não foi possível identificar a empresa. Por favor, tente novamente.');
        return;
      }

      // Buscar configuração existente da empresa
      const { data: existingSettings, error: fetchError } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', idEmpresa)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações:', fetchError);
        throw fetchError;
      }

      const settingsData = {
        company_id: idEmpresa,
        enable_2fa: securitySettings.enable_2fa,
        password_policy: securitySettings.password_policy,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingSettings) {
        // Atualizar configuração existente
        result = await supabase
          .from('company_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select()
          .single();
      } else {
        // Criar nova configuração
        result = await supabase
          .from('company_settings')
          .insert([{
            ...settingsData,
            company_name: settings?.company_name || 'Minha Empresa',
            default_language: settings?.default_language || 'pt-BR',
            default_timezone: settings?.default_timezone || 'America/Sao_Paulo',
            default_currency: settings?.default_currency || 'BRL',
            datetime_format: settings?.datetime_format || 'DD/MM/YYYY HH:mm',
          }])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar configurações de segurança:', result.error);
        throw result.error;
      }

      success('Sucesso!', 'Configurações de segurança salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar configurações de segurança:', error);
      showError('Erro', error.message || 'Erro ao salvar configurações de segurança');
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  // Carregar configurações de segurança do Supabase
  const loadSecuritySettings = async () => {
    try {
      const identity = getUserIdentity();
      const idEmpresa = identity.id_empresa;

      if (!idEmpresa) {
        console.warn('id_empresa não encontrado, usando valores padrão');
        return;
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('enable_2fa, password_policy')
        .eq('company_id', idEmpresa)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações de segurança:', error);
        return;
      }

      if (data) {
        setSecuritySettings({
          enable_2fa: data.enable_2fa || false,
          password_policy: (data.password_policy as any) || {
            min_length: 8,
            require_numbers: true,
            require_uppercase: true,
            require_special: true,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de segurança:', error);
    }
  };

  // Carregar tentativas de login falhas
  const loadFailedLoginAttempts = async () => {
    try {
      setIsLoadingLoginAttempts(true);
      
      const identity = getUserIdentity();
      const idEmpresa = identity.id_empresa;

      if (!idEmpresa) {
        setFailedLoginAttempts([]);
        return;
      }

      // Buscar tentativas de login falhas da empresa
      // Primeiro, buscar todos os usuários da empresa
      const { data: companyUsers, error: usersError } = await supabase
        .from('company_users')
        .select('id, email, full_name')
        .eq('company_id', idEmpresa);

      if (usersError) {
        console.error('Erro ao buscar usuários da empresa:', usersError);
        setFailedLoginAttempts([]);
        return;
      }

      if (!companyUsers || companyUsers.length === 0) {
        setFailedLoginAttempts([]);
        return;
      }

      const userIds = companyUsers.map(u => u.id);

      // Buscar tentativas de login falhas
      const { data: attempts, error: attemptsError } = await supabase
        .from('login_attempts')
        .select('*')
        .in('user_id', userIds)
        .eq('success', false)
        .order('attempted_at', { ascending: false })
        .limit(50);

      if (attemptsError) {
        console.error('Erro ao buscar tentativas de login:', attemptsError);
        setFailedLoginAttempts([]);
        return;
      }

      // Mapear tentativas com informações do usuário
      const attemptsWithUser = (attempts || []).map(attempt => {
        const user = companyUsers.find(u => u.id === attempt.user_id);
        return {
          ...attempt,
          user_email: user?.email || 'Desconhecido',
          user_name: user?.full_name || 'Desconhecido',
        };
      });

      setFailedLoginAttempts(attemptsWithUser);
    } catch (error) {
      console.error('Erro ao carregar tentativas de login falhas:', error);
      setFailedLoginAttempts([]);
    } finally {
      setIsLoadingLoginAttempts(false);
    }
  };

  // Carregar configurações de segurança quando a aba for aberta
  useEffect(() => {
    if (activeTab === 'security') {
      loadSecuritySettings();
      loadFailedLoginAttempts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Validar senha contra a política
  const validatePasswordPolicy = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const policy = securitySettings.password_policy;

    if (password.length < policy.min_length) {
      errors.push(`A senha deve ter pelo menos ${policy.min_length} caracteres`);
    }

    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }

    if (policy.require_special && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  // Alterar senha do usuário
  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordErrors({});

      // Validações básicas
      if (!passwordForm.current_password) {
        setPasswordErrors({ current_password: 'Digite sua senha atual' });
        return;
      }

      if (!passwordForm.new_password) {
        setPasswordErrors({ new_password: 'Digite a nova senha' });
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        setPasswordErrors({ confirm_password: 'As senhas não coincidem' });
        return;
      }

      // Validar nova senha contra a política
      const validation = validatePasswordPolicy(passwordForm.new_password);
      if (!validation.valid) {
        setPasswordErrors({ new_password: validation.errors.join(', ') });
        return;
      }

      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.current_password,
      });

      if (signInError) {
        setPasswordErrors({ current_password: 'Senha atual incorreta' });
        return;
      }

      // Alterar senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      });

      if (updateError) {
        console.error('Erro ao alterar senha:', updateError);
        showError('Erro', updateError.message || 'Erro ao alterar senha');
        return;
      }

      // Se o usuário for um company_user, atualizar também na tabela company_users
      const identity = getUserIdentity();
      if (identity.id_usuario) {
        try {
          // Verificar se é um company_user
          const { data: companyUser } = await supabase
            .from('company_users')
            .select('id')
            .eq('id', identity.id_usuario)
            .single();

          if (companyUser) {
            // Aqui você pode adicionar hash da senha se necessário
            // Por enquanto, a senha principal está no Supabase Auth
            console.log('Usuário da empresa identificado, senha atualizada no Auth');
          }
        } catch (error) {
          console.warn('Erro ao verificar company_user:', error);
          // Não é crítico, continuar
        }
      }

      success('Sucesso!', 'Senha alterada com sucesso!');
      
      // Limpar formulário
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      showError('Erro', error.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Salvar configurações da empresa
  const handleSaveCompanySettings = async () => {
    if (!validateCompanyForm()) {
      showError('Erro de validação', 'Por favor, corrija os campos obrigatórios');
      return;
    }

    setIsLoadingCompany(true);
    try {
      const result = await saveCompanySettings({
        ...companyForm,
        ...themeColors,
        ...securitySettings,
      });

      if (result.success) {
        // Aplicar tema globalmente
        document.documentElement.style.setProperty('--sidebar-color', themeColors.sidebar_color);
        document.documentElement.style.setProperty('--topbar-color', themeColors.topbar_color);
        document.documentElement.style.setProperty('--button-color', themeColors.button_color);
        
        success('Sucesso!', 'Configurações salvas com sucesso');
      } else {
        showError('Erro', 'Falha ao salvar configurações');
      }
    } catch (error) {
      showError('Erro', 'Erro inesperado ao salvar configurações');
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsLoadingCompany(false);
    }
  };


  // Funções para gerenciar conexões
  const handleViewConnectionDetails = async (connection: any) => {
    setSelectedConnection(connection);
    setShowConnectionDetailsModal(true);
  };

  const handleDisconnectClick = (connection: any) => {
    setConnectionToDisconnect(connection);
    setShowDisconnectModal(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!connectionToDisconnect) return;

    setIsDisconnecting(true);
    try {
      const result = await disconnectWhatsApp(connectionToDisconnect.id, user?.id || '');
      if (result.success) {
        success('Conexão Desconectada', 'A conexão foi desconectada com sucesso');
        // A conexão será removida automaticamente pelo contexto
        setShowDisconnectModal(false);
        setConnectionToDisconnect(null);
      } else {
        showError('Erro', result.error || 'Falha ao desconectar');
      }
    } catch (error) {
      showError('Erro', 'Erro inesperado ao desconectar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
    setConnectionToDisconnect(null);
  };

  // Delete confirmation handlers
  const handleDeleteClick = (connection: any) => {
    setConnectionToDelete(connection);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!connectionToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteConnection(connectionToDelete.id, user.id);
      if (result.success) {
        success('Conexão Excluída', 'A conexão foi excluída permanentemente');
        setShowDeleteModal(false);
        setConnectionToDelete(null);
      } else {
        showError('Erro', result.error || 'Falha ao excluir conexão');
      }
    } catch (error) {
      showError('Erro', 'Erro inesperado ao excluir conexão');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setConnectionToDelete(null);
  };

  // Handlers para CRUD com toasts
  const handleDeleteArea = async (id: string) => {
    try {
      const result = await deleteArea(id);
      if (result.success) {
        success('Área excluída', 'Área excluída com sucesso');
      } else {
        showError('Erro', 'Falha ao excluir área');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao excluir área');
      return { success: false, error };
    }
  };

  const handleAddArea = async (name: string, description?: string) => {
    try {
      const result = await addArea(name, description);
      if (result.success) {
        success('Área criada', 'Área criada com sucesso');
      } else {
        showError('Erro', 'Falha ao criar área');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao criar área');
      return { success: false, error };
    }
  };

  const handleEditArea = async (id: string, updates: Partial<CompanyArea>) => {
    try {
      const result = await editArea(id, updates);
      if (result.success) {
        success('Área atualizada', 'Área atualizada com sucesso');
      } else {
        showError('Erro', 'Falha ao atualizar área');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao atualizar área');
      return { success: false, error };
    }
  };

  const handleAddRole = async (name: string, description?: string) => {
    try {
      const result = await addRole(name, description);
      if (result.success) {
        success('Cargo criado', 'Cargo criado com sucesso');
      } else {
        showError('Erro', 'Falha ao criar cargo');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao criar cargo');
      return { success: false, error };
    }
  };

  const handleEditRole = async (id: string, updates: Partial<CompanyRole>) => {
    try {
      const result = await editRole(id, updates);
      if (result.success) {
        success('Cargo atualizado', 'Cargo atualizado com sucesso');
      } else {
        showError('Erro', 'Falha ao atualizar cargo');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao atualizar cargo');
      return { success: false, error };
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const result = await deleteRole(id);
      if (result.success) {
        success('Cargo excluído', 'Cargo excluído com sucesso');
      } else {
        showError('Erro', 'Falha ao excluir cargo');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao excluir cargo');
      return { success: false, error };
    }
  };

  // Estados para permissões RBAC
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  // Estados para botões de minimizar - PADRÃO MINIMIZADO
  const [isAreasMinimized, setIsAreasMinimized] = useState(true);
  const [isRolesMinimized, setIsRolesMinimized] = useState(true);

  // Estados para configurações de email
  const [emailSettings, setEmailSettings] = useState({
    provider: 'gmail',
    smtp_host: '',
    smtp_port: 587,
    email: '',
    password: '',
    use_tls: true
  });
  const [isLoadingEmailSettings, setIsLoadingEmailSettings] = useState(false);
  const [emailSettingsErrors, setEmailSettingsErrors] = useState<Record<string, string>>({});
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Handler para salvar permissões do cargo
  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) {
      showError('Erro', 'Selecione um cargo para configurar permissões');
      return;
    }

    try {
      const result = await saveRolePermissions(selectedRoleId, rolePermissions);
      if (result.success) {
        success('Permissões salvas', 'Permissões do cargo salvas com sucesso');
      } else {
        showError('Erro', 'Falha ao salvar permissões');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao salvar permissões');
      return { success: false, error };
    }
  };

  // Handler para alterar permissão individual
  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionKey]: checked
    }));
  };

  // Handler para selecionar cargo e carregar suas permissões
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    const selectedRole = roles.find(role => role.id === roleId);
    if (selectedRole) {
      setRolePermissions(selectedRole.permissions || {});
    } else {
      setRolePermissions({});
    }
  };

  const handleSavePermissions = async (roleId: string, permissions: Record<string, boolean>) => {
    try {
      const result = await saveRolePermissions(roleId, permissions);
      if (result.success) {
        success('Permissões salvas', 'Permissões do cargo atualizadas com sucesso');
      } else {
        showError('Erro', 'Falha ao salvar permissões');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao salvar permissões');
      return { success: false, error };
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const result = await deleteUser(id);
      if (result.success) {
        success('Usuário excluído', 'Usuário excluído com sucesso');
      } else {
        showError('Erro', 'Falha ao excluir usuário');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao excluir usuário');
      return { success: false, error };
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const result = await updateUserStatus(userId, newStatus);
      if (result.success) {
        const statusText = newStatus === 'active' ? 'ativado' : newStatus === 'inactive' ? 'desativado' : 'aprovado';
        success('Status alterado', `Usuário ${statusText} com sucesso`);
      } else {
        showError('Erro', 'Falha ao alterar status do usuário');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao alterar status');
      return { success: false, error };
    }
  };

  const handleOpenEditUser = (user: any) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
  };

  const handleEditUserSave = async (id: string, updates: Partial<any>) => {
    try {
      // Fechar itens expandidos para evitar estados inconsistentes
      setExpandedUsers(new Set());

      const result = await editUser(id, updates);
      if (result.success) {
        success('Usuário atualizado', 'Dados do usuário salvos com sucesso');
        if (loadData) {
          // Garantir atualização da lista e persistência pós F5
          await loadData();
        }
      } else {
        showError('Erro', 'Falha ao salvar dados do usuário');
      }
      return result;
    } catch (error) {
      showError('Erro', 'Erro inesperado ao salvar usuário');
      return { success: false, error };
    }
  };

  // Toggle de usuário expandido
  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // Badges de status
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode; text: string }> = {
      active: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <UserCheck className="h-3 w-3" />,
        text: 'Ativo'
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
        text: 'Pendente'
      },
      inactive: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <UserX className="h-3 w-3" />,
        text: 'Inativo'
      },
      suspended: {
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <AlertTriangle className="h-3 w-3" />,
        text: 'Suspenso'
      },
    };

    const variant = variants[status] || variants.inactive;
    return (
      <Badge className={`${variant.className} flex items-center gap-1 border`}>
        {variant.icon}
        {variant.text}
      </Badge>
    );
  };

  // Ações de status
  const getStatusActions = (user: any) => {
    const currentStatus = user.status;
    
    if (currentStatus === 'active') {
      return null;
    } else if (currentStatus === 'inactive') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(user.id, 'active')}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          Ativar
        </Button>
      );
    } else if (currentStatus === 'pending') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(user.id, 'active')}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          Aprovar
        </Button>
      );
    } else {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange(user.id, 'active')}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          Reativar
        </Button>
      );
    }
  };

  const getRoleName = (user: any) => {
    const roleMatchById = roles.find(r => String(r.id) === String(user.role_id ?? user.cargo));
    if (roleMatchById?.name) return roleMatchById.name;
    const roleMatchByName = roles.find(r => String(r.name).toLowerCase() === String(user.role_id ?? user.cargo ?? '').toLowerCase());
    return roleMatchByName?.name || '-';
  };

  const getAreaName = (user: any) => {
    const areaMatchById = areas.find(a => String(a.id) === String(user.area_id ?? user.area));
    if (areaMatchById?.name) return areaMatchById.name;
    const areaMatchByName = areas.find(a => String(a.name).toLowerCase() === String(user.area_id ?? user.area ?? '').toLowerCase());
    return areaMatchByName?.name || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo responsivo ao sidebar */}
      <div 
        className="fixed top-[38px] right-0 bg-transparent border-b border-gray-200 z-30 transition-all duration-300"
        style={{
          left: sidebarExpanded ? '240px' : '64px'
        }}
      >
        {/* Botões de visualização */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão fixo de toggle da sidebar - SEMPRE VISÍVEL quando colapsada */}
              {!sidebarExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0"
                  onClick={expandSidebarFromMenu}
                  title="Expandir barra lateral"
                >
                  <AlignJustify size={14} />
                </Button>
              )}
              
              {/* Botões de navegação das tabs */}
              {[
                { id: 'profile', label: t('settings.tabs.profile'), icon: User },
                { id: 'company', label: t('settings.tabs.company'), icon: Building2 },
                { id: 'structure', label: t('settings.tabs.structure'), icon: SettingsIcon },
                { id: 'users', label: t('settings.tabs.users'), icon: Users },
                { id: 'connections', label: t('settings.tabs.connections'), icon: Link },
                { id: 'email', label: t('settings.tabs.email'), icon: Mail },
                { id: 'security', label: t('settings.tabs.security'), icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      h-10 px-4 text-sm font-medium transition-all duration-200 rounded-lg
                      ${activeTab === tab.id 
                        ? 'bg-gray-50 text-slate-900 shadow-inner' 
                        : 'text-slate-700 hover:text-slate-900 hover:bg-gray-25'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {!isMobile && tab.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Container principal com padding para o header fixo */}
      <div className="pt-14 pb-16 bg-gray-50 min-h-screen px-0">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full mx-0">

          {/* Tela 1 - Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-lg p-0">
              <h2 className="text-xl text-gray-900 mb-6 pb-4 border-b border-gray-200">
                {t('settings.profile.title')}
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Foto de Perfil */}
                <div className="lg:col-span-1">
                  <div className="text-center p-6">
                    <div className="relative mb-4 inline-block group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center relative">
                        {profileForm.avatar_url ? (
                          <img 
                            src={profileForm.avatar_url} 
                            alt="Foto do perfil" 
                            className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-70"
                          />
                        ) : (
                          <User className="w-16 h-16 text-gray-400 transition-opacity duration-200 group-hover:opacity-70" />
                        )}
                        
                        {/* Overlay com botão de editar */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded-full">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <input
                              type="file"
                              id="avatar-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="bg-[#0f172a] text-white p-3 rounded-full cursor-pointer hover:bg-[#0f172a]/90 transition-colors flex items-center justify-center"
                            >
                              <Upload className="w-4 h-4" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      {t('settings.profile.hoverToEdit')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('settings.profile.maxFileSize')}
                    </p>
                  </div>
                </div>

                {/* Informações do Perfil */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="profile_name" className="text-sm text-gray-700">
                      {t('settings.profile.fullName')} *
                    </Label>
                    <Input
                      id="profile_name"
                      value={profileForm.name}
                      onChange={(e) => handleProfileFormChange('name', e.target.value)}
                      placeholder="Digite seu nome completo"
                      className={`h-10 rounded-md border focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] ${
                        profileErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {profileErrors.name && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {profileErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email (apenas visualização) */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      Email
                    </Label>
                    <Input
                      value={user?.email || profile?.email || 'Não informado'}
                      disabled
                      className="h-10 rounded-md border-gray-300 bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500">
                      O email não pode ser alterado aqui. Entre em contato com o administrador.
                    </p>
                  </div>

                  {/* Cargo (apenas visualização) */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      {t('settings.profile.position')}
                    </Label>
                    <Input
                      value={profileForm.position || 'Não informado'}
                      disabled
                      className="h-10 rounded-md border-gray-300 bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500">
                      {t('settings.profile.positionNote')}
                    </p>
                  </div>

                  {/* Setor (apenas visualização) */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">
                      {t('settings.profile.department')}
                    </Label>
                    <Input
                      value={profileForm.department || 'Não informado'}
                      disabled
                      className="h-10 rounded-md border-gray-300 bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500">
                      {t('settings.profile.departmentNote')}
                    </p>
                  </div>

                  {/* Botão de Salvar */}
                  <div className="flex justify-end items-center pt-6 mt-6 border-t border-gray-200">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoadingProfile}
                      className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white px-6 h-10 rounded-md"
                    >
                      {isLoadingProfile ? t('settings.profile.saving') : t('settings.profile.saveChanges')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tela 2 - Empresa */}
          <TabsContent value="company" className="space-y-6">
            <div className="rounded-lg p-0">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl text-gray-900">
                  Informações da Empresa
                </h2>
                <Button
                  size="sm"
                  onClick={() => setIsEditingCompany(!isEditingCompany)}
                  className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                >
                  <Edit className="h-4 w-4" />
                  {isEditingCompany ? "Cancelar Edição" : "Editar"}
                </Button>
              </div>
              
              {/* Informações Básicas */}
              <div className="mb-6">
                <h3 className="text-base text-gray-900 mb-4">
                  Informações Básicas
                </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm text-gray-700">
                      Nome da Empresa *
                  </Label>
                  <Input
                    id="company_name"
                    value={companyForm.company_name}
                    onChange={(e) => handleCompanyFormChange('company_name', e.target.value)}
                    placeholder="Digite o nome da empresa"
                    className={`h-10 rounded-md border focus:border-[#0f172a] focus:ring-1 focus:ring-[#0f172a] ${
                      formErrors.company_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                      disabled={!isEditingCompany}
                    required
                  />
                  {formErrors.company_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {formErrors.company_name}
                    </p>
                  )}
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_pessoa" className="text-sm text-gray-700">
                      Tipo de Pessoa
                    </Label>
                    <Select value={companyForm.tipo_pessoa} onValueChange={(value) => handleCompanyFormChange('tipo_pessoa', value)} disabled={!isEditingCompany}>
                      <SelectTrigger className="h-10 rounded-md border-gray-300">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                        <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {companyForm.tipo_pessoa === 'PJ' ? (
                    <div className="space-y-2">
                      <Label htmlFor="cnpj" className="text-sm text-gray-700">
                        CNPJ
                      </Label>
                      <Input
                        id="cnpj"
                        value={companyForm.cnpj}
                        onChange={(e) => handleCompanyFormChange('cnpj', e.target.value)}
                        placeholder="00.000.000/0000-00"
                        className="h-10 rounded-md border-gray-300"
                        disabled={!isEditingCompany}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-sm text-gray-700">
                        CPF
                      </Label>
                      <Input
                        id="cpf"
                        value={companyForm.cpf}
                        onChange={(e) => handleCompanyFormChange('cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        className="h-10 rounded-md border-gray-300"
                        disabled={!isEditingCompany}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-sm text-gray-700">
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      value={companyForm.telefone}
                      onChange={(e) => handleCompanyFormChange('telefone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-10 rounded-md border-gray-300"
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nicho" className="text-sm text-gray-700">
                      Nicho/Setor
                    </Label>
                    <Input
                      id="nicho"
                      value={companyForm.nicho}
                      onChange={(e) => handleCompanyFormChange('nicho', e.target.value)}
                      placeholder="Ex: Tecnologia, Varejo, Serviços"
                      className="h-10 rounded-md border-gray-300"
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="mb-6 pt-6 border-t border-gray-200">
                <h3 className="text-base text-gray-900 mb-4">
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-sm text-gray-700">
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      value={companyForm.cep}
                      onChange={(e) => handleCompanyFormChange('cep', e.target.value)}
                      placeholder="00000-000"
                      className="h-10 rounded-md border-gray-300"
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco" className="text-sm text-gray-700">
                      Endereço
                    </Label>
                    <Input
                      id="endereco"
                      value={companyForm.endereco}
                      onChange={(e) => handleCompanyFormChange('endereco', e.target.value)}
                      placeholder="Rua, número, complemento"
                      className="h-10 rounded-md border-gray-300"
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade" className="text-sm text-gray-700">
                      Cidade
                    </Label>
                    <Input
                      id="cidade"
                      value={companyForm.cidade}
                      onChange={(e) => handleCompanyFormChange('cidade', e.target.value)}
                      placeholder="Digite a cidade"
                      className="h-10 rounded-md border-gray-300"
                      disabled={!isEditingCompany}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado" className="text-sm text-gray-700">
                      Estado
                    </Label>
                    <Select value={companyForm.estado} onValueChange={(value) => handleCompanyFormChange('estado', value)} disabled={!isEditingCompany}>
                      <SelectTrigger className="h-10 rounded-md border-gray-300">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Configurações Regionais */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-base text-gray-900 mb-4">
                  Configurações Regionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="default_language" className="text-sm text-gray-700">
                      Idioma Padrão
                  </Label>
                    <Select value={companyForm.default_language} onValueChange={(value) => handleCompanyFormChange('default_language', value)} disabled={!isEditingCompany}>
                    <SelectTrigger className="h-10 rounded-md border-gray-300">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">Inglês (EUA)</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                      <SelectItem value="fr">Francês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_timezone" className="text-sm text-gray-700">
                      Fuso Horário
                  </Label>
                    <Select value={companyForm.default_timezone} onValueChange={(value) => handleCompanyFormChange('default_timezone', value)} disabled={!isEditingCompany}>
                    <SelectTrigger className="h-10 rounded-md border-gray-300">
                      <SelectValue placeholder="Selecione o fuso horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                      <SelectItem value="America/Belem">Belém (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_currency" className="text-sm text-gray-700">
                      Moeda Padrão
                  </Label>
                    <Select value={companyForm.default_currency} onValueChange={(value) => handleCompanyFormChange('default_currency', value)} disabled={!isEditingCompany}>
                    <SelectTrigger className="h-10 rounded-md border-gray-300">
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (Real Brasileiro)</SelectItem>
                      <SelectItem value="USD">USD (Dólar Americano)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (Libra Esterlina)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="datetime_format" className="text-sm text-gray-700">
                      Formato de Data/Hora
                  </Label>
                    <Select value={companyForm.datetime_format} onValueChange={(value) => handleCompanyFormChange('datetime_format', value)} disabled={!isEditingCompany}>
                    <SelectTrigger className="h-10 rounded-md border-gray-300">
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY HH:mm">DD/MM/YYYY HH:mm</SelectItem>
                      <SelectItem value="MM/DD/YYYY HH:mm">MM/DD/YYYY HH:mm</SelectItem>
                      <SelectItem value="YYYY-MM-DD HH:mm">YYYY-MM-DD HH:mm</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                </div>
              </div>

              {/* Seção de Identidade Visual */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base text-gray-900">
                    Identidade Visual
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!settings) {
                        showError('Erro', 'Configurações da empresa não carregadas. Aguarde um momento e tente novamente.');
                        return;
                      }
                      
                      // Valores padrão originais do sistema VBSolution
                      const defaultTopbarColor = '#0f172a'; // Cor azul escuro original
                      const defaultLogoUrl = null; // Voltar ao logo padrão VB
                      
                      console.log('🔄 Revertendo identidade visual para padrão:', { defaultTopbarColor, defaultLogoUrl });
                      setIsLoadingCompany(true);
                      
                      try {
                        // Reverter no Supabase
                        console.log('💾 Salvando configurações no Supabase...');
                        const result = await saveCompanySettings({ 
                          topbar_color: defaultTopbarColor,
                          logo_url: defaultLogoUrl
                        });
                        
                        console.log('📊 Resultado do saveCompanySettings:', result);
                        
                        if (result && result.success) {
                          console.log('✅ Configurações salvas com sucesso!');
                          
                          // Atualizar estado local
                          setThemeColors(prev => ({ 
                            ...prev, 
                            topbar_color: defaultTopbarColor 
                          }));
                          
                          // Atualizar no localStorage
                          localStorage.setItem('companyTopbarColor', defaultTopbarColor);
                          localStorage.removeItem('companySidebarLogo');
                          console.log('💾 Valores salvos no localStorage');
                          
                          // Disparar eventos para atualizar componentes
                          window.dispatchEvent(new CustomEvent('companyThemeChanged', { 
                            detail: { topbar_color: defaultTopbarColor } 
                          }));
                          
                          window.dispatchEvent(new CustomEvent('companyLogoChanged', { 
                            detail: { url: null } 
                          }));
                          console.log('📢 Eventos disparados para atualizar componentes');
                          
                          // Recarregar dados para atualizar settings
                          if (loadData) {
                            console.log('🔄 Recarregando dados...');
                            await loadData();
                          }
                          
                          success('Identidade Visual revertida', 'A identidade visual foi restaurada ao padrão original do sistema!');
                        } else {
                          const errorMessage = result?.error?.message || result?.error || result?.error?.toString() || 'Falha ao salvar no Supabase';
                          console.error('❌ Erro ao salvar:', errorMessage);
                          throw new Error(errorMessage);
                        }
                      } catch (error: any) {
                        console.error('❌ Erro completo ao reverter:', error);
                        const errorMsg = error?.message || error?.toString() || 'Não foi possível reverter a identidade visual. Tente novamente.';
                        showError('Erro ao reverter', errorMsg);
                      } finally {
                        setIsLoadingCompany(false);
                      }
                    }}
                    disabled={isLoadingCompany}
                    className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-all hover:border-blue-300 hover:text-blue-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reverter ao Padrão
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Cor da Topbar */}
                  <div className="space-y-4">
                    <Label className="text-sm text-gray-700">
                      Cor da Topbar
                    </Label>
                    <p className="text-xs text-gray-500 mb-3">
                      Personalize a cor da barra superior do sistema. Esta cor será mantida mesmo após recarregar a página.
                    </p>
                    <ExpandedColorPicker
                      label=""
                      value={themeColors.topbar_color}
                      onChange={(color) => {
                        setThemeColors(prev => ({ ...prev, topbar_color: color }));
                      }}
                    />
                  </div>

                  {/* Logo da Sidebar */}
                  <div className="space-y-4">
                    <Label className="text-sm text-gray-700">
                      Logo da Empresa (Sidebar)
                    </Label>
                    <p className="text-xs text-gray-500 mb-3">
                      Envie uma imagem PNG para substituir a logo no topo da barra lateral. O logo será mantido mesmo após recarregar a página.
                    </p>
                    <CompanyLogoUpload
                      currentLogoUrl={settings?.logo_url}
                      onLogoUploaded={async (url) => {
                        if (settings) {
                          await saveCompanySettings({ logo_url: url });
                          // Atualizar logo na sidebar imediatamente
                          localStorage.setItem('companySidebarLogo', url);
                          window.dispatchEvent(new CustomEvent('companyLogoChanged', { detail: { url } }));
                        }
                      }}
                      onLogoRemoved={async () => {
                        if (settings) {
                          await saveCompanySettings({ logo_url: null });
                          localStorage.removeItem('companySidebarLogo');
                          window.dispatchEvent(new CustomEvent('companyLogoChanged', { detail: { url: null } }));
                        }
                      }}
                      companyId={settings?.id_empresa}
                    />
                  </div>

                  {/* Botão para salvar identidade visual */}
                  <div className="flex justify-end">
                    <Button
                      onClick={async () => {
                        if (settings) {
                          await saveCompanySettings({ 
                            topbar_color: themeColors.topbar_color 
                          });
                          // Atualizar cor na topbar imediatamente
                          localStorage.setItem('companyTopbarColor', themeColors.topbar_color);
                          window.dispatchEvent(new CustomEvent('companyThemeChanged', { 
                            detail: { topbar_color: themeColors.topbar_color } 
                          }));
                          success('Identidade Visual atualizada', 'As alterações foram salvas com sucesso!');
                        }
                      }}
                      disabled={isLoadingCompany}
                      className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white px-6"
                    >
                      {isLoadingCompany ? 'Salvando...' : 'Salvar Identidade Visual'}
                    </Button>
                  </div>
                </div>
              </div>

              {isEditingCompany && (
                <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingCompany(false);
                      // Recarregar dados originais
                      if (settings) {
                        setCompanyForm({
                          company_name: settings.company_name || '',
                          telefone: (settings as any).telefone || '',
                          cnpj: (settings as any).cnpj || '',
                          cpf: (settings as any).cpf || '',
                          tipo_pessoa: (settings as any).tipo_pessoa || 'PJ',
                          cep: (settings as any).cep || '',
                          endereco: (settings as any).endereco || '',
                          cidade: (settings as any).cidade || '',
                          estado: (settings as any).estado || '',
                          nicho: (settings as any).nicho || '',
                          default_language: settings.default_language || 'pt-BR',
                          default_timezone: settings.default_timezone || 'America/Sao_Paulo',
                          default_currency: settings.default_currency || 'BRL',
                          datetime_format: settings.datetime_format || 'DD/MM/YYYY HH:mm',
                        });
                      }
                    }}
                    disabled={isLoadingCompany}
                    className="h-10 px-6 rounded-md bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      handleSaveCompanySettings();
                      setIsEditingCompany(false);
                    }}
                  disabled={isLoadingCompany}
                  className="bg-transparent hover:bg-blue-50 text-blue-900 border border-blue-300 px-6 h-10 rounded-md"
                >
                  {isLoadingCompany ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
              )}
            </div>
          </TabsContent>

          {/* Tela 2 - Estrutura da Empresa */}
          <TabsContent value="structure" className="space-y-6">
            {/* Seção: Áreas */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base text-gray-900">Áreas da Empresa</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsAreasMinimized(!isAreasMinimized)}
                      className="h-8 px-3 text-sm bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                    >
                      {isAreasMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  <AddItemModal
                    title="Adicionar Área"
                    itemType="area"
                    onAdd={handleAddArea}
                  />
                  </div>
                </div>
              </div>
              
              {!isAreasMinimized && (
                <div className="p-6">
                  {areas.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Nenhuma área cadastrada</h4>
                      <p className="text-sm text-gray-500">
                        Clique em "Adicionar Área" para criar a primeira área da empresa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {areas.length} áreas cadastradas
                        </span>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Nome da Área</TableHead>
                      <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {areas.map((area) => (
                        <TableRow key={area.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{area.name}</TableCell>
                          <TableCell className="text-gray-600">{area.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EditItemModal
                                item={area}
                                itemType="area"
                                onEdit={handleEditArea}
                              />
                              <DeleteConfirmModal
                                itemName={area.name}
                                itemType="area"
                                onDelete={() => handleDeleteArea(area.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                          ))}
                  </TableBody>
                </Table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seção: Cargos */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base text-gray-900">Cargos da Empresa</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsRolesMinimized(!isRolesMinimized)}
                      className="h-8 px-3 text-sm bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                    >
                      {isRolesMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                  <AddItemModal
                    title="Adicionar Cargo"
                    itemType="role"
                    onAdd={handleAddRole}
                  />
                  </div>
                </div>
              </div>
              
              {!isRolesMinimized && (
                <div className="p-6">
                  {roles.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-medium text-gray-900 mb-2">Nenhum cargo cadastrado</h4>
                      <p className="text-sm text-gray-500">
                        Clique em "Adicionar Cargo" para criar o primeiro cargo da empresa.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {roles.length} cargos cadastrados
                        </span>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Nome do Cargo</TableHead>
                      <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                            <TableHead className="font-semibold text-gray-700">Nível</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                          {roles.map((role) => (
                        <TableRow key={role.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell className="text-gray-600">{role.description || '-'}</TableCell>
                              <TableCell>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                  Nível {role.level}
                                </span>
                              </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <EditItemModal
                                item={role}
                                itemType="role"
                                onEdit={handleEditRole}
                              />
                              <DeleteConfirmModal
                                itemName={role.name}
                                itemType="role"
                                onDelete={() => handleDeleteRole(role.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                          ))}
                  </TableBody>
                </Table>
                </div>
                  )}
                  </div>
              )}
                    </div>


            {/* Permissões por Cargo (RBAC) */}
            <RolePermissionsManagerNew />
          </TabsContent>

          {/* Tela 3 - Usuários e Permissões */}
          <TabsContent value="users" className="space-y-6">
            {/* Cadastro de Usuário */}
            <div>
              <h2 className="text-xl text-gray-900 mb-6">
                Cadastro de Usuário da Empresa
              </h2>
              <CompanyUserForm onUserCreated={() => {
                // Recarregar lista de usuários após cadastro
                console.log('✅ Usuário criado com sucesso! Recarregando lista...');
                if (loadData) {
                  loadData();
                }
              }} />
            </div>

            {/* Lista de Usuários */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Lista de Usuários
              </h2>
              
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">E-mail</TableHead>
                    <TableHead className="font-semibold text-gray-700">Cargo</TableHead>
                    <TableHead className="font-semibold text-gray-700">Área</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        Nenhum usuário cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <React.Fragment key={user.id}>
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell className="text-gray-600">{user.email}</TableCell>
                          <TableCell className="text-gray-600">
                            {getRoleName(user)}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {getAreaName(user)}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {getStatusActions(user)}
                              <Button
                                size="sm"
                                className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DeleteConfirmModal
                                itemName={user.full_name}
                                itemType="user"
                                onDelete={() => handleDeleteUser(user.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {/* Linha expandível */}
                        {expandedUsers.has(user.id) && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Último login:</span>
                                    <span className="text-gray-600">
                                      {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">IP:</span>
                                    <span className="text-gray-600">{user.last_login_ip || '-'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Data de nascimento:</span>
                                    <span className="text-gray-600">
                                      {user.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">Telefone:</span>
                                    <span className="text-gray-600">{(user as any).telefone || user.phone || '-'}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tela 4 - Conexões */}
          <TabsContent value="connections" className="space-y-0">
            <div className="bg-transparent rounded-lg p-0">
              <h2 className="text-xl text-gray-900 mb-4 pb-4 border-b border-gray-200/30">
                Gerenciar Conexões
              </h2>

              {/* Provider options grid (Baileys + Webhook) */}
              <ConnectionsOptionsGrid
                onConnectBaileys={() => openCreateModal('whatsapp_baileys')}
                onConnectWebhook={() => openCreateModal('webhook')}
                onConnectGoogle={async () => {
                  // O modal será aberto pelo ConnectionsOptionsGrid
                  // Esta função é chamada quando o usuário clica em "Conectar"
                }}
                onConnectFacebook={async () => {
                  try {
                    const response = await fetch('/api/integrations/meta/auth');
                    const data = await response.json();
                    window.open(data.authUrl, '_blank', 'width=600,height=600');
                  } catch (error) {
                    console.error('Erro ao conectar Facebook:', error);
                  }
                }}
                onConnectInstagram={async () => {
                  try {
                    const response = await fetch('/api/integrations/meta/auth');
                    const data = await response.json();
                    window.open(data.authUrl, '_blank', 'width=600,height=600');
                  } catch (error) {
                    console.error('Erro ao conectar Instagram:', error);
                  }
                }}
                baileysConnected={connections.some(
                  conn =>
                    conn.type === 'whatsapp_baileys' &&
                    (conn.isConnected || conn.connectionState === 'connected' || conn.connectionState === 'open')
                )}
                webhookConnected={connections.some(conn => conn.type === 'webhook' && conn.connectionState === 'connected')}
                googleConnected={false} // TODO: Implementar verificação de status do Google
                facebookConnected={false} // TODO: Implementar verificação de status do Facebook
                instagramConnected={false} // TODO: Implementar verificação de status do Instagram
                activeConnection={(() => {
                  const connectedConn = connections.find(
                    conn =>
                      conn.type === 'whatsapp_baileys' &&
                      (conn.isConnected || conn.connectionState === 'connected' || conn.connectionState === 'open')
                  );
                  if (connectedConn) {
                    return {
                      id: connectedConn.id,
                      name: connectedConn.name || `Conexão ${connectedConn.id}`,
                      whatsappName: connectedConn.whatsappName || connectedConn.phoneNumber,
                      type: connectedConn.type,
                      connectedAt: connectedConn.createdAt ? 
                                  new Date(connectedConn.createdAt).toLocaleString('pt-BR') : undefined
                    };
                  }
                  return undefined;
                })()}
                onViewDetails={(connectionId) => {
                  const connection = connections.find(conn => conn.id === connectionId);
                  if (connection) {
                    setSelectedConnection(connection);
                    setShowConnectionDetailsModal(true);
                  }
                }}
                onDisconnect={(connectionId) => {
                  const connection = connections.find(conn => conn.id === connectionId);
                  if (connection) {
                    setConnectionToDisconnect(connection);
                    setShowDisconnectModal(true);
                  }
                }}
              />


            </div>
          </TabsContent>

          {/* Tela 6 - Email */}
          <TabsContent value="email" className="space-y-6">
            <div className="rounded-lg p-0">
              <EmailSettingsForm onSave={() => success('Configurações de email salvas com sucesso!')} />
            </div>
          </TabsContent>

          {/* Tela 7 - Segurança */}
          <TabsContent value="security" className="space-y-6">
            {/* 2FA */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Autenticação de Dois Fatores (2FA)
              </h2>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-700">Ativar 2FA</Label>
                  <p className="text-sm text-gray-600">Requer autenticação adicional para login</p>
                </div>
                <Switch
                  checked={securitySettings.enable_2fa}
                  onCheckedChange={(checked) => handleSecurityChange('enable_2fa', checked)}
                />
              </div>
            </div>

            {/* Política de Senha */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Política de Senha
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min_length" className="text-sm text-gray-700">
                    Mínimo de caracteres
                  </Label>
                  <Input
                    id="min_length"
                    type="number"
                    value={securitySettings.password_policy.min_length}
                    onChange={(e) => handleSecurityChange('password_policy', {
                      min_length: parseInt(e.target.value)
                    })}
                    className="w-32 h-10 rounded-md border-gray-300"
                    min="6"
                    max="20"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm text-gray-700">Requisitos da senha</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.password_policy.require_numbers}
                        onCheckedChange={(checked) => handleSecurityChange('password_policy', {
                          require_numbers: checked
                        })}
                      />
                      <Label className="text-sm text-gray-700">Exigir números</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.password_policy.require_uppercase}
                        onCheckedChange={(checked) => handleSecurityChange('password_policy', {
                          require_uppercase: checked
                        })}
                      />
                      <Label className="text-sm text-gray-700">Exigir letras maiúsculas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={securitySettings.password_policy.require_special}
                        onCheckedChange={(checked) => handleSecurityChange('password_policy', {
                          require_special: checked
                        })}
                      />
                      <Label className="text-sm text-gray-700">Exigir caracteres especiais</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botão de Salvar Configurações de Segurança */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={saveSecuritySettings}
                  disabled={isLoadingSecurity}
                  className="bg-[#0f172a] hover:bg-[#0f172a]/90 text-white"
                >
                  {isLoadingSecurity ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações de Segurança
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Tentativas de Login Falhas */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl text-gray-900">
                  Tentativas de Login Falhas
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFailedLoginAttempts}
                  disabled={isLoadingLoginAttempts}
                >
                  {isLoadingLoginAttempts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Atualizar'
                  )}
                </Button>
              </div>
              
              {isLoadingLoginAttempts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Carregando tentativas de login...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">Data/Hora</TableHead>
                      <TableHead className="font-semibold text-gray-700">IP</TableHead>
                      <TableHead className="font-semibold text-gray-700">Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedLoginAttempts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          Nenhuma tentativa de login falha registrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      failedLoginAttempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell className="text-gray-700">
                            {new Date(attempt.attempted_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-gray-700">{attempt.ip_address || 'N/A'}</TableCell>
                          <TableCell className="text-gray-700">
                            <div>
                              <div className="font-medium">{attempt.user_name || 'Desconhecido'}</div>
                              <div className="text-sm text-gray-500">{attempt.user_email || 'N/A'}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Alterar Senha */}
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h2 className="text-xl text-gray-900 mb-6 pb-4 border-b border-gray-200">
                Alterar Senha
              </h2>
              
              <div className="space-y-5 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="current_password" className="text-sm text-gray-700">
                    Senha atual
                  </Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                      className={`h-10 rounded-md border-gray-300 pr-10 ${passwordErrors.current_password ? 'border-red-500' : ''}`}
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.current_password && (
                    <p className="text-sm text-red-500">{passwordErrors.current_password}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-sm text-gray-700">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.new_password}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, new_password: e.target.value }));
                        if (passwordErrors.new_password) {
                          setPasswordErrors(prev => ({ ...prev, new_password: '' }));
                        }
                      }}
                      className={`h-10 rounded-md border-gray-300 pr-10 ${passwordErrors.new_password ? 'border-red-500' : ''}`}
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="text-sm text-red-500">{passwordErrors.new_password}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Mínimo de {securitySettings.password_policy.min_length} caracteres
                    {securitySettings.password_policy.require_numbers && ', com números'}
                    {securitySettings.password_policy.require_uppercase && ', maiúsculas'}
                    {securitySettings.password_policy.require_special && ' e caracteres especiais'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-sm text-gray-700">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirm_password}
                      onChange={(e) => {
                        setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }));
                        if (passwordErrors.confirm_password) {
                          setPasswordErrors(prev => ({ ...prev, confirm_password: '' }));
                        }
                      }}
                      className={`h-10 rounded-md border-gray-300 pr-10 ${passwordErrors.confirm_password ? 'border-red-500' : ''}`}
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="text-sm text-red-500">{passwordErrors.confirm_password}</p>
                  )}
                </div>
                
                <Button 
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full bg-[#0f172a] hover:bg-[#0f172a]/90 text-white rounded-md h-10 mt-6"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando senha...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

        {/* Botão FAB para mobile */}
        {isMobile && activeTab === 'company' && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              onClick={handleSaveCompanySettings}
              className="rounded-full w-14 h-14 shadow-lg bg-[#0f172a] text-white hover:bg-[#0f172a]/90 hover:shadow-xl"
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>
        )}
        
        </Tabs>

        {userToEdit && (
          <CompanyUserEditModal
            user={userToEdit}
            roles={roles}
            areas={areas}
            isOpen={showEditUserModal}
            onClose={() => {
              setShowEditUserModal(false);
              setUserToEdit(null);
            }}
            onSave={handleEditUserSave}
            onResetPassword={async (id, newPassword) => {
              try {
                const result = await resetUserPassword(id, newPassword);
                if (result.success) {
                  success('Senha atualizada', 'Senha do usuário resetada com sucesso');
                  return result;
                } else {
                  showError('Erro', 'Falha ao resetar senha');
                  return result;
                }
              } catch (error) {
                showError('Erro', 'Erro inesperado ao resetar senha');
                return { success: false, error };
              }
            }}
          />
        )}
        <RightDrawerModal
          open={showConnectionModal}
          onClose={closeCreateModal}
          title={editingConnection ? 'Editar Conexão' : 'Nova Conexão'}
          actions={[
            {
              label: 'Cancelar',
              variant: 'outline',
              onClick: () => closeCreateModal()
            },
            ...(connectionForm.type === 'webhook'
              ? [{
                  label: 'Testar Webhook',
                  variant: 'outline',
                  onClick: () => handleTestWebhook(),
                  disabled: !connectionForm.webhookUrl,
                  icon: <MessageSquare className="h-4 w-4" />
                }]
              : []),
            {
              label: editingConnection ? 'Salvar Alterações' : 'Salvar',
              variant: 'primary',
              onClick: () => handleFormSubmit()
            }
          ]}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleFormSubmit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
                handleFormSubmit();
              }
            }}
            className="space-y-6"
          >
            <ModalSection title="Informações Básicas">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="connection-name" className="text-sm font-medium text-gray-700">
                    Nome da Conexão *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="connection-name"
                      value={connectionForm.name}
                      onChange={(e) => setConnectionForm({ ...connectionForm, name: e.target.value })}
                      placeholder="Ex: WhatsApp Principal"
                      className="pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {connectionForm.type !== 'whatsapp_baileys' && (
                  <div>
                    <Label htmlFor="connection-type" className="text-sm font-medium text-gray-700">
                      Tipo de Conexão *
                    </Label>
                    <Select
                      value={connectionForm.type}
                      onValueChange={(value) => setConnectionForm({ ...connectionForm, type: value })}
                      disabled={createTypeLocked}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="webhook">Conexão de Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="connection-description" className="text-sm font-medium text-gray-700">
                    Descrição
                  </Label>
                  <textarea
                    id="connection-description"
                    value={connectionForm.description}
                    onChange={(e) => setConnectionForm({ ...connectionForm, description: e.target.value })}
                    placeholder="Descrição da conexão"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </ModalSection>

            {connectionForm.type === 'whatsapp_baileys' && (
              <ModalSection title="Conexão WhatsApp via QR Code" className="bg-blue-50/60 rounded-xl px-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Após salvar, um QR Code será gerado para você escanear com seu WhatsApp e estabelecer a conexão.
                    </p>
                    <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                      <li>Garanta que seu celular esteja com internet</li>
                      <li>Abra o WhatsApp {'>'} Configurações {'>'} Dispositivos conectados</li>
                      <li>Escaneie o QR Code que será exibido</li>
                    </ul>
                  </div>
                </div>
              </ModalSection>
            )}

            {connectionForm.type === 'webhook' && (
              <ModalSection title="Configurações Webhook">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url-required" className="text-sm font-medium text-gray-700">
                      URL do Webhook *
                    </Label>
                    <Input
                      id="webhook-url-required"
                      value={connectionForm.webhookUrl}
                      onChange={(e) => setConnectionForm({ ...connectionForm, webhookUrl: e.target.value })}
                      placeholder="https://seu-dominio.com/webhook"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URL do webhook para integração com plataformas de automação
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="webhook-token-optional" className="text-sm font-medium text-gray-700">
                      Token de Verificação
                    </Label>
                    <Input
                      id="webhook-token-optional"
                      value={connectionForm.webhookToken}
                      onChange={(e) => setConnectionForm({ ...connectionForm, webhookToken: e.target.value })}
                      placeholder="Token opcional para verificação"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Token opcional para autenticação do webhook
                    </p>
                  </div>
                </div>
              </ModalSection>
            )}

            <button type="submit" className="hidden" aria-hidden="true" />
          </form>
        </RightDrawerModal>

        {/* Modal para QR Code - DESABILITADO: usando OptimizedQRModal */}
        {false && showQRModal && selectedConnection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  Conectar WhatsApp
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseQRModal}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {connectionStatus.connected ? (
                    <>
                      <div className="rounded-full h-5 w-5 bg-green-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Conectado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-600">Aguardando conexão...</span>
                    </>
                  )}
                </div>
                
                {!connectionStatus.connected && (
                  <>
                    <div className="bg-purple-600 rounded-lg p-8 mb-4 mx-auto w-64 h-64 flex items-center justify-center">
                      {selectedConnection.qrCode ? (
                        <img 
                          src={selectedConnection.qrCode} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="h-32 w-32 text-white" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      Abra o WhatsApp {'>>'} Configurações {'>>'} WhatsApp Web
                    </p>
                    
                    <div className="text-left mb-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Como conectar:</h4>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li>1. Abra o WhatsApp no seu celular</li>
                        <li>2. Toque em Configurações (⚙️)</li>
                        <li>3. Toque em Dispositivos Conectados</li>
                        <li>4. Aponte a câmera para o QR Code</li>
                        <li>5. Aguarde a confirmação</li>
                      </ol>
                    </div>
                  </>
                )}
                
                {connectionStatus.connected && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="rounded-full h-12 w-12 bg-green-500 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <h4 className="text-lg font-medium text-green-900 text-center mb-2">
                      WhatsApp Conectado!
                    </h4>
                    <p className="text-sm text-green-700 text-center">
                      Sua conexão foi estabelecida com sucesso. O modal será fechado automaticamente.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  {connectionStatus.connected ? (
                    <Button
                      onClick={() => {
                        handleCloseQRModal();
                        setConnectionStatus({
                          connected: false,
                          connecting: true,
                          lastError: null,
                          sessionName: null
                        });
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      Concluído
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleCloseQRModal();
                          setConnectionStatus({
                            connected: false,
                            connecting: true,
                            lastError: null,
                            sessionName: null
                          });
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            if (selectedConnection) {
                              // Verificar se a conexão está conectada antes de concluir
                              const apiBase = getApiBase();
                              const encodedId = encodeURIComponent(selectedConnection.id);
                              const headers = buildAuthHeaders();
                              const response = await fetch(`${apiBase}/api/baileys-simple/connections/${encodedId}`, {
                                headers
                              });
                              if (response.ok) {
                                const data = await response.json();
                                if (data.success && data.data.isConnected) {
                                  // Atualizar o status da conexão no contexto
                                  updateConnectionStatus(selectedConnection.id);
                                  
                                  handleCloseQRModal();
                                  success('✅ WhatsApp conectado com sucesso!');
                                  loadConnections();
                                } else {
                                  error('A conexão ainda não foi estabelecida. Aguarde a confirmação do WhatsApp.');
                                }
                              } else {
                                error('Erro ao verificar status da conexão');
                              }
                            }
                          } catch (err) {
                            error('Erro ao verificar conexão');
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Concluir
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes da Conexão */}
        <ConnectionDetailsModal
          isOpen={showConnectionDetailsModal}
          onClose={() => {
            setShowConnectionDetailsModal(false);
            setSelectedConnection(null);
          }}
          connection={selectedConnection}
          onConnectionUpdated={(updatedConnection) => {
            // Atualizar a conexão selecionada quando for atualizada
            setSelectedConnection(updatedConnection);
            // Recarregar conexões para garantir sincronização
            if (user?.id) {
              loadConnections(user.id);
            }
          }}
          onDisconnect={() => {
            if (selectedConnection) {
              handleDisconnectConnection(selectedConnection.id);
            }
          }}
        />

        {/* Optimized QR Modal */}
        <OptimizedQRModal
          isOpen={showQRModal}
          onClose={handleCloseQRModal}
          connectionId={baileysConnectionId || ''}
          connectionName={lastCreatedNameRef.current || 'WhatsApp'}
          statusMessage={qrModalStatus || undefined}
          externalError={qrModalError || undefined}
          forceServerOffline={qrModalForceOffline}
          onConnectionSuccess={() => {
            console.log('🔄 onConnectionSuccess called in Settings.tsx');
            console.log('🔄 User ID:', user?.id);
            console.log('🐛 DEBUG - baileysConnectionId:', baileysConnectionId);
            console.log('🐛 DEBUG - lastCreatedNameRef:', lastCreatedNameRef.current);
            // Reload connections list when connection is successful
            if (user?.id) {
              console.log('🔄 Calling loadConnections...');
              loadConnections(user.id);
            } else {
              console.log('❌ No user ID available');
            }
          }}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          open={showDeleteModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Excluir Conexão"
          description="Tem certeza que deseja excluir esta conexão?"
          itemName={connectionToDelete?.name || ''}
          loading={isDeleting}
        />

        {/* Disconnect Confirmation Modal */}
        <DisconnectConfirmModal
          isOpen={showDisconnectModal}
          onClose={handleCancelDisconnect}
          onConfirm={handleConfirmDisconnect}
          connectionName={connectionToDisconnect?.name || (connectionToDisconnect?.type === 'whatsapp_baileys' ? 'Baileys (WhatsApp Web)' : 'Conexão de Webhook')}
          isDisconnecting={isDisconnecting}
        />

        {/* Container de Toasts */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}
