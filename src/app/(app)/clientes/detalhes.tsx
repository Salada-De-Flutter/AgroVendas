import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProdApi } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
}

export default function ClienteDetalhesScreen() {
  const { clienteId } = useLocalSearchParams<{ clienteId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (clienteId) {
      carregarCliente(clienteId);
    }
  }, [clienteId]);

  const carregarCliente = async (id: string) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const API_URL = useProdApi ? process.env.EXPO_PUBLIC_API_URL || 'https://api.agrosystemapp.com/api' : 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/clientes/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok && data.sucesso && data.cliente) {
        setCliente(data.cliente);
      } else {
        setErrorMessage(data.mensagem || 'Erro ao carregar cliente');
      }
    } catch (error) {
      setErrorMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Cliente</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#ff4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : cliente ? (
        <View style={styles.card}>
          <Ionicons name="person" size={48} color="#4CAF50" style={{ marginBottom: 16 }} />
          <Text style={styles.nome}>{cliente.nome}</Text>
          <Text style={styles.info}>CPF: {cliente.cpf}</Text>
          {cliente.telefone && <Text style={styles.info}>Telefone: {cliente.telefone}</Text>}
          {cliente.email && <Text style={styles.info}>Email: {cliente.email}</Text>}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderRadius: 8,
    margin: 20,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: '#b0b0b0',
    marginBottom: 4,
  },
});
