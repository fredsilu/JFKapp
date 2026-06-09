// src/hooks/useWebModalBack.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';

type UseWebModalBackParams = {
    visible: boolean;
    onClose: () => void;
};

export function useWebModalBack({ visible, onClose }: UseWebModalBackParams) {
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if (!visible) return;

        window.history.pushState({ modal: true }, '');

        const handlePopState = () => {
            onClose();
            window.history.pushState(null, '');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [visible, onClose]);
}