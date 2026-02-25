import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Mensagem, Canal, ContextoChat } from '../types';
import { useAuth } from './ContextoAutenticacao';

const ContextoChat = createContext<ContextoChat | undefined>(undefined);

export const ProvvedorChat: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { utilizador } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [canalSelecionado, setCanalSelecionado] = useState<string | null>(null);
  const [conversasPrivadas, setConversasPrivadas] = useState<string[]>([]);

  // Carregar canais públicos
  const carregarCanais = useCallback(async () => {
    try {
      const q = query(collection(db, 'canais'), orderBy('dataCriacao', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const canalData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Canal[];
        
        setCanais(canalData);
      });

      return unsubscribe;
    } catch (erro) {
      console.error('Erro ao carregar canais:', erro);
    }
  }, []);

  // Carregar mensagens de um canal
  const carregarMensagens = useCallback(
    async (canalId: string) => {
      if (!utilizador) return;

      try {
        const q = query(
          collection(db, 'mensagens'),
          where('canalId', '==', canalId),
          orderBy('dataCriacao', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const mensagensData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const dados = doc.data();
              
              // Buscar dados do utilizador
              const userDoc = await getDoc(doc(db, 'utilizadores', dados.utilizadorId));
              
              return {
                id: doc.id,
                ...dados,
                utilizador: userDoc.data(),
              } as Mensagem;
            })
          );

          setMensagens(mensagensData);
          setCanalSelecionado(canalId);
        });

        return unsubscribe;
      } catch (erro) {
        console.error('Erro ao carregar mensagens:', erro);
      }
    },
    [utilizador]
  );

  // Carregar conversa privada
  const carregarConversaPrivada = useCallback(
    async (utilizadorId: string) => {
      if (!utilizador) return;

      try {
        const conversaId = [utilizador.id, utilizadorId].sort().join('_');
        
        const q = query(
          collection(db, 'mensagens'),
          where('conversaId', '==', conversaId),
          orderBy('dataCriacao', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const mensagensData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const dados = doc.data();
              const userDoc = await getDoc(doc(db, 'utilizadores', dados.utilizadorId));
              
              return {
                id: doc.id,
                ...dados,
                utilizador: userDoc.data(),
              } as Mensagem;
            })
          );

          setMensagens(mensagensData);
        });

        return unsubscribe;
      } catch (erro) {
        console.error('Erro ao carregar conversa privada:', erro);
      }
    },
    [utilizador]
  );

  // Enviar mensagem
  const enviarMensagem = useCallback(
    async (conteudo: string, destinatarioId?: string) => {
      if (!utilizador) throw new Error('Utilizador não autenticado');

      try {
        const dadosMensagem = {
          utilizadorId: utilizador.id,
          conteudo,
          dataCriacao: new Date(),
          lida: false,
        };

        if (destinatarioId) {
          // Mensagem privada
          const conversaId = [utilizador.id, destinatarioId].sort().join('_');
          await addDoc(collection(db, 'mensagens'), {
            ...dadosMensagem,
            conversaId,
            destinatarioId,
          });
        } else if (canalSelecionado) {
          // Mensagem pública
          await addDoc(collection(db, 'mensagens'), {
            ...dadosMensagem,
            canalId: canalSelecionado,
          });
        }
      } catch (erro) {
        console.error('Erro ao enviar mensagem:', erro);
        throw erro;
      }
    },
    [utilizador, canalSelecionado]
  );

  // Criar canal
  const criarCanal = useCallback(
    async (nome: string, descricao: string) => {
      if (!utilizador) throw new Error('Utilizador não autenticado');

      try {
        const novoCanal: Canal = {
          id: '', // Será gerado pelo Firestore
          nome,
          descricao,
          dataCriacao: new Date(),
          membros: [utilizador.id],
        };

        await addDoc(collection(db, 'canais'), novoCanal);
      } catch (erro) {
        console.error('Erro ao criar canal:', erro);
        throw erro;
      }
    },
    [utilizador]
  );

  // Marcar mensagem como lida
  const marcarComoLida = useCallback(async (mensagemId: string) => {
    try {
      await updateDoc(doc(db, 'mensagens', mensagemId), {
        lida: true,
      });
    } catch (erro) {
      console.error('Erro ao marcar mensagem como lida:', erro);
    }
  }, []);

  // Carregar canais ao iniciar
  React.useEffect(() => {
    const unsubscribe = carregarCanais();
    return () => {
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [carregarCanais]);

  const valor: ContextoChat = {
    mensagens,
    canais,
    canaisSelecionado: canalSelecionado,
    conversasPrivadas,
    enviarMensagem,
    carregarMensagens,
    carregarConversaPrivada,
    criarCanal,
    marcarComoLida,
  };

  return (
    <ContextoChat.Provider value={valor}>
      {children}
    </ContextoChat.Provider>
  );
};

export const useChat = () => {
  const contexto = useContext(ContextoChat);
  if (contexto === undefined) {
    throw new Error('useChat deve ser usado dentro de ProvvedorChat');
  }
  return contexto;
};
