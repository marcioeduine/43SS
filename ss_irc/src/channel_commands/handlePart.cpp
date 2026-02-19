/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   handlePart.cpp                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:27 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 12:00:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

static t_text	ss_message(int index)
{
	t_text	message[3];

	message[0] = "PART :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :You're not on that channel";
	return (message[index]);
}

static void	ss_process_part(Server *server, Client *client,
	const t_text &chan, const t_text &reason, const t_text &part_msg)
{
	Channel	*channel;

	channel = server->getChannel(chan);
	if (not channel)
		server->ss_print(client, 403, chan + ss_message(1));
	else if (not channel->isMember(client))
		server->ss_print(client, 442, chan + ss_message(2));
	else
	{
		channel->broadcast(part_msg + chan + " :" + reason + "\r\n");
		channel->removeMember(client);
		if (channel->getMembersNicknames().empty())
			server->removeChannel(chan);
	}
}

void	Server::handlePart(Client *client, const t_vector &params)
{
	t_vector					channels;
	t_vector::const_iterator	it;
	t_text						part_msg(":" + client->getPrefix() + " PART ");
	t_text						reason("Leaving");

	if (params.empty())
		return (ss_print(client, 461, ss_message(0)));
	if (params.size() > 1)
		reason = ss_join_params(params, 1);
	ss_parse_list(params[0], channels);
	it = channels.begin();
	while (it != channels.end())
		(ss_process_part(this, client, *it, reason, part_msg), ++it);
}
