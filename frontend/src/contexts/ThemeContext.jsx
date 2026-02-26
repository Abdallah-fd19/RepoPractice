import { useState, useContext, createContext, useEffect } from "react"

const ThemeContext = createContext();

export const ThemeProvider =  ({children})=> {
    // Read the initial value of theme
    const [theme, setTheme] = useState(()=>{
        return localStorage.getItem("theme") || "light";
    });

    // Apply theme to <html> 
    useEffect(()=>{
        const root = document.documentElement; // <html>

        if (theme === "dark"){
            root.classList.add("dark");        
        }
        else{
            root.classList.remove("dark")   
        }
        
        localStorage.setItem("theme", theme)
    }, [theme]);

    // Toggle function 
    const toggleTheme = ()=> {
        setTheme(prev => prev === "light" ? "dark" : "light");
    }

    return(
        <ThemeContext.Provider value={{theme, toggleTheme}}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    return context
}