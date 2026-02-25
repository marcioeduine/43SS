
**NOTA:** Este tutorial foi actualizado para reflectir a implementação real do projecto `ss_irc`, que utiliza `epoll` em vez de `poll`, e segue o estilo de código com os operadores `not`, `and`, `or` e `xor` (C++98 com keywords alternativas), conforme as preferências do autor, **Ser Superior (SS)**.

---

# Tutorial Completo: Servidor IRC em C++98

Vamos explicar-vos, passo a passo, como construir um servidor IRC (Internet Relay Chat) profissional capaz de se conectar com clientes IRC reais como **irssi**, **HexChat** ou **netcat**. Todo o código está em **C++98** e segue o protocolo **RFC 1459**. O servidor utiliza `epoll` para I/O não‑bloqueante e gere múltiplos clientes numa única thread.

---

## 📋 Índice

1. [Conceitos Fundamentais](#1-conceitos-fundamentais)
2. [Estrutura do Projecto](#2-estrutura-do-projecto)
3. [Sintaxe Completa dos Comandos IRC](#3-sintaxe-completa-dos-comandos-irc)
4. [Passo 1 – Criar o Socket TCP](#4-passo-1---criar-o-socket-tcp)
5. [Passo 2 – Aceitar Clientes com epoll](#5-passo-2---aceitar-clientes-com-epoll)
6. [Passo 3 – Receber e Enviar Dados](#6-passo-3---receber-e-enviar-dados)
7. [Passo 4 – Parsing do Protocolo IRC](#7-passo-4---parsing-do-protocolo-irc)
8. [Passo 5 – Autenticação (PASS, NICK, USER)](#8-passo-5---autenticacao)
9. [Passo 6 – Canais (JOIN, PART, PRIVMSG)](#9-passo-6---canais)
10. [Passo 7 – Comandos de Operador (KICK, INVITE, TOPIC, MODE)](#10-passo-7---comandos-de-operador)
11. [Passo 8 – Comandos Utilitários (PING, PONG, QUIT, CAP)](#11-passo-8---comandos-utilitarios)
12. [Armadilhas Comuns e Bugs a Evitar](#12-armadilhas-comuns-e-bugs-a-evitar)
13. [Testar o Servidor](#13-testar-o-servidor)
14. [Referência de Códigos IRC](#14-referencia-de-codigos-irc)

---

## 1. Conceitos Fundamentais

### O que é IRC?

IRC (Internet Relay Chat) é um protocolo de chat baseado em texto sobre TCP criado em 1988. Funciona assim:

```
Cliente A ---\                    /--- Canal #geral
              >--- Servidor IRC ---
Cliente B ---/                    \--- Canal #ajuda
```

**Componentes:**
- **Clientes:** Conectam-se ao servidor por TCP (porta 6667-6697)
- **Servidor:** Gere canais (salas de chat) e reencaminha mensagens
- **Canais:** Salas de chat identificadas por `#nome` ou `&nome`
- **Operadores:** Utilizadores com privilégios especiais nos canais

**Características:**
- Toda a comunicação é texto ASCII terminado por `\r\n`
- Protocolo orientado a linhas (uma linha = um comando)
- Suporta mensagens privadas (DM) e públicas (canais)
- Sistema de modos (modes) para controlar comportamento dos canais

### O que é TCP?

TCP (Transmission Control Protocol) é um protocolo de comunicação da camada de transporte usado na Internet. 

**Características do TCP:**
- **Confiável:** Garante entrega ordenada e sem erros
- **Orientado a conexão:** Estabelece conexão antes de transmitir
- **Controlo de fluxo:** Evita sobrecarga do receptor
- **Retransmissão:** Reenvia pacotes perdidos automaticamente

Em resumo: TCP é o protocolo que permite comunicação confiável entre dois computadores em rede, como entre um cliente IRC e um servidor IRC.

### Formato das Mensagens IRC

Cada mensagem IRC segue este formato geral:

```
[:prefixo] COMANDO [parametro1] [parametro2] [...] [:trailing]\r\n
```

**Componentes:**
- **`:prefixo`** (opcional): Origem da mensagem (ex: `:nick!user@host`)
- **`COMANDO`**: Nome do comando em MAIÚSCULAS (ex: `PRIVMSG`, `JOIN`)
- **`parametros`**: Argumentos do comando separados por espaços
- **`:trailing`**: Último parâmetro que pode conter espaços (começa com `:`)
- **`\r\n`**: Terminador obrigatório (Carriage Return + Line Feed)

**Exemplos:**
```
PASS senha123\r\n
NICK joao\r\n
USER joao 0 * :João Miguel Silva\r\n
JOIN #geral\r\n
PRIVMSG #geral :Olá a todos!\r\n
:joao!joao@host PRIVMSG #geral :Olá!\r\n
```

### Arquitectura: 3 Classes Principais

```
Server     -> Gere socket, epoll, clientes e canais
  |
  +-- Client   -> Representa um utilizador conectado
  |             (nickname, buffers, estado de autenticação)
  |
  +-- Channel  -> Representa um canal de chat
                (membros, operadores, modos, tópico)
```

---

## 2. Estrutura do Projecto

```
ss_irc/
├── include/
│   ├── Server.hpp          ← Definição da classe Server
│   ├── Client.hpp          ← Definição da classe Client
│   └── Channel.hpp         ← Definição da classe Channel
├── src/
│   ├── main.cpp            ← Ponto de entrada
│   ├── Server.cpp          ← Lógica principal do servidor (epoll)
│   ├── Client.cpp          ← Implementação do cliente
│   ├── Channel.cpp         ← Implementação do canal
│   ├── server_commands/
│   │   ├── handlePass.cpp    ← Comando PASS (password)
│   │   ├── handleNick.cpp    ← Comando NICK (nickname)
│   │   ├── handleUser.cpp    ← Comando USER (username)
│   │   ├── handlePrivmsg.cpp ← Comando PRIVMSG (mensagens)
│   │   └── utility_commands.cpp ← PING, PONG, QUIT, CAP, MODE user
│   ├── channel_commands/
│   │   ├── handleJoin.cpp    ← Comando JOIN (entrar em canal)
│   │   └── handlePart.cpp    ← Comando PART (sair de canal)
│   └── operator_commands/
│       ├── handleMode.cpp    ← Comando MODE (modos do canal)
│       ├── handleKick.cpp    ← Comando KICK (expulsar utilizador)
│       ├── handleInvite.cpp  ← Comando INVITE (convidar utilizador)
│       └── handleTopic.cpp   ← Comando TOPIC (tópico do canal)
└── Makefile
```

**Makefile básico:**

```makefile
NAME     = ss_ircserv
CXX      = c++
CXXFLAGS = -Wall -Wextra -Werror -std=c++98

SRCS     = src/main.cpp src/Server.cpp src/Client.cpp src/Channel.cpp \
           src/server_commands/handlePass.cpp \
           src/server_commands/handleNick.cpp \
           src/server_commands/handleUser.cpp \
           src/server_commands/handlePrivmsg.cpp \
           src/server_commands/utility_commands.cpp \
           src/channel_commands/handleJoin.cpp \
           src/channel_commands/handlePart.cpp \
           src/operator_commands/handleInvite.cpp \
           src/operator_commands/handleKick.cpp \
           src/operator_commands/handleMode.cpp \
           src/operator_commands/handleTopic.cpp

OBJS     = $(SRCS:.cpp=.o)

all: $(NAME)

$(NAME): $(OBJS)
	$(CXX) $(CXXFLAGS) $(OBJS) -o $(NAME)

clean:
	rm -f $(OBJS)

fclean: clean
	rm -f $(NAME)

re: fclean all

.PHONY: all clean fclean re
```

**Execução:**
```bash
./ss_ircserv <porta> <password>
```

---

## 3. Sintaxe Completa dos Comandos IRC

Esta secção detalha **TODOS** os comandos IRC que o servidor deve suportar.

---

### 🔐 COMANDOS DE AUTENTICAÇÃO

#### **PASS** - Definir Password do Servidor

**Sintaxe:**
```
PASS <password>
```

**Parâmetros:**
- `<password>`: Password do servidor (obrigatório)

**Descrição:**
Define a password para autenticar no servidor. **DEVE** ser o primeiro comando enviado pelo cliente, antes de `NICK` e `USER`.

**Exemplos:**
```
PASS senha123
PASS minha_senha_secreta
```

**Respostas do Servidor:**
```
:ss_ircserv 464 * :Password incorrect        (senha errada → desconecta)
:ss_ircserv 462 nick :You may not reregister  (já enviou PASS antes)
:ss_ircserv 461 nick PASS :Not enough parameters (sem parâmetro)
```

**Regras:**
- ✅ Deve ser enviado ANTES de NICK e USER
- ❌ Não pode ser reenviado após autenticação
- ❌ Senha errada → servidor fecha a conexão
- ✅ Senha correcta → cliente pode prosseguir

---

#### **NICK** - Definir/Mudar Nickname

**Sintaxe:**
```
NICK <nickname>
```

**Parâmetros:**
- `<nickname>`: Nome de utilizador único (1-9 caracteres, alfanuméricos)

**Descrição:**
Define ou muda o nickname do cliente. O nickname deve ser único no servidor.

**Exemplos:**
```
NICK joao
NICK alice123
NICK Bob
```

**Respostas do Servidor:**
```
:ss_ircserv 431 * :No nickname given              (sem parâmetro)
:ss_ircserv 433 * joao :Nickname is already in use (nickname já existe)
:ss_ircserv 432 * jo@o :Erroneous nickname        (caracteres inválidos)
```

**Regras:**
- ✅ Alfanuméricos e underscore `_` permitidos
- ❌ Não pode começar com número ou `-`
- ❌ Não pode conter espaços ou caracteres especiais (`#`, `@`, `:`, etc.)
- ✅ Máximo 9 caracteres (RFC 1459)

**Mudança de Nickname:**
Após autenticação, o cliente pode mudar de nickname:
```
NICK novo_nick
:antigo!user@host NICK :novo_nick  (broadcast para canais)
```

---

#### **USER** - Definir Username e Realname

**Sintaxe:**
```
USER <username> <modo> <unused> :<realname>
```

**Parâmetros:**
- `<username>`: Nome de utilizador (não precisa ser único)
- `<modo>`: Modo do utilizador (geralmente `0`, ignorado em servidores simples)
- `<unused>`: Campo não usado (usar `*`)
- `:<realname>`: Nome real do utilizador (pode ter espaços)

**Descrição:**
Define o username e nome real do cliente. Enviado após `PASS` e `NICK` para completar o registo.

**Exemplos:**
```
USER joao 0 * :João Miguel Silva
USER alice 0 * :Alice Wonderland
USER bob 8 * :Bob O'Brien
```

**Respostas do Servidor:**
```
:ss_ircserv 461 nick USER :Not enough parameters  (parâmetros insuficientes)
:ss_ircserv 462 nick :You may not reregister      (já enviou USER)
```

**Após PASS + NICK + USER bem-sucedidos:**
```
:ss_ircserv 001 joao :Welcome to the IRC network joao!joao@127.0.0.1
:ss_ircserv 002 joao :Your host is ss_ircserv, running version 1.0
:ss_ircserv 003 joao :This server was created today
:ss_ircserv 004 joao ss_ircserv 1.0 itkol itkol
```

---

### 💬 COMANDOS DE MENSAGENS

#### **PRIVMSG** - Enviar Mensagem

**Sintaxe:**
```
PRIVMSG <target> :<mensagem>
```

**Parâmetros:**
- `<target>`: Nickname do utilizador OU nome do canal (`#canal`)
- `:<mensagem>`: Mensagem a enviar (pode ter espaços)

**Descrição:**
Envia uma mensagem privada para um utilizador ou mensagem pública para um canal.

**Exemplos:**
```
PRIVMSG alice :Olá Alice!
PRIVMSG #geral :Olá a todos!
PRIVMSG bob :Como estás?
PRIVMSG #ajuda :Preciso de ajuda com o IRC
```

**Múltiplos alvos (separados por vírgula):**
```
PRIVMSG alice,bob :Mensagem para ambos
PRIVMSG #geral,#ajuda :Broadcast para 2 canais
```

**Respostas do Servidor:**
```
:ss_ircserv 401 nick alice :No such nick/channel      (nick não existe)
:ss_ircserv 403 nick #xyz :No such channel            (canal não existe)
:ss_ircserv 404 nick #geral :Cannot send to channel   (não és membro)
:ss_ircserv 461 nick PRIVMSG :Not enough parameters   (parâmetros insuficientes)
```

**Formato da mensagem recebida:**
```
:joao!joao@host PRIVMSG alice :Olá!
:joao!joao@host PRIVMSG #geral :Olá a todos!
```

---

#### **NOTICE** - Enviar Notificação (opcional)

**Sintaxe:**
```
NOTICE <target> :<mensagem>
```

Igual ao PRIVMSG, mas não gera respostas automáticas (usado por bots).

---

### 🚪 COMANDOS DE CANAIS

#### **JOIN** - Entrar em Canal

**Sintaxe:**
```
JOIN <canal>[,<canal2>,...] [<key>[,<key2>,...]]
```

**Parâmetros:**
- `<canal>`: Nome do canal (começa com `#` ou `&`)
- `<key>` (opcional): Password do canal (se tiver modo `+k`)

**Descrição:**
Entra num ou mais canais. Se o canal não existir, é criado automaticamente. O primeiro a entrar torna-se operador.

**Exemplos:**
```
JOIN #geral
JOIN #ajuda,#programacao
JOIN #privado senha123
JOIN #vip,#premium senha1,senha2
```

**Respostas do Servidor:**
```
:nick!user@host JOIN :#geral                        (sucesso - broadcast)
:ss_ircserv 331 nick #geral :No topic is set           (sem tópico)
:ss_ircserv 353 nick = #geral :@alice bob charlie      (lista de membros)
:ss_ircserv 366 nick #geral :End of NAMES list         (fim da lista)

:ss_ircserv 471 nick #vip :Cannot join channel (+l)    (canal cheio)
:ss_ircserv 473 nick #privado :Cannot join channel (+i) (só por convite)
:ss_ircserv 475 nick #secreto :Cannot join channel (+k) (senha errada)
:ss_ircserv 461 nick JOIN :Not enough parameters       (sem parâmetro)
```

**Formato da notificação (todos os membros recebem):**
```
:joao!joao@host JOIN :#geral
```

**Símbolos na lista NAMES:**
- `@nick`: Operador do canal
- `nick`: Membro normal

---

#### **PART** - Sair de Canal

**Sintaxe:**
```
PART <canal>[,<canal2>,...] [:<razão>]
```

**Parâmetros:**
- `<canal>`: Nome do canal
- `:<razão>` (opcional): Mensagem de despedida

**Descrição:**
Sai de um ou mais canais.

**Exemplos:**
```
PART #geral
PART #ajuda :Até logo!
PART #vip,#premium :Saindo de ambos
```

**Respostas do Servidor:**
```
:nick!user@host PART #geral :Até logo!        (sucesso - broadcast)
:ss_ircserv 403 nick #xyz :No such channel       (canal não existe)
:ss_ircserv 442 nick #geral :You're not on that channel
:ss_ircserv 461 nick PART :Not enough parameters
```

---

#### **TOPIC** - Ver/Mudar Tópico do Canal

**Sintaxe:**
```
TOPIC <canal> [:<novo_topico>]
```

**Parâmetros:**
- `<canal>`: Nome do canal
- `:<novo_topico>` (opcional): Novo tópico (se omitido, apenas consulta)

**Descrição:**
Consulta ou muda o tópico de um canal. Se o canal tiver modo `+t` (topic restricted), apenas operadores podem mudar o tópico.

**Exemplos:**
```
TOPIC #geral                          (ver tópico)
TOPIC #geral :Bem-vindos ao canal!   (mudar tópico)
TOPIC #ajuda :                        (remover tópico)
```

**Respostas do Servidor:**
```
:ss_ircserv 332 nick #geral :Bem-vindos!           (tópico actual)
:ss_ircserv 331 nick #geral :No topic is set       (sem tópico)
:nick!user@host TOPIC #geral :Novo tópico       (mudança - broadcast)

:ss_ircserv 442 nick #geral :You're not on that channel
:ss_ircserv 482 nick #geral :You're not channel operator (+t activo)
:ss_ircserv 461 nick TOPIC :Not enough parameters
```

---

#### **NAMES** - Listar Membros do Canal (opcional)

**Sintaxe:**
```
NAMES [<canal>]
```

Retorna a lista de membros de um canal. Geralmente enviado automaticamente no JOIN.

---

### 👮 COMANDOS DE OPERADOR

#### **KICK** - Expulsar Utilizador

**Sintaxe:**
```
KICK <canal> <nick> [:<razão>]
```

**Parâmetros:**
- `<canal>`: Nome do canal
- `<nick>`: Nickname do utilizador a expulsar
- `:<razão>` (opcional): Motivo da expulsão

**Descrição:**
Remove um utilizador de um canal. Apenas operadores podem executar.

**Exemplos:**
```
KICK #geral bob
KICK #geral charlie :Comportamento inadequado
KICK #vip alice :Violação das regras
```

**Respostas do Servidor:**
```
:op!op@host KICK #geral bob :Razão        (sucesso - broadcast)
:ss_ircserv 403 nick #xyz :No such channel
:ss_ircserv 441 nick bob #geral :They aren't on that channel
:ss_ircserv 482 nick #geral :You're not channel operator
:ss_ircserv 461 nick KICK :Not enough parameters
```

---

#### **INVITE** - Convidar Utilizador

**Sintaxe:**
```
INVITE <nick> <canal>
```

**Parâmetros:**
- `<nick>`: Nickname do utilizador a convidar
- `<canal>`: Nome do canal

**Descrição:**
Convida um utilizador para um canal. Obrigatório se o canal tiver modo `+i` (invite-only).

**Exemplos:**
```
INVITE alice #privado
INVITE bob #vip
```

**Respostas do Servidor:**
```
:ss_ircserv 341 op alice #privado                    (confirmação ao operador)
:op!op@host INVITE alice :#privado                (notificação ao convidado)

:ss_ircserv 401 op alice :No such nick
:ss_ircserv 403 op #xyz :No such channel
:ss_ircserv 442 op #privado :You're not on that channel
:ss_ircserv 443 op alice #privado :is already on channel
:ss_ircserv 482 op #privado :You're not channel operator
:ss_ircserv 461 op INVITE :Not enough parameters
```

---

#### **MODE** - Mudar Modos do Canal ou Utilizador

**Sintaxe:**
```
MODE <alvo> [<modos>] [<parametros>]
```

**Parâmetros:**
- `<alvo>`: Nome do canal (`#canal`) ou nickname do utilizador
- `<modos>`: String de modos (ex: `+it`, `-k`, `+o alice`)
- `<parametros>`: Parâmetros necessários para certos modos

**Descrição:**
Modifica os modos de um canal ou utilizador. Apenas operadores podem mudar modos de canal.

---

##### **MODOS DE CANAL**

| Modo | Nome | Descrição | Parâmetro |
|------|------|-----------|-----------|
| `+i` | invite-only | Só por convite | - |
| `-i` | | Remove invite-only | - |
| `+t` | topic-restricted | Só ops mudam tópico | - |
| `-t` | | Qualquer um muda tópico | - |
| `+k` | key | Password do canal | `<password>` |
| `-k` | | Remove password | - |
| `+l` | limit | Limite de membros | `<número>` |
| `-l` | | Remove limite | - |
| `+o` | operator | Dá privilégios de operador | `<nickname>` |
| `-o` | | Remove operador | `<nickname>` |

**Exemplos:**
```
MODE #geral                      (ver modos actuais)
MODE #geral +i                   (activar invite-only)
MODE #geral +t                   (só ops mudam tópico)
MODE #geral +k senha123          (definir password)
MODE #geral +l 50                (limitar a 50 membros)
MODE #geral +o alice             (dar op a alice)
MODE #geral -o bob               (remover op de bob)
MODE #geral +it                  (activar invite-only + topic-restricted)
MODE #geral -ik senha123         (remover invite-only + password)
MODE #geral +o alice +o bob      (dar op a alice e bob)
```

**Respostas do Servidor:**
```
:ss_ircserv 324 nick #geral +itk senha 50            (modos actuais)
:op!op@host MODE #geral +o alice                  (mudança - broadcast)

:ss_ircserv 403 nick #xyz :No such channel
:ss_ircserv 482 nick #geral :You're not channel operator
:ss_ircserv 401 nick alice :No such nick             (target não existe)
:ss_ircserv 441 nick alice #geral :They aren't on that channel
:ss_ircserv 484 nick #geral :You cannot change your own operator status
:ss_ircserv 461 nick MODE :Not enough parameters
```

**Regras Importantes:**
- ✅ Operador pode dar `+o` a outros membros
- ❌ Operador **NÃO** pode dar/remover `+o` de si próprio
- ✅ Múltiplos modos podem ser combinados: `+it`, `-ik`
- ⚠️ `+k` (password) e `+l` (limit) requerem parâmetro

---

##### **MODOS DE UTILIZADOR** (opcional)

```
MODE <nick> [+|-]<modo>
```

Exemplos:
```
MODE joao +i    (invisible - não aparece em WHO)
MODE joao -i    (visível)
```

---

### 🛠️ COMANDOS UTILITÁRIOS

#### **PING** - Verificar Conexão

**Sintaxe:**
```
PING :<servidor_ou_token>
```

**Parâmetros:**
- `:<servidor_ou_token>`: Identificador (geralmente o nome do servidor)

**Descrição:**
Verifica se o servidor está vivo. O servidor responde com `PONG`.

**Exemplos:**
```
PING :ss_ircserv
PING :localhost
```

**Resposta do Servidor:**
```
:ss_ircserv PONG ss_ircserv :ss_ircserv
:ss_ircserv 409 nick :No origin specified  (sem parâmetro)
```

---

#### **PONG** - Resposta ao PING

**Sintaxe:**
```
PONG :<servidor_ou_token>
```

**Descrição:**
Resposta do cliente ao PING do servidor. Usado para detectar timeouts.

**Exemplo:**
```
PONG :ss_ircserv
```

---

#### **QUIT** - Desconectar

**Sintaxe:**
```
QUIT [:<mensagem>]
```

**Parâmetros:**
- `:<mensagem>` (opcional): Mensagem de despedida

**Descrição:**
Desconecta do servidor. Notifica todos os canais em que o utilizador está.

**Exemplos:**
```
QUIT
QUIT :Até amanhã!
QUIT :Tenho de ir
```

**Resposta do Servidor:**
```
:nick!user@host QUIT :Até amanhã!  (broadcast para todos os canais)
ERROR :Closing Link: 127.0.0.1 (Client Quit)
```

---

#### **CAP** - Negociar Capacidades (opcional)

**Sintaxe:**
```
CAP LS
CAP REQ :<capacidades>
CAP END
```

**Descrição:**
Negociação de capacidades do cliente (IRCv3). Servidores simples podem apenas responder com lista vazia.

**Exemplos:**
```
CAP LS
:ss_ircserv CAP * LS :
CAP END
```

---

### 📊 COMANDOS DE CONSULTA (opcionais)

#### **WHO** - Listar Utilizadores

```
WHO <canal_ou_mask>
```

#### **WHOIS** - Informação de Utilizador

```
WHOIS <nickname>
```

#### **LIST** - Listar Canais

```
LIST
```

---

## 4. Passo 1 – Criar o Socket TCP

O primeiro passo é criar um socket que escuta numa porta. O servidor precisa de:

1. **Criar** o socket (`socket()`)
2. **Configurar** opções (`setsockopt()`)
3. **Associar** a uma porta (`bind()`)
4. **Escutar** conexões (`listen()`)
5. **Tornar não-bloqueante** (`fcntl()`)

### Código: setupServer()

```cpp
#include <arpa/inet.h>   // sockaddr_in, htons, inet_ntop
#include <fcntl.h>       // fcntl, O_NONBLOCK
#include <sys/epoll.h>   // epoll_create1, epoll_ctl, epoll_wait
#include <unistd.h>      // close
#include <cstring>       // memset
#include <sys/socket.h>  // socket, bind, listen, accept

void Server::setupServer(void)
{
    struct epoll_event  ev;
    struct sockaddr_in  addr;
    int                 opt(1);

    // 1. Criar socket TCP/IPv4
    _serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (_serverSocket < 0)
        throw std::runtime_error("Failed to create socket");

    // 2. Permitir reutilizar a porta rapidamente após reiniciar
    if (setsockopt(_serverSocket, SOL_SOCKET, SO_REUSEADDR,
                   &opt, sizeof(opt)) < 0)
        throw std::runtime_error("Failed to set socket options");

    // 3. Associar o socket à porta
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;         // IPv4
    addr.sin_addr.s_addr = INADDR_ANY; // Escutar em todas as interfaces
    addr.sin_port = htons(_port);      // Converter porta para network byte order

    if (bind(_serverSocket, (struct sockaddr*)&addr, sizeof(addr)) < 0)
    {
        close(_serverSocket);
        throw std::runtime_error("Failed to bind socket to port");
    }

    // 4. Começar a escutar (SOMAXCONN = máximo de conexões pendentes na fila)
    if (listen(_serverSocket, SOMAXCONN) < 0)
    {
        close(_serverSocket);
        throw std::runtime_error("Failed to listen on socket");
    }

    // 5. Modo não-bloqueante: accept/recv/send não ficam à espera
    if (fcntl(_serverSocket, F_SETFL, O_NONBLOCK) < 0)
    {
        close(_serverSocket);
        throw std::runtime_error("Failed to set non-blocking mode");
    }

    // 6. Criar instância epoll
    _epollFd = epoll_create1(0);
    if (_epollFd < 0)
    {
        close(_serverSocket);
        throw std::runtime_error("Failed to create epoll fd");
    }

    // 7. Adicionar o socket do servidor ao epoll para monitorizar leituras
    ev.events = EPOLLIN;
    ev.data.fd = _serverSocket;
    if (epoll_ctl(_epollFd, EPOLL_CTL_ADD, _serverSocket, &ev) < 0)
    {
        close(_serverSocket);
        close(_epollFd);
        throw std::runtime_error("Failed to add server socket to epoll");
    }

    std::cout << "Server listening on port " << _port << std::endl;
}
```

### Explicação Detalhada

**1. `socket(AF_INET, SOCK_STREAM, 0)`**
- `AF_INET`: IPv4
- `SOCK_STREAM`: TCP (orientado a conexão)
- `0`: Protocolo automático (TCP)
- Retorna: File descriptor do socket (ex: `3`)

**2. `setsockopt(SOL_SOCKET, SO_REUSEADDR)`**
- Permite reutilizar porta imediatamente após fechar
- Sem isto: erro "Address already in use" ao reiniciar servidor

**3. `bind()` - Associar socket à porta**
- `INADDR_ANY`: Escutar em todas as interfaces de rede
- `htons(_port)`: Converter porta para network byte order (big-endian)

**4. `listen(SOMAXCONN)`**
- `SOMAXCONN`: Tamanho máximo da fila de conexões pendentes (normalmente 128)

**5. `fcntl(F_SETFL, O_NONBLOCK)`**
- Modo não-bloqueante: funções como `accept()`, `recv()`, `send()` retornam imediatamente
- Sem isto: servidor fica bloqueado à espera de dados

**6. `epoll_create1(0)`**
- Cria uma instância epoll (mais eficiente que `poll()` para muitos fds)
- Retorna um file descriptor para o epoll

**7. `epoll_ctl(EPOLL_CTL_ADD, ...)`**
- Adiciona o socket do servidor à lista de monitorização do epoll
- `EPOLLIN`: Notifica quando há dados para ler (nova conexão ou dados de cliente)

### Porquê epoll em vez de poll?

- **Escalabilidade:** `epoll` tem desempenho O(1) mesmo com milhares de conexões, enquanto `poll()` é O(n).
- **Eficiência:** `epoll` notifica apenas os descritores com eventos, evitando varrer toda a lista.
- **Moderno:** Apesar de estarmos em C++98, o Linux disponibiliza epoll desde o kernel 2.6.

---

## 5. Passo 2 – Aceitar Clientes com epoll

### O Loop Principal: run()

O coração do servidor é um loop infinito que usa `epoll_wait()` para aguardar eventos em todos os file descriptors monitorizados:

```cpp
void Server::run(void)
{
    int                 max_events(64);
    struct epoll_event  events[max_events];
    int                 nfd;
    int                 fd;
    int                 i;

    while (_running and g_running)
    {
        nfd = epoll_wait(_epollFd, events, max_events, 10000);
        if (nfd >= 0)
        {
            i = -1;
            while (++i < nfd)
            {
                fd = events[i].data.fd;
                if (fd == _serverSocket and (events[i].events & EPOLLIN))
                    acceptNewClient();
                else
                {
                    if (events[i].events & EPOLLIN)
                        handleClientData(fd);
                    if (events[i].events & EPOLLOUT)
                        handleClientWrite(fd);
                    if (events[i].events & (EPOLLHUP | EPOLLERR))
                        removeClient(fd);
                }
            }
            checkTimeouts();
        }
    }
}
```

### Eventos do epoll

| Evento      | Significado                                      |
|-------------|--------------------------------------------------|
| `EPOLLIN`   | Há dados para ler (ou nova conexão no servidor) |
| `EPOLLOUT`  | Socket pronto para escrita (buffer disponível)   |
| `EPOLLHUP`  | Conexão fechada pelo outro lado                  |
| `EPOLLERR`  | Erro no socket                                   |

### Aceitar Novo Cliente

```cpp
void Server::acceptNewClient(void)
{
    struct sockaddr_in  clientAddr;
    socklen_t           clientLen(sizeof(clientAddr));
    int                 clientFd;
    char                host[NI_MAXHOST];
    struct epoll_event  ev;

    // Aceitar conexão
    clientFd = accept(_serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
    if (clientFd < 0)
    {
        if (errno == EAGAIN or errno == EWOULDBLOCK)
            return;  // Sem conexão disponível (normal em não-bloqueante)
        std::cerr << "Failed to accept client" << std::endl;
        return;
    }

    // Obter hostname do cliente (ou IP se falhar)
    if (not getnameinfo((struct sockaddr*)&clientAddr, clientLen, host,
                        sizeof(host), NULL, 0, 0))
        // host preenchido
    else
        inet_ntop(AF_INET, &clientAddr.sin_addr, host, INET_ADDRSTRLEN);

    // Tornar socket do cliente não-bloqueante
    fcntl(clientFd, F_SETFL, O_NONBLOCK);

    // Adicionar ao epoll (monitorizar leituras)
    ev.events = EPOLLIN;
    ev.data.fd = clientFd;
    if (epoll_ctl(_epollFd, EPOLL_CTL_ADD, clientFd, &ev) < 0)
    {
        close(clientFd);
        std::cerr << "Failed to add client fd to epoll" << std::endl;
        return;
    }

    // Criar objecto Client
    Client *client = new Client(clientFd);
    client->setHostname(host);
    client->setServername(SERVER_NAME);
    _clients[clientFd] = client;

    std::cout << "Client connected: " << clientFd << " from " << host << std::endl;
}
```

---

## 6. Passo 3 – Receber e Enviar Dados

### Receber Dados: handleClientData()

```cpp
void Server::handleClientData(int fd)
{
    char    buffer[512];
    ssize_t bytesRead;

    bytesRead = recv(fd, buffer, sizeof(buffer) - 1, 0);
    if (bytesRead <= 0)
    {
        if (_clients.find(fd) != _clients.end())
            removeClient(fd);
        return;
    }

    std::map<int, Client *>::iterator clientIt = _clients.find(fd);
    if (clientIt == _clients.end())
        return;

    buffer[bytesRead] = '\0';
    Client *client = clientIt->second;

    if (client->isAuthenticated())
        client->updateLastActivity();

    client->appendToBuffer(buffer);

    // Protecção contra buffer overflow
    if (client->getBuffer().size() > 8192)
    {
        sendTo(fd, "ERROR :Input buffer overflow\r\n");
        removeClient(fd);
        return;
    }

    // Processar comandos completos (terminados por \r\n ou \n)
    processBuffer(client, fd);
}
```

### Processar Buffer: processBuffer() (função estática interna)

```cpp
static bool ss_find_delimiter(const t_text &buf, size_t &pos, size_t &delimSize)
{
    pos = buf.find("\r\n");
    if (pos == t_text::npos)
    {
        pos = buf.find("\n");
        delimSize = 1;
    }
    return (pos xor t_text::npos);
}

static void ss_process_buffer(Server *server, Client *client, int clientFd)
{
    t_text  buf;
    size_t  pos;
    size_t  delimSize(2);

    while (true)
    {
        if (server->getClients().find(clientFd) == server->getClients().end())
            break;
        client = server->getClients()[clientFd];
        buf = client->getBuffer();
        if (not ss_find_delimiter(buf, pos, delimSize))
            break;
        client->getBuffer().erase(0, pos + delimSize);
        server->processCommand(client, buf.substr(0, pos));
    }
}
```

### Enviar Dados: handleClientWrite() e enablePollOut()

```cpp
void Server::handleClientWrite(int fd)
{
    std::map<int, Client *>::iterator it = _clients.find(fd);
    if (it == _clients.end())
        return;

    Client *client = it->second;
    t_text buf = client->getOutBuffer();
    if (buf.empty())
        return;

    ssize_t sent = send(fd, buf.c_str(), buf.size(), 0);
    if (sent > 0)
    {
        // Verificar se cliente ainda existe (pode ter sido removido entretanto)
        it = _clients.find(fd);
        if (it == _clients.end())
            return;
        it->second->eraseFromOutBuffer(sent);
        if (it->second->getOutBuffer().empty())
            disableEpollOut(fd);
    }
}

void Server::enablePollOut(int fd)
{
    struct epoll_event ev;
    ev.events = EPOLLIN | EPOLLOUT;
    ev.data.fd = fd;
    epoll_ctl(_epollFd, EPOLL_CTL_MOD, fd, &ev);
}
```

A função `sendTo()` acrescenta a mensagem ao buffer de saída e activa `EPOLLOUT`:

```cpp
void Server::sendTo(int fd, const t_text &msg)
{
    std::map<int, Client *>::iterator it = _clients.find(fd);
    if (it != _clients.end())
    {
        it->second->appendToOutBuffer(msg);
        enablePollOut(fd);
    }
}
```

---

## 7. Passo 4 – Parsing do Protocolo IRC

### processCommand()

```cpp
void Server::processCommand(Client *client, const t_text &line)
{
    t_vector    params;
    t_text      cmd;
    t_text      paramStr;
    t_text      cleanLine = ss_trim(line);
    size_t      spacePos;

    if (cleanLine.empty())
        return;

    spacePos = cleanLine.find(' ');
    if (spacePos == t_text::npos)
        cmd = cleanLine;
    else
    {
        cmd = cleanLine.substr(0, spacePos);
        paramStr = cleanLine.substr(spacePos + 1);
    }

    std::transform(cmd.begin(), cmd.end(), cmd.begin(), ::toupper);
    ss_parse_params(paramStr, params);

    if (not ss_check_auth(client, cmd))
        return ss_print(client, 451, ":You have not registered");

    ss_dispatch_all_commands(this, client, cmd, params);
}
```

### ss_parse_params()

```cpp
static void ss_parse_params(const t_text &paramStr, t_vector &params)
{
    t_text  beforeColon;
    t_text  trailing;
    t_text  token;
    t_ss    iss;
    size_t  colonPos = paramStr.find(" :");

    if (colonPos xor t_text::npos)
    {
        beforeColon = paramStr.substr(0, colonPos);
        trailing = paramStr.substr(colonPos + 2);
        iss << beforeColon;
        while (iss >> token)
            params.push_back(token);
        if (not trailing.empty())
            params.push_back(trailing);
    }
    else
    {
        iss << paramStr;
        while (iss >> token)
            params.push_back(token);
    }
}
```

**Exemplos de parsing:**
```
"#geral :Olá a todos!"
→ params[0] = "#geral"
→ params[1] = "Olá a todos!"

"#canal +o alice"
→ params[0] = "#canal"
→ params[1] = "+o"
→ params[2] = "alice"

":Mensagem com espaços"
→ params[0] = "Mensagem com espaços"
```

### Função de despacho ss_dispatch_all_commands()

```cpp
static void ss_dispatch_all_commands(Server *server, Client *client,
    const t_text &cmd, const t_vector &params)
{
    if (cmd == "CAP")
        server->handleCap(client, params);
    else if (cmd == "PASS")
        server->handlePass(client, params);
    else if (cmd == "NICK")
        server->handleNick(client, params);
    else if (cmd == "USER")
        server->handleUser(client, params);
    else if (cmd == "JOIN")
        server->handleJoin(client, params);
    else if (cmd == "PART")
        server->handlePart(client, params);
    else if (cmd == "PRIVMSG")
        server->handlePrivmsg(client, params);
    else if (cmd == "QUIT")
        server->handleQuit(client, params);
    else if (cmd == "KICK")
        server->handleKick(client, params);
    else if (cmd == "INVITE")
        server->handleInvite(client, params);
    else if (cmd == "TOPIC")
        server->handleTopic(client, params);
    else if (cmd == "MODE")
    {
        if (params.empty())
            server->handleMode(client, params);
        else if ((params[0][0] xor '#') and (params[0][0] xor '&'))
            server->handleModeUser(client, params);
        else
            server->handleMode(client, params);
    }
    else if (cmd == "PING")
        server->handlePing(client, params);
    else if (cmd == "PONG")
        server->handlePong(client, params);
    else
        server->ss_print(client, 421, cmd + " :Unknown command");
}
```

---

## 8. Passo 5 – Autenticação

### Fluxo de Autenticação

```
Cliente conecta
     ↓
1. PASS senha
     ↓ (validar senha)
2. NICK joao
     ↓ (validar nickname único)
3. USER joao 0 * :João Silva
     ↓ (registar utilizador)
✅ Autenticado!
     ↓
Enviar mensagens de boas-vindas (001-004)
```

### handlePass()

```cpp
void Server::handlePass(Client *client, const t_vector &params)
{
    if (params.empty())
        ss_print(client, 461, "PASS :Not enough parameters");
    else if (client->hasPassword())
        ss_print(client, 462, ":You may not reregister");
    else if (params[0] == _password)
        client->setHasPassword(true);
    else
        ss_print(client, 464, ":Password incorrect");
}
```

**⚠️ IMPORTANTE:** Quando a senha está errada, o servidor **DEVE** fechar a conexão (RFC 1459). Isso é feito posteriormente no loop de timeout ou quando o cliente não completa o registo.

### handleNick()

```cpp
static bool ss_is_special(char c)
{
    return (c == '-' or c == '[' or c == ']' or c == '\\'
        or c == '`' or c == '^' or c == '{' or c == '}' or c == '|');
}

static bool ss_valid_nick(const t_text &nick)
{
    if (nick.empty() or nick.size() > 9)
        return false;
    if (not std::isalpha(nick[0]))
        return false;
    for (size_t i = 1; i < nick.size(); ++i)
        if (not std::isalpha(nick[i]) and not std::isdigit(nick[i])
            and not ss_is_special(nick[i]))
            return false;
    return true;
}

void Server::handleNick(Client *client, const t_vector &params)
{
    if (params.empty())
        return ss_print(client, 431, ":No nickname given");

    if (params[0] == client->getNickname())
        return;

    if (getClient(params[0]))
        return ss_print(client, 433, params[0] + " :Nickname is already in use");

    if (not ss_valid_nick(params[0]))
        return ss_print(client, 432, params[0] + " :Erroneous nickname");

    if (client->isAuthenticated())
    {
        // Mudança de nick após autenticação
        t_text oldPrefix = client->getPrefix();
        client->setNickname(params[0]);
        t_text nickMsg = ":" + oldPrefix + " NICK :" + params[0] + "\r\n";
        sendTo(client->getFd(), nickMsg);
        // Broadcast para canais onde o cliente está
        std::map<t_text, Channel *>::iterator it = _channels.begin();
        while (it != _channels.end())
        {
            if (it->second->isMember(client))
                it->second->broadcast(nickMsg, client);
            ++it;
        }
    }
    else
    {
        client->setNickname(params[0]);
        client->setHasNick(true);
        if (client->hasPassword() and client->hasNick() and client->hasUser())
        {
            client->setAuthenticated(true);
            sendWelcome(client);
        }
    }
}
```

### handleUser()

```cpp
void Server::handleUser(Client *client, const t_vector &params)
{
    if (params.size() < 4)
        return ss_print(client, 461, "USER :Not enough parameters");
    if (client->hasUser())
        return ss_print(client, 462, ":You may not reregister");

    client->setUsername(params[0]);
    client->setRealname(params[3]);
    client->setHasUser(true);

    if (client->hasPassword() and client->hasNick() and client->hasUser())
    {
        client->setAuthenticated(true);
        sendWelcome(client);
    }
}
```

### sendWelcome()

```cpp
void Server::sendWelcome(Client *client)
{
    t_ss ss[4];
    ss[0] << ":Welcome to the Internet Relay Network " + client->getPrefix();
    ss[1] << ":Your host is " << SERVER_NAME << ", running version 1.0";
    ss[2] << ":This server was created 2026/02/18";
    ss[3] << SERVER_NAME << " 1.0 o itkol";
    ss_print(client, 001, ss[0].str());
    ss_print(client, 002, ss[1].str());
    ss_print(client, 003, ss[2].str());
    ss_print(client, 004, ss[3].str());
}
```

---

## 9. Passo 6 – Canais

### handleJoin()

O ficheiro `handleJoin.cpp` contém várias funções auxiliares estáticas. Eis a versão simplificada da lógica principal:

```cpp
void Server::handleJoin(Client *client, const t_vector &params)
{
    t_vector                channels;
    t_vector                keys;
    t_vector::size_type     i = -1;
    t_text                  channel_key;

    if (params.empty())
        return ss_print(client, 461, "JOIN :Not enough parameters");

    ss_parse_list(params[0], channels);
    if (params.size() > 1)
        ss_parse_keys(params, keys); // extrai as keys separadas por vírgula

    while (++i < channels.size())
    {
        channel_key.clear();
        if (i < keys.size())
            channel_key = keys[i];
        ss_process_join(this, client, channels[i], channel_key);
    }
}

static void ss_process_join(Server *server, Client *client,
    const t_text &channel_name, const t_text &channel_key)
{
    Channel *channel;

    if ((channel_name[0] xor '#') and (channel_name[0] xor '&'))
        return server->ss_print(client, 403, channel_name + " :No such channel");

    channel = server->getChannel(channel_name);
    if (not channel)
    {
        channel = server->createChannel(channel_name, channel_key);
        channel->addMember(client);
        channel->addOperator(client);  // primeiro membro vira operador
    }
    else
    {
        if (channel->isMember(client))
            return;
        if (not ss_check_channel_restrictions(server, client, channel,
                                               channel_name, channel_key))
            return;
        channel->addMember(client);
    }
    ss_send_join_info(server, client, channel, channel_name);
}
```

### handlePart()

```cpp
void Server::handlePart(Client *client, const t_vector &params)
{
    t_vector channels;
    t_text   reason = "Leaving";
    t_text   part_msg = ":" + client->getPrefix() + " PART ";

    if (params.empty())
        return ss_print(client, 461, "PART :Not enough parameters");

    if (params.size() > 1)
        reason = ss_join_params(params, 1);

    ss_parse_list(params[0], channels);

    for (t_vector::const_iterator it = channels.begin(); it != channels.end(); ++it)
    {
        Channel *channel = getChannel(*it);
        if (not channel)
            ss_print(client, 403, *it + " :No such channel");
        else if (not channel->isMember(client))
            ss_print(client, 442, *it + " :You're not on that channel");
        else
        {
            channel->broadcast(part_msg + *it + " :" + reason + "\r\n");
            channel->removeMember(client);
            if (channel->getMembersNicknames().empty())
                removeChannel(*it);
        }
    }
}
```

### handlePrivmsg()

```cpp
void Server::handlePrivmsg(Client *client, const t_vector &params)
{
    t_vector targets;
    t_text   fullMsg;
    t_text   msg = ":" + client->getPrefix() + " PRIVMSG ";

    if (params.size() < 2)
        return ss_print(client, 461, "PRIVMSG :Not enough parameters");

    fullMsg = ss_join_params(params, 1);
    ss_parse_list(params[0], targets);

    for (t_vector::const_iterator it = targets.begin(); it != targets.end(); ++it)
    {
        t_text target = *it;
        if (target[0] == '#' or target[0] == '&')
        {
            Channel *channel = getChannel(target);
            if (not channel)
                ss_print(client, 403, target + " :No such channel");
            else if (not channel->isMember(client))
                ss_print(client, 404, target + " :Cannot send to channel");
            else
                channel->broadcast(msg + target + " :" + fullMsg + "\r\n", client);
        }
        else
        {
            Client *targetClient = getClient(target);
            if (not targetClient)
                ss_print(client, 401, target + " :No such nick");
            else
                sendTo(targetClient->getFd(), msg + target + " :" + fullMsg + "\r\n");
        }
    }
}
```

---

## 10. Passo 7 – Comandos de Operador

### handleKick()

```cpp
void Server::handleKick(Client *client, const t_vector &params)
{
    if (params.size() < 2)
        return ss_print(client, 461, "KICK :Not enough parameters");

    t_text reason = (params.size() > 2) ? ss_join_params(params, 2) : "No reason";
    Channel *channel = getChannel(params[0]);
    if (not channel)
        return ss_print(client, 403, params[0] + " :No such channel");

    if (not channel->isOperator(client))
        return ss_print(client, 482, params[0] + " :You're not channel operator");

    Client *target = getClient(params[1]);
    if (not target)
        return ss_print(client, 401, params[1] + " :No such nick");

    if (not channel->isMember(target))
        return ss_print(client, 441, params[1] + " " + params[0] + " :They aren't on that channel");

    t_text kickMsg = ":" + client->getPrefix() + " KICK " + params[0] + " " + params[1] + " :" + reason + "\r\n";
    channel->broadcast(kickMsg);
    channel->removeMember(target);
}
```

### handleInvite()

```cpp
void Server::handleInvite(Client *client, const t_vector &params)
{
    if (params.size() < 2)
        return ss_print(client, 461, "INVITE :Not enough parameters");

    Client *target = getClient(params[0]);
    if (not target)
        return ss_print(client, 401, params[0] + " :No such nick");

    Channel *channel = getChannel(params[1]);
    if (not channel)
        return ss_print(client, 403, params[1] + " :No such channel");

    if (not channel->isOperator(client))
        return ss_print(client, 482, params[1] + " :You're not channel operator");

    if (channel->isMember(target))
        return ss_print(client, 443, params[0] + " " + params[1] + " :is already on channel");

    channel->inviteClient(target);
    sendTo(target->getFd(), ":" + client->getPrefix() + " INVITE " + params[0] + " " + params[1] + "\r\n");
    ss_print(client, 341, params[0] + " " + params[1]);
}
```

### handleTopic()

```cpp
void Server::handleTopic(Client *client, const t_vector &params)
{
    if (params.empty())
        return ss_print(client, 461, "TOPIC :Not enough parameters");

    Channel *channel = getChannel(params[0]);
    if (not channel)
        return ss_print(client, 403, params[0] + " :No such channel");

    if (not channel->isMember(client))
        return ss_print(client, 442, params[0] + " :You're not on that channel");

    if (params.size() == 1)
    {
        if (channel->getTopic().empty())
            ss_print(client, 331, params[0] + " :No topic is set");
        else
            ss_print(client, 332, params[0] + " :" + channel->getTopic());
    }
    else
    {
        if (channel->isTopicRestricted() and not channel->isOperator(client))
            return ss_print(client, 482, params[0] + " :You're not channel operator");

        t_text newTopic = ss_join_params(params, 1);
        channel->setTopic(newTopic);
        channel->broadcast(":" + client->getPrefix() + " TOPIC " + params[0] + " :" + newTopic + "\r\n");
    }
}
```

### handleMode()

O tratamento do `MODE` é complexo; aqui mostramos a estrutura principal e as funções auxiliares (definidas em `handleMode.cpp`).

```cpp
void Server::handleMode(Client *client, const t_vector &params)
{
    if (params.empty())
        return ss_print(client, 461, "MODE :Not enough parameters");

    Channel *channel = getChannel(params[0]);
    if (not channel)
        return ss_print(client, 403, params[0] + " :No such channel");

    // Se só um parâmetro, mostrar modos actuais
    if (params.size() == 1)
    {
        t_text modes = "+";
        if (channel->isInviteOnly()) modes += "i";
        if (channel->isTopicRestricted()) modes += "t";
        t_text modeParams;
        if (not channel->getKey().empty())
        {
            modes += "k";
            modeParams = " " + channel->getKey();
        }
        if (channel->getLimit() > 0)
        {
            modes += "l";
            t_ss ss;
            ss << channel->getLimit();
            modeParams += " " + ss.str();
        }
        ss_print(client, 324, params[0] + " " + modes + modeParams);
        return;
    }

    if (not channel->isOperator(client))
        return ss_print(client, 482, params[0] + " :You're not channel operator");

    bool adding = true;
    size_t paramIndex = 2;

    for (size_t i = 0; i < params[1].size(); ++i)
    {
        char c = params[1][i];
        if (c == '+' or c == '-')
        {
            adding = (c == '+');
            continue;
        }

        t_text arg;
        if (paramIndex < params.size())
            arg = params[paramIndex];

        if (c == 'i')
            channel->setInviteOnly(adding);
        else if (c == 't')
            channel->setTopicRestricted(adding);
        else if (c == 'k')
        {
            if (adding and not arg.empty())
            {
                channel->setKey(arg);
                ++paramIndex;
            }
            else if (not adding)
                channel->setKey("");
        }
        else if (c == 'l')
        {
            if (adding and not arg.empty())
            {
                int limit;
                t_ss(arg) >> limit;
                if (limit > 0 and limit <= 10000)
                {
                    channel->setLimit(limit);
                    ++paramIndex;
                }
            }
            else if (not adding)
                channel->setLimit(0);
        }
        else if (c == 'o')
        {
            if (arg.empty()) continue;
            Client *target = getClient(arg);
            ++paramIndex;
            if (not target)
            {
                ss_print(client, 401, arg + " :No such nick");
                continue;
            }
            if (not channel->isMember(target))
            {
                ss_print(client, 441, arg + " " + channel->getName() + " :They aren't on that channel");
                continue;
            }
            if (target == client)
            {
                ss_print(client, 484, channel->getName() + " :You cannot change your own operator status");
                continue;
            }
            if (adding)
                channel->addOperator(target);
            else
                channel->removeOperator(target);
        }
    }

    // Broadcast da alteração
    t_text modeMsg = ":" + client->getPrefix() + " MODE " + params[0] + " " + params[1];
    for (size_t i = 2; i < params.size(); ++i)
        modeMsg += " " + params[i];
    modeMsg += "\r\n";
    channel->broadcast(modeMsg);
}
```

---

## 11. Passo 8 – Comandos Utilitários

### handlePing() e handlePong()

```cpp
void Server::handlePing(Client *client, const t_vector &params)
{
    if (params.empty())
    {
        sendTo(client->getFd(), ":" + t_text(SERVER_NAME) + " 409 " + client->getNickname() + " :No origin specified\r\n");
        return;
    }
    sendTo(client->getFd(), ":" + t_text(SERVER_NAME) + " PONG " + SERVER_NAME + " :" + params[0] + "\r\n");
}

void Server::handlePong(Client *client, const t_vector &params)
{
    (void)params;
    client->setPingPending(false);
    client->updateLastActivity();
}
```

### handleQuit()

```cpp
void Server::handleQuit(Client *client, const t_vector &params)
{
    t_text reason = params.empty() ? "Client disconnected" : params[0];
    removeClient(client->getFd(), reason);
}
```

### handleCap()

```cpp
void Server::handleCap(Client *client, const t_vector &params)
{
    if (not params.empty() and params[0] == "LS")
        sendTo(client->getFd(), ":" + t_text(SERVER_NAME) + " CAP * LS :\r\n");
}
```

### handleModeUser() (modos de utilizador)

```cpp
void Server::handleModeUser(Client *client, const t_vector &params)
{
    if (params.empty())
        return;
    if (params[0] == client->getNickname())
        ss_print(client, 221, "+ ");
    else
        ss_print(client, 502, ":Can't change mode for other users");
}
```

### Função auxiliar ss_print() para enviar respostas numéricas

```cpp
void Server::ss_print(Client *client, int code, const t_text &s)
{
    t_ss ss;
    t_text nick = client->getNickname();
    if (nick.empty())
        nick = "*";

    ss << ':' << SERVER_NAME << ' ';
    if (code < 10)
        ss << "00";
    else if (code < 100)
        ss << "0";
    ss << code << ' ' << nick << ' ' << s << "\r\n";
    sendTo(client->getFd(), ss.str());
}
```

### Verificação de timeouts

```cpp
void Server::checkTimeouts(void)
{
    std::map<int, Client *>::iterator it = _clients.begin();
    std::vector<std::pair<int, t_text> > toRemove;
    time_t now = time(NULL);

    while (it != _clients.end())
    {
        Client *client = it->second;
        if (not client->isAuthenticated() and (now - client->getLastActivity() > 30))
        {
            toRemove.push_back(std::make_pair(it->first, "Registration timeout"));
        }
        else if (client->isAuthenticated() and (now - client->getLastActivity() > 60))
        {
            if (not client->isPingPending())
            {
                sendTo(client->getFd(), "PING :" + t_text(SERVER_NAME) + "\r\n");
                client->setPingPending(true);
                client->setPingSentTime(now);
            }
            else if (now - client->getPingSentTime() > 60)
            {
                toRemove.push_back(std::make_pair(it->first, "Ping timeout"));
            }
        }
        ++it;
    }

    for (size_t i = 0; i < toRemove.size(); ++i)
        removeClient(toRemove[i].first, toRemove[i].second);
}
```

---

## 12. Armadilhas Comuns e Bugs a Evitar

### 🐛 Bug 1: Use-After-Free

**Problema:** Usar ponteiro de cliente após `removeClient()`.

```cpp
// ❌ ERRADO
void handlePass(Client *client)
{
    if (senha_errada)
    {
        ss_print(client, 464, ":Password incorrect");
        removeClient(client->getFd());
        // client pode estar deletado aqui!
    }
}
```

**Solução:**
```cpp
// ✅ CORRECTO
void handlePass(Client *client)
{
    if (senha_errada)
    {
        ss_print(client, 464, ":Password incorrect");
        int fd = client->getFd();
        removeClient(fd);
        return; // sair imediatamente
    }
}
```

### 🐛 Bug 2: Operador Modifica-se a Si Próprio

**Problema:** Operador pode dar `-o` a si próprio.

**Solução:** Já implementada em `handleMode()`:
```cpp
if (target == client)
{
    ss_print(client, 484, channel->getName() + " :You cannot change your own operator status");
    continue;
}
```

### 🐛 Bug 3: Buffer Overflow

**Problema:** Cliente envia dados sem limite.

**Solução:** Verificar tamanho do buffer após cada `appendToBuffer()`.

### 🐛 Bug 4: Não Verificar se Target Existe em Modos

**Problema:** `MODE +o nick_inexistente` não é tratado.

**Solução:** Em `handleMode()`, verificamos com `getClient()` e enviamos `ERR_NOSUCHNICK`.

### 🐛 Bug 5: Esquecer de Remover Cliente de Canais ao Sair

**Solução:** A função `removeClient()` chama `ss_broadcast_quit()` e `ss_remove_from_channels()` antes de apagar o cliente.

---

## 13. Testar o Servidor

### Compilar e Executar

```bash
cd ss_irc
make
./ss_ircserv 6667 senha123
```

### Teste Básico com netcat

```bash
# Terminal 1: Servidor
./ss_ircserv 6667 senha123

# Terminal 2: Cliente
nc -C localhost 6667
PASS senha123
NICK alice
USER alice 0 * :Alice Wonderland
JOIN #geral
PRIVMSG #geral :Olá a todos!
PART #geral :Até logo
QUIT :Adeus
```

### Teste com irssi

```bash
irssi
/connect localhost 6667 senha123
/nick meunome
/join #geral
/msg #geral Olá a todos!
/topic #geral Bem-vindos!
/mode #geral +t
/part #geral
/quit
```

### Teste com HexChat

1. Abrir HexChat
2. **Network List** → Add → Nome: `Local IRC`
3. **Edit** → Servers: `localhost/6667`
4. **Password:** `senha123`
5. Connect
6. `/join #geral`
7. Enviar mensagens
8. `/mode #geral +i` (testar modos)

### Testar com Valgrind

```bash
valgrind --leak-check=full --track-fds=yes ./ss_ircserv 6667 senha123
```

**Resultado esperado:**
```
==12345== HEAP SUMMARY:
==12345==     in use at exit: 0 bytes in 0 blocks
==12345==   total heap usage: ... allocs, ... frees, ... bytes allocated
==12345==
==12345== All heap blocks were freed -- no leaks are possible
```

### Script de Testes Automatizados

O projecto inclui um script Python simples para testar autenticação básica e password errada.

---

## 14. Referência de Códigos IRC

### Códigos de Resposta (RPL_*)

| Código | Nome | Formato | Descrição |
|--------|------|---------|-----------|
| 001 | RPL_WELCOME | `:text` | Mensagem de boas-vindas |
| 002 | RPL_YOURHOST | `:text` | Informação do servidor |
| 003 | RPL_CREATED | `:text` | Data de criação |
| 004 | RPL_MYINFO | `<server> <version> <umodes> <cmodes>` | Info do servidor |
| 221 | RPL_UMODEIS | `<modes>` | Modos do utilizador |
| 324 | RPL_CHANNELMODEIS | `<channel> <modes>` | Modos do canal |
| 331 | RPL_NOTOPIC | `<channel> :text` | Sem tópico |
| 332 | RPL_TOPIC | `<channel> :topic` | Tópico do canal |
| 341 | RPL_INVITING | `<nick> <channel>` | Confirmação de convite |
| 353 | RPL_NAMREPLY | `= <channel> :nicks` | Lista de membros |
| 366 | RPL_ENDOFNAMES | `<channel> :text` | Fim da lista |

### Códigos de Erro (ERR_*)

| Código | Nome | Formato | Descrição |
|--------|------|---------|-----------|
| 401 | ERR_NOSUCHNICK | `<nick> :text` | Nickname não encontrado |
| 403 | ERR_NOSUCHCHANNEL | `<channel> :text` | Canal não encontrado |
| 404 | ERR_CANNOTSENDTOCHAN | `<channel> :text` | Não pode enviar |
| 409 | ERR_NOORIGIN | `:text` | Sem origem no PING |
| 421 | ERR_UNKNOWNCOMMAND | `<command> :text` | Comando desconhecido |
| 431 | ERR_NONICKNAMEGIVEN | `:text` | Nenhum nickname |
| 432 | ERR_ERRONEUSNICKNAME | `<nick> :text` | Nickname inválido |
| 433 | ERR_NICKNAMEINUSE | `<nick> :text` | Já em uso |
| 441 | ERR_USERNOTINCHANNEL | `<nick> <channel> :text` | User não está |
| 442 | ERR_NOTONCHANNEL | `<channel> :text` | Tu não estás |
| 443 | ERR_USERONCHANNEL | `<nick> <channel> :text` | Já está no canal |
| 451 | ERR_NOTREGISTERED | `:text` | Não registado |
| 461 | ERR_NEEDMOREPARAMS | `<command> :text` | Parâmetros insuficientes |
| 462 | ERR_ALREADYREGISTERED | `:text` | Já registado |
| 464 | ERR_PASSWDMISMATCH | `:text` | Password incorrecta |
| 471 | ERR_CHANNELISFULL | `<channel> :text` | Canal cheio (+l) |
| 473 | ERR_INVITEONLYCHAN | `<channel> :text` | Só por convite (+i) |
| 475 | ERR_BADCHANNELKEY | `<channel> :text` | Password errada (+k) |
| 482 | ERR_CHANOPRIVSNEEDED | `<channel> :text` | Precisa ser operador |
| 484 | ERR_RESTRICTED | `<channel> :text` | Não pode modificar-se |
| 502 | ERR_USERSDONTMATCH | `:text` | Não pode mudar outros |

---

## Resumo do Fluxo Completo

```
1. Servidor inicia
   ↓
   - Cria socket TCP
   - bind() na porta
   - listen() por conexões
   - Adiciona socket ao epoll (EPOLLIN)

2. Cliente conecta
   ↓
   - accept() cria novo socket
   - Cria objecto Client
   - Adiciona socket ao epoll (EPOLLIN)

3. Cliente autentica
   ↓
   PASS senha
   NICK nickname
   USER username 0 * :realname
   ↓
   Servidor envia RPL_WELCOME (001-004)

4. Cliente usa canais
   ↓
   JOIN #canal
   ↓
   - Cria/junta ao canal
   - Envia tópico + lista membros
   ↓
   PRIVMSG #canal :mensagem
   ↓
   - Servidor reencaminha para todos os membros

5. Operador gere canal
   ↓
   MODE #canal +it
   MODE #canal +o alice
   TOPIC #canal :Novo tópico
   KICK #canal bob :Violação regras
   INVITE charlie #canal

6. Cliente desconecta
   ↓
   QUIT :Até logo
   ↓
   - Servidor notifica todos os canais
   - Remove cliente do epoll
   - Fecha socket

7. epoll_wait() volta ao passo 2
   ↓
   À espera de mais eventos...
```

---

## 🎯 Conclusão

Parabéns! Construístes um servidor IRC funcional em C++98 que:

✅ Suporta múltiplos clientes simultaneamente com `epoll`  
✅ Implementa autenticação (PASS, NICK, USER)  
✅ Gere canais com modos (+i, +t, +k, +l, +o)  
✅ Permite mensagens privadas e públicas  
✅ Suporta comandos de operador (KICK, INVITE, TOPIC, MODE)  
✅ Detecta timeouts com PING/PONG  
✅ Segue o protocolo RFC 1459  
✅ É compatível com clientes IRC reais (irssi, HexChat)  
✅ Utiliza os operadores `not`, `and`, `or`, `xor` no código, conforme preferência

**Próximos passos:**
- Implementar comandos adicionais (WHO, WHOIS, LIST)
- Adicionar suporte a SSL/TLS (portas 6697)
- Implementar persistência de canais
- Criar sistema de bans (+b mode)
- Adicionar logging detalhado

**Recursos úteis:**
- RFC 1459: https://tools.ietf.org/html/rfc1459
- RFC 2812 (atualização): https://tools.ietf.org/html/rfc2812
- Beej's Guide to Network Programming: https://beej.us/guide/bgnet/
- `man epoll`, `man epoll_ctl`, `man epoll_wait`, `man bind`, `man accept`, `man recv`, `man send`, `man tpc`, `man socket`, `man listen`...

---

**Boa sorte com o vosso servidor IRC!** 🚀
