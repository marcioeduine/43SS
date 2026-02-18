/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   handlePass.cpp                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42luanda.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/16 10:06:46 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 14:00:00 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Server.hpp"

void	Server::handlePass(Client *client, const t_vector &params)
{
	t_text	message[3];

	message[0] = "PASS :Not enough parameters";
	message[1] = ":You may not reregister";
	message[2] = ":Password incorrect";
	if (params.empty())
		ss_print(client, 461, message[0]);
	else if (client->hasPassword())
		ss_print(client, 462, message[1]);
	else if (params[0] == _password)
		client->setHasPassword(true);
	else
		ss_print(client, 464, message[2]);
}
