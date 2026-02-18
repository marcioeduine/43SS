/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handleInvite.cpp                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:35 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:35 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

static t_text	ss_message(int index)
{
	t_text	message[6];

	message[0] = "INVITE :Not enough parameters";
	message[1] = " :No such nick";
	message[2] = " :No such channel";
	message[3] = " :You're not channel operator";
	message[4] = " :is already on channel as operator";
	message[5] = " :is already on channel";
	return (message[index]);
}

void	Server::handleInvite(Client *client, const t_vector &params)
{
	Channel	*channel;
	Client	*targetClient;
	t_text	invite_msg(":" + client->getPrefix() + " INVITE ");

	if (params.size() < 2)
		return (ss_print(client, 461, ss_message(0)));
	targetClient = getClient(params[0]);
	if (not targetClient)
		return (ss_print(client, 401, params[0] + ss_message(1)));
	channel = getChannel(params[1]);
	if (not channel)
		return (ss_print(client, 403, params[1] + ss_message(2)));
	if (not channel->isOperator(client))
		return (ss_print(client, 482, params[1] + ss_message(3)));
	if (channel->isMember(targetClient))
		return (ss_print(client, 443, params[0] + " " + params[1] + ss_message(5)));
	channel->inviteClient(targetClient);
	invite_msg += params[0] + " " + params[1] + "\r\n";
	sendTo(targetClient->getFd(), invite_msg);
	ss_print(client, 341, params[0] + " " + params[1]);
}
