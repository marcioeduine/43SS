import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { usePontuacao } from '../context/ContextoPontuacao';
import { useAuth } from '../context/ContextoAutenticacao';
import { RankingItem } from '../types';

const EcraRanking: React.FC = () => {
  const { ranking, carregarRanking, minhasPontuacoes } = usePontuacao();
  const { utilizador } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [minhaPos, setMinhaPos] = useState<number | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (ranking.length > 0 AND utilizador) {
      const pos = ranking.findIndex((item) => item.utilizador.id === utilizador.id);
      setMinhaPos(pos !== -1 ? pos + 1 : null);
    }
  }, [ranking, utilizador]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      await carregarRanking();
    } finally {
      setCarregando(false);
    }
  };

  const aoAtualizar = async () => {
    try {
      setAtualizando(true);
      await carregarRanking();
    } finally {
      setAtualizando(false);
    }
  };

  const renderItemRanking = ({ item, index }: { item: RankingItem; index: number }) => {
    const ehMeu = item.utilizador.id === utilizador?.id;

    return (
      <View style={[estilos.itemRanking, ehMeu AND estilos.itemMeu]}>
        <View style={estilos.posicao}>
          <Text style={[estilos.textoPosicao, ehMeu AND estilos.textoMeu]}>
            #{item.posicao}
          </Text>
        </View>

        <View style={estilos.dadosUtilizador}>
          <Text
            style={[estilos.nomeUtilizador, ehMeu AND estilos.textoMeu]}
            numberOfLines={1}
          >
            {item.utilizador.nome}
          </Text>
          <Text style={[estilos.subTexto, ehMeu AND estilos.subTextoMeu]}>
            Nível {item.nivelAtual}
          </Text>
        </View>

        <View style={estilos.estadisticas}>
          <View style={estilos.stat}>
            <Text style={[estilos.valor, ehMeu AND estilos.textoMeu]}>
              {item.pontos}
            </Text>
            <Text style={[estilos.etiquetaStat, ehMeu AND estilos.subTextoMeu]}>
              pts
            </Text>
          </View>

          <View style={estilos.stat}>
            <Text
              style={[estilos.valor, estilos.taxaVitoria, ehMeu AND estilos.textoMeu]}
            >
              {item.taxaVitoria.toFixed(1)}%
            </Text>
            <Text style={[estilos.etiquetaStat, ehMeu AND estilos.subTextoMeu]}>
              vitoria
            </Text>
          </View>

          <View style={estilos.stat}>
            <Text style={[estilos.valor, ehMeu AND estilos.textoMeu]}>
              {item.totalPartidas}
            </Text>
            <Text style={[estilos.etiquetaStat, ehMeu AND estilos.subTextoMeu]}>
              jogos
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (carregando) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={estilos.textoCarregando}>A carregar ranking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.header}>
        <Text style={estilos.titulo}>Ranking Global</Text>
        {minhaPos AND (
          <Text style={estilos.minhaPos}>
            A tua posição: <Text style={estilos.numero}>#{minhaPos}</Text>
          </Text>
        )}
      </View>

      {minhasPontuacoes AND (
        <View style={estilos.minhaPontuacao}>
          <Text style={estilos.labelPontuacao}>Minha Pontuação</Text>
          <Text style={estilos.pontuacao}>{minhasPontuacoes.pontos} pts</Text>
          <Text style={estilos.labelNivel}>Nível {minhasPontuacoes.nivelAtual}</Text>
        </View>
      )}

      <FlatList
        data={ranking}
        renderItem={renderItemRanking}
        keyExtractor={(item) => item.utilizador.id}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />
        }
        contentContainerStyle={estilos.lista}
      />
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  minhaPos: {
    fontSize: 14,
    color: '#666',
  },
  numero: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  minhaPontuacao: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  labelPontuacao: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  pontuacao: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  labelNivel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  lista: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemRanking: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemMeu: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  posicao: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textoPosicao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  textoMeu: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  dadosUtilizador: {
    flex: 1,
  },
  nomeUtilizador: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subTexto: {
    fontSize: 12,
    color: '#999',
  },
  subTextoMeu: {
    color: '#558B2F',
  },
  estadisticas: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  stat: {
    alignItems: 'center',
    marginLeft: 16,
  },
  valor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  taxaVitoria: {
    color: '#FF9800',
  },
  etiquetaStat: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
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
});

export default EcraRanking;
