import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, ContextoAutenticacao } from '../types';

const ContextoAuth = createContext<ContextoAutenticacao | undefined>(undefined);

export const ProvvedorAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [utilizador, setUtilizador] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Buscar dados do utilizador no Firestore
          const docRef = doc(db, 'utilizadores', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUtilizador({
              id: firebaseUser.uid,
              ...docSnap.data(),
            } as User);
          }
        } else {
          setUtilizador(null);
        }
      } catch (erro) {
        console.error('Erro ao buscar dados do utilizador:', erro);
        setErro('Erro ao carregar dados do utilizador');
      } finally {
        setCarregando(false);
      }
    });

    return unsubscribe;
  }, []);

  const autenticar = async (email: string, senha: string) => {
    try {
      setErro(null);
      const resultado = await signInWithEmailAndPassword(auth, email, senha);
      
      // Actualizar último acesso
      const docRef = doc(db, 'utilizadores', resultado.user.uid);
      await updateDoc(docRef, {
        ultimoAcesso: new Date(),
        estaOnline: true,
      });
    } catch (erro: any) {
      setErro(erro.message || 'Erro ao autenticar');
      throw erro;
    }
  };

  const registrar = async (email: string, senha: string, nome: string) => {
    try {
      setErro(null);
      const resultado = await createUserWithEmailAndPassword(auth, email, senha);
      
      // Criar documento do utilizador
      const docRef = doc(db, 'utilizadores', resultado.user.uid);
      const novoUtilizador: User = {
        id: resultado.user.uid,
        email,
        nome,
        dataRegistro: new Date(),
        ultimoAcesso: new Date(),
        estaOnline: true,
      };
      
      await setDoc(docRef, novoUtilizador);
      
      // Criar documento de pontuação inicial
      const docPontuacao = doc(db, 'pontuacoes', resultado.user.uid);
      await setDoc(docPontuacao, {
        utilizadorId: resultado.user.uid,
        pontos: 0,
        nivelAtual: 1,
        dataAtualizacao: new Date(),
      });
      
      setUtilizador(novoUtilizador);
    } catch (erro: any) {
      setErro(erro.message || 'Erro ao registrar');
      throw erro;
    }
  };

  const logout = async () => {
    try {
      setErro(null);
      
      // Actualizar estado online
      if (utilizador) {
        const docRef = doc(db, 'utilizadores', utilizador.id);
        await updateDoc(docRef, {
          estaOnline: false,
        });
      }
      
      await signOut(auth);
      setUtilizador(null);
    } catch (erro: any) {
      setErro(erro.message || 'Erro ao fazer logout');
      throw erro;
    }
  };

  const atualizarPerfil = async (dados: Partial<User>) => {
    try {
      setErro(null);
      if (!utilizador) throw new Error('Utilizador não autenticado');
      
      const docRef = doc(db, 'utilizadores', utilizador.id);
      await updateDoc(docRef, {
        ...dados,
        ultimoAcesso: new Date(),
      });
      
      setUtilizador({
        ...utilizador,
        ...dados,
      });
    } catch (erro: any) {
      setErro(erro.message || 'Erro ao actualizar perfil');
      throw erro;
    }
  };

  const valor: ContextoAutenticacao = {
    utilizador,
    carregando,
    erro,
    autenticar,
    registrar,
    logout,
    atualizarPerfil,
  };

  return (
    <ContextoAuth.Provider value={valor}>
      {children}
    </ContextoAuth.Provider>
  );
};

export const useAuth = () => {
  const contexto = useContext(ContextoAuth);
  if (contexto === undefined) {
    throw new Error('useAuth deve ser usado dentro de ProvvedorAuth');
  }
  return contexto;
};
