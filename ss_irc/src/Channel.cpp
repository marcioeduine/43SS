/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Channel.cpp                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:23 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/13 11:53:27 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <algorithm>
#include "../include/Channel.hpp"
#include "../include/Client.hpp"
#include "../include/Server.hpp"

Channel::Channel(const t_text &name, const t_text &key, Server *server)
	: _name(name), _key(key), _inviteOnly(false), _topicRestricted(false),
	_limit(0), _server(server)
{
}

Channel::~Channel(void)
{
}

const t_text &Channel::getName(void) const
{
	return (_name);
}

const t_text &Channel::getTopic(void) const
{
	return (_topic);
}

void	Channel::setTopic(const t_text &topic)
{
	_topic = topic;
}

const t_text	&Channel::getKey(void) const
{
	return (_key);
}

void	Channel::setKey(const t_text &key)
{
	_key = key;
}

bool	Channel::isInviteOnly(void) const
{
	return (_inviteOnly);
}

void	Channel::setInviteOnly(bool inviteOnly)
{
	_inviteOnly = inviteOnly;
}

bool	Channel::isTopicRestricted(void) const
{
	return (_topicRestricted);
}

void	Channel::setTopicRestricted(bool topicRestricted)
{
	_topicRestricted = topicRestricted;
}

unsigned int	Channel::getLimit(void) const
{
	return (_limit);
}

void	Channel::setLimit(unsigned int limit)
{
	_limit = limit;
}

std::vector<t_text>	Channel::getMembersNicknames(void) const
{
	std::vector<t_text>						nicknames;
	std::map<int, Client *>::const_iterator	it(_members.begin());

	while (it != _members.end())
		(nicknames.push_back(it->second->getNickname()), ++it);
	return (nicknames);
}

void	Channel::addMember(Client *client)
{
	std::vector<t_text>::iterator	it;

	_members[client->getFd()] = client;
	it = std::find(_invited.begin(), _invited.end(), client->getNickname());
	if (it != _invited.end())
		_invited.erase(it);
	if (_operators.empty())
		addOperator(client);
}

void	Channel::removeMember(Client *client)
{
	_members.erase(client->getFd());
	removeOperator(client);
}

bool	Channel::isMember(Client *client) const
{
	return (_members.find(client->getFd()) != _members.end());
}

bool	Channel::isOperator(Client *client) const
{
	return (_operators.find(client->getFd()) != _operators.end());
}

void	Channel::addOperator(Client *client)
{
	if (isMember(client))
		_operators[client->getFd()] = client;
}

void	Channel::removeOperator(Client *client)
{
	_operators.erase(client->getFd());
}

void	Channel::inviteClient(Client *client)
{
	_invited.push_back(client->getNickname());
}

bool	Channel::isInvited(Client *client) const
{
	return (std::find(_invited.begin(), _invited.end(), client->getNickname()) != _invited.end());
}

void	Channel::broadcast(const t_text &message, Client *exclude)
{
	std::map<int, Client *>::const_iterator	it(_members.begin());
	Client									*member;

    while (it != _members.end())
	{
        member = it->second;
        if (not exclude or member != exclude)
		{
            member->appendToOutBuffer(message);
            _server->enablePollOut(member->getFd());
        }
		++it;
    }
}
