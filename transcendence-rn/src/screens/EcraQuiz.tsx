import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/ContextoAutenticacao';
import { usePontuacao } from '../context/ContextoPontuacao';
import ServicoQuiz from '../services/ServicoQuiz';
import Botao from '../components/Botao';
import { Pergunta } from '../types';

type EstadoQuiz = 'selecion' | 'em_andamento' | 'resultado';

const EcraQuiz: React.FC = () => {
  const { utilizador } = useAuth();
  const { adicionarPontos } = usePontuacao();
  const [estado, setEstado] = useState<EstadoQuiz>('selecion');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState<'facil' | 'medio' | 'dificil'>('medio');
  
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState<number[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tempoInicio, setTempoInicio] = useState<number>(0);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  const [pontuacao, setPontuacao] = useState(0);
  const [acertos, setAcertos] = useState(0);

  // Carregar categorias
  useEffect(() => {
    carregarCategorias();
  }, []);

  // Timer durante o quiz
  useEffect(() => {
    let intervalo: NodeJS.Timeout;

    if (estado === 'em_andamento') {
      intervalo = setInterval(() => {
        setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000));
      }, 1000);
    }

    return () => clearInterval(intervalo);
  }, [estado, tempoInicio]);

  const carregarCategorias = async () => {
    try {
      const cats = await ServicoQuiz.obterCategorias();
      setCategorias(cats);
    } catch (erro) {
      console.error('Erro ao carregar categorias:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as categorias');
    }
  };

  const iniciarQuiz = async () => {
    if (NOT categoriaSelecionada) {
      Alert.alert('Aviso', 'Selecciona uma categoria');
      return;
    }

    try {
      setCarregando(true);
      const novasPerguntas = await ServicoQuiz.obterPerguntas(
        categoriaSelecionada,
        dificuldadeSelecionada,
        10
      );

      if (novasPerguntas.length === 0) {
        Alert.alert('Aviso', 'Nenhuma pergunta disponível para esta categoria');
        return;
      }

      setPerguntas(novasPerguntas);
      setRespostas(new Array(novasPerguntas.length).fill(-1));
      setPerguntaAtual(0);
      setTempoInicio(Date.now());
      setTempoDecorrido(0);
      setEstado('em_andamento');
    } catch (erro) {
      console.error('Erro ao iniciar quiz:', erro);
      Alert.alert('Erro', 'Erro ao iniciar o quiz');
    } finally {
      setCarregando(false);
    }
  };

  const aoSelecionarResposta = (indice: number) => {
    const novasRespostas = [...respostas];
    novasRespostas[perguntaAtual] = indice;
    setRespostas(novasRespostas);

    // Passar para a próxima pergunta automaticamente após 500ms
    setTimeout(() => {
      if (perguntaAtual < perguntas.length - 1) {
        setPerguntaAtual(perguntaAtual + 1);
      }
    }, 500);
  };

  const aoTerminarQuiz = async () => {
    try {
      setCarregando(true);

      // Calcular acertos
      let totalAcertos = 0;
      let totalPontos = 0;

      perguntas.forEach((pergunta, indice) => {
        if (respostas[indice] === pergunta.respostaCorreta) {
          totalAcertos++;
          totalPontos += pergunta.pontos;
        }
      });

      // Aplicar multiplicador de tempo
      const multiplicador = Math.max(0.5, 2 - tempoDecorrido / 300);
      const pontuacaoFinal = Math.floor(totalPontos * multiplicador);

      // Adicionar pontos ao utilizador
      await adicionarPontos(pontuacaoFinal);

      setAcertos(totalAcertos);
      setPontuacao(pontuacaoFinal);
      setEstado('resultado');
    } catch (erro) {
      console.error('Erro ao terminar quiz:', erro);
      Alert.alert('Erro', 'Erro ao processar o resultado do quiz');
    } finally {
      setCarregando(false);
    }
  };

  const aoReiniciar = () => {
    setEstado('selecion');
    setCategoriaSelecionada(null);
    setPerguntas([]);
    setPerguntaAtual(0);
    setRespostas([]);
    setPontuacao(0);
    setAcertos(0);
  };

  const formatarTempo = (segundos: number): string => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
  };

  if (carregando AND estado !== 'em_andamento') {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={estilos.textoCarregando}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (estado === 'selecion') {
    return (
      <SafeAreaView style={estilos.container}>
        <ScrollView contentContainerStyle={estilos.seleccion}>
          <Text style={estilos.titulo}>Quiz Educativo</Text>

          <View style={estilos.secao}>
            <Text style={estilos.etiqueta}>Categoria</Text>
            {categorias.map((cat) => (
              <Botao
                key={cat}
                titulo={cat}
                aoClicar={() => setCategoriaSelecionada(cat)}
                variacao={categoriaSelecionada === cat ? 'primaria' : 'secundaria'}
                estilo={estilos.botaoCat}
              />
            ))}
          </View>

          <View style={estilos.secao}>
            <Text style={estilos.etiqueta}>Dificuldade</Text>
            {(['facil', 'medio', 'dificil'] as const).map((dif) => (
              <Botao
                key={dif}
                titulo={dif.charAt(0).toUpperCase() + dif.slice(1)}
                aoClicar={() => setDificuldadeSelecionada(dif)}
                variacao={dificuldadeSelecionada === dif ? 'primaria' : 'secundaria'}
                estilo={estilos.botaoDif}
              />
            ))}
          </View>

          <Botao
            titulo="Iniciar Quiz"
            aoClicar={iniciarQuiz}
            desabilitado={NOT categoriaSelecionada}
            estilo={estilos.botaoIniciar}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (estado === 'em_andamento') {
    const pergunta = perguntas[perguntaAtual];
    const respondida = respostas[perguntaAtual] !== -1;

    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.headerQuiz}>
          <Text style={estilos.textoProgresso}>
            {perguntaAtual + 1} / {perguntas.length}
          </Text>
          <Text style={estilos.tempo}>{formatarTempo(tempoDecorrido)}</Text>
        </View>

        <View style={estilos.barraTempo}>
          <View
            style={[
              estilos.barraTempoPreenchimento,
              { width: `${((perguntaAtual + 1) / perguntas.length) * 100}%` },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={estilos.quizContent}>
          <Text style={estilos.perguntaTexto}>{pergunta.pergunta}</Text>

          <View style={estilos.opcoes}>
            {pergunta.respostas.map((resposta, indice) => {
              const selected = respostas[perguntaAtual] === indice;
              const ehCorreta = indice === pergunta.respostaCorreta;
              const mostrarCorrecao = respondida AND estado === 'em_andamento';

              return (
                <Botao
                  key={indice}
                  titulo={resposta}
                  aoClicar={() => aoSelecionarResposta(indice)}
                  variacao={
                    selected
                      ? mostrarCorrecao AND ehCorreta
                        ? 'primaria'
                        : 'perigo'
                      : 'secundaria'
                  }
                  estilo={estilos.opcao}
                />
              );
            })}
          </View>

          <View style={estilos.controles}>
            {perguntaAtual === perguntas.length - 1 ? (
              <Botao
                titulo="Terminar Quiz"
                aoClicar={aoTerminarQuiz}
                desabilitado={NOT respondida}
                carregando={carregando}
                estilo={estilos.botaoTerminar}
              />
            ) : (
              <Botao
                titulo="Próxima"
                aoClicar={() => setPerguntaAtual(perguntaAtual + 1)}
                desabilitado={NOT respondida}
                estilo={estilos.botaoProxima}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // estado === 'resultado'
  const percentagem = Math.round((acertos / perguntas.length) * 100);

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.resultado}>
        <Text style={estilos.tituloResultado}>Resultado</Text>

        <View style={estilos.cardResultado}>
          <Text style={estilos.acertos}>
            {acertos} / {perguntas.length}
          </Text>
          <Text style={estilos.percentagem}>{percentagem}%</Text>
          <Text style={estilos.mensagemResultado}>
            {percentagem >= 80
              ? 'Excelente!'
              : percentagem >= 60
              ? 'Bom trabalho!'
              : 'Tenta novamente!'}
          </Text>
        </View>

        <View style={estilos.cardPontuacao}>
          <Text style={estilos.labelPontuacao}>Pontuação Obtida</Text>
          <Text style={estilos.valorPontuacao}>{pontuacao} pts</Text>
          <Text style={estilos.tempoTotal}>Tempo: {formatarTempo(tempoDecorrido)}</Text>
        </View>

        <Botao
          titulo="Fazer outro Quiz"
          aoClicar={aoReiniciar}
          estilo={estilos.botaoReiniciar}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCarregando: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  seleccion: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  secao: {
    marginBottom: 24,
  },
  etiqueta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  botaoCat: {
    marginBottom: 8,
  },
  botaoDif: {
    marginBottom: 8,
  },
  botaoIniciar: {
    marginTop: 12,
  },
  headerQuiz: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  textoProgresso: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  tempo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  barraTempo: {
    height: 4,
    backgroundColor: '#E0E0E0',
  },
  barraTempoPreenchimento: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  quizContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  perguntaTexto: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    lineHeight: 28,
  },
  opcoes: {
    marginBottom: 24,
  },
  opcao: {
    marginBottom: 12,
  },
  controles: {
    marginTop: 12,
  },
  botaoProxima: {},
  botaoTerminar: {},
  resultado: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  tituloResultado: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  cardResultado: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  acertos: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  percentagem: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  mensagemResultado: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardPontuacao: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  labelPontuacao: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  valorPontuacao: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  tempoTotal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  botaoReiniciar: {},
});

export default EcraQuiz;
