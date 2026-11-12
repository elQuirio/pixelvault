import { Trash2, Image, Folder, StickyNotes, HardDrive, type LucideIcon } from "lucide-react";
import type { ViewType } from "../components/Layout/Layout";

export const navItems : {view: ViewType, label: string, icon: LucideIcon}[] = [
  { view: 'gallery', label: 'Gallery', icon: Image },
  { view: 'drive', label: 'Drive', icon: Folder },
  { view: 'storage', label: 'Storage', icon: HardDrive },
  { view: 'duplicates', label: 'Duplicates', icon: StickyNotes },
  { view: 'trash', label: 'Bin', icon: Trash2 },
];