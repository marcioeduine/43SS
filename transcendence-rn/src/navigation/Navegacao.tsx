import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/ContextoAutenticacao';
import EcraAutenticacao from '../screens/EcraAutenticacao';
import EcraChatPublico from '../screens/EcraChatPublico';
import EcraRanking from '../screens/EcraRanking';
import EcraQuiz from '../screens/EcraQuiz';
import EcraPerfil from '../screens/EcraPerfil';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const NavegadorPublico = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Screen name="Autenticacao" component={EcraAutenticacao} />
  </Stack.Navigator>
);

const NavegadorPrivado = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        borderTopColor: '#E0E0E0',
        borderTopWidth: 1,
        backgroundColor: '#FFF',
        paddingVertical: 8,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        marginTop: 4,
      },
    })}
  >
    <Tab.Screen
      name="Quiz"
      component={EcraQuiz}
      options={{
        tabBarLabel: 'Quiz',
        tabBarIcon: ({ color, size }) => (
          // Aqui seria um ícone, por simplicidade, apenas usamos texto
          <Text style={{ color, fontSize: size }}>📚</Text>
        ),
      }}
    />

    <Tab.Screen
      name="Chat"
      component={EcraChatPublico}
      options={{
        tabBarLabel: 'Chat',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>💬</Text>
        ),
      }}
    />

    <Tab.Screen
      name="Ranking"
      component={EcraRanking}
      options={{
        tabBarLabel: 'Ranking',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>🏆</Text>
        ),
      }}
    />

    <Tab.Screen
      name="Perfil"
      component={EcraPerfil}
      options={{
        tabBarLabel: 'Perfil',
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size }}>👤</Text>
        ),
      }}
    />
  </Tab.Navigator>
);

const Navegacao: React.FC = () => {
  const { utilizador, carregando } = useAuth();

  if (carregando) {
    return null; // Aqui deveria estar um ecrã de carregamento
  }

  return (
    <NavigationContainer>
      {utilizador ? <NavegadorPrivado /> : <NavegadorPublico />}
    </NavigationContainer>
  );
};

export default Navegacao;
