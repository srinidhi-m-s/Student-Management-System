
import { createContext } from "react";
//import { AuthContext } from "./AuthContext";
import type { AuthContextType } from "@/types/AuthContextType";

export const AuthContext = createContext<AuthContextType | null>(null);

