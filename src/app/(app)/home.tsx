import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const drawerTranslateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const handleLogout = async () => {
    closeDrawer();
    await signOut();
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

          <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
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
            <Text style={styles.userName}>{user?.nome || 'Vendedor'}</Text>
          </View>
        </View>

        {/* Conteúdo */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Mensagem de Boas-vindas */}
          <View style={styles.welcomeCard}>
            <Ionicons name="cart" size={48} color="#4CAF50" />
            <Text style={styles.welcomeTitle}>Bem-vindo ao AgroVendas</Text>
            <Text style={styles.welcomeText}>
              Comece adicionando seus clientes
            </Text>
          </View>

          {/* Ação Principal */}
          <TouchableOpacity style={styles.mainActionButton} onPress={() => router.push('/(app)/clientes/adicionar')}>
            <View style={styles.mainActionIcon}>
              <Ionicons name="person-add" size={32} color="#ffffff" />
            </View>
            <View style={styles.mainActionContent}>
              <Text style={styles.mainActionTitle}>Adicionar Novo Cliente</Text>
              <Text style={styles.mainActionSubtitle}>Cadastrar um cliente no sistema</Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#4CAF50" />
          </TouchableOpacity>

          {/* Nova Venda */}
          <TouchableOpacity style={styles.secondaryActionButton} onPress={() => router.push('/(app)/vendas/selecionar-cliente')}>
            <View style={[styles.mainActionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="cart" size={32} color="#ffffff" />
            </View>
            <View style={styles.mainActionContent}>
              <Text style={styles.mainActionTitle}>Nova Venda</Text>
              <Text style={styles.mainActionSubtitle}>Registrar uma venda</Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color="#2196F3" />
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
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  welcomeCard: {
    backgroundColor: '#2a2a2a',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  mainActionIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainActionContent: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  mainActionSubtitle: {
    fontSize: 14,
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
