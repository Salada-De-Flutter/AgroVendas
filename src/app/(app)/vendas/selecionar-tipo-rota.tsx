import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TipoVenda = 'vista_dinheiro' | 'vista_agendado' | 'parcelado';

interface TipoVendaOption {
  id: TipoVenda;
  titulo: string;
  descricao: string;
  icon: string;
  cor: string;
  implementado: boolean;
}

const tiposVenda: TipoVendaOption[] = [
  {
    id: 'vista_dinheiro',
    titulo: 'À Vista - Dinheiro',
    descricao: 'Pagamento imediato em dinheiro',
    icon: 'cash',
    cor: '#4CAF50',
    implementado: false,
  },
  {
    id: 'vista_agendado',
    titulo: 'À Vista - Agendado',
    descricao: 'Pagamento à vista em data futura',
    icon: 'calendar',
    cor: '#2196F3',
    implementado: false,
  },
  {
    id: 'parcelado',
    titulo: 'Parcelado',
    descricao: 'Pagamento em múltiplas parcelas',
    icon: 'card',
    cor: '#FF9800',
    implementado: true,
  },
];

// Rota padrão (depois virá da API)
const rotaPadrao = {
  id: 1,
  nome: 'Rota Padrão',
  descricao: 'Rota principal de vendas',
};

export default function SelecionarTipoRotaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoVenda | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Dados do cliente vindos da tela anterior
  const clienteId = params.clienteId as string;
  const clienteNome = params.clienteNome as string;
  const clienteCpf = params.clienteCpf as string;

  const handleContinuar = () => {
    if (!tipoSelecionado) {
      setErrorMessage('Selecione o tipo de venda');
      return;
    }

    // Verificar se o tipo está implementado
    const tipoSelecionadoObj = tiposVenda.find(t => t.id === tipoSelecionado);
    if (!tipoSelecionadoObj?.implementado) {
      setErrorMessage('Este tipo de venda ainda não está disponível');
      return;
    }

    setErrorMessage('');

    // Navegar para tela de criar venda com todos os dados
    router.push({
      pathname: '/(app)/vendas/criar',
      params: {
        clienteId,
        clienteNome,
        clienteCpf,
        tipoVenda: tipoSelecionado,
        rotaId: rotaPadrao.id.toString(),
        rotaNome: rotaPadrao.nome,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tipo de Venda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info do Cliente */}
          <View style={styles.clienteInfoCard}>
            <Ionicons name="person-circle" size={32} color="#4CAF50" />
            <View style={styles.clienteTexts}>
              <Text style={styles.clienteLabel}>Cliente selecionado:</Text>
              <Text style={styles.clienteNome}>{clienteNome}</Text>
            </View>
          </View>

          {/* Mensagem de erro */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Título da seção */}
          <Text style={styles.sectionTitle}>Selecione o Tipo de Venda:</Text>

          {/* Opções de tipo de venda */}
          {tiposVenda.map((tipo) => (
            <TouchableOpacity
              key={tipo.id}
              style={[
                styles.tipoCard,
                tipoSelecionado === tipo.id && styles.tipoCardSelecionado,
                !tipo.implementado && styles.tipoCardDesabilitado,
              ]}
              onPress={() => tipo.implementado && setTipoSelecionado(tipo.id)}
              disabled={!tipo.implementado}
            >
              <View style={[styles.tipoIcon, { backgroundColor: tipo.cor + '20' }]}>
                <Ionicons name={tipo.icon as any} size={32} color={tipo.cor} />
              </View>
              <View style={styles.tipoInfo}>
                <View style={styles.tipoTituloRow}>
                  <Text style={[styles.tipoTitulo, !tipo.implementado && styles.tipoTituloDesabilitado]}>
                    {tipo.titulo}
                  </Text>
                  {!tipo.implementado && (
                    <View style={styles.emBreveBadge}>
                      <Text style={styles.emBreveText}>Em breve</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tipoDescricao, !tipo.implementado && styles.tipoDescricaoDesabilitada]}>
                  {tipo.descricao}
                </Text>
              </View>
              {tipoSelecionado === tipo.id && tipo.implementado && (
                <Ionicons name="checkmark-circle" size={28} color={tipo.cor} />
              )}
              {!tipo.implementado && (
                <Ionicons name="lock-closed" size={24} color="#666666" />
              )}
            </TouchableOpacity>
          ))}

          {/* Rota (fixa por enquanto) */}
          <Text style={styles.sectionTitle}>Rota:</Text>
          <View style={styles.rotaCard}>
            <View style={styles.rotaIcon}>
              <Ionicons name="navigate" size={24} color="#2196F3" />
            </View>
            <View style={styles.rotaInfo}>
              <Text style={styles.rotaNome}>{rotaPadrao.nome}</Text>
              <Text style={styles.rotaDescricao}>{rotaPadrao.descricao}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>

          {/* Botão de continuar */}
          <TouchableOpacity
            style={[styles.continuarButton, !tipoSelecionado && styles.continuarButtonDisabled]}
            onPress={handleContinuar}
            disabled={!tipoSelecionado}
          >
            <Text style={styles.continuarButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  clienteInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  clienteTexts: {
    marginLeft: 12,
    flex: 1,
  },
  clienteLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 4,
  },
  clienteNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    marginTop: 8,
  },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  tipoCardSelecionado: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  tipoCardDesabilitado: {
    opacity: 0.5,
    backgroundColor: '#1a1a1a',
  },
  tipoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipoInfo: {
    flex: 1,
  },
  tipoTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  tipoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  tipoTituloDesabilitado: {
    color: '#666666',
  },
  tipoDescricao: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  tipoDescricaoDesabilitada: {
    color: '#666666',
  },
  emBreveBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emBreveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  rotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  rotaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F320',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rotaInfo: {
    flex: 1,
  },
  rotaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  rotaDescricao: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  continuarButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  continuarButtonDisabled: {
    opacity: 0.5,
  },
  continuarButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
