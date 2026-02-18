/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Client.hpp                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mcaquart <marvin@42.fr>                    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/14 12:58:50 by mcaquart          #+#    #+#             */
/*   Updated: 2026/02/13 09:44:47 by mcaquart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#ifndef CLIENT_HPP
# define CLIENT_HPP

# include <string>

typedef std::string	t_text;

class	Client
{
	private:
		int		_fd;
		int		_unauthCommandCount;
		t_text	_nickname;
		t_text	_username;
		t_text	_realname;
		t_text	_hostname;
		t_text	_servername;
		t_text	_buffer;
		t_text	_outBuffer;
		bool	_authenticated;
		bool	_hasPassword;
		bool	_hasNick;
		bool	_hasUser;

	public:
		Client(int fd);
		~Client(void);

		int				getFd(void) const;
		int				getUnauthCommandCount(void) const;
		
		void			setNickname(const t_text &nickname);
		void			setUsername(const t_text &username);
		void			setRealname(const t_text &realname);
		void			setHostname(const t_text &hostname);
		void			setServername(const t_text &servername);
		void			setAuthenticated(bool authenticated);
		void			setHasPassword(bool hasPassword);
		void			setHasUser(bool hasUser);
		void			clearOutBuffer(void);
		void			eraseFromOutBuffer(size_t bytes);
		void			appendToOutBuffer(const t_text &data);
		void			clearBuffer(void);
		void			appendToBuffer(const t_text &data);
		void			setHasNick(bool hasNick);
		void			incrementUnauthCommandCount(void);
		void			resetUnauthCommandCount(void);

		bool			hasUser(void) const;
		bool			isAuthenticated(void) const;
		bool			hasPassword(void) const;
		bool			hasNick(void) const;

		t_text			getPrefix(void) const;
		t_text			&getBuffer(void);
		const t_text	&getBuffer(void) const;
		const t_text	&getOutBuffer(void) const;
		const t_text	&getRealname(void) const;
		const t_text	&getHostname(void) const;
		const t_text	&getUsername(void) const;
		const t_text	&getServername(void) const;
		const t_text	&getNickname(void) const;
};

#endif
