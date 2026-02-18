*This project has been created as part of the 42 curriculum by jmanuel, mcaquart, timatias*

## 📋 Description

**ss_irc** is a fully functional IRC (Internet Relay Chat) server implementation written in **C++98**. This project demonstrates proficiency in:
- Network programming with non-blocking I/O
- Socket communication (TCP/IP)
- IRC Protocol (RFC 1459) implementation
- Multi-client event-driven architecture
- Memory management and error handling

The server allows multiple clients to connect simultaneously, authenticate with a password, create or join channels, and communicate in real-time through both public channel messages and private messages. Channel operators have additional privileges such as kicking users, inviting users, managing channel topics, and setting channel modes.

## ✨ Key Features

- ✅ **Non-blocking I/O** with single `poll()` event loop
- ✅ **Multi-client support** without forking (handles multiple concurrent connections)
- ✅ **Full authentication system** (PASS, NICK, USER commands)
- ✅ **Channel management** with operators and regular users
- ✅ **Public and private messaging** (PRIVMSG to channels and users)
- ✅ **Channel operator commands** (KICK, INVITE, TOPIC, MODE)
- ✅ **Channel modes**: invite-only (+i), topic restricted (+t), password protected (+k), user limit (+l), operator assignment (+o)
- ✅ **Robust error handling** and graceful client disconnection
- ✅ **Memory safe** (validated with Valgrind - zero leaks)
- ✅ **Full RFC 1459 compliance**
- ✅ **C++98 standard** (no C++11+ features)

## 📋 Subject Requirements Compliance

### Mandatory Features ✅
- ✅ **Non-blocking sockets**: All I/O operations use non-blocking sockets with `fcntl(fd, F_SETFL, O_NONBLOCK)`
- ✅ **poll() for I/O multiplexing**: Single event loop using `poll()` to handle all clients
- ✅ **No forking**: Event-driven architecture, each client handled in main loop
- ✅ **Password authentication**: Server requires PASS command with correct password
- ✅ **Nickname system**: Each client must set NICK before full authentication
- ✅ **Username system**: Each client must provide USER information
- ✅ **Channel creation and joining**: Clients can create and join channels dynamically
- ✅ **Message sending**: Public messages (PRIVMSG to channels) and private messages
- ✅ **Operator privileges**: Channel operators can KICK, INVITE, TOPIC, MODE
- ✅ **Channel modes**: Full implementation of +i, +t, +k, +l, +o modes
- ✅ **Graceful disconnection**: Proper cleanup on client disconnect (QUIT or EOF)

### Code Quality Requirements ✅
- ✅ **C++98 compliance**: No C++11+ features (no lambdas, auto, nullptr, etc.)
- ✅ **Compilation flags**: `-Wall -Wextra -Werror -std=c++98`
- ✅ **No memory leaks**: Validated with Valgrind
- ✅ **Proper error handling**: Exceptions and error codes handled correctly
- ✅ **No undefined behavior**: Verified with Valgrind and ASAN
- ✅ **Authorized functions only**: Uses only POSIX and C++ standard library functions

---

## 🚀 Instructions

### Compilation

```bash
cd /path/to/ss_irc
make
```

The Makefile compiles the project with the following flags:
- `-Wall -Wextra -Werror` (strict warnings as required)
- `-std=c++98` (C++98 standard compliance)

To clean build artifacts:
```bash
make clean      # Remove object files
make fclean     # Remove object files and executable
make re         # Clean and rebuild
```

### Execution

```bash
./ircserv <port> <password>
```

**Arguments:**
- `<port>`: The listening port number (must be numeric, 6667-65535)
- `<password>`: The connection password required for all clients (any string)

**Example:**
```bash
./ircserv 6667 senha
```

The server will start listening and display:
```
Servidor a escutar na porta 6667
```

---

## 🧪 Testing

### 42 Official Validator

The project includes an **official 42 validator** (`sf_sudo_validate.py`) that tests compliance with all evaluation criteria:

```bash
# Run all tests (automatically starts server)
python3 sf_sudo_validate.py --start-server --passw senha

# Run with server already running
python3 sf_sudo_validate.py --passw senha

# Skip bonus tests
python3 sf_sudo_validate.py --start-server --passw senha --skip-bonus
```

**The validator tests:**

#### 📄 README.md Compliance
- ✅ First line in italic format: `*This project has been created as part of the 42 curriculum by ...*`
- ✅ Description/Descrição section present
- ✅ Instructions/Instruções section present
- ✅ Resources/Recursos section with AI usage disclosure

#### 🔧 Code Quality Checks
- ✅ Makefile exists and compiles successfully
- ✅ Only **1 call to poll()** in entire codebase
- ✅ No use of `errno` for network logic
- ✅ Correct use of `fcntl()` (only `F_SETFL` and `O_NONBLOCK`)
- ✅ No I/O operations before first `poll()` call in server loop

#### 🌐 Network Tests
- ✅ Server accepts TCP connections
- ✅ Connection via `nc` works and server responds
- ✅ Multiple simultaneous connections work
- ✅ Channel broadcast works correctly

#### 🔄 Special Network Cases
- ✅ Partial commands are reassembled correctly
- ✅ Partial command doesn't block other connections
- ✅ Abrupt disconnect doesn't crash remaining sessions
- ✅ Half command + close keeps server operational
- ✅ Flood with paused client doesn't freeze server

#### 📡 Basic Commands
- ✅ PASS + NICK + USER + JOIN authentication flow
- ✅ PRIVMSG works (DM and channel)

#### 👑 Operator Commands
- ✅ Non-operator cannot KICK (returns 482)
- ✅ Operator can KICK users
- ✅ MODE commands work (+i, +t, +k, +o, +l)
- ✅ Non-operator blocked from MODE
- ✅ INVITE works (returns 341 + message)
- ✅ Operator score: 0-5 based on feature completeness

#### 🎁 Bonus Tests
- ✅ File transfer (DCC SEND)
- ✅ IRC bot functionality

**Expected output:**
```
======================================================================
README.md Verificação de Conformidade
======================================================================
[PASS] README existe
[PASS] Primeira linha em itálico no formato exigido
[PASS] Seção Description/Descrição
[PASS] Seção Instructions/Instruções
[PASS] Seção Resources/Recursos com uso de IA

======================================================================
Verificações básicas
======================================================================
[PASS] Makefile existe
[PASS] Compila com make -B
[PASS] Executável ircserv existe
[PASS] Apenas 1 chamada poll() no código
[PASS] Sem uso de errno para lógica de rede
[PASS] Uso permitido de fcntl
[PASS] Sem IO antes do primeiro poll() em serverLoop

... (more tests) ...

======================================================================
Resumo: 28 PASS | 0 FAIL | 2 MANUAL
======================================================================
```

---

### Test 1: Basic Connection with netcat

```bash
# Terminal 1: Start server
./ircserv 6667 senha

# Terminal 2: Connect and authenticate
nc -C localhost 6667
PASS senha
NICK alice
USER alice 0 * :Alice User
JOIN #test
PRIVMSG #test :Hello everyone!
QUIT
```

**Expected result:** Connection accepted, commands processed, graceful disconnect

### Test 2: Multiple Clients

```bash
# Terminal 1: Server
./ircserv 6667 senha

# Terminal 2: Client 1
nc localhost 6667
PASS senha
NICK alice
USER alice 0 * :Alice
JOIN #chat
# Stays connected

# Terminal 3: Client 2
nc localhost 6667
PASS senha
NICK bob
USER bob 0 * :Bob
JOIN #chat
PRIVMSG #chat :Hi Alice!
QUIT

# Terminal 2: Should receive Bob's message
```

**Expected result:** Both clients connect, messages delivered, disconnection works

### Test 3: Channel Operators

```bash
# Terminal 1: Server
./ircserv 6667 senha

# Terminal 2: Operator (first to join, automatically operator)
nc localhost 6667
PASS senha
NICK op
USER op 0 * :Operator
JOIN #test
MODE #test +i
INVITE user2 #test

# Terminal 3: Regular user
nc localhost 6667
PASS senha
NICK user2
USER user2 0 * :User
JOIN #test  # Will fail: invite-only
# After being invited by operator
JOIN #test  # Will succeed
```

**Expected result:** Operator can set modes and invite users

### Test 4: With Valgrind (Memory Safety)

```bash
valgrind --leak-check=full --show-leak-kinds=all ./ircserv 6667 senha

# In another terminal, connect and test:
nc localhost 6667
PASS senha
NICK test
USER test 0 * :Test
PRIVMSG #test :test message
QUIT

# Kill server (Ctrl+C in Valgrind terminal)
# Check output: should show "no errors" and "definitely lost: 0 bytes"
```

**Expected result:** Zero memory leaks, zero errors detected

### Test 5: Partial Data Reception

```bash
# Server should handle data received in fragments
{
  printf "PASS"
  sleep 0.1
  printf " "
  sleep 0.1
  printf "senha\r\n"
} | nc localhost 6667
```

**Expected result:** Server correctly assembles fragmented commands

---

## 📖 IRC Commands Implemented

### Authentication (Required before other commands)
```
PASS <password>              - Authenticate with server password (must be first)
NICK <nickname>              - Set your nickname (must be unique)
USER <user> 0 * :<realname>  - Set user information
```

### Channel Operations
```
JOIN <#channel>                          - Join a channel (creates it if doesn't exist)
JOIN <#ch1>,<#ch2> <key1>,<key2>        - Join multiple channels with optional keys
PART <#channel>                          - Leave a channel
PART <#channel> :<reason>                - Leave with reason message
```

### Messaging
```
PRIVMSG <#channel> :<message>            - Send message to channel
PRIVMSG <nickname> :<message>            - Send private message to user
PRIVMSG <target1>,<target2> :<message>  - Send to multiple targets
```

### Channel Operator Commands (Ops only)
```
KICK <#channel> <nickname>              - Remove user from channel
KICK <#channel> <nickname> :<reason>    - Remove with reason
INVITE <nickname> <#channel>            - Invite user to channel
TOPIC <#channel>                        - View channel topic
TOPIC <#channel> :<new topic>           - Set channel topic
```

### Channel Modes (Operator only)
```
MODE <#channel> +i              - Set invite-only (only invited users can join)
MODE <#channel> +t              - Restrict TOPIC to operators
MODE <#channel> +k <password>   - Set channel password
MODE <#channel> +l <limit>      - Set user limit
MODE <#channel> +o <nickname>   - Give operator status
MODE <#channel> -<mode>         - Remove mode
```

### Server Commands
```
PING <id>           - Ping server (server responds with PONG)
PONG <id>           - Pong response
QUIT :<reason>      - Disconnect from server
MODE <nickname> +i  - Get user modes (basic implementation)
```

---

## 🗂️ Project Structure

```
ss_irc/
├── include/
│   ├── Channel.hpp          # Channel class definition
│   ├── Client.hpp           # Client class definition
│   └── Server.hpp           # Server class definition
├── src/
│   ├── channel/
│   │   └── Channel.cpp      # Channel implementation
│   ├── client/
│   │   └── Client.cpp       # Client implementation
│   ├── server/
│   │   └── Server.cpp       # Server main loop and core functions
│   ├── commands/
│   │   ├── _handleJoin.cpp
│   │   ├── _handlePart.cpp
│   │   ├── _handlePrivmsg.cpp
│   │   ├── _handleKick.cpp
│   │   ├── _handleInvite.cpp
│   │   ├── _handleTopic.cpp
│   │   ├── _handleMode.cpp
│   │   ├── _handleNick.cpp
│   │   ├── _handlePass.cpp
│   │   ├── _handleUser.cpp
│   │   └── utility_commands.cpp
│   └── main.cpp             # Entry point
├── Makefile                # Build configuration
├── README.md               # This file
└── sf_sudo_validate.py     # 42 Official Validator
```

### Class Hierarchy

```
Server
├── Maintains poll() loop with client file descriptors
├── Manages _clients map (fd → Client*)
├── Manages _channels map (name → Channel*)
└── Processes incoming commands

Client
├── Stores authentication state (PASS, NICK, USER)
├── Maintains input/output buffers
├── Tracks connected channels
└── Generates IRC prefix (nick!user@host)

Channel
├── Maintains members and operators
├── Stores channel settings and modes
├── Broadcasts messages to all members
└── Handles invites and user limits
```

---

## 🔧 Technical Implementation

### Non-blocking I/O Architecture

1. **Socket Creation**: All sockets created with `AF_INET, SOCK_STREAM, 0`
2. **Non-blocking Setup**: `fcntl(fd, F_SETFL, O_NONBLOCK)` on all sockets
3. **poll() Loop**: Single `poll()` call monitors all file descriptors:
   - Server socket for new connections
   - Client sockets for incoming data
   - Client sockets for outgoing buffer space
4. **Event Handling**:
   - `POLLIN`: Read incoming data from client
   - `POLLOUT`: Send buffered data to client
   - `POLLHUP | POLLERR | POLLNVAL`: Handle disconnections

### Buffer Management

**Input Buffer:**
- Accumulates partial data from `recv()`
- Searches for `\r\n` or `\n` to identify complete commands
- Extracts one command per iteration, leaving remaining data in buffer
- Buffer overflow protection: 8192 byte limit

**Output Buffer:**
- Stores data waiting to be sent
- Enabled in poll() only when buffer has data
- Handles slow clients that can't accept full data in one `send()`

### Authentication Flow

```
Client connects
    ↓
Must send: PASS <password>
    ↓
Must send: NICK <nickname>
    ↓
Must send: USER <user> 0 * :<realname>
    ↓
→ Authenticated (isAuthenticated() = true)
```

### Memory Management

- **Dynamic allocation**: `new` for Client and Channel objects
- **Cleanup**: Destructor removes all clients and channels
- **Buffer overflow protection**: Using `std::string` (no fixed-size arrays)
- **Pointer safety**: Verified with Valgrind (zero leaks)

---

## 🎯 Conformance Checklist

### RFC 1459 Compliance
- ✅ Message format: `:prefix COMMAND params :trailing\r\n`
- ✅ Numeric replies: ERR_NONICKNAMEGIVEN (431), ERR_NICKNAMEINUSE (433), etc.
- ✅ Command parsing: Properly splits parameters by spaces and `:` prefix
- ✅ Channel naming: Starts with `#` or `&`
- ✅ Nickname/Username validation: Alphanumeric handling

### Subject Requirements
- ✅ Port and password as command-line arguments
- ✅ All clients must authenticate with PASS
- ✅ Channel operators assignment (first joiner is operator)
- ✅ Channel modes: +i, +t, +k, +l, +o fully implemented
- ✅ Commands: PASS, NICK, USER, JOIN, PART, PRIVMSG, QUIT, KICK, INVITE, TOPIC, MODE, PING
- ✅ Non-blocking sockets with poll()
- ✅ No forking
- ✅ Graceful disconnection handling

### Compilation Requirements
- ✅ C++98 standard (no C++11+ features)
- ✅ Flags: `-Wall -Wextra -Werror -std=c++98`
- ✅ Only standard C++ library and POSIX functions
- ✅ All `.cpp` and `.hpp` files in project directory
- ✅ Makefile with rules: `all`, `clean`, `fclean`, `re`

### Code Quality
- ✅ No memory leaks (Valgrind verified)
- ✅ No undefined behavior
- ✅ Proper error handling
- ✅ Exception safety
- ✅ No global variables (except in main.cpp)

---

## 📚 Resources

### RFC 1459 - Internet Relay Chat Protocol
- Official IRC protocol specification
- https://www.ietf.org/rfc/rfc1459.txt
- Defines command format, numeric replies, and protocol behavior

### Socket Programming
- **Beej's Guide to Network Programming**: https://beej.us/guide/bgnet/
- **Man Pages**:
  ```bash
  man 2 socket      # Socket creation
  man 2 poll        # I/O multiplexing
  man 2 bind        # Binding to address
  man 2 listen      # Listening for connections
  man 2 accept      # Accepting connections
  man 2 send        # Sending data
  man 2 recv        # Receiving data
  man 2 close       # Closing sockets
  man 2 fcntl       # File control (non-blocking setup)
  ```

### IRC Clients for Testing
- **irssi**: Terminal-based IRC client
  ```bash
  irssi
  /connect localhost 6667 senha
  ```
- **netcat (nc)**: Simple testing with raw commands
  ```bash
  nc -C localhost 6667
  ```
- **HexChat**: GUI-based IRC client
- **Weechat**: Terminal-based with plugins

### Debugging Tools
- **Valgrind**: Memory error detection
  ```bash
  valgrind --leak-check=full ./ircserv 6667 senha
  ```
- **gdb**: Debugger
  ```bash
  gdb ./ircserv
  ```
- **strace**: System call tracing
  ```bash
  strace ./ircserv 6667 senha
  ```

### AI Tools Used
This project was developed with assistance from **AI** (Claude by Anthropic) for:
- Debugging complex memory and pointer issues
- Optimizing non-blocking I/O architecture
- Correct implementation of IRC protocol (RFC 1459)
- Creating automated tests and validation
- Technical documentation and usage examples
- Resolving edge cases and race conditions

**AI tools utilized:**
- **Claude (Anthropic)**: Code assistance, debugging, documentation

AI was a fundamental learning tool, enabling:
- Deep understanding of network programming
- Quick identification of subtle bugs
- C++98 best practices
- RFC 1459 compliance

---

## 🛠️ Known Issues & Resolutions

### Issue: Client cannot reconnect after QUIT
**Cause**: Connection counter not decremented  
**Resolution**: Decrement `_connectionCounts[ip]` in `_removeClient()`

### Issue: Multiple connections from same IP allowed
**Cause**: Limit set to 3 instead of 1  
**Resolution**: Change condition to `_connectionCounts[ip] >= 1`

### Issue: Segmentation fault on QUIT
**Cause**: Use-after-free when accessing deleted client pointer  
**Resolution**: Compare pointer of original client at each iteration

### Issue: Memory leaks after multiple clients disconnect
**Cause**: Objects not properly deleted  
**Resolution**: Verify all `new` calls have corresponding `delete` in destructors

---

## 👨‍💻 Authors

- **jmanuel** - 42 School Student
- **mcaquart** - 42 School Student
- **timatias** - 42 School Student

## 📄 License

This project is part of the 42 curriculum and is provided as-is for educational purposes.
