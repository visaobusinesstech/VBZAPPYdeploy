import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const GoogleCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autorização...');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obter código de autorização da URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Erro de autorização: ${error}`);
        }

        if (!code) {
          throw new Error('Código de autorização não encontrado');
        }

        setMessage('Trocando código por token...');

        // Enviar código para o backend fazer a troca (seguro, com client_secret no servidor)
        const response = await fetch(`${BACKEND_URL}/api/integrations/google/exchange-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao trocar código por token');
        }

        const data = await response.json();
        
        if (!data.access_token) {
          throw new Error('Token de acesso não recebido');
        }

        setMessage('Obtendo informações do usuário...');

        // Obter informações do usuário do Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Erro ao obter informações do usuário');
        }

        const userInfo = await userInfoResponse.json();
        
        // Salvar tokens e informações do usuário no localStorage
        const tokensToSave = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
          scope: data.scope,
          user_email: userInfo.email,
          user_name: userInfo.name,
          user_picture: userInfo.picture,
          expires_at: Date.now() + (data.expires_in * 1000)
        };

        localStorage.setItem('google_tokens', JSON.stringify(tokensToSave));
        
        // Salvar tokens no backend também (para persistência)
        try {
          const saveResponse = await fetch(`${BACKEND_URL}/api/integrations/google/save-tokens`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_in: data.expires_in,
              user_email: userInfo.email,
              user_name: userInfo.name,
              user_picture: userInfo.picture,
            }),
          });

          if (!saveResponse.ok) {
            console.warn('Aviso: Não foi possível salvar tokens no backend, mas continuando...');
          }
        } catch (saveError) {
          console.warn('Aviso: Erro ao salvar tokens no backend:', saveError);
        }
        
        setUserEmail(userInfo.email);
        setStatus('success');
        setMessage('Conexão com Google realizada com sucesso!');

        // Notificar a janela pai sobre a conexão bem-sucedida
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_CONNECTION_SUCCESS',
            data: {
              platform: 'google',
              connected: true,
              userEmail: userInfo.email,
              tokens: tokensToSave
            }
          }, '*');
          
          // Disparar evento customizado para recarregar eventos
          window.opener.dispatchEvent(new CustomEvent('googleCalendarConnected'));
        } else {
          // Se não há window.opener, disparar na própria janela
          window.dispatchEvent(new CustomEvent('googleCalendarConnected'));
        }

        // Fechar a janela após 2 segundos
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (error: any) {
        console.error('Erro no callback do Google:', error);
        setStatus('error');
        setMessage(error.message || 'Erro ao processar autorização');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {status === 'loading' && 'Autorizando...'}
          {status === 'success' && 'Sucesso!'}
          {status === 'error' && 'Erro'}
        </h2>

        <p className="text-gray-600 mb-4">
          {message}
        </p>

        {userEmail && (
          <p className="text-sm text-gray-500 mb-6">
            Conectado como: <span className="font-medium">{userEmail}</span>
          </p>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              Esta janela será fechada automaticamente em alguns segundos.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              Você pode fechar esta janela e tentar novamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;