/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handleTopic.cpp                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:42 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:42 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

static t_text	ss_message(int index)
{
	t_text	message[5];

	message[0] = "TOPIC :Not enough parameters";
	message[1] = " :No such channel";
	message[2] = " :You're not on that channel";
	message[3] = " :No topic is set";
	message[4] = " :You're not channel operator";
	return (message[index]);
}

void	Server::handleTopic(Client *client, const t_vector &params)
{
	Channel	*channel;
	t_text	topic_msg(":" + client->getPrefix() + " TOPIC ");

	if (params.empty())
		return (ss_print(client, 461, ss_message(0)));
	channel = getChannel(params[0]);
	if (not channel)
		ss_print(client, 403, params[0] + ss_message(1));
	else if (not channel->isMember(client))
		ss_print(client, 442, params[0] + ss_message(2));
	else if (params.size() == 1)
	{
		if (channel->getTopic().empty())
			ss_print(client, 331, params[0] + ss_message(3));
		else
			ss_print(client, 332, params[0] + " :" + channel->getTopic());
	}
	else
	{
		if (channel->isTopicRestricted() and not channel->isOperator(client))
			return (ss_print(client, 482, params[0] + ss_message(4)));
		channel->setTopic(params[1]);
		channel->broadcast(topic_msg + params[0] + " :" + params[1] + "\r\n");
	}
}
