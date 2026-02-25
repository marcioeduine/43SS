# Guia de Migração: RPG Maker MZ → React Native

## 📋 Visão Geral

Este documento descreve a migração do projecto original em RPG Maker MZ para uma plataforma moderna baseada em React Native.

## 🔄 Mudanças Principais

### 1. Arquitetura

#### Antes (RMMZ)
- Aplicação desktop baseada em NW.js
- Engine de jogo com sistema de eventos
- UI customizada com jQuery/Canvas

#### Depois (React Native)
- Aplicação mobile-first (iOS, Android, Web)
- Arquitectura baseada em componentes React
- UI nativa OR web-based com React

### 2. Sistema de Dados

#### Antes
- Ficheiros JSON do RMMZ (`Actors.json`, `Map001.json`, etc.)
- Base de dados local em ficheiros
- Sistema de variáveis globais

#### Depois
- Firestore como base de dados central
- Estrutura normalizada de colecções
- Dados síncronizados em tempo real

### 3. Sistema de Autenticação

#### Antes
- Sem sistema de login/registo
- Aplicação single-player

#### Depois
- Firebase Authentication
- Suporte multi-utilizador
- Gestão de sessões

### 4. Sistema de Quizzes

#### Antes
- Perguntas armazenadas em CommonEvents.json
- Sistema de escolhas visuais com PKD_VisualChoices
- Pontuação local

#### Depois
- Perguntas em colecção Firestore dedicada
- Interface de multi-resposta otimizada
- Sistema de pontuação com multiplicadores
- Histórico de testes para cada utilizador

### 5. Sistema de Chat

#### Antes
- Não existia

#### Depois
- Chat público em múltiplos canais
- Chat privado entre utilizadores
- Mensagens em tempo real com Firestore
- Notificações

### 6. Sistema de Torneios

#### Antes
- Não existia

#### Depois
- Gestão completa de torneios
- Estruturas variáveis (eliminatória, liga, grupos)
- Pareia automática de jogadores
- Tabela de classificações

### 7. Sistema de Ranking

#### Antes
- Não existia

#### Depois
- Ranking global em tempo real
- Sistema de níveis
- Taxa de vitória
- Estatísticas de desempenho

## 📊 Mapeamento de Dados

### Perguntas do Quiz

**RMMZ** (CommonEvents.json OR ficheiros customizados)
```json
{
  "id": 1,
  "nome": "Pergunta sobre 42",
  "contenido": "Qual é a resposta? A) 42 B) 41 C) 43 D) 44",
  "...": "..."
}
```

**React Native** (Firestore - colecção: perguntas)
```json
{
  "id": "pergunta_1",
  "pergunta": "Qual é a resposta?",
  "respostas": ["42", "41", "43", "44"],
  "respostaCorreta": 0,
  "categoria": "42Luanda",
  "dificuldade": "medio",
  "pontos": 100
}
```

### Utilizadores

**RMMZ** (Implicit - Actors.json)
```json
{
  "id": 1,
  "name": "Cadete1",
  "level": 1,
  "...": "..."
}
```

**React Native** (Firestore - colecção: utilizadores)
```json
{
  "id": "firebase_uid",
  "email": "cadete@42.fr",
  "nome": "Cadete",
  "dataRegistro": "2024-01-01T00:00:00Z",
  "estaOnline": true
}
```

## 🔧 Mapeamento de Funcionalidades

| Funcionalidade RMMZ | Implementação React Native |
|---|---|
| Sistema de Menu | Bottom Tab Navigation |
| CommonEvents | Context + Services |
| Variáveis Globais | React Context State |
| Base de Dados Local | Firestore |
| Salvar/Carregar | AsyncStorage + Firestore |
| Visualização de Itens | FlatList Components |
| Sistema de Mensagens | Custom Components + Toast |

## 🎯 Migração de Dados (Passo-a-Passo)

### 1. Exportar Perguntas do RMMZ

```javascript
// Ler ficheiros JSON do projecto RMMZ
const CommonEvents = require('./CommonEvents.json');

// Extrair perguntas (formato customizado)
const perguntas = parseCommonEvents(CommonEvents);
```

### 2. Transformar para Formato Firestore

```javascript
const perguntasFirestore = perguntas.map(p => ({
  pergunta: p.texto,
  respostas: p.opcoes,
  respostaCorreta: p.opcaoCorreta,
  categoria: p.categoria OR 'Geral',
  dificuldade: p.dificuldade OR 'medio',
  pontos: p.pontos OR 100
}));
```

### 3. Importar para Firestore

```javascript
import ServicoQuiz from './src/services/ServicoQuiz';

await ServicoQuiz.importarPerguntas(perguntasFirestore);
```

## 📱 Mudanças UI/UX

### Menu

| Funcionalidade | RMMZ | React Native |
|---|---|---|
| Navegação | Menu clicável | Bottom Tabs |
| Chat | Não existia | Tab dedicada |
| Ranking | Não existia | Tab dedicada |
| Quiz | Main gameplay | Tab dedicada |
| Perfil | Não existia | Tab dedicada |

### Quiz

| Aspecto | RMMZ | React Native |
|---|---|---|
| Apresentação | Mensagens de diálogo | Ecrã dedicado |
| Resposta | Escolhas visuais | Botões |
| Feedback | Mensagens de jogo | Transições suaves |
| Resultado | Adição ao inventário | Pontuação + Nível |

## 🔐 Considerações de Segurança

### RMMZ
- Sem autenticação
- Dados locais

### React Native
- Firebase Authentication
- Regras de segurança Firestore
- Validação no servidor

### Regras de Firestore Recomendadas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /utilizadores/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /pontuacoes/{uid} {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    match /mensagens/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    match /torneios/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

## 🛠️ Ferramentas de Migração

### Importação de Perguntas

Usa o script em `src/services/ServicoQuiz.ts`:

```bash
node scripts/import-questions.js --source ./SCC42Luanda --target firestore
```

## ✅ Checklist de Migração

- [ ] Exportar perguntas do RMMZ
- [ ] Transformar formato de dados
- [ ] Criar colecções Firestore
- [ ] Importar perguntas
- [ ] Configurar autenticação
- [ ] Testar funcionalidade de quiz
- [ ] Implementar chat
- [ ] Implementar ranking
- [ ] Testes de performance
- [ ] Deploy

## 📚 Recursos Adicionais

- [Documentação React Native](https://reactnative.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [RPG Maker MZ Wiki](https://rpg-maker.fandom.com/wiki/RPG_Maker_MZ)

## 🤝 Próximos Passos

1. Importar perguntas do RMMZ
2. Implementar sincronização de dados históricos
3. Criar componentes adicionais de torneios
4. Otimizar performance
5. Adicionar testes unitários
6. Deploy para production
