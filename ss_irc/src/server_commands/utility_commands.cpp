/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utility_commands.cpp                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <mcaquart@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/10 00:00:00 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:53 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../../include/Channel.hpp"
#include "../../include/Server.hpp"

void	Server::handlePing(Client *client, const t_vector &params)
{
	t_ss	ss[2];

	ss[0] << ":" << SERVER_NAME << " 409 " + client->getNickname()
		<< " :No origin specified\r\n";
	ss[1] << ":" << SERVER_NAME << " PONG " << SERVER_NAME << " :";
	if (params.empty())
		return (sendTo(client->getFd(), ss[0].str()));
	sendTo(client->getFd(), ss[1].str() + params[0] + "\r\n");
}

void	Server::handlePong(Client *client, const t_vector &params)
{
	(void)params;
	client->setPingPending(false);
	client->updateLastActivity();
}

void	Server::handleCap(Client *client, const t_vector &params)
{
	if (not params.empty() and (params[0] == "LS"))
		sendTo(client->getFd(), ":" + t_text(SERVER_NAME) + " CAP * LS :\r\n");
}

void	Server::handleModeUser(Client *client, const t_vector &params)
{
	if (not params.empty() and (params[0] == client->getNickname()))
		ss_print(client, 221, "+ ");
}

void	Server::sendWelcome(Client *client)
{
	t_ss	ss[4];

	ss[0] << ":Welcome to the IRC network " + client->getPrefix();
	ss[1] << ":Your host is " << SERVER_NAME << ", running version 1.0";
	ss[2] << ":This server was created today";
	ss[3] << SERVER_NAME << " 1.0 itkol itkol";
	ss_print(client, 001, ss[0].str());
	ss_print(client, 002, ss[1].str());
	ss_print(client, 003, ss[2].str());
	ss_print(client, 004, ss[3].str());
}

void	Server::ss_print(Client *client, int error_type, const t_text &s)
{
	t_ss	ss;
	t_text	number_str("00");

	if ((ss << ':' << SERVER_NAME << ' ', error_type < 10))
		ss << number_str;
	ss << error_type << ' ' << client->getNickname() << ' ' << s << "\r\n";
	sendTo(client->getFd(), ss.str());
}
