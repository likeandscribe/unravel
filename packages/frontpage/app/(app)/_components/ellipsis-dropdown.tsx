"use client";

import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import React, { ReactNode } from "react";

interface EllipsisDropdownProps {
  children: ReactNode;
}

const EllipsisDropdownContext = React.createContext<null | {
  close: () => void;
}>(null);

export function EllipsisDropdown({ children }: EllipsisDropdownProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <EllipsisDropdownContext.Provider value={{ close: () => setOpen(false) }}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>{children}</DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </EllipsisDropdownContext.Provider>
  );
}

export const useEllipsisDropdownContext = () => {
  const context = React.useContext(EllipsisDropdownContext);
  if (!context) {
    throw new Error(
      "useEllipsisDropdownContext must be used within a EllipsisDropdown",
    );
  }
  return context;
};
