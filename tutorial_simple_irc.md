# Tutorial: Como Construir um Servidor IRC Simples em C++98

Este tutorial explica, passo a passo, como construir um servidor IRC (Internet Relay Chat)
capaz de se conectar com clientes IRC reais como **irssi**, **HexChat** ou **netcat**.
Todo o código está em **C++98** e segue o protocolo **RFC 1459**.

---

## Índice

1. [Conceitos Fundamentais](#1-conceitos-fundamentais)
2. [Estrutura do Projecto](#2-estrutura-do-projeto)
3. [Passo 1 - Criar o Socket TCP](#3-passo-1---criar-o-socket-tcp)
4. [Passo 2 - Aceitar Clientes com poll()](#4-passo-2---aceitar-clientes-com-poll)
5. [Passo 3 - Receber e Enviar Dados](#5-passo-3---receber-e-enviar-dados)
6. [Passo 4 - Parsing do Protocolo IRC](#6-passo-4---parsing-do-protocolo-irc)
7. [Passo 5 - Autenticação (PASS, NICK, USER)](#7-passo-5---autenticacao-pass-nick-user)
8. [Passo 6 - Canais (JOIN, PART, PRIVMSG)](#8-passo-6---canais-join-part-privmsg)
9. [Passo 7 - Comandos de Operador (KICK, INVITE, TOPIC, MODE)](#9-passo-7---comandos-de-operador-kick-invite-topic-mode)
10. [Passo 8 - Timeouts e PING/PONG](#10-passo-8---timeouts-e-pingpong)
11. [Testar o Servidor](#11-testar-o-servidor)
12. [Referência de Códigos de Erro IRC](#12-referencia-de-codigos-de-erro-irc)

---

## 1. Conceitos Fundamentais

### O que é IRC?

IRC é um protocolo de chat baseado em texto sobre TCP. Funciona assim:

```
Cliente A ---\                    /--- Canal #geral
              >--- Servidor IRC ---
Cliente B ---/                    \--- Canal #ajuda
```

- Os **clientes** conectam-se ao servidor por TCP
- O servidor gere **canais** (salas de chat) e reencaminha mensagens
- Toda a comunicação é texto terminado por `\r\n`

### O que é TCP?

TCP (Transmission Control Protocol) é um protocolo de comunicação da camada de transporte usado na Internet. Ele garante que os dados enviados de um computador para outro cheguem de forma ordenada, sem erros e sem perdas. O TCP estabelece uma conexão entre o cliente e o servidor antes de transmitir os dados, controla o fluxo das mensagens, faz retransmissão em caso de perda e garante a entrega correcta dos pacotes.

Em resumo: TCP é o protocolo que permite comunicação confiável entre dois computadores em rede, como entre um cliente IRC e um servidor IRC.

### Formato das mensagens IRC

Cada mensagem IRC segue este formato:

```
:prefixo COMANDO parametro1 parametro2 :mensagem com espaços\r\n
```

Exemplos:
```
PASS senha123                           -> cliente envia password
NICK joao                               -> cliente define nickname
USER joao 0 * :João Silva               -> cliente define username
JOIN #geral                              -> cliente entra no canal
PRIVMSG #geral :Olá a todos!            -> enviar mensagem
:joao!joao@host PRIVMSG #geral :Olá!    -> servidor reencaminha
```

### Arquitectura: 3 classes principais

```
Server     -> Gere o socket, poll(), clientes e canais
  Client   -> Representa um utilizador conectado (nickname, buffers, estado)
  Channel  -> Representa um canal de chat (membros, operadores, modos)
```

---

## 2. Estrutura do Projecto

```
ss_irc/
  include/
    Server.hpp          <- Definição da classe Server
    Client.hpp          <- Definição da classe Client
    Channel.hpp         <- Definição da classe Channel
  src/
    main.cpp            <- Ponto de entrada
    Server.cpp          <- Lógica principal do servidor
    Client.cpp          <- Implementação do cliente
    Channel.cpp         <- Implementação do canal
    server_commands/
      handlePass.cpp    <- Comando PASS (password)
      handleNick.cpp    <- Comando NICK (nickname)
      handleUser.cpp    <- Comando USER (username)
      handlePrivmsg.cpp <- Comando PRIVMSG (mensagens)
      utility_commands.cpp <- PING, PONG, QUIT, CAP, welcome
    channel_commands/
      handleJoin.cpp    <- Comando JOIN (entrar em canal)
      handlePart.cpp    <- Comando PART (sair de canal)
    operator_commands/
      handleMode.cpp    <- Comando MODE (modos do canal)
      handleKick.cpp    <- Comando KICK (expulsar utilizador)
      handleInvite.cpp  <- Comando INVITE (convidar utilizador)
      handleTopic.cpp   <- Comando TOPIC (tópico do canal)
  Makefile
```

O **Makefile** compila tudo com C++98:

```makefile
NAME     = ircserv
CXX      = c++
CXXFLAGS = -Wall -Wextra -Werror -std=c++98
```

Execução: `./ircserv <porta> <password>`

---

## 3. Passo 1 - Criar o Socket TCP

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
#include <poll.h>        // poll, pollfd
#include <unistd.h>      // close
#include <cstring>       // memset

void Server::setupServer(void)
{
    struct pollfd       pfd;
    struct sockaddr_in  addr;
    int                 opt(1);

    // 1. Criar socket TCP/IPv4
    _serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (_serverSocket < 0)
        throw std::runtime_error("Failed to create socket");

    // 2. Permitir reutilizar a porta rapidamente após reiniciar
    setsockopt(_serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    // 3. Associar o socket à porta
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;         // IPv4
    addr.sin_addr.s_addr = INADDR_ANY; // Escutar em todas as interfaces
    addr.sin_port = htons(_port);      // Converter porta para network byte order
    if (bind(_serverSocket, (struct sockaddr*)&addr, sizeof(addr)) < 0)
        throw std::runtime_error("Failed to bind socket");

    // 4. Começar a escutar (SOMAXCONN = máximo de conexões pendentes)
    if (listen(_serverSocket, SOMAXCONN) < 0)
        throw std::runtime_error("Failed to listen");

    // 5. Modo não-bloqueante: accept/recv/send não ficam à espera
    fcntl(_serverSocket, F_SETFL, O_NONBLOCK);

    // 6. Adicionar ao poll para monitorizar eventos
    pfd.fd = _serverSocket;
    pfd.events = POLLIN;  // Queremos saber quando há dados para ler
    pfd.revents = 0;
    _pollFds.push_back(pfd);
}
```

### Porquê não-bloqueante?

Sem `O_NONBLOCK`, chamadas como `accept()` e `recv()` bloqueiam o programa até
haver dados. Com I/O não-bloqueante + `poll()`, o servidor pode gerir **múltiplos
clientes numa única thread** sem ficar preso à espera de nenhum.

---

## 4. Passo 2 - Aceitar Clientes com poll()

### O loop principal: run()

O coração do servidor é um loop infinito que usa `poll()` para monitorizar
todos os file descriptors (o socket do servidor + os sockets dos clientes):

```cpp
void Server::run(void)
{
    int     pollCount;
    size_t  i;

    while (_running)
    {
        // Esperar até 10 segundos por eventos em qualquer socket
        pollCount = poll(&_pollFds[0], _pollFds.size(), 10000);
        if (pollCount < 0)
            continue;  // Erro (ex: sinal recebido), tentar de novo

        // Iterar de trás para a frente (seguro para remoções durante iteração)
        i = _pollFds.size();
        while (i--)
        {
            // Verificar eventos de leitura
            if (_pollFds[i].revents & POLLIN)
            {
                if (_pollFds[i].fd == _serverSocket)
                    acceptNewClient();      // Nova conexão!
                else
                    handleClientData(_pollFds[i].fd); // Dados de um cliente
            }
            // Verificar se o socket está pronto para escrita
            if (_pollFds[i].revents & POLLOUT)
                handleClientWrite(_pollFds[i].fd);
            // Verificar erros e desconexões
            if (_pollFds[i].revents & (POLLHUP | POLLERR | POLLNVAL))
                removeClient(_pollFds[i].fd);
        }
        checkTimeouts(); // Verificar clientes inativos
    }
}
```

### Eventos do poll()

| Evento    | Significado                                |
|-----------|--------------------------------------------|
| `POLLIN`  | Há dados para ler (ou nova conexão)        |
| `POLLOUT` | O socket está pronto para enviar dados     |
| `POLLHUP` | O cliente desconectou                      |
| `POLLERR` | Erro no socket                             |
| `POLLNVAL`| File descriptor inválido                   |

### Aceitar uma nova conexão: acceptNewClient()

Quando `poll()` indica `POLLIN` no socket do servidor, há um cliente a tentar
conectar-se:

```cpp
void Server::acceptNewClient(void)
{
    struct sockaddr_in  clientAddr;
    socklen_t           clientLen = sizeof(clientAddr);
    char                hostbuf[NI_MAXHOST];
    int                 clientFd;

    // Aceitar a conexão TCP
    clientFd = accept(_serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
    if (clientFd < 0)
        return;  // Falhou (pode acontecer em modo não-bloqueante)

    // Tornar o socket do cliente não-bloqueante
    fcntl(clientFd, F_SETFL, O_NONBLOCK);

    // Resolver o hostname do cliente
    getnameinfo((struct sockaddr*)&clientAddr, clientLen,
                hostbuf, sizeof(hostbuf), NULL, 0, 0);

    // Criar objecto Client e adicionar ao poll
    struct pollfd pfd;
    pfd.fd = clientFd;
    pfd.events = POLLIN;   // Monitorizar leitura
    pfd.revents = 0;
    _pollFds.push_back(pfd);

    Client *client = new Client(clientFd);
    client->setHostname(hostbuf);
    client->setServername(SERVER_NAME);
    _clients[clientFd] = client;
}
```

Cada cliente novo recebe:
- Um **file descriptor** (o seu socket)
- Um **objecto Client** com buffers e estado
- Uma entrada no **vector de poll**

---

## 5. Passo 3 - Receber e Enviar Dados

### Receber dados: handleClientData()

Quando `poll()` indica `POLLIN` num socket de cliente, há dados para ler:

```cpp
void Server::handleClientData(int fd)
{
    char    buffer[512];
    ssize_t bytesRead;

    // Ler dados do socket (não-bloqueante)
    bytesRead = recv(fd, buffer, sizeof(buffer) - 1, 0);

    // 0 ou negativo = cliente desconectou ou erro
    if (bytesRead <= 0)
        return removeClient(fd);

    buffer[bytesRead] = '\0';
    Client *client = _clients[fd];

    // Acumular no buffer do cliente (mensagens podem chegar fragmentadas)
    client->appendToBuffer(buffer);

    // Protecção contra buffer overflow
    if (client->getBuffer().size() > 8192)
        return removeClient(fd);

    // Processar todas as linhas completas no buffer
    std::string buf;
    size_t pos;
    while (true)
    {
        buf = client->getBuffer();
        pos = buf.find("\r\n");          // Procurar delimitador IRC
        if (pos == std::string::npos)
            pos = buf.find("\n");        // Netcat envia só \n
        if (pos == std::string::npos)
            break;                       // Mensagem incompleta, esperar mais

        std::string line = buf.substr(0, pos);
        client->getBuffer().erase(0, pos + 2); // ou +1 se for só \n
        processCommand(client, line);           // Processar o comando IRC
    }
}
```

**Ponto-chave**: Os dados TCP podem chegar fragmentados. Uma mensagem pode vir
em 2+ chamadas `recv()`, ou 2+ mensagens podem vir numa só. Por isso usamos um
**buffer de acumulação** e só processamos quando encontramos `\r\n`.

### Enviar dados: handleClientWrite()

Em vez de enviar imediatamente com `send()`, os dados vão para um **buffer de
saída**. Quando `poll()` indica `POLLOUT`, enviamos:

```cpp
void Server::sendTo(int fd, const std::string &msg)
{
    Client *client = _clients[fd];
    client->appendToOutBuffer(msg);  // Acumular no buffer de saída
    enablePollOut(fd);                // Activar POLLOUT no poll
}

void Server::handleClientWrite(int fd)
{
    Client *client = _clients[fd];
    std::string buf = client->getOutBuffer();
    if (buf.empty())
        return;

    ssize_t sent = send(fd, buf.c_str(), buf.size(), 0);
    if (sent > 0)
    {
        client->eraseFromOutBuffer(sent); // Remover bytes enviados
        if (client->getOutBuffer().empty())
            disablePollOut(fd);           // Desactivar POLLOUT
    }
}
```

**Porquê dois buffers?**
- **Buffer de entrada** (`_buffer`): acumula dados recebidos até formar uma linha completa
- **Buffer de saída** (`_outBuffer`): acumula respostas até o socket estar pronto para enviar

### Desconectar um cliente: removeClient()

```cpp
void Server::removeClient(int fd, const std::string &reason)
{
    Client *client = _clients[fd];

    // Notificar outros utilizadores nos canais
    // (enviar QUIT a todos os canais onde este cliente estava)
    broadcastQuit(client, reason);

    // Remover de todos os canais
    removeFromAllChannels(client);

    // Remover do poll, fechar socket, libertar memória
    removeFromPoll(fd);
    close(fd);
    delete client;
    _clients.erase(fd);
}
```

---

## 6. Passo 4 - Parsing do Protocolo IRC

Cada linha recebida precisa de ser parsed em **comando** e **parâmetros**:

```
PRIVMSG #geral :Olá a todos!
  ^       ^        ^
  |       |        +-- trailing (depois de " :")
  |       +----------- parâmetro 1
  +------------------- comando
```

### processCommand()

```cpp
void Server::processCommand(Client *client, const std::string &line)
{
    std::string cleanLine = trim(line);
    if (cleanLine.empty())
        return;

    // Separar comando dos parâmetros
    std::string cmd, paramStr;
    size_t spacePos = cleanLine.find(' ');
    if (spacePos == std::string::npos)
        cmd = cleanLine;
    else
    {
        cmd = cleanLine.substr(0, spacePos);
        paramStr = cleanLine.substr(spacePos + 1);
    }

    // Converter comando para maiúsculas (IRC é case-insensitive)
    std::transform(cmd.begin(), cmd.end(), cmd.begin(), ::toupper);

    // Fazer parse dos parâmetros
    // O " :" indica o início do "trailing" (pode conter espaços)
    std::vector<std::string> params;
    size_t colonPos = paramStr.find(" :");
    if (colonPos != std::string::npos)
    {
        // Parte antes do " :" -> parâmetros separados por espaço
        // Parte depois do " :" -> um único parâmetro (trailing)
        std::string before = paramStr.substr(0, colonPos);
        std::string trailing = paramStr.substr(colonPos + 2);
        // split 'before' por espaços -> push_back cada token
        // push_back trailing
    }
    else
    {
        // Todos os parâmetros separados por espaço
    }

    // Verificar autenticação antes de executar
    if (!client->isAuthenticated()
        && cmd != "PASS" && cmd != "NICK" && cmd != "USER"
        && cmd != "QUIT" && cmd != "CAP")
    {
        ss_print(client, 451, ":You have not registered");
        return;
    }

    // Despachar para o handler correcto
    if (cmd == "PASS")       handlePass(client, params);
    else if (cmd == "NICK")  handleNick(client, params);
    else if (cmd == "USER")  handleUser(client, params);
    else if (cmd == "JOIN")  handleJoin(client, params);
    else if (cmd == "PART")  handlePart(client, params);
    else if (cmd == "PRIVMSG") handlePrivmsg(client, params);
    else if (cmd == "KICK")  handleKick(client, params);
    else if (cmd == "INVITE") handleInvite(client, params);
    else if (cmd == "TOPIC") handleTopic(client, params);
    else if (cmd == "MODE")  handleMode(client, params);
    else if (cmd == "PING")  handlePing(client, params);
    else if (cmd == "PONG")  handlePong(client, params);
    else if (cmd == "QUIT")  handleQuit(client, params);
    else ss_print(client, 421, cmd + " :Unknown command");
}
```

### Formato de resposta do servidor: ss_print()

Todas as respostas do servidor seguem o formato IRC:

```
:nomeservidor CÓDIGO nickname mensagem\r\n
```

```cpp
void Server::ss_print(Client *client, int code, const std::string &msg)
{
    std::stringstream ss;
    std::string nick = client->getNickname();
    if (nick.empty())
        nick = "*";  // Antes de ter nickname, usa-se *

    ss << ":" << SERVER_NAME << " ";

    // Códigos IRC têm sempre 3 dígitos (ex: 001, 042, 433)
    if (code < 10)       ss << "00";
    else if (code < 100) ss << "0";
    ss << code << " " << nick << " " << msg << "\r\n";

    sendTo(client->getFd(), ss.str());
}
```

---

## 7. Passo 5 - Autenticação (PASS, NICK, USER)

Um cliente IRC real (como irssi) envia estes comandos por esta ordem ao conectar:

```
CAP LS                        <- Negociação de capacidades (responder vazio)
PASS senha123                 <- Password do servidor
NICK joao                     <- Escolher nickname
USER joao 0 * :João Silva    <- Definir username e realname
```

O cliente só está **autenticado** quando os três (PASS + NICK + USER) estiverem completos.

### handlePass()

```cpp
void Server::handlePass(Client *client, const std::vector<std::string> &params)
{
    if (params.empty())
        ss_print(client, 461, "PASS :Not enough parameters"); // ERR_NEEDMOREPARAMS
    else if (client->hasPassword())
        ss_print(client, 462, ":You may not reregister");     // ERR_ALREADYREGISTERED
    else if (params[0] == _password)
        client->setHasPassword(true);                          // Password correcta!
    else
        ss_print(client, 464, ":Password incorrect");          // ERR_PASSWDMISMATCH
}
```

### handleNick()

```cpp
void Server::handleNick(Client *client, const std::vector<std::string> &params)
{
    if (params.empty())
        return ss_print(client, 431, ":No nickname given");
    if (getClient(params[0]))               // Nickname já existe?
        return ss_print(client, 433, params[0] + " :Nickname is already in use");
    if (!isValidNick(params[0]))            // Caracteres inválidos?
        return ss_print(client, 432, params[0] + " :Erroneous nickname");

    if (client->isAuthenticated())
    {
        // Já autenticado -> mudar de nick (notificar canais)
        std::string oldPrefix = client->getPrefix();
        client->setNickname(params[0]);
        std::string nickMsg = ":" + oldPrefix + " NICK :" + params[0] + "\r\n";
        sendTo(client->getFd(), nickMsg);
        // Broadcast para todos os canais onde o cliente está
    }
    else
    {
        // Ainda em registo
        client->setNickname(params[0]);
        client->setHasNick(true);
        // Verificar se registo está completo
        if (client->hasPassword() && client->hasNick() && client->hasUser())
        {
            client->setAuthenticated(true);
            sendWelcome(client);
        }
    }
}
```

**Regras de validação do nickname** (RFC 1459):
- Máximo 9 caracteres
- Primeiro caractere deve ser uma letra
- Restantes: letras, dígitos ou caracteres especiais (`-[]\\` `` ` `` `^{}|`)

### handleUser()

```cpp
void Server::handleUser(Client *client, const std::vector<std::string> &params)
{
    // USER <username> <modo> <nãoUsado> :<realname>
    // Exemplo: USER joao 0 * :João Miguel Silva
    if (params.size() < 4)
        return ss_print(client, 461, "USER :Not enough parameters");
    if (client->hasUser())
        return ss_print(client, 462, ":You may not reregister");

    client->setUsername(params[0]);
    client->setRealname(params[3]);  // O trailing após " :"
    client->setHasUser(true);

    if (client->hasPassword() && client->hasNick() && client->hasUser())
    {
        client->setAuthenticated(true);
        sendWelcome(client);
    }
}
```

### sendWelcome()

Quando o registo está completo, o servidor envia as mensagens de boas-vindas:

```cpp
void Server::sendWelcome(Client *client)
{
    ss_print(client, 001, ":Welcome to the Internet Relay Network "
             + client->getPrefix());
    ss_print(client, 002, ":Your host is " + std::string(SERVER_NAME)
             + ", running version 1.0");
    ss_print(client, 003, ":This server was created 2026/02/18");
    ss_print(client, 004, std::string(SERVER_NAME) + " 1.0 o itkol");
}
```

Estas 4 respostas (001-004) são **obrigatórias** para que clientes IRC reconheçam
a conexão como bem-sucedida.

### O prefixo do cliente: getPrefix()

Todas as mensagens reenviadas pelo servidor incluem o prefixo do remetente:

```
:nickname!username@hostname
```

```cpp
std::string Client::getPrefix(void) const
{
    return _nickname + "!" + _username + "@" + _hostname;
}
```

---

## 8. Passo 6 - Canais (JOIN, PART, PRIVMSG)

### A classe Channel

```cpp
class Channel
{
    std::string                _name;       // Ex: "#geral"
    std::string                _topic;      // Tópico do canal
    std::string                _key;        // Password do canal (modo +k)
    std::map<int, Client *>    _members;    // Membros (fd -> Client)
    std::map<int, Client *>    _operators;  // Operadores (@)
    bool                       _inviteOnly; // Modo +i
    bool                       _topicRestricted; // Modo +t
    unsigned int               _limit;      // Modo +l (limite de membros)
    std::vector<std::string>   _invited;    // Lista de convidados
    Server                     *_server;    // Referência ao servidor
};
```

### broadcast() - Enviar mensagem a todos no canal

```cpp
void Channel::broadcast(const std::string &message, Client *exclude)
{
    std::map<int, Client *>::const_iterator it = _members.begin();
    while (it != _members.end())
    {
        if (!exclude || it->second != exclude)
        {
            it->second->appendToOutBuffer(message);
            _server->enablePollOut(it->second->getFd());
        }
        ++it;
    }
}
```

O parâmetro `exclude` serve para não enviar a mensagem de volta ao remetente
(ex: quando um utilizador envia uma mensagem, todos os outros recebem, menos ele).

### handleJoin()

Quando um cliente envia `JOIN #geral`:

```cpp
void Server::handleJoin(Client *client, const std::vector<std::string> &params)
{
    // 1. Parse dos canais e keys (podem ser múltiplos separados por vírgula)
    //    JOIN #geral,#ajuda chave1,chave2

    // 2. Para cada canal:
    Channel *channel = getChannel(channelName);

    if (!channel)
    {
        // Canal não existe -> criar e tornar o utilizador operador
        channel = createChannel(channelName, key);
        channel->addMember(client);
        channel->addOperator(client);  // Primeiro membro = operador
    }
    else
    {
        // Canal existe -> verificar restrições
        if (channel->isInviteOnly() && !channel->isInvited(client))
            return ss_print(client, 473, channelName + " :Cannot join (+i)");
        if (!channel->getKey().empty() && key != channel->getKey())
            return ss_print(client, 475, channelName + " :Cannot join (+k)");
        if (channel->getLimit() > 0
            && channel->getMembersNicknames().size() >= channel->getLimit())
            return ss_print(client, 471, channelName + " :Cannot join (+l)");

        channel->addMember(client);
    }

    // 3. Notificar todos os membros do canal
    channel->broadcast(":" + client->getPrefix() + " JOIN " + channelName + "\r\n");

    // 4. Enviar tópico ao novo membro
    if (!channel->getTopic().empty())
        ss_print(client, 332, channelName + " :" + channel->getTopic());
    else
        ss_print(client, 331, channelName + " :No topic is set");

    // 5. Enviar lista de membros (NAMES)
    std::string names;
    // Para cada membro: se é operador, prefixa com @
    // Ex: "@joao maria @pedro"
    ss_print(client, 353, "= " + channelName + " :" + names);
    ss_print(client, 366, channelName + " :End of NAMES list");
}
```

### handlePart()

Quando um cliente envia `PART #geral :Até logo!`:

```cpp
void Server::handlePart(Client *client, const std::vector<std::string> &params)
{
    Channel *channel = getChannel(params[0]);
    if (!channel)
        return ss_print(client, 403, params[0] + " :No such channel");
    if (!channel->isMember(client))
        return ss_print(client, 442, params[0] + " :You're not on that channel");

    std::string reason = (params.size() > 1) ? params[1] : "Leaving";

    // Notificar todos e remover
    channel->broadcast(":" + client->getPrefix() + " PART "
                       + params[0] + " :" + reason + "\r\n");
    channel->removeMember(client);

    // Se o canal ficou vazio, apagar
    if (channel->getMembersNicknames().empty())
        removeChannel(params[0]);
}
```

### handlePrivmsg()

O comando PRIVMSG pode enviar para um canal ou directamente para um utilizador:

```cpp
void Server::handlePrivmsg(Client *client, const std::vector<std::string> &params)
{
    // PRIVMSG <alvo> :<mensagem>
    if (params.size() < 2)
        return ss_print(client, 461, "PRIVMSG :Not enough parameters");

    std::string target = params[0];
    std::string msg = ":" + client->getPrefix() + " PRIVMSG "
                      + target + " :" + params[1] + "\r\n";

    if (target[0] == '#' || target[0] == '&')
    {
        // Mensagem para canal
        Channel *channel = getChannel(target);
        if (!channel)
            return ss_print(client, 403, target + " :No such channel");
        if (!channel->isMember(client))
            return ss_print(client, 404, target + " :Cannot send to channel");
        channel->broadcast(msg, client);  // Enviar a todos menos ao remetente
    }
    else
    {
        // Mensagem privada para utilizador
        Client *targetClient = getClient(target);
        if (!targetClient)
            return ss_print(client, 401, target + " :No such nick");
        sendTo(targetClient->getFd(), msg);
    }
}
```

---

## 9. Passo 7 - Comandos de Operador (KICK, INVITE, TOPIC, MODE)

Os operadores de canal (marcados com `@` na lista de membros) têm permissões especiais.
O primeiro utilizador a entrar num canal torna-se automaticamente operador.

### handleKick()

```cpp
// KICK #canal nickname :razão
void Server::handleKick(Client *client, const std::vector<std::string> &params)
{
    Channel *channel = getChannel(params[0]);
    if (!channel)
        return ss_print(client, 403, params[0] + " :No such channel");
    if (!channel->isOperator(client))
        return ss_print(client, 482, params[0] + " :You're not channel operator");

    Client *target = getClient(params[1]);
    if (!target || !channel->isMember(target))
        return ss_print(client, 441, params[1] + " :They aren't on that channel");

    std::string kickMsg = ":" + client->getPrefix() + " KICK "
                          + params[0] + " " + params[1] + " :" + reason + "\r\n";
    channel->broadcast(kickMsg);
    channel->removeMember(target);
}
```

### handleInvite()

```cpp
// INVITE nickname #canal
void Server::handleInvite(Client *client, const std::vector<std::string> &params)
{
    Client *target = getClient(params[0]);
    Channel *channel = getChannel(params[1]);

    if (!channel->isOperator(client))
        return ss_print(client, 482, params[1] + " :You're not channel operator");
    if (channel->isMember(target))
        return ss_print(client, 443, params[0] + " " + params[1]
                        + " :is already on channel");

    channel->inviteClient(target);  // Adicionar à lista de convidados
    // Enviar convite ao alvo
    sendTo(target->getFd(), ":" + client->getPrefix() + " INVITE "
           + params[0] + " " + params[1] + "\r\n");
    // Confirmar ao remetente
    ss_print(client, 341, params[0] + " " + params[1]);
}
```

### handleTopic()

```cpp
// TOPIC #canal             -> ver tópico
// TOPIC #canal :novo tópico -> mudar tópico
void Server::handleTopic(Client *client, const std::vector<std::string> &params)
{
    Channel *channel = getChannel(params[0]);

    if (params.size() == 1)
    {
        // Apenas ver o tópico
        if (channel->getTopic().empty())
            ss_print(client, 331, params[0] + " :No topic is set");
        else
            ss_print(client, 332, params[0] + " :" + channel->getTopic());
    }
    else
    {
        // Mudar o tópico
        if (channel->isTopicRestricted() && !channel->isOperator(client))
            return ss_print(client, 482, params[0]
                            + " :You're not channel operator");

        channel->setTopic(params[1]);
        channel->broadcast(":" + client->getPrefix() + " TOPIC "
                           + params[0] + " :" + params[1] + "\r\n");
    }
}
```

### handleMode()

O modo é o comando mais complexo. Suporta estas flags:

| Modo | Significado                              |
|------|------------------------------------------|
| `+i` | Canal invite-only                        |
| `+t` | Só operadores podem mudar o tópico       |
| `+k` | Canal protegido por password             |
| `+l` | Limite de membros no canal               |
| `+o` | Dar/remover status de operador           |

```cpp
// MODE #canal              -> ver modos actuais
// MODE #canal +it          -> activar invite-only e topic-restricted
// MODE #canal +k senha     -> definir password
// MODE #canal +o nickname  -> dar operador
// MODE #canal -o nickname  -> remover operador
// MODE #canal +l 10        -> limitar a 10 membros
```

A lógica de parsing do MODE:
1. Iterar sobre a string de modos (ex: `+itk-o`)
2. `+` activa o modo add, `-` activa o modo remove
3. Para modos que precisam de parâmetro (k, l, o), consumir o próximo parâmetro
4. Aplicar cada modo ao canal
5. Broadcast da mudança a todos os membros

---

## 10. Passo 8 - Timeouts e PING/PONG

Para detectar clientes que perderam conexão sem enviar `QUIT`:

```cpp
void Server::checkTimeouts(void)
{
    time_t now = time(NULL);

    for (cada cliente)
    {
        // Clientes não autenticados: 30 segundos para registar
        if (!client->isAuthenticated()
            && (now - client->getLastActivity() > 30))
        {
            sendTo(fd, "ERROR :Registration timeout\r\n");
            removeClient(fd);
            continue;
        }

        // Clientes autenticados: verificar inactividade
        if (client->isAuthenticated()
            && (now - client->getLastActivity() > 60))
        {
            if (!client->isPingPending())
            {
                // Enviar PING e esperar resposta
                sendTo(fd, "PING :" + std::string(SERVER_NAME) + "\r\n");
                client->setPingPending(true);
                client->setPingSentTime(now);
            }
            else if (now - client->getPingSentTime() > 60)
            {
                // Sem PONG após 60 segundos -> desconectar
                sendTo(fd, "ERROR :Ping timeout (120 seconds)\r\n");
                removeClient(fd);
            }
        }
    }
}
```

O handler de PONG é simples:

```cpp
void Server::handlePong(Client *client, const std::vector<std::string> &params)
{
    client->setPingPending(false);
    client->updateLastActivity();
}
```

---

## 11. Testar o Servidor

### Compilar e executar

```bash
cd ss_irc
make
./ircserv 6667 senha123
```

### Testar com netcat (teste básico)

```bash
nc localhost 6667
PASS senha123
NICK teste
USER teste 0 * :Utilizador Teste
JOIN #geral
PRIVMSG #geral :Olá!
QUIT :Até logo
```

### Testar com irssi (cliente IRC real)

```bash
irssi
/connect localhost 6667 senha123
/nick meunome
/join #geral
/msg #geral Olá a todos!
/part #geral
/quit
```

### Testar com HexChat

1. Abrir HexChat
2. Adicionar servidor: `localhost/6667`
3. Definir password do servidor: `senha123`
4. Conectar
5. Entrar num canal: `/join #geral`

---

## 12. Referência de Códigos de Erro IRC

Códigos usados neste servidor (RFC 1459):

| Código | Nome                  | Significado                                    |
|--------|-----------------------|------------------------------------------------|
| 001    | RPL_WELCOME           | Mensagem de boas-vindas                        |
| 002    | RPL_YOURHOST          | Informação do servidor                         |
| 003    | RPL_CREATED           | Data de criação do servidor                    |
| 004    | RPL_MYINFO            | Informação do servidor e modos suportados      |
| 221    | RPL_UMODEIS           | Modos do utilizador                            |
| 324    | RPL_CHANNELMODEIS     | Modos actuais do canal                          |
| 331    | RPL_NOTOPIC           | Nenhum tópico definido                         |
| 332    | RPL_TOPIC             | Tópico do canal                                |
| 341    | RPL_INVITING          | Confirmação de convite                         |
| 353    | RPL_NAMREPLY          | Lista de membros do canal                      |
| 366    | RPL_ENDOFNAMES        | Fim da lista de membros                        |
| 401    | ERR_NOSUCHNICK        | Nickname não encontrado                        |
| 403    | ERR_NOSUCHCHANNEL     | Canal não encontrado                           |
| 404    | ERR_CANNOTSENDTOCHAN  | Não pode enviar para o canal                   |
| 409    | ERR_NOORIGIN          | Sem origem no PING                             |
| 421    | ERR_UNKNOWNCOMMAND    | Comando desconhecido                           |
| 431    | ERR_NONICKNAMEGIVEN   | Nenhum nickname fornecido                      |
| 432    | ERR_ERRONEUSNICKNAME  | Nickname inválido                              |
| 433    | ERR_NICKNAMEINUSE     | Nickname já em uso                             |
| 441    | ERR_USERNOTINCHANNEL  | Utilizador não está no canal                   |
| 442    | ERR_NOTONCHANNEL      | Você não está no canal                         |
| 443    | ERR_USERONCHANNEL     | Utilizador já está no canal                    |
| 451    | ERR_NOTREGISTERED     | Não registado                                  |
| 461    | ERR_NEEDMOREPARAMS    | Parâmetros insuficientes                       |
| 462    | ERR_ALREADYREGISTERED | Já registado                                   |
| 464    | ERR_PASSWDMISMATCH    | Password incorrecta                             |
| 471    | ERR_CHANNELISFULL     | Canal cheio (+l)                               |
| 473    | ERR_INVITEONLYCHAN    | Canal só por convite (+i)                      |
| 475    | ERR_BADCHANNELKEY     | Password do canal incorrecta (+k)               |
| 482    | ERR_CHANOPRIVSNEEDED  | Precisa de ser operador                        |
| 484    | ERR_RESTRICTED        | Não pode mudar o próprio status                |
| 502    | ERR_USERSDONTMATCH    | Não pode mudar modos de outros                 |

---

## Resumo do Fluxo Completo

```
1. Servidor inicia -> cria socket, bind, listen, poll

2. Cliente conecta (TCP) -> accept() -> cria Client, adiciona ao poll

3. Cliente envia: PASS, NICK, USER
   -> Servidor valida e envia RPL_WELCOME (001-004)

4. Cliente envia: JOIN #canal
   -> Servidor cria/junta ao canal, envia tópico + lista de membros

5. Cliente envia: PRIVMSG #canal :mensagem
   -> Servidor reencaminha para todos os membros do canal

6. Cliente envia: QUIT
   -> Servidor notifica canais, remove cliente, fecha socket

7. poll() volta ao passo 2, à espera de mais eventos
```

Este ciclo repete-se infinitamente até o servidor ser parado (Ctrl+C).
