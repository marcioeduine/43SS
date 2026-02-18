/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handleKick.cpp                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:38 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:38 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

static t_text	ss_message(int index)
{
	t_text	message[5];

	message[0] = "KICK :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :You're not channel operator";
	message[3] = " :No such nick";
	message[4] = ":You cannot KICK your self";
	return (message[index]);
}

void	Server::handleKick(Client *client, const t_vector &params)
{
	Channel	*channel;
	Client	*targetClient;
	t_text	kick_msg(":" + client->getPrefix() + " KICK ");
	t_text	reason("No reason");

	if (params.size() < 2)
		return (ss_print(client, 461, ss_message(0)));
	if (params.size() > 2)
		reason = params[2];
	channel = getChannel(params[0]);
	if (not channel)
		return (ss_print(client, 403, params[0] + ss_message(1)));
	if (not channel->isOperator(client))
		return (ss_print(client, 482, params[0] + ss_message(2)));
	targetClient = getClient(params[1]);
	if (not targetClient or not channel->isMember(targetClient))
		ss_print(client, 441, params[1] + " " + params[0] + ss_message(3));
	if (targetClient == client)
		return (ss_print(client, 482, ss_message(4)));
	else
	{
		kick_msg += params[0] + " " + params[1] + " :" + reason + "\r\n";
		(channel->broadcast(kick_msg), channel->removeMember(targetClient));
	}
}
