import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const ToolTiper = ({ trigger,children }: { children: React.ReactNode, trigger: string }) => {
  return (
    <Tooltip>
     <TooltipTrigger>{trigger}</TooltipTrigger>
       <TooltipContent>
         {children}
        </TooltipContent>
    </Tooltip>
  )
}

export default ToolTiper