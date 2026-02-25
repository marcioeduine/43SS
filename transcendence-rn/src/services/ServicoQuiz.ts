import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Pergunta, Teste } from '../types';

class ServicoQuiz {
  // Obter perguntas por categoria
  async obterPerguntas(
    categoria: string,
    dificuldade?: 'facil' | 'medio' | 'dificil',
    limite: number = 10
  ): Promise<Pergunta[]> {
    try {
      let q;
      if (dificuldade) {
        q = query(
          collection(db, 'perguntas'),
          where('categoria', '==', categoria),
          where('dificuldade', '==', dificuldade),
          orderBy('id')
        );
      } else {
        q = query(
          collection(db, 'perguntas'),
          where('categoria', '==', categoria),
          orderBy('id')
        );
      }

      const snapshot = await getDocs(q);
      const perguntas = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Pergunta[];

      // Embaralhar e retornar o número límite
      return this.embaralhar(perguntas).slice(0, limite);
    } catch (erro) {
      console.error('Erro ao obter perguntas:', erro);
      throw erro;
    }
  }

  // Obter todas as categorias
  async obterCategorias(): Promise<string[]> {
    try {
      const snapshot = await getDocs(collection(db, 'perguntas'));
      const categorias = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const categoria = doc.data().categoria;
        if (categoria) categorias.add(categoria);
      });

      return Array.from(categorias).sort();
    } catch (erro) {
      console.error('Erro ao obter categorias:', erro);
      throw erro;
    }
  }

  // Criar teste (quiz)
  async criarTeste(
    utilizadorId: string,
    perguntas: Pergunta[]
  ): Promise<string> {
    try {
      const teste: Teste = {
        id: '',
        utilizadorId,
        perguntas,
        respostas: [],
        pontuacaoFinal: 0,
        dataInicio: new Date(),
        dataFim: new Date(),
        dataEmpresa: 0,
        acertou: [],
      };

      const docRef = await addDoc(collection(db, 'testes'), teste);
      return docRef.id;
    } catch (erro) {
      console.error('Erro ao criar teste:', erro);
      throw erro;
    }
  }

  // Submeter respostas do teste
  async submeterTeste(
    testeId: string,
    respostas: number[],
    tempoGasto: number
  ): Promise<{ pontuacao: number; acertos: boolean[] }> {
    try {
      const docRef = doc(db, 'testes', testeId);
      const testeSnap = await getDoc(docRef);

      if (!testeSnap.exists()) throw new Error('Teste não encontrado');

      const teste = testeSnap.data() as Teste;
      const acertos: boolean[] = [];
      let pontosTotais = 0;

      // Calcular acertos
      teste.perguntas.forEach((pergunta, indice) => {
        const acertou = respostas[indice] === pergunta.respostaCorreta;
        acertos.push(acertou);
        
        if (acertou) {
          pontosTotais += pergunta.pontos;
        }
      });

      // Aplicar multiplicador baseado no tempo (quizzes rápidos dão mais pontos)
      const multiplicador = Math.max(0.5, 2 - tempoGasto / 300); // De 0.5x a 2x
      const pontuacaoFinal = Math.floor(pontosTotais * multiplicador);

      // Actualizar teste
      await updateDoc(docRef, {
        respostas,
        acertou: acertos,
        pontuacaoFinal,
        dataFim: new Date(),
        dataEmpresa: tempoGasto,
      });

      return {
        pontuacao: pontuacaoFinal,
        acertos,
      };
    } catch (erro) {
      console.error('Erro ao submeter teste:', erro);
      throw erro;
    }
  }

  // Obter histórico de testes de um utilizador
  async obterHistoricoTestes(utilizadorId: string, limite: number = 20): Promise<Teste[]> {
    try {
      const q = query(
        collection(db, 'testes'),
        where('utilizadorId', '==', utilizadorId),
        orderBy('dataFim', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.slice(0, limite).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teste[];
    } catch (erro) {
      console.error('Erro ao obter histórico de testes:', erro);
      throw erro;
    }
  }

  // Calcular estatísticas de desempenho
  async calcularEstatisticas(utilizadorId: string): Promise<{
    mediaAcertos: number;
    totalTestes: number;
    mediaPontuacao: number;
    categoriasAveriguadas: string[];
  }> {
    try {
      const testes = await this.obterHistoricoTestes(utilizadorId, 100);

      if (testes.length === 0) {
        return {
          mediaAcertos: 0,
          totalTestes: 0,
          mediaPontuacao: 0,
          categoriasAveriguadas: [],
        };
      }

      let totalAcertos = 0;
      let totalPerguntas = 0;
      let totalPontuacao = 0;
      const categoriasSet = new Set<string>();

      testes.forEach((teste) => {
        totalPerguntas += teste.acertou.length;
        totalAcertos += teste.acertou.filter((x) => x).length;
        totalPontuacao += teste.pontuacaoFinal;
        teste.perguntas.forEach((p) => categoriasSet.add(p.categoria));
      });

      const mediaAcertos = (totalAcertos / totalPerguntas) * 100;
      const mediaPontuacao = Math.floor(totalPontuacao / testes.length);

      return {
        mediaAcertos: Math.round(mediaAcertos * 100) / 100,
        totalTestes: testes.length,
        mediaPontuacao,
        categoriasAveriguadas: Array.from(categoriasSet),
      };
    } catch (erro) {
      console.error('Erro ao calcular estatísticas:', erro);
      throw erro;
    }
  }

  // Método auxiliar para embaralhar array
  private embaralhar<T>(array: T[]): T[] {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  // Importar perguntas do banco de dados original (RMMZ)
  async importarPerguntas(perguntas: Pergunta[]): Promise<void> {
    try {
      for (const pergunta of perguntas) {
        await addDoc(collection(db, 'perguntas'), pergunta);
      }
      console.log(`${perguntas.length} perguntas importadas com sucesso`);
    } catch (erro) {
      console.error('Erro ao importar perguntas:', erro);
      throw erro;
    }
  }
}

export default new ServicoQuiz();
