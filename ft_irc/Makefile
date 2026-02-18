# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/01/14 12:52:00 by mcaquart          #+#    #+#              #
#    Updated: 2026/02/15 17:26:27 by mcaquart         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		= ircserv
CXX			= c++
CXXFLAGS	= -Wall -Wextra -Werror -std=c++98
HEADER		= include/Channel.hpp \
			  include/Client.hpp \
			  include/Server.hpp
OBJ			= src/Channel.o \
			  src/Client.o \
			  src/main.o \
			  src/Server.o \
			  src/channel_commands/handleJoin.o \
			  src/channel_commands/handlePart.o \
			  src/operator_commands/handleInvite.o \
			  src/operator_commands/handleKick.o \
			  src/operator_commands/handleMode.o \
			  src/operator_commands/handleTopic.o \
			  src/server_commands/handleNick.o \
			  src/server_commands/handlePrivmsg.o \
			  src/server_commands/handleUser.o \
			  src/server_commands/utility_commands.o \
			  src/server_commands/handlePass.o

all: $(NAME)

$(OBJ): $(HEADER)

$(NAME): $(OBJ)
	$(CXX) $(CXXFLAGS) $(OBJ) -o $(NAME)

clean:
	rm -f $(OBJ)

fclean: clean
	rm -f $(NAME)

re: fclean all

.PHONY: all clean fclean re
