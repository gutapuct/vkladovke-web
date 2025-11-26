import { createContext, useContext } from "react";

export const NavigationGuardContext = createContext({
    shouldBlock: false,
    setShouldBlock: () => {},
    confirmIfNeeded: (action) => action && action(),
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);
