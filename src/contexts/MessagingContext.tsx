import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface MessagingContextType {
    isDrawerOpen: boolean;
    activeConversationId: string | null;
    openDrawer: (conversationId?: string) => void;
    closeDrawer: () => void;
    startConversation: (otherUserId: string) => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const openDrawer = (conversationId?: string) => {
        if (conversationId) {
            setActiveConversationId(conversationId);
        }
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setActiveConversationId(null);
    };

    const startConversation = async () => {
        // Implementation will be handled by the consumer (Drawer) or here? 
        // Ideally we just set state here and the Drawer effects handle creation/fetching 
        // BUT we need the conversation ID.
        // We'll leave this empty for now and handle logic in the components or 
        // pass the logic in. Actually, simpler to just expose the functionality to set ID.
        // The creating logic should potentially be in firestore service, wrapper here.
    };

    return (
        <MessagingContext.Provider value={{
            isDrawerOpen,
            activeConversationId,
            openDrawer,
            closeDrawer,
            startConversation
        }}>
            {children}
        </MessagingContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (context === undefined) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};
