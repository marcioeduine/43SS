*This project has been created as part of the 42 curriculum by jmanuel, mcaquart, timatias*

## Description

An IRC server written in C++98 that handles multiple clients simultaneously using `epoll()` for non-blocking I/O. Clients authenticate with a password, set a nickname and username, then can join channels and exchange messages. Channel operators can kick, invite, set topics and manage channel modes (+i, +t, +k, +o, +l).

Reference client: **irssi**. Also tested with **nc** (netcat).

## Instructions

```bash
make                        # compile
make clean                  # remove object files
make fclean                 # remove object files and executable
make re                     # clean and rebuild
```

```bash
./ircserv <port> <password>
```

Example:
```bash
./ircserv 6667 senha
```

Testing with nc:
```bash
nc -C localhost 6667
PASS senha
NICK alice
USER alice 0 * :Alice
JOIN #test
PRIVMSG #test :Hello!
```

Testing with irssi:
```bash
irssi
/connect localhost 6667 senha
/join #test
```

## Resources

- [RFC 1459 — Internet Relay Chat Protocol](https://www.ietf.org/rfc/rfc1459.txt)
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- `man epoll`, `man epoll_ctl`, `man epoll_wait`, `man bind`, `man accept`, `man recv`, `man send`, `man tpc`, `man socket`, `man listen`...

### AI Usage

This project was developed with assistance from **Claude** (Anthropic) for:
- Debugging network and memory issues
- Ensuring RFC 1459 protocol compliance
- Fixing edge cases in command handling
- Code review and documentation
