import type { ReactNode } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHasPermission } from "@/lib/settings";

/** Render children only when current user has the permission. */
export function PermissionGate({
  perm,
  children,
  fallback = null,
}: {
  perm: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = useHasPermission(perm);
  return <>{allowed ? children : fallback}</>;
}

/**
 * Button that visually stays in place but is disabled (with tooltip) when
 * the active user doesn't have permission. Clicking shows a toast.
 */
export function PermissionButton({
  perm,
  children,
  onClick,
  deniedMessage = "Você não tem permissão para executar esta ação.",
  ...rest
}: ButtonProps & { perm: string; deniedMessage?: string }) {
  const allowed = useHasPermission(perm);

  if (allowed) {
    return (
      <Button onClick={onClick} {...rest}>
        {children}
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              {...rest}
              disabled
              onClick={(e) => {
                e.preventDefault();
                toast.error(deniedMessage);
              }}
            >
              <Lock className="h-3.5 w-3.5" />
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{deniedMessage}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
