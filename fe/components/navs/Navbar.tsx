import { Film, Settings } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

const Navbar = () => {
  return (
    <div className="border-b py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Film className="h-5 w-5" />
        <h1 className="font-semibold text-lg">/ Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </div>
    </div>
  )
}

export default Navbar