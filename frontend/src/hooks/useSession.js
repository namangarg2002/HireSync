import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { sessionAPI } from '../api/session'

export const useCreateSession = () => {
    const result = useMutation({
        mutationKey: ['createSession'],
        mutationFn: sessionAPI.createSession,
        onSuccess: () => toast.success("Session Created Successfully"),
        onError: (error) => toast.error(error.response?.data?.message || "Failed to create room"),
    })

    return result;
}

export const useActiveSessions = () => {
    const result = useQuery({
        queryKey: ['activeSessions'],
        queryFn: sessionAPI.getActiveSessions
    });

    return result;
} 

export const useMyRecentSessions = () => {
    const result = useQuery({
        queryKey: ['myRecentSessions'],
        queryFn: sessionAPI.getMyRecentSessions
    });

    return result;
}

export const useSessionById = (sessionId) => {
    const result = useQuery({
        queryKey: ['session', sessionId],
        queryFn: ()=> sessionAPI.getSessionById(sessionId),
        enabled: !!sessionId,
        refetchInterval: 5000, // refetch every 5 seconds to detect the session status changes
    });

    return result;
}

export const useJoinSessions = () => {
    const result = useMutation({
        mutationKey: ['joinSession'],
        mutationFn: sessionAPI.joinSession,
        onSuccess: () => toast.success("Joined session succesfully!"),
        onError: (error) => toast.error(error.response?.data?.message || "Failed to join room"),
    })

    return result;
}

export const useEndSessions = () => {
    const result = useMutation({
        mutationKey: ['endSession'],
        mutationFn:sessionAPI.endSession,
        onSuccess: () => toast.success("Session ended succesfully!"),
        onError: (error) => toast.error(error.response?.data?.message || "Failed to end room"),
    })

    return result;
}

