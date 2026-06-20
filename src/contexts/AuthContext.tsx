'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, Shop } from '@/types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  shop: Shop | null;
  loading: boolean;
  isOwner: boolean;
  isManager: boolean;
  isAdmin: boolean;       // owner OR manager
  isSuperAdmin: boolean;
  canEditUser: (target: User) => boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  user: null,
  shop: null,
  loading: true,
  isOwner: false,
  isManager: false,
  isAdmin: false,
  isSuperAdmin: false,
  canEditUser: () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(fbUser: FirebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);

        if (userData.shopId) {
          const shopDoc = await getDoc(doc(db, 'shops', userData.shopId));
          if (shopDoc.exists()) {
            setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop);
          }
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }

  const refreshUser = async () => {
    if (firebaseUser) await loadUserData(firebaseUser);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setShop(null);
  };

  // Kiểm tra xem user hiện tại có quyền sửa target không
  const canEditUser = (target: User): boolean => {
    if (!user) return false;
    if (user.id === target.id) return true; // tự sửa bản thân
    if (user.role === 'super_admin') return true;
    if (user.role === 'owner' && target.role !== 'super_admin') return true;
    // manager chỉ sửa được staff — không sửa owner/manager khác
    if (user.role === 'manager' && target.role === 'staff') return true;
    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadUserData(fbUser);
      } else {
        setUser(null);
        setShop(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager';
  const isAdmin = isOwner || isManager;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        shop,
        loading,
        isOwner,
        isManager,
        isAdmin,
        isSuperAdmin,
        canEditUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
