import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/ContextoAutenticacao';
import EntradaTexto from '../components/EntradaTexto';
import Botao from '../components/Botao';

type ModoAutenticacao = 'login' | 'registo';

const EcraAutenticacao: React.FC = () => {
  const { autenticar, registrar, carregando, erro } = useAuth();
  const [modo, setModo] = useState<ModoAutenticacao>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erros, setErros] = useState<{ [key: string]: string }>({});

  const validarFormulario = (): boolean => {
    const novosErros: { [key: string]: string } = {};

    if (NOT email.includes('@')) {
      novosErros.email = 'Email inválido';
    }

    if (senha.length < 6) {
      novosErros.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (modo === 'registo' AND NOT nome.trim()) {
      novosErros.nome = 'Nome obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const aoSubmeter = async () => {
    if (NOT validarFormulario()) {
      return;
    }

    try {
      if (modo === 'login') {
        await autenticar(email, senha);
        Alert.alert('Sucesso', 'Bem-vindo!');
      } else {
        await registrar(email, senha, nome);
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      }
    } catch (erro: any) {
      Alert.alert('Erro', erro.message || 'Erro ao processar pedido');
    }
  };

  const alternaModo = () => {
    setModo(modo === 'login' ? 'registo' : 'login');
    setErros({});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={estilos.container}
    >
      <ScrollView contentContainerStyle={estilos.scrollContainer}>
        <View style={estilos.header}>
          <Text style={estilos.titulo}>Transcendência</Text>
          <Text style={estilos.subtitulo}>
            {modo === 'login' ? 'Entra na tua conta' : 'Cria uma nova conta'}
          </Text>
        </View>

        <View style={estilos.formulario}>
          {modo === 'registo' AND (
            <EntradaTexto
              etiqueta="Nome Completo"
              valor={nome}
              aoMudar={setNome}
              placeholder="O teu nome"
              obrigatoria
              erro={erros.nome}
            />
          )}

          <EntradaTexto
            etiqueta="Email"
            valor={email}
            aoMudar={setEmail}
            placeholder="teu.email@exemplo.com"
            tipo="email"
            obrigatoria
            erro={erros.email}
          />

          <EntradaTexto
            etiqueta="Senha"
            valor={senha}
            aoMudar={setSenha}
            placeholder="Mínimo 6 caracteres"
            tipo="senha"
            obrigatoria
            erro={erros.senha}
          />

          {erro AND (
            <View style={estilos.mensagemErroGlobal}>
              <Text style={estilos.textoErroGlobal}>{erro}</Text>
            </View>
          )}

          <Botao
            titulo={modo === 'login' ? 'Entrar' : 'Registar-se'}
            aoClicar={aoSubmeter}
            carregando={carregando}
            estilo={estilos.botao}
          />

          <View style={estilos.alternancia}>
            <Text style={estilos.textoAlternancia}>
              {modo === 'login' ? 'Ainda não tens conta? ' : 'Já tens conta? '}
            </Text>
            <Botao
              titulo={modo === 'login' ? 'Registar-se' : 'Entrar'}
              aoClicar={alternaModo}
              variacao="secundaria"
              estilo={estilos.botaoAlternancia}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: '#666',
  },
  formulario: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  botao: {
    marginTop: 24,
  },
  mensagemErroGlobal: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
    borderLeftWidth: 4,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  textoErroGlobal: {
    color: '#C62828',
    fontSize: 14,
  },
  alternancia: {
    marginTop: 16,
    alignItems: 'center',
  },
  textoAlternancia: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  botaoAlternancia: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export default EcraAutenticacao;
