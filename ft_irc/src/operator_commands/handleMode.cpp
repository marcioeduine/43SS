/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   handleMode.cpp                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:40 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 16:00:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

typedef std::pair<Channel *, Client *>	t_pair;

static t_text	ss_message(int index)
{
	t_text	message[6];

	message[0] = "MODE :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :You're not channel operator";
	message[3] = " :No such nick";
	message[4] = " isn't a member of ";
	message[5] = " :You cannot change your own operator status";
	return (message[index]);
}

static void	ss_add_mode_params(Channel *channel, t_text &modes,
	t_text &modeParams, t_ss &ss)
{
	if (not channel->getKey().empty())
	{
		modes += "k";
		modeParams = " " + channel->getKey();
	}
	if (channel->getLimit())
	{
		modes += "l";
		ss.clear();
		ss << channel->getLimit();
		modeParams += " " + ss.str();
	}
}

static bool	ss_init_modes(Server &server, t_pair pair,
	const t_vector &params, t_ss &ss)
{
	t_text	modes("+");
	t_text	modeParams;

	if (params.size() xor 1)
		return (false);
	if (pair.first->isInviteOnly())
		modes += "i";
	if (pair.first->isTopicRestricted())
		modes += "t";
	ss_add_mode_params(pair.first, modes, modeParams, ss);
	server.ss_print(pair.second, 324, params[0] + " " + modes + modeParams);
	return (true);
}

static void	ss_mode_i(Channel *channel, bool add)
{
	channel->setInviteOnly(add);
}

static void	ss_mode_t(Channel *channel, bool add)
{
	channel->setTopicRestricted(add);
}

static void	ss_mode_k(Channel *channel, bool add, const t_text &param,
	size_t &j)
{
	if (not add)
		return (channel->setKey(""));
	if (not param.empty())
		(channel->setKey(param), j++);
}

static void	ss_mode_o(Server *server, Channel *channel, bool add,
	const t_text &param, size_t &j, Client *operator_client)
{
	Client	*target_client;

	if (param.empty())
		return ;
	(target_client = server->getClient(param), j++);
	if (not target_client)
		return (server->ss_print(operator_client, 401, param + ss_message(3)));
	if (not channel->isMember(target_client))
		return (server->ss_print(operator_client, 441, param + ss_message(4)
			+ channel->getName()));
	if (target_client == operator_client)
		return (server->ss_print(operator_client, 484, channel->getName()
			+ ss_message(5)));
	if (add)
		channel->addOperator(target_client);
	else
		channel->removeOperator(target_client);
}

static bool	ss_parse_limit(const t_text &param, int &limit)
{
	t_ss	ss;

	ss << param;
	if ((ss >> limit) and ss.eof() and limit > 0 and limit <= 10000)
		return (true);
	return (false);
}

static void	ss_mode_l(Channel *channel, bool add, const t_text &param,
	size_t &j)
{
	int	limit;

	if (not add)
		return (channel->setLimit(0));
	if (not param.empty() and ss_parse_limit(param, limit))
		(channel->setLimit(static_cast<unsigned int>(limit)), j++);
}

static void	ss_process_mode(Server *server, Channel *channel, char mode,
	bool add, const t_text &param, size_t &j, Client *operator_client)
{
	if (mode == 'i')
		ss_mode_i(channel, add);
	else if (mode == 't')
		ss_mode_t(channel, add);
	else if (mode == 'k')
		ss_mode_k(channel, add, param, j);
	else if (mode == 'o')
		ss_mode_o(server, channel, add, param, j, operator_client);
	else if (mode == 'l')
		ss_mode_l(channel, add, param, j);
}

static void	ss_build_mode_msg(const t_vector &params, t_text &mode_msg)
{
	t_vector::size_type	i(1);

	mode_msg += params[0] + " " + params[1];
	while (++i < params.size())
		mode_msg += " " + params[i];
	mode_msg += "\r\n";
}

void	Server::handleMode(Client *client, const t_vector &params)
{
	Channel				*channel;
	t_text::size_type	i(-1);
	t_text				mode_msg(":" + client->getPrefix() + " MODE ");
	t_text				param;
	t_ss				ss;
	size_t				j(2);
	bool				add(true);

	if (params.empty())
		return (ss_print(client, 461, ss_message(0)));
	channel = getChannel(params[0]);
	if (not channel)
		return (ss_print(client, 403, params[0] + ss_message(1)));
	if (ss_init_modes(*this, std::make_pair(channel, client), params, ss))
		return ;
	if (not channel->isOperator(client))
		return (ss_print(client, 482, params[0] + ss_message(2)));
	while (++i < params[1].size())
	{
		if (params[1][i] == '+' or params[1][i] == '-')
			add = (params[1][i] == '+');
		else
		{
			if ((param.clear(), j < params.size()))
				param = params[j];
			ss_process_mode(this, channel, params[1][i], add, param, j,
				client);
		}
	}
	(ss_build_mode_msg(params, mode_msg), channel->broadcast(mode_msg));
}
