/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   irc.cpp                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/20 01:10:55 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/20 03:44:09 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <algorithm>
#include <asm-generic/socket.h>
#include <cstddef>
#include <cstring>
#include <filesystem>
#include <string>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <sys/epoll.h>
#include <vector>

class	Server
{
	private:
		int					fd;
		int					epoll_fd;
		std::vector<int>	clients;

		bool				init_socket(void);
		bool				setup_epoll(void);
		void				handle_client_data(int _fd);
		void				handle_new_connection(void);
	public:
		Server(void);
		~Server(void);

		void				run(void);
};

Server::Server(void) : fd(-1), epoll_fd(-1)
{
	if (not init_socket() or not setup_epoll())
		_exit(1);
}

Server::~Server(void)
{
	size_t	size(clients.size());
	size_t	i(0);

	if (epoll_fd >= 0)
		close(epoll_fd);
	if (fd >= 0)
		close(fd);
	while (i < size)
		close(clients[i++]);
}

bool	Server::init_socket(void)
{
	struct sockaddr_in	addr;
	int		option(1);

	fd = socket(AF_INET, SOCK_STREAM, 0);
	if (fd < 0)
		return (false);
	setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &option, sizeof(option));
	addr.sin_family = AF_INET;
	addr.sin_port = htons(6667);
	addr.sin_addr.s_addr = INADDR_ANY;
	if (bind(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0)
		return (false);
	if (listen(fd, 4096) < 0)
		return (false);
	return (true);
}

bool	Server::setup_epoll(void)
{
	struct epoll_event	events;

	events.events = EPOLLIN;
	epoll_fd = epoll_create(4096);
	if (epoll_fd < 0)
		return (false);
	events.data.fd = fd;
	if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, fd, &events) < 0)
		return (close(epoll_fd), false);
	return (true);
}

void	Server::handle_new_connection(void)
{
	struct epoll_event	events;
	int					client_fd(accept(fd, 0, 0));

	if (client_fd < 0)
		return ;
	events.events = EPOLLIN;
	events.data.fd = client_fd;
	if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &events) >= 0)
		return (clients.push_back(client_fd));
	close(client_fd);
}

void	Server::handle_client_data(int _fd)
{
	char		buffer[1024];
	int			length(read(_fd, buffer, sizeof(buffer) - 1));
	std::string	msg[4];

	msg[0] = "PING";
	msg[1] = "PONG localhost\r\n";
	msg[2] = "NICK ";
	msg[3] = ":localhost 001 user :Welcome\r\n:localhost 376 user :End MOTD\r\n";
	if (length <= 0)
	{
		epoll_ctl(epoll_fd, EPOLL_CTL_DEL, _fd, 0);
		close(_fd);
		clients.erase(std::remove(clients.begin(), clients.end(), _fd), clients.end());
		return ;
	}
	buffer[length] = 0;
	if (not std::strncmp(buffer, msg[0].c_str(), msg[0].length()))
		write(_fd, msg[1].c_str(), msg[1].length());
	else if (std::strstr(buffer, msg[2].c_str()))
		write(_fd, msg[3].c_str(), msg[3].length());
}

void	Server::run(void)
{
	int					max_events(1024);
	struct epoll_event	events[max_events];
	int					nfds;
	int					_fd;
	int					i;

	while (true)
	{
		nfds = epoll_wait(epoll_fd, events, max_events, -1);
		i = 0;
		while (i < nfds)
		{
			_fd = events[i++].data.fd;
			if (fd == _fd)
				handle_new_connection();
			else
				handle_client_data(_fd);
		}
	}
}

int	main(void)
{
	return (Server().run(), 0);
}
