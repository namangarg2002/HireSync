import { useUser } from '@clerk/clerk-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import WelcomeSection from '../components/WelcomeSection'
import StatsCards from '../components/StatsCards'
import ActiveSessions from '../components/ActiveSessions'
import RecentSessions from '../components/RecentSessions'
import CreateSessionModel from '../components/CreateSessionModel'
import { useActiveSessions, useCreateSession, useMyRecentSessions } from '../hooks/useSession'

function DashboardPage() {

  const navigate = useNavigate()
  const user = useUser()

  const [showCreateModel, setShowCreateModel] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: ""});

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions }  = useMyRecentSessions();

  console.log("Active Sessions: ", activeSessionsData)
  console.log("Recent Sessions: ", recentSessionsData)

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if(!user.id) return false;

    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id
  }

  const handleCreateRoom = () => {
    if(!roomConfig.problem || !roomConfig.difficulty) return;

    createSessionMutation.mutate({
      problem: roomConfig.problem,
      difficulty: roomConfig.difficulty
    },{
      onSuccess: (data) => {
        console.log("Session response: ", data)
        setShowCreateModel(false),
        navigate(`/session/${data.sessionId}`);
      }
    })
  }

  return (
    <>
      <div className='min-h-screen bg-base-300'>
        <Navbar />
        <WelcomeSection 
          onCreateSession={() => setShowCreateModel(true)}
        />
        {/* Grid layout */}
        <div className='container mx-auto px-6 pb-16'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <StatsCards 
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions 
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          <RecentSessions
            sessions={recentSessions}
            isLoading={loadingRecentSessions}
          />
        </div>
      </div>

      <CreateSessionModel 
        isOpen={showCreateModel}
        onClose={() => setShowCreateModel(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation?.isPending}
      />
    </>
  )
}

export default DashboardPage