import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  vendedorNome?: string;
}

export default function SelecionarClienteScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    carregarClientes();
  }, []);

  // Buscar no servidor quando o usuário digita (com debounce)
  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Aguardar 500ms após parar de digitar para buscar
    timeoutRef.current = setTimeout(() => {
      console.log('🔍 Busca com debounce:', busca);
      carregarClientes(busca.trim());
    }, 500);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [busca]);

  const carregarClientes = async (termoBusca: string = '') => {
    try {
      setLoading(true);
      setErrorMessage('');

      // Construir URL com parâmetro de busca se fornecido
      let url = API_ENDPOINTS.CLIENTES.LIST;
      if (termoBusca) {
        url += `?busca=${encodeURIComponent(termoBusca)}`;
        console.log('🌐 Buscando no servidor:', termoBusca);
      } else {
        console.log('🌐 Carregando todos os clientes (sem busca)');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📄 Resposta da API:', {
        sucesso: data.sucesso,
        total: data.clientes?.length || 0,
        termoBusca: termoBusca || 'sem busca'
      });

      if (response.ok && data.sucesso) {
        const clientesCarregados = data.clientes || [];
        console.log('✅ Clientes definidos no estado:', clientesCarregados.length);
        setClientes(clientesCarregados);
      } else {
        setErrorMessage(data.mensagem || 'Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      setErrorMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const formatarCPF = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '');
    
    if (numeros.length !== 11) return cpf;
    
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const selecionarCliente = (cliente: Cliente) => {
    router.push({
      pathname: '/(app)/vendas/selecionar-tipo-rota',
      params: {
        clienteId: cliente.id.toString(),
        clienteNome: cliente.nome,
        clienteCpf: cliente.cpf,
      },
    });
  };

  const renderCliente = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      style={styles.clienteItem}
      onPress={() => selecionarCliente(item)}
    >
      <View style={styles.clienteIconContainer}>
        <Ionicons name="person" size={24} color="#4CAF50" />
      </View>
      <View style={styles.clienteInfo}>
        <Text style={styles.clienteNome}>{item.nome}</Text>
        <Text style={styles.clienteCpf}>CPF: {formatarCPF(item.cpf)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666666" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecionar Cliente</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Campo de Busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou CPF..."
          placeholderTextColor="#666666"
          value={busca}
          onChangeText={(text) => {
            setBusca(text);
          }}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={20} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Mensagem de erro */}
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#ff4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Lista de Clientes */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {busca ? 'Buscando...' : 'Carregando clientes...'}
          </Text>
        </View>
      ) : clientes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#666666" />
          <Text style={styles.emptyText}>
            {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </Text>
          {busca && (
            <Text style={styles.emptySubtext}>
              Tente buscar por outro nome ou CPF
            </Text>
          )}
        </View>
      ) : (
        <>
          <Text style={styles.resultadosText}>
            {clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
            {busca && ` para "${busca}"`}
          </Text>
          <FlatList
            data={clientes}
            renderItem={renderCliente}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    margin: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resultadosText: {
    color: '#666666',
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clienteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  clienteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a3a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  clienteCpf: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  clienteVendedor: {
    fontSize: 12,
    color: '#808080',
    fontStyle: 'italic',
  },
});
