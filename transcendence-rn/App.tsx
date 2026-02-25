import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ProvvedorAuth } from './src/context/ContextoAutenticacao';
import { ProvvedorChat } from './src/context/ContextoChat';
import { ProvvedorPontuacao } from './src/context/ContextoPontuacao';
import Navegacao from './src/navigation/Navegacao';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProvvedorAuth>
        <ProvvedorPontuacao>
          <ProvvedorChat>
            <Navegacao />
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
          </ProvvedorChat>
        </ProvvedorPontuacao>
      </ProvvedorAuth>
    </GestureHandlerRootView>
  );
};

export default App;
