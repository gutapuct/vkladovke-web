import { useState, useLayoutEffect, useCallback } from "react";

export interface VisualViewportState {
    height: number | undefined;
    offsetTop: number;
    isKeyboardOpen: boolean;
}

export const useVisualViewportHeight = (): VisualViewportState => {
    const [state, setState] = useState<VisualViewportState>({
        height: undefined,
        offsetTop: 0,
        isKeyboardOpen: false,
    });

    const updateState = useCallback(() => {
        if (!window.visualViewport) {
            setState({ height: undefined, offsetTop: 0, isKeyboardOpen: false });
            return;
        }

        const vv = window.visualViewport;
        const windowHeight = window.innerHeight;
        const isKeyboardOpen = vv.height < windowHeight * 0.75;

        setState({
            height: vv.height,
            offsetTop: vv.offsetTop,
            isKeyboardOpen,
        });
    }, []);

    useLayoutEffect(() => {
        updateState();

        const handleResize = () => updateState();
        const handleScroll = () => updateState();

        window.visualViewport?.addEventListener("resize", handleResize);
        window.visualViewport?.addEventListener("scroll", handleScroll);

        const timeout = setTimeout(updateState, 300);

        return () => {
            clearTimeout(timeout);
            window.visualViewport?.removeEventListener("resize", handleResize);
            window.visualViewport?.removeEventListener("scroll", handleScroll);
        };
    }, [updateState]);

    return state;
};
