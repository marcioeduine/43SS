/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handleNick.cpp                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:45 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:45 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

void	Server::handleNick(Client *client, const t_vector &params)
{
	t_text	message[3];

	message[0] = ":No nickname given";
	message[1] = " :Nickname is already in use";
	message[2] = " :Erroneous nickname";
	if (params.empty())
		return (ss_print(client, 431, message[0]));
	if (getClient(params[0]))
		return (ss_print(client, 433, params[0] + message[1]));
	if (not std::isalpha(params[0][0]))
		return (ss_print(client, 432, params[0] + message[2]));
	(client->setNickname(params[0]), client->setHasNick(true));
	if (client->hasPassword() and client->hasNick() and client->hasUser())
		(client->setAuthenticated(true), sendWelcome(client));
}
