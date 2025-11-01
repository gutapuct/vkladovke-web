import { useState, useLayoutEffect } from "react";

export const useVisualViewportHeight = () => {
    const [height, setHeight] = useState(undefined);

    useLayoutEffect(() => {
        const updateHeight = () => {
            if (!window.visualViewport) {
                setHeight(undefined);
                return;
            }

            setHeight(window.visualViewport.height);
        };

        updateHeight();

        window.visualViewport?.addEventListener("resize", updateHeight);

        const timeout = setTimeout(updateHeight, 300);

        return () => {
            clearTimeout(timeout);
            window.visualViewport?.removeEventListener("resize", updateHeight);
        };
    }, []);

    return height;
};
