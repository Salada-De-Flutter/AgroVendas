import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StorageService } from '../../services/storage';

const DRAWER_WIDTH = 280;

export default function HomeScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    const user = await StorageService.getUser();
    setUsuario(user);
  };

  const handleLogout = async () => {
    await StorageService.clearAll();
    router.replace('/');
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { pageX } = evt.nativeEvent;
        const { dx, dy } = gestureState;
        return !drawerOpen && pageX < 50 && dx > 5 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newPosition = Math.max(-DRAWER_WIDTH, Math.min(0, -DRAWER_WIDTH + gestureState.dx));
        drawerTranslateX.setValue(newPosition);
        const progress = (DRAWER_WIDTH + newPosition) / DRAWER_WIDTH;
        overlayOpacity.setValue(progress * 0.5);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newPosition = Math.max(-DRAWER_WIDTH, Math.min(0, -DRAWER_WIDTH + gestureState.dx));
        const shouldOpen = newPosition > -DRAWER_WIDTH * 0.5;
        
        if (shouldOpen) {
          openDrawer();
        } else {
          closeDrawer();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Drawer Overlay */}
      {drawerOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity 
            style={styles.overlayTouchable}
            onPress={closeDrawer}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Drawer */}
      <Animated.View 
        style={[styles.drawer, { transform: [{ translateX: drawerTranslateX }] }]}
      >
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Menu</Text>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.drawerContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="storefront-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Minhas Vendas</Text>
              <Text style={styles.drawerItemSubtitle}>Ver histórico de vendas</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="people-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Clientes</Text>
              <Text style={styles.drawerItemSubtitle}>Gerenciar clientes</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Produtos</Text>
              <Text style={styles.drawerItemSubtitle}>Catálogo de produtos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Relatórios</Text>
              <Text style={styles.drawerItemSubtitle}>Análise de vendas</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.drawerDivider} />

          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="settings-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Configurações</Text>
              <Text style={styles.drawerItemSubtitle}>Ajustes do sistema</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); handleLogout(); }}>
            <View style={[styles.drawerIconContainer, { backgroundColor: '#3a1a1a' }]}>
              <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            </View>
            <View style={styles.drawerTextContainer}>
              <Text style={styles.drawerItemTitle}>Sair</Text>
              <Text style={styles.drawerItemSubtitle}>Encerrar sessão</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Container Principal */}
      <View style={styles.mainContainer} {...panResponder.panHandlers}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.userName}>{usuario?.nome || 'Vendedor'}</Text>
          </View>
        </View>

        {/* Conteúdo */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Visão Geral */}
          <Text style={styles.sectionTitle}>Visão Geral</Text>

          {/* Card Vendas do Mês */}
          <View style={[styles.metricCard, styles.metricCardLarge, { borderTopColor: '#4CAF50' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.metricLabel}>Vendas do Mês</Text>
            </View>
            <Text style={styles.metricValueLarge}>R$ 12.450,00</Text>
            <Text style={styles.metricSubtext}>+15% em relação ao mês passado</Text>
          </View>

          {/* Cards em 2 colunas */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, styles.metricCardHalf, { borderTopColor: '#2196F3' }]}>
              <View style={styles.cardHeaderSmall}>
                <Ionicons name="cart" size={20} color="#2196F3" />
                <Text style={styles.metricLabel}>Vendas</Text>
              </View>
              <Text style={styles.metricValueMedium}>47</Text>
              <Text style={styles.metricSubtext}>Este mês</Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardHalf, { borderTopColor: '#FF9800' }]}>
              <View style={styles.cardHeaderSmall}>
                <Ionicons name="people" size={20} color="#FF9800" />
                <Text style={styles.metricLabel}>Clientes</Text>
              </View>
              <Text style={styles.metricValueMedium}>23</Text>
              <Text style={styles.metricSubtext}>Ativos</Text>
            </View>
          </View>

          {/* Produtos Mais Vendidos */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Produtos Mais Vendidos</Text>
          
          <View style={styles.productCard}>
            <View style={styles.productIcon}>
              <Ionicons name="leaf" size={28} color="#4CAF50" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Fertilizante NPK</Text>
              <Text style={styles.productQuantity}>85 unidades vendidas</Text>
            </View>
            <Text style={styles.productValue}>R$ 3.400</Text>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productIcon}>
              <Ionicons name="water" size={28} color="#2196F3" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Adubo Orgânico</Text>
              <Text style={styles.productQuantity}>62 unidades vendidas</Text>
            </View>
            <Text style={styles.productValue}>R$ 2.480</Text>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productIcon}>
              <Ionicons name="bug" size={28} color="#FF5722" />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>Defensivo Agrícola</Text>
              <Text style={styles.productQuantity}>45 unidades vendidas</Text>
            </View>
            <Text style={styles.productValue}>R$ 2.250</Text>
          </View>

          {/* Ações Rápidas */}
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Ações Rápidas</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="add-circle-outline" size={28} color="#4CAF50" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Nova Venda</Text>
              <Text style={styles.menuSubtitle}>Registrar uma nova venda</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="person-add-outline" size={28} color="#4CAF50" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Novo Cliente</Text>
              <Text style={styles.menuSubtitle}>Cadastrar um novo cliente</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#1a3a1a' }]}>
              <Ionicons name="cube-outline" size={28} color="#4CAF50" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Estoque</Text>
              <Text style={styles.menuSubtitle}>Gerenciar produtos em estoque</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Menu Inferior */}
        <View style={styles.bottomMenu}>
          <TouchableOpacity style={styles.bottomMenuItem} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#4CAF50" />
            <Text style={styles.bottomMenuLabel}>Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomMenuItem}>
            <Ionicons name="home" size={24} color="#4CAF50" />
            <Text style={[styles.bottomMenuLabel, { color: '#4CAF50' }]}>Início</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomMenuItem}>
            <Ionicons name="bar-chart-outline" size={24} color="#b0b0b0" />
            <Text style={styles.bottomMenuLabel}>Relatórios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomMenuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            <Text style={styles.bottomMenuLabel}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  mainContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#1a1a1a',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 8,
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  drawerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  drawerTextContainer: {
    flex: 1,
  },
  drawerItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  drawerItemSubtitle: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  metricCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderTopWidth: 3,
  },
  metricCardLarge: {
    padding: 20,
    marginBottom: 12,
  },
  metricCardHalf: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  metricValueLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  metricValueMedium: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#888',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  productIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  productValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#b0b0b0',
  },
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    height: 64,
  },
  bottomMenuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomMenuLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    marginTop: 2,
  },
});
