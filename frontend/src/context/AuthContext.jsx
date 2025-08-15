import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, getStoredUser, isAuthenticated } from '../services/api';

// État initial
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Création du Context
const AuthContext = createContext();

// Provider du Context
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // Query pour obtenir l'utilisateur actuel
  const { data: currentUserData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated(), // Ne faire la query que si token présent
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initAuth = () => {
      try {
        if (isAuthenticated()) {
          const storedUser = getStoredUser();
          if (storedUser) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: storedUser });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initAuth();
  }, []);

  // Mettre à jour l'état quand la query utilisateur change
  useEffect(() => {
    if (currentUserData?.success) {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: currentUserData.data.user });
    } else if (userError) {
      // Token invalide, nettoyer
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      queryClient.clear();
    }
  }, [currentUserData, userError, queryClient]);

  // Mettre à jour le loading state
  useEffect(() => {
    if (isAuthenticated()) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: userLoading });
    } else {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  }, [userLoading]);

  // Actions du Context
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response.data.user });
        
        // Invalider et refetch les queries
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        
        return { success: true };
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.message });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      // Nettoyer toutes les queries
      queryClient.clear();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      queryClient.clear();
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
    
    // Mettre à jour le cache de la query
    queryClient.setQueryData(['currentUser'], (oldData) => ({
      ...oldData,
      data: { user: userData }
    }));
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Fonctions utilitaires
  const hasRole = (requiredRole) => {
    if (!state.user || !state.user.roles) return false;
    
    // Admin a tous les droits
    if (state.user.roles.includes('admin')) return true;
    
    return state.user.roles.includes(requiredRole);
  };

  const hasAnyRole = (requiredRoles) => {
    if (!Array.isArray(requiredRoles)) return hasRole(requiredRoles);
    return requiredRoles.some(role => hasRole(role));
  };

  const isAdmin = () => hasRole('admin');
  const isBlogAdmin = () => hasAnyRole(['admin', 'blogadmin']);
  const isCareerAdmin = () => hasAnyRole(['admin', 'careeradmin']);
  const isContentAdmin = () => hasAnyRole(['admin', 'contentadmin']);

  // Valeur du Context
  const value = {
    // État
    ...state,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    
    // Utilitaires
    hasRole,
    hasAnyRole,
    isAdmin,
    isBlogAdmin,
    isCareerAdmin,
    isContentAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};

// HOC pour protéger les routes avec loading en Tailwind pur
export const withAuth = (WrappedComponent, requiredRoles = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasAnyRole, loading } = useAuth();
    
    // Loading spinner en Tailwind pur
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyner-teal"></div>
            <p className="text-gray-600 text-sm">Chargement...</p>
          </div>
        </div>
      );
    }
    
    // Rediriger si pas authentifié
    if (!isAuthenticated) {
      window.location.href = '/admin/login';
      return null;
    }
    
    // Page d'erreur de permissions en Tailwind pur
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-cyner-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors duration-200"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;