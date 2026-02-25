import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Torneio, Partida, TabelaTorneio } from '../types';

class ServicoTorneio {
  // Criar torneio
  async criarTorneio(
    nome: string,
    descricao: string,
    dataInicio: Date,
    maxParticipantes: number,
    estrutura: 'eliminatoria' | 'grupos' | 'liga',
    criadorId: string
  ): Promise<string> {
    try {
      const novoTorneio: Torneio = {
        id: '',
        nome,
        descricao,
        dataCriacao: new Date(),
        dataInicio,
        estado: 'planejamento',
        maxParticipantes,
        participantes: [criadorId],
        estrutura,
      };

      const docRef = await addDoc(collection(db, 'torneios'), novoTorneio);
      return docRef.id;
    } catch (erro) {
      console.error('Erro ao criar torneio:', erro);
      throw erro;
    }
  }

  // Obter torneio
  async obterTorneio(torneioId: string): Promise<Torneio | null> {
    try {
      const docRef = doc(db, 'torneios', torneioId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Torneio;
      }
      return null;
    } catch (erro) {
      console.error('Erro ao obter torneio:', erro);
      throw erro;
    }
  }

  // Listar torneios
  async listarTorneios(estado?: string): Promise<Torneio[]> {
    try {
      let q;
      if (estado) {
        q = query(
          collection(db, 'torneios'),
          where('estado', '==', estado),
          orderBy('dataCriacao', 'desc')
        );
      } else {
        q = query(
          collection(db, 'torneios'),
          orderBy('dataCriacao', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Torneio[];
    } catch (erro) {
      console.error('Erro ao listar torneios:', erro);
      throw erro;
    }
  }

  // Juntar-se a um torneio
  async juntarTorneio(torneioId: string, utilizadorId: string): Promise<void> {
    try {
      const docRef = doc(db, 'torneios', torneioId);
      const torneio = await getDoc(docRef);

      if (!torneio.exists()) throw new Error('Torneio não encontrado');

      const dados = torneio.data() as Torneio;
      
      if (dados.participantes.includes(utilizadorId)) {
        throw new Error('Já estás registado neste torneio');
      }

      if (dados.participantes.length >= dados.maxParticipantes) {
        throw new Error('Torneio lotado');
      }

      await updateDoc(docRef, {
        participantes: arrayUnion(utilizadorId),
      });
    } catch (erro) {
      console.error('Erro ao juntar-se ao torneio:', erro);
      throw erro;
    }
  }

  // Sair de um torneio
  async sairTorneio(torneioId: string, utilizadorId: string): Promise<void> {
    try {
      const docRef = doc(db, 'torneios', torneioId);
      
      await updateDoc(docRef, {
        participantes: arrayRemove(utilizadorId),
      });
    } catch (erro) {
      console.error('Erro ao sair do torneio:', erro);
      throw erro;
    }
  }

  // Iniciar torneio
  async iniciarTorneio(torneioId: string): Promise<void> {
    try {
      const docRef = doc(db, 'torneios', torneioId);
      
      await updateDoc(docRef, {
        estado: 'em_andamento',
        dataInicio: new Date(),
      });

      // Gerar partidas iniciais (dependendo da estrutura)
      await this.gerarPartidas(torneioId);
    } catch (erro) {
      console.error('Erro ao iniciar torneio:', erro);
      throw erro;
    }
  }

  // Gerar partidas (baseado na estrutura do torneio)
  private async gerarPartidas(torneioId: string): Promise<void> {
    try {
      const torneio = await this.obterTorneio(torneioId);
      if (!torneio) throw new Error('Torneio não encontrado');

      const participantes = torneio.participantes;

      if (torneio.estrutura === 'eliminatoria') {
        // Gerar eliminatória simples (parear sequencialmente)
        for (let i = 0; i < participantes.length - 1; i += 2) {
          await addDoc(collection(db, 'partidas'), {
            torneioId,
            jogador1Id: participantes[i],
            jogador2Id: participantes[i + 1],
            estado: 'pendente',
            pontos1: 0,
            pontos2: 0,
            data: new Date(),
          });
        }
      } else if (torneio.estrutura === 'liga') {
        // Gerar liga (todos contra todos)
        for (let i = 0; i < participantes.length; i++) {
          for (let j = i + 1; j < participantes.length; j++) {
            await addDoc(collection(db, 'partidas'), {
              torneioId,
              jogador1Id: participantes[i],
              jogador2Id: participantes[j],
              estado: 'pendente',
              pontos1: 0,
              pontos2: 0,
              data: new Date(),
            });
          }
        }
      }
    } catch (erro) {
      console.error('Erro ao gerar partidas:', erro);
      throw erro;
    }
  }

  // Registar resultado de partida
  async registrarResultado(
    partidaId: string,
    pontos1: number,
    pontos2: number,
    vencedorId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'partidas', partidaId);
      
      await updateDoc(docRef, {
        pontos1,
        pontos2,
        vencedorId,
        estado: 'finalizada',
      });
    } catch (erro) {
      console.error('Erro ao registrar resultado:', erro);
      throw erro;
    }
  }

  // Obter partidas de um torneio
  async obterPartidas(torneioId: string, estado?: string): Promise<Partida[]> {
    try {
      let q;
      if (estado) {
        q = query(
          collection(db, 'partidas'),
          where('torneioId', '==', torneioId),
          where('estado', '==', estado)
        );
      } else {
        q = query(
          collection(db, 'partidas'),
          where('torneioId', '==', torneioId)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Partida[];
    } catch (erro) {
      console.error('Erro ao obter partidas:', erro);
      throw erro;
    }
  }

  // Obter tabela do torneio
  async obterTabelaTorneio(torneioId: string): Promise<TabelaTorneio | null> {
    try {
      const torneio = await this.obterTorneio(torneioId);
      if (!torneio) return null;

      const partidas = await this.obterPartidas(torneioId, 'finalizada');

      // Calcular pontos e posições
      const tabelaMap = new Map();

      for (const participante of torneio.participantes) {
        tabelaMap.set(participante, {
          utilizadorId: participante,
          pontos: 0,
          vitórias: 0,
          derrotas: 0,
        });
      }

      for (const partida of partidas) {
        const entrada1 = tabelaMap.get(partida.jogador1Id);
        const entrada2 = tabelaMap.get(partida.jogador2Id);

        if (partida.vencedorId === partida.jogador1Id) {
          entrada1.vitórias++;
          entrada1.pontos += 3;
          entrada2.derrotas++;
        } else if (partida.vencedorId === partida.jogador2Id) {
          entrada2.vitórias++;
          entrada2.pontos += 3;
          entrada1.derrotas++;
        }
      }

      // Ordenar por pontos
      const tabelaOrdenada = Array.from(tabelaMap.values())
        .sort((a, b) => b.pontos - a.pontos)
        .map((entrada, indice) => ({
          ...entrada,
          posicao: indice + 1,
        }));

      // Buscar dados dos utilizadores
      const tabelaComUtilizadores = await Promise.all(
        tabelaOrdenada.map(async (entrada) => {
          const userDoc = await getDoc(doc(db, 'utilizadores', entrada.utilizadorId));
          return {
            ...entrada,
            utilizador: userDoc.data(),
          };
        })
      );

      return {
        torneioId,
        participantes: tabelaComUtilizadores,
      };
    } catch (erro) {
      console.error('Erro ao obter tabela do torneio:', erro);
      throw erro;
    }
  }

  // Finalizar torneio
  async finalizarTorneio(torneioId: string): Promise<void> {
    try {
      const docRef = doc(db, 'torneios', torneioId);
      
      await updateDoc(docRef, {
        estado: 'finalizado',
        dataFim: new Date(),
      });
    } catch (erro) {
      console.error('Erro ao finalizar torneio:', erro);
      throw erro;
    }
  }
}

export default new ServicoTorneio();
