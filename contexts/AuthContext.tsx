
import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { hashString } from '../utils/security';

interface AuthContextType {
  user: User | null;
  login: (name: string, password?: string) => Promise<{success: boolean; message: string;}>;
  logout: () => void;
  signup: (name: string, password?: string, securityQuestion?: string, securityAnswer?: string) => Promise<{success: boolean; message: string;}>;
  getSecurityQuestionForUser: (name: string) => Promise<string | null>;
  verifySecurityAnswer: (name: string, answer: string) => Promise<boolean>;
  resetPassword: (name: string, newPassword: string) => Promise<boolean>;
  findUserByName: (name: string) => Promise<User | null>;
  findUserById: (id: string) => Promise<User | null>;
  updateUsername: (userId: string, newName: string) => Promise<{ success: boolean; message: string; }>;
  updatePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string; }>;
  updateSecurity: (userId: string, password: string, newQuestion: string, newAnswer: string) => Promise<{ success: boolean; message: string; }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useLocalStorage<User[]>('studysync-users', []);
  const [user, setUser] = useLocalStorage<User | null>('studysync-currentUser', null);

  const login = async (name: string, password = ''): Promise<{success: boolean, message: string}> => {
    const foundUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!foundUser) {
      return { success: false, message: 'User not found.' };
    }
    const hashedPassword = await hashString(password);
    if (foundUser.password !== hashedPassword) {
        return { success: false, message: 'Invalid password.' };
    }
    const { password: _, securityAnswer: __, ...userForSession } = foundUser;
    setUser(userForSession);
    return { success: true, message: 'Logged in successfully.' };
  };

  const logout = () => {
    setUser(null);
  };

  const signup = async (name: string, password = '', securityQuestion = '', securityAnswer = ''): Promise<{success: boolean, message: string}> => {
     if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return { success: false, message: 'User with this name already exists.' };
     }
     const hashedPassword = await hashString(password);
     const hashedAnswer = await hashString(securityAnswer);
     const newUser: User = {
        id: crypto.randomUUID(),
        name,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedAnswer,
     };
     setUsers([...users, newUser]);
     const { password: _, securityAnswer: __, ...userForSession } = newUser;
     setUser(userForSession);
     return { success: true, message: 'Signed up successfully.' };
  };

  const getSecurityQuestionForUser = async (name: string): Promise<string | null> => {
    const foundUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    return Promise.resolve(foundUser?.securityQuestion || null);
  };
  
  const verifySecurityAnswer = async (name: string, answer: string): Promise<boolean> => {
     const foundUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
     if (!foundUser?.securityAnswer) return Promise.resolve(false);
     const hashedAnswer = await hashString(answer);
     return Promise.resolve(foundUser.securityAnswer === hashedAnswer);
  };

  const resetPassword = async (name: string, newPassword: string): Promise<boolean> => {
     const userIndex = users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
     if (userIndex > -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex].password = await hashString(newPassword);
        setUsers(updatedUsers);
        return Promise.resolve(true);
     }
     return Promise.resolve(false);
  };

  const findUserByName = async (name: string): Promise<User | null> => {
    const foundUser = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!foundUser) return Promise.resolve(null);
    const { password, securityQuestion, securityAnswer, ...safeUser } = foundUser;
    return Promise.resolve(safeUser);
  };

  const findUserById = async (id: string): Promise<User | null> => {
    const foundUser = users.find(u => u.id === id);
    if (!foundUser) return Promise.resolve(null);
    const { password, securityQuestion, securityAnswer, ...safeUser } = foundUser;
    return Promise.resolve(safeUser);
  };

  const updateUsername = async (userId: string, newName: string): Promise<{ success: boolean; message: string; }> => {
    if (users.some(u => u.id !== userId && u.name.toLowerCase() === newName.toLowerCase())) {
        return { success: false, message: 'This name is already taken.' };
    }
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    const updatedUsers = [...users];
    updatedUsers[userIndex].name = newName;
    setUsers(updatedUsers);

    if (user?.id === userId) {
        setUser({ ...user, name: newName });
    }
    return { success: true, message: 'Username updated successfully.' };
  };

  const updatePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string; }> => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    const hashedOldPassword = await hashString(oldPassword);
    if (users[userIndex].password !== hashedOldPassword) {
        return { success: false, message: 'Incorrect current password.' };
    }
    const hashedNewPassword = await hashString(newPassword);
    const updatedUsers = [...users];
    updatedUsers[userIndex].password = hashedNewPassword;
    setUsers(updatedUsers);
    return { success: true, message: 'Password updated successfully.' };
  };

  const updateSecurity = async (userId: string, password: string, newQuestion: string, newAnswer: string): Promise<{ success: boolean; message: string; }> => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return { success: false, message: 'User not found.' };
    }
    const hashedPassword = await hashString(password);
    if (users[userIndex].password !== hashedPassword) {
        return { success: false, message: 'Incorrect password.' };
    }
    const hashedNewAnswer = await hashString(newAnswer);
    const updatedUsers = [...users];
    updatedUsers[userIndex].securityQuestion = newQuestion;
    updatedUsers[userIndex].securityAnswer = hashedNewAnswer;
    setUsers(updatedUsers);
    return { success: true, message: 'Security info updated successfully.' };
  };

  const value = { user, login, logout, signup, getSecurityQuestionForUser, verifySecurityAnswer, resetPassword, findUserByName, findUserById, updateUsername, updatePassword, updateSecurity };

  // No loading state needed for local storage implementation
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
