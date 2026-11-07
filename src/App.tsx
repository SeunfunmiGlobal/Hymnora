import { useEffect, useMemo, useState } from 'react';
import { api, auth, invitesClient } from '@appdeploy/client';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Church,
  CirclePlay,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  Facebook,
  Headphones,
  Instagram,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Mic2,
  Music2,
  Plus,
  Radio,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Users,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react';

type Song = {
  id: string;
  title: string;
  artist: string;
  language: string;
  lyrics: string;
  rights: string;
};
type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  description: string;
};
type Passage = { reference: string; reason: string; theme: string };

const demoSongs: Song[] = [
  {
    id: 's1',
    title: 'Great Is Thy Faithfulness',
    artist: 'Thomas Chisholm',
    language: 'English',
    rights: 'Public domain',
    lyrics:
      'Great is Thy faithfulness, O God my Father\nThere is no shadow of turning with Thee\nThou changest not, Thy compassions, they fail not\nAs Thou hast been, Thou forever wilt be',
  },
  {
    id: 's2',
    title: 'Way Maker',
    artist: 'Sinach',
    language: 'English',
    rights: 'Church supplied / verify licence',
    lyrics:
      'Add your church-authorized lyrics here.\nUse the presenter view to display each section.',
  },
  {
    id: 's3',
    title: 'Olorun Agbaye',
    artist: 'Local worship collection',
    language: 'Yoruba',
    rights: 'Church supplied / verify licence',
    lyrics: 'Paste authorized Yoruba lyrics here.',
  },
];
const demoEvents: EventItem[] = [
  {
    id: 'e1',
    title: 'Sunday Worship Experience',
    date: '2026-11-15',
    time: '09:00 AM',
    venue: 'Main Auditorium',
    description: 'A time of worship, the Word and fellowship.',
  },
  {
    id: 'e2',
    title: 'Night of Encounter',
    date: '2026-11-27',
    time: '10:00 PM',
    venue: 'Church Sanctuary',
    description: 'An evening of prayer and spiritual renewal.',
  },
];
const channels = [
  {
    name: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    note: 'Posts, Reels and Stories',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    note: 'Pages and event announcements',
  },
  {
    name: 'TikTok',
    icon: Video,
    color: '#111827',
    note: 'Short-form video publishing',
  },
  {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0033',
    note: 'Live streams and video updates',
  },
  {
    name: 'Spotify',
    icon: Headphones,
    color: '#1DB954',
    note: 'Podcast and audio distribution',
  },
  { name: 'X', icon: X, color: '#111827', note: 'Church updates and threads' },
  {
    name: 'Threads',
    icon: Activity,
    color: '#111827',
    note: 'Community conversations',
  },
];

function App() {
  const [section, setSection] = useState('Overview');
  const [user, setUser] = useState<{ userId: string; email?: string; name?: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [workspaceRole, setWorkspaceRole] = useState('member');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteUrl, setInviteUrl] = useState('');
  const [songs, setSongs] = useState<Song[]>(demoSongs);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeSong, setActiveSong] = useState<Song>(demoSongs[0]);
  const [slide, setSlide] = useState(0);
  const [presenter, setPresenter] = useState(false);
  const [search, setSearch] = useState('');
  const [sermon, setSermon] = useState('');
  const [passages, setPassages] = useState<Passage[]>([]);
  const [scriptureLoading, setScriptureLoading] = useState(false);
  const [songForm, setSongForm] = useState({
    title: '',
    artist: '',
    language: 'English',
    lyrics: '',
    rights: 'Church supplied / verify licence',
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    venue: '',
    description: '',
  });
  const [showSongForm, setShowSongForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    location: '',
    busStop: '',
    source: '',
    eventId: '',
    consent: false,
  });
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const pendingInvite = invitesClient.getPendingCode();
    auth.getUser().then(async current => {
      if (!active) return;
      setUser(current);