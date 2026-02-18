/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Server.cpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:13 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 12:00:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <algorithm>
#include <csignal>
#include "../include/Channel.hpp"
#include "../include/Server.hpp"
#include <iostream>

static bool	g_running = true;

static t_text	ss_client_id(Client *client)
{
	t_ss	ss;

	if (not client->getNickname().empty())
		ss << client->getNickname() << "(fd=" << client->getFd()
			<< ", " << client->getHostname() << ")";
	else
		ss << "fd=" << client->getFd() << ", " << client->getHostname();
	return (ss.str());
}

static void	signalHandler(int signum)
{
	(void)signum;
	g_running = false;
}

Server::Server(int port, const t_text &password)
	: _port(port), _password(password), _serverSocket(-1), _running(true)
{
	signal(SIGINT, signalHandler);
	signal(SIGQUIT, signalHandler);
	signal(SIGTERM, signalHandler);
	signal(SIGPIPE, SIG_IGN);
	setupServer();
}

static void	ss_cleanup_clients(std::map<int, Client *> &clients)
{
	std::map<int, Client *>::iterator	it(clients.begin());

	while (it != clients.end())
	{
		close(it->first);
		delete (it->second);
		++it;
	}
}

static void	ss_cleanup_channels(std::map<t_text, Channel*> &channels)
{
	std::map<t_text, Channel*>::iterator	it(channels.begin());

	while (it != channels.end())
	{
		delete (it->second);
		++it;
	}
}

Server::~Server(void)
{
	ss_cleanup_clients(_clients);
	ss_cleanup_channels(_channels);
	close(_serverSocket);
}

static void	ss_configure_socket(int socket_fd)
{
	int	opt(1);

	if (setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0)
		(close(socket_fd), ss_print_fd("Erro ao configurar socket", -1));
}

static void	ss_bind_socket(int socket_fd, int port)
{
	struct sockaddr_in	addr;

	memset(&addr, 0, sizeof(addr));
	addr.sin_family = AF_INET;
	addr.sin_addr.s_addr = INADDR_ANY;
	addr.sin_port = htons(port);
	if (bind(socket_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0)
		(close(socket_fd), ss_print_fd("Erro ao fazer bind", -1));
}

void	Server::setupServer(void)
{
	struct pollfd	pfd;

	_serverSocket = socket(AF_INET, SOCK_STREAM, 0);
	if (_serverSocket < 0)
		return (ss_print_fd("Erro ao Criar o socket", -1));
	ss_configure_socket(_serverSocket);
	ss_bind_socket(_serverSocket, _port);
	if (listen(_serverSocket, SOMAXCONN) < 0)
		(close(_serverSocket), ss_print_fd("Erro ao escutar", -1));
	fcntl(_serverSocket, F_SETFL, O_NONBLOCK);
	pfd.fd = _serverSocket;
	pfd.events = POLLIN;
	pfd.revents = 0;
	_pollFds.push_back(pfd);
	std::cout << SS_GREEN << "LISTEN" << SS_RESET << " "
		<< SERVER_NAME << " porta " << _port << std::endl;
}

static void	ss_handle_poll_events(Server *server, size_t i,
	std::vector<struct pollfd> &pollFds)
{
	if (i >= pollFds.size())
		return ;
	if (pollFds[i].revents & POLLIN)
	{
		if (pollFds[i].fd == server->getServerSocket())
			server->acceptNewClient();
		else
			server->handleClientData(pollFds[i].fd);
	}
}

static void	ss_handle_write_and_errors(Server *server, size_t i,
	std::vector<struct pollfd> &pollFds)
{
	if (i >= pollFds.size())
		return ;
	if (pollFds[i].revents & POLLOUT)
		server->handleClientWrite(pollFds[i].fd);
	if (i >= pollFds.size())
		return ;
	if (pollFds[i].revents & (POLLHUP | POLLERR | POLLNVAL))
		server->removeClient(pollFds[i].fd);
}

void	Server::run(void)
{
	int		pollCount;
	size_t	i;

	while (_running and g_running)
	{
		pollCount = poll(&_pollFds[0], _pollFds.size(), 10000);
		if (pollCount < 0)
			continue ;
		i = _pollFds.size();
		while (i--)
		{
			ss_handle_poll_events(this, i, _pollFds);
			ss_handle_write_and_errors(this, i, _pollFds);
		}
		checkTimeouts();
	}
}

static void	ss_setup_new_client(int clientFd, const char *host,
	std::map<int, Client *> &clients,
	std::vector<struct pollfd> &pollFds)
{
	struct pollfd	pfd;
	Client			*client;

	fcntl(clientFd, F_SETFL, O_NONBLOCK);
	pfd.fd = clientFd;
	pfd.events = POLLIN;
	pfd.revents = 0;
	pollFds.push_back(pfd);
	client = new Client(clientFd);
	client->setHostname(host);
	client->setServername(SERVER_NAME);
	clients[clientFd] = client;
}

void	Server::acceptNewClient(void)
{
	struct sockaddr_in	clientAddr;
	socklen_t			clientLen(sizeof(clientAddr));
	int					clientFd;
	char				ipbuf[INET_ADDRSTRLEN];
	char				hostbuf[NI_MAXHOST];
	t_text				ip;
	t_text				hostname;

	clientFd = accept(_serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
	if (clientFd < 0)
		return (ss_print_fd("Erro ao aceitar cliente", 2));
	inet_ntop(AF_INET, &(clientAddr.sin_addr), ipbuf, INET_ADDRSTRLEN);
	ip = ipbuf;
	if (getnameinfo((struct sockaddr*)&clientAddr, clientLen,
		hostbuf, sizeof(hostbuf), NULL, 0, 0) == 0
		and t_text(hostbuf) != ip)
		hostname = hostbuf;
	else
		hostname = ip;
	ss_setup_new_client(clientFd, hostname.c_str(), _clients, _pollFds);
	std::cout << SS_GREEN << "CONNECT" << SS_RESET << " "
		<< ss_client_id(_clients[clientFd]) << std::endl;
}

static void	ss_broadcast_quit(Client *client,
	std::map<t_text, Channel *> &channels, const t_text &reason)
{
	std::map<t_text, Channel *>::iterator	it(channels.begin());
	t_text									quitMsg;

	quitMsg = ":" + client->getPrefix() + " QUIT :" + reason + "\r\n";
	while (it != channels.end())
	{
		if (it->second->isMember(client))
			it->second->broadcast(quitMsg, client);
		++it;
	}
}

static void	ss_remove_from_channels(Client *client,
	std::map<t_text, Channel *> &channels)
{
	std::map<t_text, Channel*>::iterator	it(channels.begin());

	while (it != channels.end())
	{
		if (it->second->isMember(client))
		{
			it->second->removeMember(client);
			if (it->second->getMembersNicknames().empty())
			{
				delete (it->second);
				channels.erase(it++);
			}
			else
				++it;
		}
		else
			++it;
	}
}

static void	ss_remove_from_poll(int fd, std::vector<struct pollfd> &pollFds)
{
	std::vector<struct pollfd>::iterator	it(pollFds.begin());

	while (it != pollFds.end())
	{
		if (it->fd == fd)
		{
			pollFds.erase(it);
			break ;
		}
		++it;
	}
}

void	Server::removeClient(int fd, const t_text &quitReason)
{
	t_text	clientInfo;

	if (_clients.find(fd) == _clients.end())
		return ;
	clientInfo = ss_client_id(_clients[fd]);
	ss_broadcast_quit(_clients[fd], _channels, quitReason);
	ss_remove_from_channels(_clients[fd], _channels);
	ss_remove_from_poll(fd, _pollFds);
	close(fd);
	delete (_clients[fd]);
	_clients.erase(fd);
	std::cout << SS_RED << "DISCONNECT" << SS_RESET << " "
		<< clientInfo << " (" << quitReason << ")" << std::endl;
}

static bool	ss_find_delimiter(const t_text &buf, size_t &pos, size_t &delimSize)
{
	pos = buf.find("\r\n");
	if (pos == t_text::npos)
	{
		pos = buf.find("\n");
		delimSize = 1;
	}
	return (pos xor t_text::npos);
}

static void	ss_process_buffer(Server *server, Client *client, int clientFd)
{
	t_text	buf;
	size_t	pos;
	size_t	delimSize(2);

	while (true)
	{
		if (server->getClients().find(clientFd)
			== server->getClients().end())
			break ;
		client = server->getClients()[clientFd];
		buf = client->getBuffer();
		if (not ss_find_delimiter(buf, pos, delimSize))
			break ;
		client->getBuffer().erase(0, pos + delimSize);
		server->processCommand(client, buf.substr(0, pos));
	}
}

void	Server::handleClientData(int fd)
{
	std::map<int, Client *>::iterator	clientIt;
	char								buffer[512];
	Client								*client;
	ssize_t								bytesRead;

	bytesRead = recv(fd, buffer, sizeof(buffer) - 1, 0);
	if (bytesRead <= 0)
	{
		if (_clients.find(fd) != _clients.end())
			removeClient(fd);
		return ;
	}
	clientIt = _clients.find(fd);
	if (clientIt == _clients.end())
		return ;
	buffer[bytesRead] = '\0';
	client = clientIt->second;
	client->updateLastActivity();
	client->appendToBuffer(buffer);
	if (client->getBuffer().size() > 8192)
	{
		sendTo(fd, "ERROR :Input buffer overflow\r\n");
		return (removeClient(fd));
	}
	ss_process_buffer(this, client, fd);
}

static void	ss_disable_pollout(int fd, std::vector<struct pollfd> &pollFds)
{
	std::vector<struct pollfd>::iterator	it(pollFds.begin());

	while (it != pollFds.end())
	{
		if (it->fd == fd)
		{
			it->events &= ~POLLOUT;
			break ;
		}
		++it;
	}
}

void	Server::handleClientWrite(int fd)
{
	std::map<int, Client *>::iterator	it(_clients.find(fd));
	Client								*client;
	t_text								buf;
	ssize_t								sent;

	if (it == _clients.end())
		return ;
	client = it->second;
	buf = client->getOutBuffer();
	if (buf.empty())
		return ;
	sent = send(fd, buf.c_str(), buf.size(), 0);
	if (sent > 0)
	{
		it = _clients.find(fd);
		if (it == _clients.end())
			return ;
		it->second->eraseFromOutBuffer(sent);
		if (it->second->getOutBuffer().empty())
			ss_disable_pollout(fd, _pollFds);
	}
}

void	Server::enablePollOut(int fd)
{
	std::vector<struct pollfd>::iterator	it(_pollFds.begin());

	while (it != _pollFds.end())
	{
		if (it->fd == fd)
		{
			it->events |= POLLOUT;
			break ;
		}
		++it;
	}
}

void	Server::sendTo(int fd, const t_text &msg)
{
	std::map<int, Client *>::iterator	it(_clients.find(fd));

	if (it != _clients.end())
		(it->second->appendToOutBuffer(msg), enablePollOut(fd));
}

static t_text	ss_trim(const t_text &str)
{
	size_t	first(str.find_first_not_of(" \t\r\n"));
	size_t	last(str.find_last_not_of(" \t\r\n"));

	if (str.empty() or first == t_text::npos)
		return ("");
	return (str.substr(first, last - first + 1));
}

static void	ss_parse_params(const t_text &paramStr, t_vector &params)
{
	t_text	beforeColon;
	t_text	trailing;
	t_text	token;
	t_ss	iss;
	size_t	colonPos(paramStr.find(" :"));

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

static bool	ss_check_auth(Client *client, const t_text &cmd)
{
	return (client->isAuthenticated() or cmd == "PASS" or cmd == "NICK"
		or cmd == "USER" or cmd == "QUIT" or cmd == "CAP" or cmd == "PING"
		or cmd == "PONG");
}

static void	ss_handle_unauth(Server *server, Client *client)
{
	server->ss_print(client, 451, ":You have not registered");
}

static void	ss_dispatch_all_commands(Server *server, Client *client,
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

void	Server::processCommand(Client *client, const t_text &line)
{
	t_vector	params;
	t_text		cmd;
	t_text		paramStr;
	t_text		cleanLine(ss_trim(line));
	size_t		spacePos;

	if (cleanLine.empty())
		return ;
	std::cout << SS_CYAN << "CMD" << SS_RESET << " "
		<< ss_client_id(client) << ": " << cleanLine << std::endl;
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
		return (ss_handle_unauth(this, client));
	ss_dispatch_all_commands(this, client, cmd, params);
}

void	Server::checkTimeouts(void)
{
	std::map<int, Client *>::iterator	it(_clients.begin());
	std::vector<int>					toRemove;
	time_t								now(time(NULL));
	Client								*client;
	t_ss								ss;

	while (it != _clients.end())
	{
		client = it->second;
		if (client->isAuthenticated()
			and (now - client->getLastActivity() > 60))
		{
			if (not client->isPingPending())
			{
				ss.str("");
				ss << "PING :" << SERVER_NAME << "\r\n";
				sendTo(client->getFd(), ss.str());
				client->setPingPending(true);
				client->setPingSentTime(now);
				std::cout << SS_YELLOW << "PING" << SS_RESET << " sent to "
					<< ss_client_id(client) << std::endl;
			}
			else if (now - client->getPingSentTime() > 60)
			{
				std::cout << SS_RED << "TIMEOUT" << SS_RESET << " "
					<< ss_client_id(client) << " (no PONG after 120s)"
					<< std::endl;
				sendTo(client->getFd(),
					"ERROR :Closing Link: Ping timeout (120 seconds)\r\n");
				toRemove.push_back(it->first);
			}
		}
		++it;
	}
	for (size_t i = 0; i < toRemove.size(); ++i)
		removeClient(toRemove[i]);
}

Client	*Server::getClient(const t_text &nickname)
{
	std::map<int, Client *>::iterator	it(_clients.begin());

	while (it != _clients.end())
	{
		if (it->second->getNickname() == nickname)
			return (it->second);
		++it;
	}
	return (NULL);
}

Channel	*Server::getChannel(const t_text &name)
{
	std::map<t_text, Channel*>::iterator	it(_channels.find(name));

	if (it != _channels.end())
		return (it->second);
	return (NULL);
}

Channel	*Server::createChannel(const t_text &name, const t_text &key)
{
	Channel	*channel(new Channel(name, key, this));

	return (_channels[name] = channel);
}

void	Server::removeChannel(const t_text &name)
{
	std::map<t_text, Channel*>::iterator	it(_channels.find(name));

	if (it == _channels.end())
		return ;
	delete it->second;
	_channels.erase(it);
}

int		Server::getServerSocket(void) const
{
	return (_serverSocket);
}

t_text	Server::getPassword(void) const
{
	return (_password);
}

std::map<int, Client *>	&Server::getClients(void)
{
	return (_clients);
}

std::vector<struct pollfd>	&Server::getPollFds(void)
{
	return (_pollFds);
}

void	Server::stop(void)
{
	_running = false;
}

void	ss_print_fd(const t_text &s, int fd)
{
	if (fd == -1)
		throw (std::runtime_error(s));
	else if (fd == 1)
		std::cout << s << std::endl;
	else if (fd == 2)
		std::cerr << SS_RED << "ERROR" << SS_RESET << " " << s << std::endl;
	else
		throw (std::invalid_argument("Invalid fd in SS_PRINT_FD!"));
}
