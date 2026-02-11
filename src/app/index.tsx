import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  console.log('[Welcome] Loading:', loading, '| Authenticated:', isAuthenticated);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    console.log('[Welcome] Mostrando tela de loading');
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="cart" size={80} color="#4CAF50" />
        </View>
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  // Se já está autenticado, não mostrar nada (o AuthContext vai redirecionar)
  if (isAuthenticated) {
    console.log('[Welcome] Usuario autenticado, aguardando redirecionamento');
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  console.log('[Welcome] Mostrando tela de boas-vindas');
  return (
    <View style={styles.container}>
      {/* Ícone principal */}
      <View style={styles.iconContainer}>
        <Ionicons name="cart" size={80} color="#4CAF50" />
      </View>

      {/* Título */}
      <Text style={styles.title}>Bem-vindo ao AgroVendas</Text>
      
      {/* Subtítulo */}
      <Text style={styles.subtitle}>
        Gerencie suas vendas agrícolas de forma simples e eficiente
      </Text>

      {/* Botão */}
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
    backgroundColor: '#2a2a2a',
    padding: 30,
    borderRadius: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    color: '#b0b0b0',
    fontSize: 16,
    marginTop: 10,
  },
});
