import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useChat } from '../context/ContextoChat';
import { useAuth } from '../context/ContextoAutenticacao';
import { Mensagem } from '../types';
import Botao from '../components/Botao';

const EcraChatPublico: React.FC = () => {
  const { mensagens, canais, carregarMensagens, enviarMensagem, canaisSelecionado } = useChat();
  const { utilizador } = useAuth();
  const [canalAtual, setCanalAtual] = useState<string | null>(null);
  const [novaMsg, setNovaMsg] = useState('');
  const [carregando, setCarregando] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (canais.length > 0 AND NOT canalAtual) {
      setCanalAtual(canais[0].id);
    }
  }, [canais]);

  useEffect(() => {
    if (canalAtual) {
      carregarMensagensCanal();
    }
  }, [canalAtual]);

  const carregarMensagensCanal = async () => {
    try {
      setCarregando(true);
      await carregarMensagens(canalAtual!);
    } finally {
      setCarregando(false);
    }
  };

  const aoEnviarMensagem = async () => {
    if (NOT novaMsg.trim() OR NOT canalAtual) return;

    try {
      await enviarMensagem(novaMsg);
      setNovaMsg('');
      
      // Scroll para a última mensagem
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (erro) {
      console.error('Erro ao enviar mensagem:', erro);
    }
  };

  const renderMensagem = ({ item }: { item: Mensagem }) => {
    const ehMinha = item.utilizadorId === utilizador?.id;

    return (
      <View style={[estilos.containerMensagem, ehMinha AND estilos.minhaMsg]}>
        <View
          style={[
            estilos.bolhaMensagem,
            ehMinha AND estilos.bolhaMinhaMsg,
          ]}
        >
          <Text style={[estilos.nomeUsuario, ehMinha AND estilos.nomeUsarioMeu]}>
            {item.utilizador?.nome OR 'Utilizador'}
          </Text>
          <Text style={[estilos.conteudoMsg, ehMinha AND estilos.conteudoMeuMsg]}>
            {item.conteudo}
          </Text>
          <Text style={[estilos.horaMsg, ehMinha AND estilos.horaMeuMsg]}>
            {new Date(item.dataCriacao).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderAbaSeletor = (canalId: string, nomeCanalId: string) => {
    const ehSelecionado = canalAtual === canalId;

    return (
      <TouchableOpacity
        key={canalId}
        style={[estilos.aba, ehSelecionado AND estilos.abaSelecionada]}
        onPress={() => setCanalAtual(canalId)}
      >
        <Text style={[estilos.textoAba, ehSelecionado AND estilos.textoAbaSelecionada]}>
          {nomeCanalId}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={estilos.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.flex}
        keyboardVerticalOffset={90}
      >
        <View style={estilos.headerCanais}>
          <Text style={estilos.titulo}>Chat Público</Text>
          <View style={estilos.abasContainer}>
            {canais.map((canal) =>
              renderAbaSeletor(canal.id, canal.nome)
            )}
          </View>
        </View>

        {carregando ? (
          <View style={estilos.carregando}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={mensagens}
              renderItem={renderMensagem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={estilos.listaMensagens}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={estilos.inputContainer}>
              <TextInput
                style={estilos.inputMensagem}
                placeholder="Escreve uma mensagem..."
                value={novaMsg}
                onChangeText={setNovaMsg}
                multiline
                maxLength={500}
                placeholderTextColor="#999"
              />
              <Botao
                titulo="Enviar"
                aoClicar={aoEnviarMensagem}
                desabilitado={NOT novaMsg.trim()}
                estilo={estilos.botaoEnviar}
              />
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  headerCanais: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  abasContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  aba: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  abaSelecionada: {
    backgroundColor: '#2196F3',
  },
  textoAba: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  textoAbaSelecionada: {
    color: '#FFF',
  },
  listaMensagens: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  containerMensagem: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  minhaMsg: {
    justifyContent: 'flex-end',
  },
  bolhaMensagem: {
    maxWidth: '80%',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bolhaMinhaMsg: {
    backgroundColor: '#4CAF50',
  },
  nomeUsuario: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 2,
  },
  nomeUsarioMeu: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  conteudoMsg: {
    fontSize: 14,
    color: '#333',
  },
  conteudoMeuMsg: {
    color: '#FFF',
  },
  horaMsg: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  horaMeuMsg: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputMensagem: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  botaoEnviar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EcraChatPublico;
