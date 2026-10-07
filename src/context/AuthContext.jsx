import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getUsers, getMyProfile, logoutUser, isMockMode, getMockSessionUserId, MOCK_AUTH_EVENT } from '../services/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // currentUser is now the real logged-in person's row from `users`
  // (linked via auth_user_id to their Supabase Auth account) — not a
  // freely-switchable mock identity anymore.
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfileFor = async (authUserId) => {
    try {
      const profile = await getMyProfile(authUserId);
      setCurrentUser(profile || null);
    } catch (err) {
      console.error('Error loading profile:', err);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // وضع التجربة المحلي (من غير Supabase): الجلسة محفوظة في المتصفح.
    if (isMockMode()) {
      const syncMock = async () => {
        const id = getMockSessionUserId();
        await loadProfileFor(id);
        if (mounted) setLoading(false);
      };
      syncMock();
      window.addEventListener(MOCK_AUTH_EVENT, syncMock);
      return () => {
        mounted = false;
        window.removeEventListener(MOCK_AUTH_EVENT, syncMock);
      };
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const activeSession = data?.session || null;
      setSession(activeSession);
      if (activeSession?.user) {
        await loadProfileFor(activeSession.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (!mounted) return;
      setSession(activeSession);
      if (activeSession?.user) {
        loadProfileFor(activeSession.user.id);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Full roster, used only for legitimate "who else is here" views (e.g. a
  // parent's own list of children, or the admin's user-management table) —
  // not for switching WHO you're logged in as. Loaded once someone is
  // actually signed in; refreshUsers lets a screen that just added/edited/
  // deleted someone pull the roster again.
  const refreshUsers = async () => {
    try {
      const users = await getUsers();
      setAllUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshUsers();
    } else {
      setAllUsers([]);
    }
  }, [currentUser?.id]);

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSession(null);
  };

  // Kept only for picking between accounts of the SAME role (e.g. a family
  // with more than one child) — can never be used to switch into a
  // different, more privileged role.
  const selectUser = (user) => {
    if (!currentUser || !user || user.role !== currentUser.role) return;
    setCurrentUser(user);
  };

  // بعد أي تعديل في "بياناتي" أو تبديل دور حساب التدريب، نعيد قراية
  // الحساب عشان الواجهة كلها تتحدث فورًا.
  const refreshProfile = async () => {
    if (isMockMode()) {
      await loadProfileFor(getMockSessionUserId());
    } else if (session?.user?.id) {
      await loadProfileFor(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role: currentUser?.role || null,
        currentUser,
        allUsers,
        loading,
        logout,
        selectUser,
        refreshUsers,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
