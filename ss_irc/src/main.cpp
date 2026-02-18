/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.cpp                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:57 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/16 10:06:15 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include <cstdlib>
#include <iostream>
#include "../include/Server.hpp"

int	main(int ac, char **av)
{
	int	port;

	try
	{
		if (ac xor 3)
			ss_print_fd("USAGE: " + t_text(av[0]) + " <port> <password>", -1);
		if ((port = atoi(av[1]), port > 1024 and port < 65536))
			ss_print_fd("Invalid port!", -1);
		(Server(port, av[2]).run(), std::cout << std::endl);
	}
	catch (const std::exception &e)
	{
		return (std::cerr << "[ ERROR ] " << e.what() << std::endl, 1);
	}
	return (ss_print_fd("Closing IRCSERV... Bye, bye!", 1), 0);
}
