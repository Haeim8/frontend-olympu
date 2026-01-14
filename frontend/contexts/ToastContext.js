"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Error translations for blockchain errors
const errorTranslations = {
    // ethers.js error codes
    CALL_EXCEPTION: {
        fr: "Erreur d'appel au contrat. Vérifiez que vous êtes sur le bon réseau.",
        en: "Contract call failed. Please check you're on the correct network.",
        es: "Error de llamada al contrato. Verifique que está en la red correcta."
    },
    ACTION_REJECTED: {
        fr: "Transaction annulée par l'utilisateur.",
        en: "Transaction cancelled by user.",
        es: "Transacción cancelada por el usuario."
    },
    INSUFFICIENT_FUNDS: {
        fr: "Fonds insuffisants pour effectuer cette transaction.",
        en: "Insufficient funds to complete this transaction.",
        es: "Fondos insuficientes para completar esta transacción."
    },
    NETWORK_ERROR: {
        fr: "Erreur réseau. Vérifiez votre connexion internet.",
        en: "Network error. Please check your internet connection.",
        es: "Error de red. Verifique su conexión a internet."
    },
    UNPREDICTABLE_GAS_LIMIT: {
        fr: "Impossible d'estimer le gas. La transaction pourrait échouer.",
        en: "Unable to estimate gas. The transaction might fail.",
        es: "No se puede estimar el gas. La transacción podría fallar."
    },
    NONCE_EXPIRED: {
        fr: "Transaction expirée. Veuillez réessayer.",
        en: "Transaction expired. Please try again.",
        es: "Transacción expirada. Por favor, inténtelo de nuevo."
    },
    TRANSACTION_REPLACED: {
        fr: "Transaction remplacée par une autre.",
        en: "Transaction was replaced by another one.",
        es: "La transacción fue reemplazada por otra."
    },
    REPLACEMENT_UNDERPRICED: {
        fr: "Le prix du gas est trop bas pour remplacer la transaction.",
        en: "Gas price too low to replace the transaction.",
        es: "El precio del gas es demasiado bajo para reemplazar la transacción."
    },
    SERVER_ERROR: {
        fr: "Erreur serveur. Veuillez réessayer plus tard.",
        en: "Server error. Please try again later.",
        es: "Error del servidor. Por favor, inténtelo más tarde."
    },
    TIMEOUT: {
        fr: "La requête a expiré. Veuillez réessayer.",
        en: "Request timed out. Please try again.",
        es: "La solicitud ha expirado. Por favor, inténtelo de nuevo."
    },
    UNKNOWN_ERROR: {
        fr: "Une erreur inconnue s'est produite.",
        en: "An unknown error occurred.",
        es: "Se ha producido un error desconocido."
    },
    // Wallet/Account errors
    WRONG_NETWORK: {
        fr: "Mauvais réseau. Veuillez passer sur Base Sepolia.",
        en: "Wrong network. Please switch to Base Sepolia.",
        es: "Red incorrecta. Por favor, cambie a Base Sepolia."
    },
    WALLET_NOT_CONNECTED: {
        fr: "Portefeuille non connecté. Veuillez vous connecter.",
        en: "Wallet not connected. Please connect your wallet.",
        es: "Billetera no conectada. Por favor, conecte su billetera."
    },
    // Default
    DEFAULT: {
        fr: "Une erreur s'est produite. Veuillez réessayer.",
        en: "An error occurred. Please try again.",
        es: "Se ha producido un error. Por favor, inténtelo de nuevo."
    }
};

// Parse ethers.js errors and return translation key
function parseError(error) {
    if (!error) return 'DEFAULT';

    // Check for error code directly
    if (error.code) {
        if (errorTranslations[error.code]) {
            return error.code;
        }
    }

    // Check error message for known patterns
    const message = error.message || error.toString();

    if (message.includes('user rejected') || message.includes('User denied')) {
        return 'ACTION_REJECTED';
    }
    if (message.includes('insufficient funds') || message.includes('INSUFFICIENT_FUNDS')) {
        return 'INSUFFICIENT_FUNDS';
    }
    if (message.includes('CALL_EXCEPTION') || message.includes('call revert exception')) {
        return 'CALL_EXCEPTION';
    }
    if (message.includes('network') || message.includes('NETWORK_ERROR')) {
        return 'NETWORK_ERROR';
    }
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
        return 'TIMEOUT';
    }
    if (message.includes('nonce')) {
        return 'NONCE_EXPIRED';
    }
    if (message.includes('replacement') || message.includes('underpriced')) {
        return 'REPLACEMENT_UNDERPRICED';
    }
    if (message.includes('gas')) {
        return 'UNPREDICTABLE_GAS_LIMIT';
    }
    if (message.includes('wrong network') || message.includes('chain')) {
        return 'WRONG_NETWORK';
    }
    if (message.includes('wallet') || message.includes('not connected')) {
        return 'WALLET_NOT_CONNECTED';
    }

    return 'DEFAULT';
}

// Toast Context
const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Component
function Toast({ toast, onClose }) {
    const icons = {
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const bgColors = {
        error: 'bg-red-500/10 border-red-500/30',
        success: 'bg-green-500/10 border-green-500/30',
        warning: 'bg-yellow-500/10 border-yellow-500/30',
        info: 'bg-blue-500/10 border-blue-500/30'
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl ${bgColors[toast.type]} animate-in slide-in-from-right-5 duration-300`}
            role="alert"
        >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="font-semibold text-foreground text-sm">{toast.title}</p>
                )}
                <p className="text-sm text-foreground/80 break-words">{toast.message}</p>
            </div>
            <button
                onClick={() => onClose(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4 text-foreground/60" />
            </button>
        </div>
    );
}

// Toast Provider
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const { currentLanguage } = useLanguage();

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
        const id = Date.now() + Math.random();
        const newToast = { id, type, title, message };

        setToasts(prev => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }

        return id;
    }, [removeToast]);

    // Helper to show translated blockchain errors
    const showError = useCallback((error, customTitle) => {
        const errorKey = parseError(error);
        const lang = currentLanguage || 'en';
        const translation = errorTranslations[errorKey]?.[lang] || errorTranslations.DEFAULT[lang];

        const titles = {
            fr: 'Erreur',
            en: 'Error',
            es: 'Error'
        };

        return showToast({
            type: 'error',
            title: customTitle || titles[lang],
            message: translation
        });
    }, [currentLanguage, showToast]);

    const showSuccess = useCallback((message, title) => {
        const titles = {
            fr: 'Succès',
            en: 'Success',
            es: 'Éxito'
        };
        return showToast({
            type: 'success',
            title: title || titles[currentLanguage || 'en'],
            message
        });
    }, [currentLanguage, showToast]);

    const showWarning = useCallback((message, title) => {
        return showToast({ type: 'warning', title, message });
    }, [showToast]);

    const showInfo = useCallback((message, title) => {
        return showToast({ type: 'info', title, message });
    }, [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning, showInfo }}>
            {children}

            {/* Toast Container - Fixed position, responsive */}
            <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast toast={toast} onClose={removeToast} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
