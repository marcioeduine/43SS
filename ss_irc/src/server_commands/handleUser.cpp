/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*    handleUser.cpp                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:51 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:51 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Server.hpp"

void	Server::handleUser(Client *client, const t_vector &params)
{
	t_text	message[2];

	message[0] = "USER :Not enough parameters";
	message[1] = ":You may not reregister";
	if (params.size() < 4)
		return (ss_print(client, 461, message[0]));
	if (client->hasUser())
		return (ss_print(client, 462, message[1]));
	(client->setUsername(params[0]),
	client->setHasUser(true));
	tryCompleteRegistration(client);
}
