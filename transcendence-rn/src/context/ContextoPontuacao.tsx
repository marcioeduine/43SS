import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Pontuacao, RankingItem, ContextoPontuacao } from '../types';
import { useAuth } from './ContextoAutenticacao';

const ContextoPontuacao = createContext<ContextoPontuacao | undefined>(undefined);

export const ProvvedorPontuacao: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { utilizador } = useAuth();
  const [minhasPontuacoes, setMinhasPontuacoes] = useState<Pontuacao | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  // Calcular nível baseado em pontos
  const calcularNivel = (pontos: number): number => {
    return Math.floor(pontos / 1000) + 1;
  };

  // Carregar minhas pontuações
  const carregarPontuacoes = useCallback(async () => {
    if (!utilizador) return;

    try {
      const docRef = doc(db, 'pontuacoes', utilizador.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setMinhasPontuacoes({
          id: docSnap.id,
          ...docSnap.data(),
        } as Pontuacao);
      }
    } catch (erro) {
      console.error('Erro ao carregar pontuações:', erro);
    }
  }, [utilizador]);

  // Carregar ranking geral
  const carregarRanking = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'pontuacoes'),
        orderBy('pontos', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      
      const rankingData = await Promise.all(
        snapshot.docs.map(async (docSnap, indice) => {
          const dados = docSnap.data() as Pontuacao;
          
          // Buscar dados do utilizador
          const userDoc = await getDoc(doc(db, 'utilizadores', dados.utilizadorId));
          const userData = userDoc.data();

          // Buscar estatísticas de partidas
          const partidasRef = collection(db, 'partidas');
          const q1 = query(partidasRef, where('jogador1Id', '==', dados.utilizadorId));
          const q2 = query(partidasRef, where('jogador2Id', '==', dados.utilizadorId));
          
          const snap1 = await getDocs(q1);
          const snap2 = await getDocs(q2);

          let vitórias = 0;
          let derrotas = 0;

          snap1.docs.forEach((doc) => {
            if (doc.data().vencedorId === dados.utilizadorId) vitórias++;
            else derrotas++;
          });

          snap2.docs.forEach((doc) => {
            if (doc.data().vencedorId === dados.utilizadorId) vitórias++;
            else derrotas++;
          });

          const totalPartidas = vitórias + derrotas;
          const taxaVitoria = totalPartidas > 0 ? (vitórias / totalPartidas) * 100 : 0;

          return {
            posicao: indice + 1,
            utilizador: userData as any,
            pontos: dados.pontos,
            nivelAtual: calcularNivel(dados.pontos),
            taxaVitoria,
            totalPartidas,
          } as RankingItem;
        })
      );

      setRanking(rankingData);
    } catch (erro) {
      console.error('Erro ao carregar ranking:', erro);
    }
  }, []);

  // Adicionar pontos
  const adicionarPontos = useCallback(
    async (quantidade: number) => {
      if (!utilizador) throw new Error('Utilizador não autenticado');

      try {
        const docRef = doc(db, 'pontuacoes', utilizador.id);
        
        await updateDoc(docRef, {
          pontos: increment(quantidade),
          dataAtualizacao: new Date(),
        });

        // Recarregar pontuações
        await carregarPontuacoes();
      } catch (erro) {
        console.error('Erro ao adicionar pontos:', erro);
        throw erro;
      }
    },
    [utilizador, carregarPontuacoes]
  );

  // Recarregar pontuações e ranking periodicamente
  useEffect(() => {
    if (!utilizador) return;

    carregarPontuacoes();
    carregarRanking();

    const intervalo = setInterval(() => {
      carregarPontuacoes();
      carregarRanking();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(intervalo);
  }, [utilizador, carregarPontuacoes, carregarRanking]);

  const valor: ContextoPontuacao = {
    minhasPontuacoes,
    ranking,
    carregarPontuacoes,
    carregarRanking,
    adicionarPontos,
  };

  return (
    <ContextoPontuacao.Provider value={valor}>
      {children}
    </ContextoPontuacao.Provider>
  );
};

export const usePontuacao = () => {
  const contexto = useContext(ContextoPontuacao);
  if (contexto === undefined) {
    throw new Error('usePontuacao deve ser usado dentro de ProvvedorPontuacao');
  }
  return contexto;
};
