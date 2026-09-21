import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

const ThemeContext = createContext(null);


export const ThemeProvider = ({
    children
}) => {

    const [darkMode, setDarkMode] =
        useState(() => {

            const savedTheme =
                localStorage.getItem("theme");

            return savedTheme === "dark";
        });


    useEffect(() => {

        localStorage.setItem(
            "theme",
            darkMode
                ? "dark"
                : "light"
        );

    }, [darkMode]);


    const toggleDarkMode = () => {

        setDarkMode(
            previous => !previous
        );

    };


    return (

        <ThemeContext.Provider
            value={{
                darkMode,
                setDarkMode,
                toggleDarkMode
            }}
        >

            {children}

        </ThemeContext.Provider>

    );
};


export const useTheme = () => {

    const context =
        useContext(ThemeContext);


    if (!context) {

        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );

    }


    return context;
};