import {
  LayoutDashboard,
  AlertTriangle,
  Megaphone,
  FolderKanban,
  Trello,
  Calendar,
  FileText,
  Handshake,
  ScrollText,
  CalendarHeart,
  Sparkles,
  Radio,
  Gift,
  Wallet,
  BarChart3,
  Settings,
  Workflow,
  Bot,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", to: "/", icon: LayoutDashboard },
      { title: "Central de Prioridades", to: "/prioridades", icon: AlertTriangle },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Campanhas", to: "/campanhas", icon: Megaphone },
      { title: "Projetos", to: "/projetos", icon: FolderKanban },
      { title: "Kanban", to: "/kanban", icon: Trello },
      { title: "Calendário", to: "/calendario", icon: Calendar },
      { title: "Conteúdos", to: "/conteudos", icon: FileText },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      { title: "Parceiros", to: "/parceiros", icon: Handshake },
      { title: "Contratos", to: "/contratos", icon: ScrollText },
      { title: "Eventos", to: "/eventos", icon: CalendarHeart },
      { title: "Patrocínios", to: "/patrocinios", icon: Sparkles },
    ],
  },
  {
    label: "Mídia & Materiais",
    items: [
      { title: "Mídia Offline", to: "/midia-offline", icon: Radio },
      { title: "Brindes", to: "/brindes", icon: Gift },
    ],
  },
  {
    label: "Inteligência",
    items: [
      { title: "Central IA", to: "/central-ia", icon: Bot },
      { title: "Analytics", to: "/analytics", icon: BarChart3 },
      { title: "Indicadores", to: "/indicadores", icon: BarChart3 },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", to: "/financeiro", icon: Wallet },
      { title: "Workflows", to: "/workflows", icon: Workflow },
      { title: "Configurações", to: "/configuracoes", icon: Settings },
    ],
  },
];
