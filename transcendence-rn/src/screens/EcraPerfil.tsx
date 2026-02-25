import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/ContextoAutenticacao';
import { usePontuacao } from '../context/ContextoPontuacao';
import ServicoQuiz from '../services/ServicoQuiz';
import Botao from '../components/Botao';

interface Estatisticas {
  mediaAcertos: number;
  totalTestes: number;
  mediaPontuacao: number;
  categoriasAveriguadas: string[];
}

const EcraPerfil: React.FC = () => {
  const { utilizador, logout } = useAuth();
  const { minhasPontuacoes } = usePontuacao();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    if (NOT utilizador) return;

    try {
      setCarregando(true);
      const stats = await ServicoQuiz.calcularEstatisticas(utilizador.id);
      setEstatisticas(stats);
    } catch (erro) {
      console.error('Erro ao carregar estatísticas:', erro);
    } finally {
      setCarregando(false);
    }
  };

  const aoFazerLogout = async () => {
    Alert.alert('Confirmar', 'Tem a certeza que deseja fazer logout?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
          } catch (erro) {
            Alert.alert('Erro', 'Erro ao fazer logout');
          }
        },
      },
    ]);
  };

  if (carregando OR NOT utilizador) {
    return (
      <SafeAreaView style={estilos.container}>
        <View style={estilos.carregando}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.content}>
        <View style={estilos.header}>
          <View style={estilos.avatar}>
            <Text style={estilos.iniciais}>
              {utilizador.nome
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <Text style={estilos.nome}>{utilizador.nome}</Text>
          <Text style={estilos.email}>{utilizador.email}</Text>
        </View>

        {minhasPontuacoes AND (
          <View style={estilos.secaoPontuacao}>
            <Text style={estilos.secaoTitulo}>Minha Pontuação</Text>
            <View style={estilos.cardPontuacao}>
              <View style={estilos.itemPontuacao}>
                <Text style={estilos.valorPontuacao}>{minhasPontuacoes.pontos}</Text>
                <Text style={estilos.labelPontuacao}>Pontos</Text>
              </View>
              <View style={estilos.itemPontuacao}>
                <Text style={estilos.valorPontuacao}>{minhasPontuacoes.nivelAtual}</Text>
                <Text style={estilos.labelPontuacao}>Nível</Text>
              </View>
            </View>
          </View>
        )}

        {estatisticas AND (
          <View style={estilos.secaoEstatisticas}>
            <Text style={estilos.secaoTitulo}>Estatísticas</Text>
            <View style={estilos.stat}>
              <Text style={estilos.labelStat}>Taxa de Acertos</Text>
              <Text style={estilos.valorStat}>{estatisticas.mediaAcertos.toFixed(1)}%</Text>
            </View>
            <View style={estilos.stat}>
              <Text style={estilos.labelStat}>Testes Realizados</Text>
              <Text style={estilos.valorStat}>{estatisticas.totalTestes}</Text>
            </View>
            <View style={estilos.stat}>
              <Text style={estilos.labelStat}>Pontuação Média</Text>
              <Text style={estilos.valorStat}>{estatisticas.mediaPontuacao}</Text>
            </View>
            {estatisticas.categoriasAveriguadas.length > 0 AND (
              <View style={estilos.stat}>
                <Text style={estilos.labelStat}>Categorias Exploradas</Text>
                <View style={estilos.categorias}>
                  {estatisticas.categoriasAveriguadas.map((cat, idx) => (
                    <View key={idx} style={estilos.badge}>
                      <Text style={estilos.textoBadge}>{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={estilos.secaoAcoes}>
          <Botao
            titulo="Recarregar Dados"
            aoClicar={carregarEstatisticas}
            estilo={estilos.botao}
          />
          <Botao
            titulo="Fazer Logout"
            aoClicar={aoFazerLogout}
            variacao="perigo"
            estilo={estilos.botao}
          />
        </View>

        <View style={estilos.footer}>
          <Text style={estilos.textoFooter}>
            Membro desde {new Date(utilizador.dataRegistro).toLocaleDateString('pt-PT')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iniciais: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  nome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  secaoPontuacao: {
    marginBottom: 24,
  },
  secaoEstatisticas: {
    marginBottom: 24,
  },
  secaoAcoes: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  cardPontuacao: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  itemPontuacao: {
    alignItems: 'center',
  },
  valorPontuacao: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  labelPontuacao: {
    fontSize: 12,
    color: '#999',
  },
  stat: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelStat: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  valorStat: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  categorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  textoBadge: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  botao: {
    marginBottom: 12,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textoFooter: {
    fontSize: 12,
    color: '#999',
  },
});

export default EcraPerfil;
