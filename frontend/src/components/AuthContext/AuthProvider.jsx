import react , {createContext, useContext, useState} from "react";

const AuthContext=createContext();

export const AuthProvider=({children})=>{
  const [userId, setUserId]=useState(null);

  const login=(id)=>{setUserId(id)};
  const signup=(id)=>{setUserId(id)};
  const logout=()=>{setUserId(null)};

  return(
    <AuthContext.Provider value={{login,logout,signup,userId}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth=()=>{
  return useContext(AuthContext);
};