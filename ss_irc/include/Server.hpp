/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Server.hpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:59:17 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 13:30:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef SERVER_HPP
# define SERVER_HPP

# define SERVER_NAME "ircserv"

# define SS_RED     "\033[31m"
# define SS_GREEN   "\033[32m"
# define SS_YELLOW  "\033[33m"
# define SS_BOLD    "\033[1m"
# define SS_RESET   "\033[0m"
# define SS_ALERT   "\033[5;31m"

# include <algorithm>
# include <arpa/inet.h>
# include <cerrno>
# include <cstring>
# include <fcntl.h>
# include <map>
# include <netdb.h>
# include <poll.h>
# include <sstream>
# include <unistd.h>
# include <vector>

typedef std::string 		t_text;
typedef std::stringstream	t_ss;
typedef std::vector<t_text>	t_vector;

class	Client;
class	Channel;
class	Server
{
	private:
		int							_port;
		t_text						_password;
		int							_serverSocket;
		std::vector<struct pollfd>	_pollFds;
		std::map<int, Client *>		_clients;
		std::map<t_text, Channel *>	_channels;
		bool						_running;

		void	setupServer(void);

	public:
		Server(int port, const t_text &password);
		~Server(void);

		void	run(void);
		void	stop(void);

		int							getServerSocket(void) const;
		t_text						getPassword(void) const;
		std::map<int, Client *>		&getClients(void);
		std::vector<struct pollfd>	&getPollFds(void);

		Channel	*getChannel(const t_text &name);
		Channel	*createChannel(const t_text &name, const t_text &key);
		void	removeChannel(const t_text &name);

		Client	*getClient(const t_text &nickname);
		void	acceptNewClient(void);
		void	removeClient(int fd, const t_text &quitReason = "Client disconnected");
		void	handleClientData(int fd);
		void	handleClientWrite(int fd);
		void	checkTimeouts(void);

		void	sendTo(int fd, const t_text &msg);
		void	enablePollOut(int fd);
		void	sendWelcome(Client *client);
		void	ss_print(Client *client, int code, const t_text &msg);

		void	processCommand(Client *client, const t_text &line);

		void	handleCap(Client *client, const t_vector &params);
		void	handlePass(Client *client, const t_vector &params);
		void	handleNick(Client *client, const t_vector &params);
		void	handleUser(Client *client, const t_vector &params);
		void	handleJoin(Client *client, const t_vector &params);
		void	handlePart(Client *client, const t_vector &params);
		void	handlePrivmsg(Client *client, const t_vector &params);
		void	handleKick(Client *client, const t_vector &params);
		void	handleInvite(Client *client, const t_vector &params);
		void	handleTopic(Client *client, const t_vector &params);
		void	handleMode(Client *client, const t_vector &params);
		void	handleModeUser(Client *client, const t_vector &params);
		void	handlePing(Client *client, const t_vector &params);
		void	handlePong(Client *client, const t_vector &params);
		void	handleQuit(Client *client, const t_vector &params);
};

void	ss_print_fd(const t_text &s, int fd);

#endif
