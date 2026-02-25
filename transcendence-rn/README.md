# Transcendência - Plataforma de Torneios e Quizzes

Migração do projecto RPG Maker MZ para React Native com novas funcionalidades de chat, ranking e sistema de torneios.

## 📋 Funcionalidades

### ✅ Autenticação
- Registo e login de utilizadores
- Gestão de sessões
- Perfis de utilizadores

### 📚 Quiz Educativo
- Quizzes por categoria
- Três níveis de dificuldade
- Sistema de pontuação com multiplicador de tempo
- Histórico de testes
- Estatísticas de desempenho

### 💬 Sistema de Chat
- Chat público em múltiplos canais
- Chat privado entre utilizadores
- Mensagens em tempo real
- Notificações

### 🏆 Ranking e Pontuação
- Ranking global em tempo real
- Sistema de níveis
- Visualização de estatísticas
- Taxa de vitória

### 🎮 Sistema de Torneios
- Criação de torneios
- Estruturas: Eliminatória, Liga, Grupos
- Gestão de partidas
- Tabela de classificações

## 🚀 Instalação

### Pré-requisitos
- Node.js (v16 OR superior)
- npm OR yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase account AND credentials

### Passos

1. **Clonar o repositório**
```bash
git clone <repo-url>
cd transcendence-react-native
```

2. **Instalar dependências**
```bash
npm install
```

3. **Configurar Firebase**

Cria um ficheiro `.env` na raiz do projecto:

```env
FIREBASE_API_KEY=tua_chave_api
FIREBASE_AUTH_DOMAIN=teu_dominio.firebaseapp.com
FIREBASE_PROJECT_ID=teu_id_projecto
FIREBASE_STORAGE_BUCKET=teu_bucket.appspot.com
FIREBASE_MESSAGING_SENDER_ID=teu_sender_id
FIREBASE_APP_ID=teu_app_id
FIREBASE_DATABASE_URL=https://teu-projecto.firebaseio.com
```

4. **Iniciar a aplicação**

```bash
# Web
npm run web

# iOS
npm run ios

# Android
npm run android
```

## 📁 Estrutura do Projecto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Botao.tsx
│   └── EntradaTexto.tsx
├── config/             # Configurações (Firebase)
│   └── firebase.js
├── context/            # Contextos React
│   ├── ContextoAutenticacao.tsx
│   ├── ContextoChat.tsx
│   └── ContextoPontuacao.tsx
├── database/           # Operações de base de dados
├── navigation/         # Navegação da app
│   └── Navegacao.tsx
├── screens/            # Ecrãs
│   ├── EcraAutenticacao.tsx
│   ├── EcraChatPublico.tsx
│   ├── EcraQuiz.tsx
│   ├── EcraRanking.tsx
│   └── EcraPerfil.tsx
├── services/           # Serviços (lógica de negócio)
│   ├── ServicoTorneio.ts
│   └── ServicoQuiz.ts
├── types/              # Definições de tipos TypeScript
│   └── index.ts
└── utils/              # Funções utilitárias
```

## 🗂️ Estrutura de Base de Dados (Firestore)

### Colecções

**utilizadores**
```json
{
  "id": "uid",
  "email": "usuario@exemplo.com",
  "nome": "Nome do Utilizador",
  "avatar": "url_avatar",
  "dataRegistro": "timestamp",
  "ultimoAcesso": "timestamp",
  "estaOnline": true
}
```

**pontuacoes**
```json
{
  "utilizadorId": "uid",
  "pontos": 1500,
  "nivelAtual": 2,
  "dataAtualizacao": "timestamp"
}
```

**mensagens**
```json
{
  "utilizadorId": "uid",
  "conteudo": "Conteúdo da mensagem",
  "dataCriacao": "timestamp",
  "canalId": "canal_id (opcional)",
  "conversaId": "conversa_id (opcional)",
  "lida": false
}
```

**canais**
```json
{
  "nome": "Nome do Canal",
  "descricao": "Descrição",
  "dataCriacao": "timestamp",
  "membros": ["uid1", "uid2"]
}
```

**perguntas**
```json
{
  "pergunta": "Qual é a resposta?",
  "respostas": ["opção1", "opção2", "opção3", "opção4"],
  "respostaCorreta": 0,
  "categoria": "42Luanda",
  "dificuldade": "medio",
  "pontos": 100
}
```

**testes**
```json
{
  "utilizadorId": "uid",
  "perguntas": [...],
  "respostas": [0, 1, 2, ...],
  "pontuacaoFinal": 450,
  "dataInicio": "timestamp",
  "dataFim": "timestamp",
  "dataEmpresa": 120,
  "acertou": [true, false, true, ...]
}
```

**torneios**
```json
{
  "nome": "Nome do Torneio",
  "descricao": "Descrição",
  "dataCriacao": "timestamp",
  "dataInicio": "timestamp",
  "estado": "em_andamento",
  "maxParticipantes": 16,
  "participantes": ["uid1", "uid2", ...],
  "estrutura": "liga"
}
```

**partidas**
```json
{
  "torneioId": "torneio_id",
  "jogador1Id": "uid1",
  "jogador2Id": "uid2",
  "vencedorId": "uid1",
  "data": "timestamp",
  "estado": "finalizada",
  "pontos1": 100,
  "pontos2": 80
}
```

## 🔧 Operadores Usados no Código

O código utiliza operadores lógicos CSS/C++:
- `AND` em vez de `&&`
- `OR` em vez de `||`
- `NOT` em vez de `!`
- `XOR` para operações exclusivas

Isto permite compatibilidade com a preferência de sintaxe do desenvolvedor.

## 📱 Tipos Principais

Ver `src/types/index.ts` para as definições completas de tipos.

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm start      # Inicia o Expo
npm run web    # Web
npm run ios    # iOS
npm run android # Android
npm test       # Executa testes
```

### Nomear Convenções

- **Tipos**: PascalCase (ex: `ContextoAutenticacao`)
- **Variáveis**: camelCase (ex: `utilizadorId`)
- **Componentes**: PascalCase (ex: `EcraQuiz`)
- **Ficheiros**: PascalCase para componentes, camelCase para funções

## 📚 Dependências Principais

- **React Native**: Framework mobile
- **Expo**: Plataforma de desenvolvimento
- **Firebase**: Backend
- **React Navigation**: Navegação
- **TypeScript**: Type safety
- **Firestore**: Base de dados

## 🐛 Troubleshooting

### Erro de autenticação Firebase
- Verifica as credenciais no ficheiro `.env`
- Certifica-te de que o projecto Firebase está activo

### Erro de conexão ao chat
- Verifica a configuração do Firestore
- Certifica-te de que as regras de segurança permitem leitura/escrita

### Erro ao carregar quizzes
- Verifica se as perguntas estão no Firestore
- Podes importar usando `ServicoQuiz.importarPerguntas()`

## 📄 Licença

Propriedade de 42 Luanda

## 👤 Autor

Desenvolvido como migração do projecto RPG Maker MZ para React Native

## 📞 Suporte

Para questões ou problemas, contacta o administrador do projecto.
