import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  TrophyIcon,
  UserIcon,
  PlusSignIcon,
  ClipboardListIcon,
  XIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FireIcon,
  Moon01Icon,
  TShirtIcon,
  ArrowUp01Icon,
  ZapIcon,
  WaveIcon,
  TrendingUpIcon,
  HandIcon,
  FootprintsIcon,
  Triangle01Icon,
  CopyIcon,
  UserAdd01Icon,
  LogOutIcon,
  Dumbbell01Icon,
  CalendarCheckIcon,
  PencilIcon,
  Loading03Icon,
  TrashIcon,
  SaveIcon,
  Share08Icon,
  InboxIcon,
  UserGroupIcon,
  RefreshCwIcon,
  SwordsIcon,
  BarChartIcon,
  TriangleAlertIcon,
  PartyPopperIcon,
  Mail01Icon,
  LockIcon,
} from "@hugeicons/core-free-icons";

// Cambio de librería de iconos (lucide-react -> Hugeicons): en vez de tocar
// cada <Icono /> suelto por toda la app, cada icono de lucide que se usaba
// tiene aquí un componente del mismo nombre que envuelve el equivalente de
// Hugeicons — así los ~40 sitios que importan un icono solo cambian de
// dónde lo importan, no cómo lo usan (className, strokeWidth... igual).
function makeIcon(svg) {
  function Icon({ strokeWidth = 2, ...props }) {
    return <HugeiconsIcon icon={svg} strokeWidth={strokeWidth} {...props} />;
  }
  return Icon;
}

export const Home = makeIcon(Home01Icon);
export const Trophy = makeIcon(TrophyIcon);
export const User = makeIcon(UserIcon);
export const Plus = makeIcon(PlusSignIcon);
export const ClipboardList = makeIcon(ClipboardListIcon);
export const X = makeIcon(XIcon);
export const Check = makeIcon(CheckIcon);
export const ChevronLeft = makeIcon(ChevronLeftIcon);
export const ChevronRight = makeIcon(ChevronRightIcon);
export const ChevronDown = makeIcon(ChevronDownIcon);
export const Flame = makeIcon(FireIcon);
export const Moon = makeIcon(Moon01Icon);
export const Shirt = makeIcon(TShirtIcon);
export const ArrowUp = makeIcon(ArrowUp01Icon);
export const Zap = makeIcon(ZapIcon);
export const Waves = makeIcon(WaveIcon);
export const TrendingUp = makeIcon(TrendingUpIcon);
export const Hand = makeIcon(HandIcon);
export const Footprints = makeIcon(FootprintsIcon);
export const Triangle = makeIcon(Triangle01Icon);
export const Copy = makeIcon(CopyIcon);
export const UserPlus = makeIcon(UserAdd01Icon);
export const LogOut = makeIcon(LogOutIcon);
export const Dumbbell = makeIcon(Dumbbell01Icon);
export const CalendarCheck = makeIcon(CalendarCheckIcon);
export const Pencil = makeIcon(PencilIcon);
export const Loader2 = makeIcon(Loading03Icon);
export const Trash2 = makeIcon(TrashIcon);
export const Save = makeIcon(SaveIcon);
export const Share2 = makeIcon(Share08Icon);
export const Inbox = makeIcon(InboxIcon);
export const Users = makeIcon(UserGroupIcon);
export const RefreshCw = makeIcon(RefreshCwIcon);
export const Swords = makeIcon(SwordsIcon);
export const BarChart3 = makeIcon(BarChartIcon);
export const AlertTriangle = makeIcon(TriangleAlertIcon);
export const PartyPopper = makeIcon(PartyPopperIcon);
export const Mail = makeIcon(Mail01Icon);
export const Lock = makeIcon(LockIcon);
