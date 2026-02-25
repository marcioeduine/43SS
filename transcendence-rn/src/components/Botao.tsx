import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BotaoProps {
  titulo: string;
  aoClicar: () => void;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
  desabilitado?: boolean;
  variacao?: 'primaria' | 'secundaria' | 'perigo';
  carregando?: boolean;
}

const Botao: React.FC<BotaoProps> = ({
  titulo,
  aoClicar,
  estilo,
  estiloTexto,
  desabilitado = false,
  variacao = 'primaria',
  carregando = false,
}) => {
  const estiloBase = [
    estilos.botao,
    estilos[`botao_${variacao}`],
    desabilitado && estilos.botaoDesabilitado,
    estilo,
  ];

  return (
    <TouchableOpacity
      style={estiloBase}
      onPress={aoClicar}
      disabled={desabilitado || carregando}
      activeOpacity={0.7}
    >
      <Text
        style={[
          estilos.texto,
          estilos[`texto_${variacao}`],
          desabilitado && estilos.textoDesabilitado,
          estiloTexto,
        ]}
      >
        {carregando ? 'Aguardando...' : titulo}
      </Text>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  botao: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botao_primaria: {
    backgroundColor: '#4CAF50',
  },
  botao_secundaria: {
    backgroundColor: '#2196F3',
  },
  botao_perigo: {
    backgroundColor: '#F44336',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
  texto_primaria: {
    color: '#FFFFFF',
  },
  texto_secundaria: {
    color: '#FFFFFF',
  },
  texto_perigo: {
    color: '#FFFFFF',
  },
  textoDesabilitado: {
    opacity: 0.7,
  },
});

export default Botao;
