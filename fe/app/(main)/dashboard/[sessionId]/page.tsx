export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <div className="flex h-screen bg-neutral-950 text-white">
        <div className="flex-shrink-0 border-r border-neutral-800">
          <Sidebar />
        </div>
  
        <div className="flex-1 flex bg-neutral-900">
          <div className="w-3/5 border-neutral-800 h-full">
            <PromptCard onSubmit={handlePromptSubmit} />
          </div>
  
          <div className="w-2/5">
            <VideoGenerationCard
              currentVideoUrl={currentVideoUrl}
              currentResponse={currentResponse}
              prompt={currentPrompt}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
              loading={loading}
            />
          </div>
        </div>
      </div>
}