import type { Icon as PhosphorIcon, IconProps } from "@phosphor-icons/react";
import {
  ArrowDownIcon as PhArrowDown,
  ArrowLeftIcon as PhArrowLeft,
  ArrowRightIcon as PhArrowRight,
  ArrowSquareOutIcon as PhArrowSquareOut,
  ArrowUpIcon as PhArrowUp,
  ArrowUpRightIcon as PhArrowUpRight,
  ArrowsClockwiseIcon as PhArrowsClockwise,
  ArrowsDownUpIcon as PhArrowsDownUp,
  BookOpenIcon as PhBookOpen,
  BracketsCurlyIcon as PhBracketsCurly,
  CalendarDotsIcon as PhCalendarDots,
  CaretDownIcon as PhCaretDown,
  CaretLeftIcon as PhCaretLeft,
  CaretRightIcon as PhCaretRight,
  ChartBarIcon as PhChartBar,
  CheckCircleIcon as PhCheckCircle,
  CheckIcon as PhCheck,
  CircleIcon as PhCircle,
  CircleNotchIcon as PhCircleNotch,
  CodeIcon as PhCode,
  CopyIcon as PhCopy,
  CreditCardIcon as PhCreditCard,
  CubeIcon as PhCube,
  CursorClickIcon as PhCursorClick,
  DeviceMobileIcon as PhDeviceMobile,
  DotsThreeIcon as PhDotsThree,
  DownloadIcon as PhDownload,
  EnvelopeIcon as PhEnvelope,
  EyeIcon as PhEye,
  EyeSlashIcon as PhEyeSlash,
  FlaskIcon as PhFlask,
  FloppyDiskIcon as PhFloppyDisk,
  GearIcon as PhGear,
  GlobeHemisphereWestIcon as PhGlobeHemisphereWest,
  GlobeIcon as PhGlobe,
  KeyIcon as PhKey,
  LayoutIcon as PhLayout,
  LightningIcon as PhLightning,
  LinkIcon as PhLink,
  ListIcon as PhList,
  LockIcon as PhLock,
  LockKeyIcon as PhLockKey,
  MagicWandIcon as PhMagicWand,
  MagnifyingGlassIcon as PhMagnifyingGlass,
  MegaphoneIcon as PhMegaphone,
  MinusIcon as PhMinus,
  MoonIcon as PhMoon,
  PauseIcon as PhPause,
  PencilSimpleIcon as PhPencilSimple,
  PlayIcon as PhPlay,
  PlusIcon as PhPlus,
  QrCodeIcon as PhQrCode,
  ReceiptIcon as PhReceipt,
  ScanIcon as PhScan,
  SealCheckIcon as PhSealCheck,
  ShareNetworkIcon as PhShareNetwork,
  ShieldCheckIcon as PhShieldCheck,
  SignInIcon as PhSignIn,
  SignOutIcon as PhSignOut,
  SparkleIcon as PhSparkle,
  SquaresFourIcon as PhSquaresFour,
  StackIcon as PhStack,
  SunIcon as PhSun,
  TagIcon as PhTag,
  TerminalWindowIcon as PhTerminalWindow,
  TextHTwoIcon as PhTextHTwo,
  TextTIcon as PhTextT,
  TrashIcon as PhTrash,
  TrendDownIcon as PhTrendDown,
  TrendUpIcon as PhTrendUp,
  UploadSimpleIcon as PhUploadSimple,
  UserIcon as PhUser,
  UserPlusIcon as PhUserPlus,
  UsersIcon as PhUsers,
  WarningIcon as PhWarning,
  XIcon as PhX,
} from "@phosphor-icons/react/dist/ssr";

type Props = Omit<IconProps, "weight"> & { weight?: IconProps["weight"] };

function withWeight(Icon: PhosphorIcon) {
  return function IconWithWeight(props: Props) {
    return <Icon weight="bold" {...props} />;
  };
}

export const AlertTriangle = withWeight(PhWarning);
export const ArrowDown = withWeight(PhArrowDown);
export const ArrowDownWideNarrow = withWeight(PhArrowsDownUp);
export const ArrowLeft = withWeight(PhArrowLeft);
export const ArrowRight = withWeight(PhArrowRight);
export const ArrowUp = withWeight(PhArrowUp);
export const ArrowUpRight = withWeight(PhArrowUpRight);
export const BadgeCheck = withWeight(PhSealCheck);
export const BarChart3 = withWeight(PhChartBar);
export const BookOpen = withWeight(PhBookOpen);
export const Braces = withWeight(PhBracketsCurly);
export const CalendarClock = withWeight(PhCalendarDots);
export const Check = withWeight(PhCheck);
export const CheckCircle2 = withWeight(PhCheckCircle);
export const ChevronDown = withWeight(PhCaretDown);
export const ChevronLeft = withWeight(PhCaretLeft);
export const ChevronRight = withWeight(PhCaretRight);
export const CircleDot = withWeight(PhCircle);
export const Code2 = withWeight(PhCode);
export const Codesandbox = withWeight(PhCube);
export const Copy = withWeight(PhCopy);
export const CreditCard = withWeight(PhCreditCard);
export const Download = withWeight(PhDownload);
export const ExternalLink = withWeight(PhArrowSquareOut);
export const Eye = withWeight(PhEye);
export const EyeOff = withWeight(PhEyeSlash);
export const FlaskConical = withWeight(PhFlask);
export const Globe = withWeight(PhGlobe);
export const Globe2 = withWeight(PhGlobeHemisphereWest);
export const Heading2 = withWeight(PhTextHTwo);
export const KeyRound = withWeight(PhKey);
export const Layers = withWeight(PhStack);
export const LayoutDashboard = withWeight(PhSquaresFour);
export const Link2 = withWeight(PhLink);
export const Loader2 = withWeight(PhCircleNotch);
export const Lock = withWeight(PhLock);
export const LockKeyhole = withWeight(PhLockKey);
export const LogIn = withWeight(PhSignIn);
export const LogOut = withWeight(PhSignOut);
export const Mail = withWeight(PhEnvelope);
export const MailCheck = withWeight(PhEnvelope);
export const MailWarning = withWeight(PhEnvelope);
export const Megaphone = withWeight(PhMegaphone);
export const Menu = withWeight(PhList);
export const Minus = withWeight(PhMinus);
export const Moon = withWeight(PhMoon);
export const MoreHorizontal = withWeight(PhDotsThree);
export const MousePointerClick = withWeight(PhCursorClick);
export const PanelsTopLeft = withWeight(PhLayout);
export const Pause = withWeight(PhPause);
export const Pencil = withWeight(PhPencilSimple);
export const Play = withWeight(PhPlay);
export const Plus = withWeight(PhPlus);
export const QrCode = withWeight(PhQrCode);
export const Receipt = withWeight(PhReceipt);
export const RefreshCw = withWeight(PhArrowsClockwise);
export const Save = withWeight(PhFloppyDisk);
export const ScanLine = withWeight(PhScan);
export const Search = withWeight(PhMagnifyingGlass);
export const Settings = withWeight(PhGear);
export const Share2 = withWeight(PhShareNetwork);
export const ShieldCheck = withWeight(PhShieldCheck);
export const Smartphone = withWeight(PhDeviceMobile);
export const Sparkles = withWeight(PhSparkle);
export const Sun = withWeight(PhSun);
export const Tag = withWeight(PhTag);
export const Terminal = withWeight(PhTerminalWindow);
export const Trash2 = withWeight(PhTrash);
export const TrendingDown = withWeight(PhTrendDown);
export const TrendingUp = withWeight(PhTrendUp);
export const Type = withWeight(PhTextT);
export const Upload = withWeight(PhUploadSimple);
export const UserPlus = withWeight(PhUserPlus);
export const UserRound = withWeight(PhUser);
export const Users = withWeight(PhUsers);
export const Wand2 = withWeight(PhMagicWand);
export const X = withWeight(PhX);
export const Zap = withWeight(PhLightning);
