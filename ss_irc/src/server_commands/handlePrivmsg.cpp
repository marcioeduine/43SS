/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handlePrivmsg.cpp                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:48 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:48 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

typedef std::pair<t_text, t_text>	t_pair;

static t_text	ss_message(int index)
{
	t_text	message[4];

	message[0] = "PRIVMSG :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :Cannot send to channel";
	message[3] = " :No such nick";
	return (message[index]);
}

static void	ss_find_channel(Server &server, Client *client, t_pair pair,
	const t_vector &params)
{
	Channel	*target(server.getChannel(pair.first));

	if (not target)
		return (server.ss_print(client, 403, pair.first + ss_message(1)));
	if (not target->isMember(client))
		return (server.ss_print(client, 404, pair.first + ss_message(2)));
	pair.second += pair.first + " :" + params[1] + "\r\n";
	target->broadcast(pair.second, client);
}

static void	ss_find_client(Server &server, Client *client, t_pair pair,
	const t_vector &params)
{
	Client	*target(server.getClient(pair.first));

	if (not target)
		return (server.ss_print(client, 401, pair.first + ss_message(3)));
	pair.second += pair.first + " :" + params[1] + "\r\n";
	server.sendTo(target->getFd(), pair.second);
}

void	Server::handlePrivmsg(Client *client, const t_vector &params)
{
	t_vector::const_iterator	it;
	t_vector					vec_targets;
	t_text						target;
	t_text						msg(":" + client->getPrefix() + " PRIVMSG ");
	t_ss						ss;

	if (params.size() < 2)
		return (ss_print(client, 461, ss_message(0)));
	ss << params[0];
	while (std::getline(ss, target, ','))
		if (not target.empty())
			vec_targets.push_back(target);
	it = vec_targets.begin();
	while (it != vec_targets.end())
	{
		(target.clear(), target = *it, ++it);
		if ((target[0] == '#') or (target[0] == '&'))
			ss_find_channel(*this, client, std::make_pair(target, msg), params);
		else
			ss_find_client(*this, client, std::make_pair(target, msg), params);
	}
}
