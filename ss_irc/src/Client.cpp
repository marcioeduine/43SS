/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Client.cpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:43 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/15 17:30:22 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../include/Client.hpp"

Client::Client(int fd) : _fd(fd), _authenticated(false),
	_hasPassword(false), _hasNick(false), _hasUser(false),
	_lastActivity(time(NULL)),
	_pingSentTime(0), _pingPending(false)
{
}

Client::~Client(void)
{
}

int	Client::getFd(void) const
{
	return (_fd);
}

const t_text&	Client::getNickname() const
{
	return (_nickname);
}

void	Client::setNickname(const t_text &nickname)
{
	_nickname = nickname;
}

const t_text	&Client::getUsername(void) const
{
	return (_username);
}

void	Client::setUsername(const t_text &username)
{
	_username = username;
}

const t_text	&Client::getRealname(void) const
{
	return (_realname);
}

void	Client::setRealname(const t_text &realname)
{
	_realname = realname;
}

const t_text	&Client::getHostname(void) const
{
	return (_hostname);
}

void	Client::setHostname(const t_text &hostname)
{
	_hostname = hostname;
}

const t_text	&Client::getIpAddress(void) const
{
	return (_ipAddress);
}

void	Client::setIpAddress(const t_text &ip)
{
	_ipAddress = ip;
}

const t_text	&Client::getServername(void) const
{
	return (_servername);
}

void	Client::setServername(const t_text &servername)
{
	_servername = servername;
}

bool	Client::isAuthenticated(void) const
{
	return (_authenticated);
}

void	Client::setAuthenticated(bool authenticated)
{
	_authenticated = authenticated;
}

bool	Client::hasPassword(void) const
{
	return (_hasPassword);
}

void	Client::setHasPassword(bool hasPassword)
{
	_hasPassword = hasPassword;
}

bool	Client::hasNick(void) const
{
	return (_hasNick);
}

void	Client::setHasNick(bool hasNick)
{
	_hasNick = hasNick;
}

bool	Client::hasUser(void) const
{
	return (_hasUser);
}

void	Client::setHasUser(bool hasUser)
{
	_hasUser = hasUser;
}

void	Client::appendToBuffer(const t_text &data)
{
	_buffer += data;
}

const t_text	&Client::getBuffer(void) const
{
	return (_buffer);
}

t_text	&Client::getBuffer(void)
{
	return (_buffer);
}

void	Client::clearBuffer(void)
{
	_buffer.clear();
}

void	Client::appendToOutBuffer(const t_text &data)
{
	_outBuffer += data;
}

const t_text	&Client::getOutBuffer(void) const
{
	return (_outBuffer);
}

void	Client::eraseFromOutBuffer(size_t bytes)
{
	_outBuffer.erase(0, bytes);
}

void	Client::clearOutBuffer(void)
{
	_outBuffer.clear();
}

t_text	Client::getPrefix(void) const
{
    t_text	nick("*");
    t_text	user("*");
    t_text	host("localhost");

	if (not _nickname.empty())
		nick = _nickname;
	if (not _username.empty())
		user = _username;
	if (not _hostname.empty())
		host = _hostname;
    return (nick + "!" + user + "@" + host);
}

time_t	Client::getLastActivity(void) const
{
	return (_lastActivity);
}

time_t	Client::getPingSentTime(void) const
{
	return (_pingSentTime);
}

bool	Client::isPingPending(void) const
{
	return (_pingPending);
}

void	Client::updateLastActivity(void)
{
	_lastActivity = time(NULL);
}

void	Client::setPingPending(bool pending)
{
	_pingPending = pending;
}

void	Client::setPingSentTime(time_t t)
{
	_pingSentTime = t;
}
