/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Channel.hpp                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:33 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/13 12:04:16 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef CHANNEL_HPP
# define CHANNEL_HPP

# include "Client.hpp"
# include <map>
# include <vector>

class	Client;
class	Server;

class	Channel
{
	private:
		t_text					_name;
		t_text					_topic;
		t_text					_key;
		std::map<int, Client *>	_members;
		std::map<int, Client *>	_operators;
		bool					_inviteOnly;
		bool					_topicRestricted;
		unsigned int			_limit;
		std::vector<t_text>		_invited;
		Server					*_server;

	public:
		Channel(const t_text &name, const t_text &key, Server *server);
		~Channel(void);

		std::vector<t_text>	getMembersNicknames(void) const;
		const t_text		&getName(void) const;
		const t_text		&getTopic(void) const;
		const t_text		&getKey(void) const;
		unsigned int		getLimit(void) const;

		void				setTopic(const t_text &topic);
		void				setKey(const t_text &key);
		void				setInviteOnly(bool inviteOnly);
		void				setTopicRestricted(bool topicRestricted);
		void				setLimit(unsigned int limit);
		void				addMember(Client *client);
		void				removeMember(Client *client);
		void				addOperator(Client *client);
		void				removeOperator(Client *client);
		void				inviteClient(Client *client);
		void				broadcast(const t_text &message, Client *exclude = NULL);

		bool				isInvited(Client *client) const;
		bool				isTopicRestricted(void) const;
		bool				isOperator(Client *client) const;
		bool				isMember(Client *client) const;
		bool				isInviteOnly(void) const;
};

#endif
