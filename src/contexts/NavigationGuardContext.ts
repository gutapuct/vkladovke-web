import { createContext, useContext, Dispatch, SetStateAction } from "react";

export interface NavigationGuardContextValue {
    shouldBlock: boolean;
    setShouldBlock: Dispatch<SetStateAction<boolean>>;
    confirmIfNeeded: (action: () => void) => void;
}

export const NavigationGuardContext = createContext<NavigationGuardContextValue>({
    shouldBlock: false,
    setShouldBlock: () => {
    },
    confirmIfNeeded: (action: () => void) => action && action(),
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);
