// Tipos de Utilizador
export interface User {
  id: string;
  email: string;
  nome: string;
  avatar?: string;
  dataRegistro: Date;
  ultimoAcesso: Date;
  estaOnline: boolean;
}

// Tipos de Pontuação
export interface Pontuacao {
  id: string;
  utilizadorId: string;
  pontos: number;
  dataAtualizacao: Date;
  nivelAtual: number;
}

// Tipos de Ranking
export interface RankingItem {
  posicao: number;
  utilizador: User;
  pontos: number;
  nivelAtual: number;
  taxaVitoria: number;
  totalPartidas: number;
}

// Tipos de Chat
export interface Mensagem {
  id: string;
  utilizadorId: string;
  utilizador?: User;
  conteudo: string;
  dataCriacao: Date;
  canalId?: string; // Para chat público
  destinatarioId?: string; // Para chat privado
  lida: boolean;
}

export interface Canal {
  id: string;
  nome: string;
  descricao: string;
  dataCriacao: Date;
  membros: string[];
}

// Tipos de Quiz
export interface Pergunta {
  id: string;
  pergunta: string;
  respostas: string[];
  respostaCorreta: number;
  categoria: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  pontos: number;
}

export interface Teste {
  id: string;
  utilizadorId: string;
  perguntas: Pergunta[];
  respostas: number[];
  pontuacaoFinal: number;
  dataInicio: Date;
  dataFim: Date;
  dataEmpresa: number; // em segundos
  acertou: boolean[];
}

// Tipos de Torneio
export interface Torneio {
  id: string;
  nome: string;
  descricao: string;
  dataCriacao: Date;
  dataInicio: Date;
  dataFim?: Date;
  estado: 'planejamento' | 'em_andamento' | 'finalizado';
  maxParticipantes: number;
  participantes: string[];
  estrutura: 'eliminatoria' | 'grupos' | 'liga';
}

export interface Partida {
  id: string;
  torneioId: string;
  jogador1Id: string;
  jogador2Id: string;
  vencedorId?: string;
  data: Date;
  estado: 'pendente' | 'em_andamento' | 'finalizada';
  pontos1: number;
  pontos2: number;
}

export interface TabelaTorneio {
  torneioId: string;
  participantes: {
    utilizadorId: string;
    utilizador: User;
    pontos: number;
    vitórias: number;
    derrotas: number;
    posicao: number;
  }[];
}

// Tipos de Notificação
export interface Notificacao {
  id: string;
  utilizadorId: string;
  tipo: 'mensagem' | 'convite' | 'resultado' | 'promoção';
  conteudo: string;
  dataCriacao: Date;
  lida: boolean;
  actionUrl?: string;
}

// Tipos de Contexto de Autenticação
export interface ContextoAutenticacao {
  utilizador: User | null;
  carregando: boolean;
  erro: string | null;
  autenticar: (email: string, senha: string) => Promise<void>;
  registrar: (email: string, senha: string, nome: string) => Promise<void>;
  logout: () => Promise<void>;
  atualizarPerfil: (dados: Partial<User>) => Promise<void>;
}

// Tipos de Contexto de Chat
export interface ContextoChat {
  mensagens: Mensagem[];
  canais: Canal[];
  canaisSelecionado: string | null;
  conversasPrivadas: string[];
  enviarMensagem: (conteudo: string, destinatarioId?: string) => Promise<void>;
  carregarMensagens: (canalId: string) => Promise<void>;
  carregarConversaPrivada: (utilizadorId: string) => Promise<void>;
  criarCanal: (nome: string, descricao: string) => Promise<void>;
  marcarComoLida: (mensagemId: string) => Promise<void>;
}

// Tipos de Contexto de Pontuação
export interface ContextoPontuacao {
  minhasPontuacoes: Pontuacao | null;
  ranking: RankingItem[];
  carregarPontuacoes: () => Promise<void>;
  carregarRanking: () => Promise<void>;
  adicionarPontos: (quantidade: number) => Promise<void>;
}
