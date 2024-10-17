"use client";

import * as React from "react";
import { SunIcon, MoonIcon, Half2Icon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/lib/components/ui/dropdown-menu";

export function ThemeToggleMenuGroup() {
  const { setTheme, theme } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="truncate">Theme</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="light" className="flex gap-1.5">
          <SunIcon className="size-4" />
          <span>Light</span>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="dark" className="flex gap-1.5">
          <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
          <span>Dark</span>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system" className="flex gap-1.5">
          <Half2Icon className="h-[1.2rem] w-[1.2rem]" />
          <span>System</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
