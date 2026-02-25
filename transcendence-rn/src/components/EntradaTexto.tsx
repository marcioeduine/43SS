import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';

interface EntradaTextoProps extends TextInputProps {
  etiqueta?: string;
  valor: string;
  aoMudar: (texto: string) => void;
  placeholder?: string;
  tipo?: 'texto' | 'email' | 'senha' | 'numero';
  erro?: string;
  obrigatoria?: boolean;
  estilo?: ViewStyle;
  multilinhas?: boolean;
}

const EntradaTexto: React.FC<EntradaTextoProps> = ({
  etiqueta,
  valor,
  aoMudar,
  placeholder,
  tipo = 'texto',
  erro,
  obrigatoria = false,
  estilo,
  multilinhas = false,
  ...props
}) => {
  const obterTipoEntrada = () => {
    switch (tipo) {
      case 'email':
        return 'email-address';
      case 'senha':
        return 'default';
      case 'numero':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const ehSenha = tipo === 'senha';

  return (
    <View style={[estilos.container, estilo]}>
      {etiqueta && (
        <Text style={estilos.etiqueta}>
          {etiqueta}
          {obrigatoria && <Text style={estilos.obrigatoria}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[estilos.entrada, multilinhas && estilos.entradaMultilinhas, erro && estilos.entradaErro]}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        keyboardType={obterTipoEntrada()}
        secureTextEntry={ehSenha}
        placeholderTextColor="#999"
        multiline={multilinhas}
        numberOfLines={multilinhas ? 4 : 1}
        {...props}
      />
      {erro && <Text style={estilos.mensagemErro}>{erro}</Text>}
    </View>
  );
};

const estilos = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  obrigatoria: {
    color: '#F44336',
  },
  entrada: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFF',
  },
  entradaMultilinhas: {
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  entradaErro: {
    borderColor: '#F44336',
  },
  mensagemErro: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
});

export default EntradaTexto;
