/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   handleJoin.cpp                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/15 17:31:22 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 12:00:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

static t_text	ss_message(int index)
{
	t_text	message[7];

	message[0] = "JOIN :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :Cannot join channel (+i)";
	message[3] = " :Cannot join channel (+k)";
	message[4] = " :Cannot join channel (+l)";
	message[5] = " :No topic is set";
	message[6] = " :End of NAMES list";
	return (message[index]);
}

static void	ss_parse_channels(const t_text &str, t_vector &channels)
{
	t_ss	ss(str);
	t_text	token;

	while (std::getline(ss, token, ','))
		if (not token.empty())
			channels.push_back(token);
}

static void	ss_parse_keys(const t_vector &params, t_vector &keys)
{
	t_ss	ss;
	t_text	token;

	if (params.size() > 1)
	{
		ss << params[1];
		while (std::getline(ss, token, ','))
			keys.push_back(token);
	}
}

static bool	ss_check_channel_restrictions(Server *server, Client *client,
	Channel *channel, const t_text &channel_name, const t_text &channel_key)
{
	if (channel->isInviteOnly() and not channel->isInvited(client))
		server->ss_print(client, 473, channel_name + ss_message(2));
	else if (not channel->getKey().empty()
		and (channel_key != channel->getKey()))
		server->ss_print(client, 475, channel_name + ss_message(3));
	else if (channel->getMembersNicknames().size() >= channel->getLimit()
		and channel->getLimit() > 0)
		server->ss_print(client, 471, channel_name + ss_message(4));
	else
		return (true);
	return (false);
}

static void	ss_build_names_list(Channel *channel, Server *server,
	t_text &names)
{
	t_vector						vec_members(channel->getMembersNicknames());
	t_vector::const_iterator		it(vec_members.begin());

	while (it != vec_members.end())
	{
		if (channel->isOperator(server->getClient(*it)))
			names += "@";
		(names += *it + " ", ++it);
	}
	if (not names.empty())
		names.erase(names.end() - 1);
}

static void	ss_send_join_info(Server *server, Client *client,
	Channel *channel, const t_text &channel_name)
{
	t_text	names("");
	t_text	join_msg(":" + client->getPrefix() + " JOIN ");

	channel->broadcast(join_msg + channel_name + "\r\n");
	if (not channel->getTopic().empty())
		server->ss_print(client, 332, channel_name + " :" + channel->getTopic());
	else
		server->ss_print(client, 331, channel_name + ss_message(5));
	ss_build_names_list(channel, server, names);
	server->ss_print(client, 353, "= " + channel_name + " :" + names);
	server->ss_print(client, 366, channel_name + ss_message(6));
}

static Channel	*ss_get_or_create_channel(Server *server,
	const t_text &channel_name, const t_text &channel_key, Client *client)
{
	Channel	*channel(server->getChannel(channel_name));

	if (not channel)
	{
		channel = server->createChannel(channel_name, channel_key);
		channel->addMember(client);
		channel->addOperator(client);
	}
	return (channel);
}

static void	ss_process_join(Server *server, Client *client,
	const t_text &channel_name, const t_text &channel_key)
{
	Channel	*channel;

	if ((channel_name[0] xor '#') and (channel_name[0] xor '&'))
		return (server->ss_print(client, 403, channel_name + ss_message(1)));
	channel = ss_get_or_create_channel(server, channel_name, channel_key, client);
	if (channel->isMember(client))
		return ;
	if (not ss_check_channel_restrictions(server, client, channel,
			channel_name, channel_key))
		return ;
	channel->addMember(client);
	ss_send_join_info(server, client, channel, channel_name);
}

void	Server::handleJoin(Client *client, const t_vector &params)
{
	t_vector				vec_channels;
	t_vector				keys;
	t_vector::size_type		i(-1);
	t_text					channel_key;

	if (params.empty())
		return (ss_print(client, 461, ss_message(0)));
	ss_parse_channels(params[0], vec_channels);
	ss_parse_keys(params, keys);
	while (++i < vec_channels.size())
	{
		if ((channel_key.clear(), i < keys.size()))
			channel_key = keys[i];
		ss_process_join(this, client, vec_channels[i], channel_key);
	}
}
