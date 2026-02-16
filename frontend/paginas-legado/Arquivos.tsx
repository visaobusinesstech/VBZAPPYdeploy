import { useState } from 'react';

interface Arquivo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  data_upload: string;
  uploader: string;
  pasta: string;
  projeto_id?: string;
  cliente_id?: string;
  lead_id?: string;
  url: string;
  descricao: string;
  tags: string[];
  compartilhado: boolean;
  versao: number;
  hash: string;
  mime_type: string;
}

interface Pasta {
  id: string;
  nome: string;
  cor: string;
  icon: string;
  quantidade_arquivos: number;
  tamanho_total: number;
  data_criacao: string;
  criador: string;
  compartilhada: boolean;
  descricao: string;
}

export default function Arquivos() {
  const [activeTab, setActiveTab] = useState<'todos' | 'pastas' | 'compartilhados' | 'favoritos' | 'lixeira'>('todos');
  const [viewMode, setViewMode] = useState<'lista' | 'grade'>('lista');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPastaModal, setShowPastaModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [pastaFilter, setPastaFilter] = useState<string>('todos');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('raiz');

  const [arquivos, setArquivos] = useState<Arquivo[]>([
    {
      id: '1',
      nome: 'Contrato_Tech_Solutions_2024.pdf',
      tipo: 'pdf',
      tamanho: 2048576,
      data_upload: '2024-01-15',
      uploader: 'João Santos',
      pasta: 'Contratos',
      projeto_id: '1',
      cliente_id: '1',
      url: '/uploads/contratos/contrato_tech_solutions.pdf',
      descricao: 'Contrato de implementação ERP - Tech Solutions',
      tags: ['contrato', 'tech-solutions', 'erp', '2024'],
      compartilhado: false,
      versao: 2,
      hash: 'a1b2c3d4e5f6',
      mime_type: 'application/pdf'
    },
    {
      id: '2',
      nome: 'Apresentacao_ERP_2024.pptx',
      tipo: 'presentation',
      tamanho: 15728640,
      data_upload: '2024-01-10',
      uploader: 'Ana Costa',
      pasta: 'Apresentações',
      projeto_id: '1',
      cliente_id: '1',
      url: '/uploads/apresentacoes/apresentacao_erp_2024.pptx',
      descricao: 'Apresentação comercial do ERP para Tech Solutions',
      tags: ['apresentacao', 'erp', 'comercial', 'tech-solutions'],
      compartilhado: true,
      versao: 1,
      hash: 'b2c3d4e5f6g7',
      mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    },
    {
      id: '3',
      nome: 'Requisitos_Sistema.xlsx',
      tipo: 'spreadsheet',
      tamanho: 1048576,
      data_upload: '2024-01-08',
      uploader: 'Pedro Silva',
      pasta: 'Documentos',
      projeto_id: '1',
      cliente_id: '1',
      url: '/uploads/documentos/requisitos_sistema.xlsx',
      descricao: 'Planilha com requisitos detalhados do sistema',
      tags: ['requisitos', 'documentacao', 'sistema'],
      compartilhado: false,
      versao: 3,
      hash: 'c3d4e5f6g7h8',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },
    {
      id: '4',
      nome: 'Logo_Empresa.png',
      tipo: 'image',
      tamanho: 524288,
      data_upload: '2024-01-05',
      uploader: 'Maria Silva',
      pasta: 'Imagens',
      url: '/uploads/imagens/logo_empresa.png',
      descricao: 'Logo oficial da empresa',
      tags: ['logo', 'imagem', 'marca'],
      compartilhado: true,
      versao: 1,
      hash: 'd4e5f6g7h8i9',
      mime_type: 'image/png'
    },
    {
      id: '5',
      nome: 'Manual_Usuario.pdf',
      tipo: 'pdf',
      tamanho: 3145728,
      data_upload: '2024-01-12',
      uploader: 'Carlos Oliveira',
      pasta: 'Documentos',
      url: '/uploads/documentos/manual_usuario.pdf',
      descricao: 'Manual completo do usuário do sistema',
      tags: ['manual', 'documentacao', 'usuario', 'ajuda'],
      compartilhado: true,
      versao: 1,
      hash: 'e5f6g7h8i9j0',
      mime_type: 'application/pdf'
    }
  ]);

  const [pastas, setPastas] = useState<Pasta[]>([
    {
      id: '1',
      nome: 'Contratos',
      cor: '#EF4444',
      icon: '📄',
      quantidade_arquivos: 15,
      tamanho_total: 52428800,
      data_criacao: '2024-01-01',
      criador: 'Administrador',
      compartilhada: false,
      descricao: 'Contratos e documentos legais'
    },
    {
      id: '2',
      nome: 'Apresentações',
      cor: '#3B82F6',
      icon: '📊',
      quantidade_arquivos: 8,
      tamanho_total: 104857600,
      data_criacao: '2024-01-02',
      criador: 'Administrador',
      compartilhada: true,
      descricao: 'Apresentações e slides comerciais'
    },
    {
      id: '3',
      nome: 'Documentos',
      cor: '#10B981',
      icon: '📋',
      quantidade_arquivos: 25,
      tamanho_total: 78643200,
      data_criacao: '2024-01-03',
      criador: 'Administrador',
      compartilhada: false,
      descricao: 'Documentos técnicos e administrativos'
    },
    {
      id: '4',
      nome: 'Imagens',
      cor: '#8B5CF6',
      icon: '🖼️',
      quantidade_arquivos: 12,
      tamanho_total: 31457280,
      data_criacao: '2024-01-04',
      criador: 'Administrador',
      compartilhada: true,
      descricao: 'Imagens e recursos gráficos'
    }
  ]);

  const getFileIcon = (tipo: string) => {
    const icons = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp4: '🎥',
      mp3: '🎵',
      zip: '📦',
      rar: '📦',
      folder: '📁',
      presentation: '📊',
      spreadsheet: '📊',
      image: '🖼️'
    };
    return icons[tipo as keyof typeof icons] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredArquivos = arquivos.filter(arquivo => {
    const matchesSearch = arquivo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         arquivo.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || arquivo.tipo === tipoFilter;
    const matchesPasta = pastaFilter === 'todos' || arquivo.pasta === pastaFilter;
    
    return matchesSearch && matchesTipo && matchesPasta;
  });

  const handleFileSelect = (fileId: string) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    } else {
      setSelectedFiles([...selectedFiles, fileId]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Arquivos</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>⬆️</span>
                <span>Upload</span>
              </button>
              <button
                onClick={() => setShowPastaModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>📁</span>
                <span>Nova Pasta</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            {[
              { key: 'todos', label: 'Todos', icon: '📂' },
              { key: 'pastas', label: 'Pastas', icon: '📁' },
              { key: 'compartilhados', label: 'Compartilhados', icon: '🔗' },
              { key: 'favoritos', label: 'Favoritos', icon: '⭐' },
              { key: 'lixeira', label: 'Lixeira', icon: '🗑️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* View Mode and Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('lista')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'lista'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Lista
                </button>
                <button
                  onClick={() => setViewMode('grade')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === 'grade'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⊞ Grade
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredArquivos.length} arquivo(s)
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedFiles.length} selecionado(s)</span>
                <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                  🗑️ Excluir
                </button>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  📤 Compartilhar
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar arquivos..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="pdf">PDF</option>
                <option value="doc">Documentos</option>
                <option value="xls">Planilhas</option>
                <option value="ppt">Apresentações</option>
                <option value="image">Imagens</option>
                <option value="video">Vídeos</option>
                <option value="audio">Áudios</option>
                <option value="zip">Arquivos Compactados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pasta</label>
              <select
                value={pastaFilter}
                onChange={(e) => setPastaFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todas as Pastas</option>
                {pastas.map((pasta) => (
                  <option key={pasta.id} value={pasta.nome}>{pasta.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pastas View */}
        {activeTab === 'pastas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {pastas.map((pasta) => (
              <div key={pasta.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${pasta.cor}20`, color: pasta.cor }}
                  >
                    {pasta.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{pasta.nome}</h3>
                    <p className="text-sm text-gray-500">{pasta.quantidade_arquivos} arquivos</p>
                  </div>
                  {pasta.compartilhada && (
                    <span className="text-blue-500 text-sm">🔗</span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tamanho:</span>
                    <span className="font-medium">{formatFileSize(pasta.tamanho_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Criado:</span>
                    <span className="font-medium">{new Date(pasta.data_criacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Por:</span>
                    <span className="font-medium">{pasta.criador}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">{pasta.descricao}</p>
              </div>
            ))}
          </div>
        )}

        {/* Files List View */}
        {viewMode === 'lista' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'compartilhados' ? 'Arquivos Compartilhados' : 
                 activeTab === 'favoritos' ? 'Favoritos' : 
                 activeTab === 'lixeira' ? 'Lixeira' : 'Todos os Arquivos'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(filteredArquivos.map(f => f.id));
                          } else {
                            setSelectedFiles([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modificado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Por</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArquivos.map((arquivo) => (
                    <tr key={arquivo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedFiles.includes(arquivo.id)}
                          onChange={() => handleFileSelect(arquivo.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFileIcon(arquivo.tipo)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{arquivo.nome}</div>
                            <div className="text-sm text-gray-500">{arquivo.pasta}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                          {arquivo.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(arquivo.tamanho)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(arquivo.data_upload).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {arquivo.uploader}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" title="Download">
                            ⬇️
                          </button>
                          <button className="text-green-600 hover:text-green-900" title="Compartilhar">
                            🔗
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" title="Editar">
                            ✏️
                          </button>
                          <button className="text-red-600 hover:text-red-900" title="Excluir">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Files Grid View */}
        {viewMode === 'grade' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredArquivos.map((arquivo) => (
              <div key={arquivo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{getFileIcon(arquivo.tipo)}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedFiles.includes(arquivo.id)}
                    onChange={() => handleFileSelect(arquivo.id)}
                  />
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{arquivo.nome}</h3>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>{formatFileSize(arquivo.tamanho)}</div>
                  <div>{new Date(arquivo.data_upload).toLocaleDateString('pt-BR')}</div>
                  <div>{arquivo.uploader}</div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase">
                    {arquivo.tipo}
                  </span>
                  <div className="flex items-center space-x-1">
                    {arquivo.compartilhado && <span className="text-blue-500 text-xs">🔗</span>}
                    <span className="text-gray-400">v{arquivo.versao}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload de Arquivos</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-600 mb-2">Arraste arquivos aqui ou</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Escolher Arquivos
                </button>
                <p className="text-xs text-gray-500 mt-2">Máximo 10MB por arquivo</p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fazer Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Folder Modal */}
        {showPastaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Pasta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Pasta</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da pasta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Descrição da pasta..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex space-x-2">
                    {['#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6B7280'].map((cor) => (
                      <button
                        key={cor}
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: cor }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPastaModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowPastaModal(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Criar Pasta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}