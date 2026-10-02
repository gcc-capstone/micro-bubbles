// Hardcoded dummy data for the prototype, based on docs/report.md representative tasks.
import { bubbleColors } from './theme';
import type { IconName } from './components';

export type Member = {
  name: string;
  place: string; // where they are, as shown in the member list
  updated: string;
  battery: number;
  lat: number;
  lng: number;
  moving?: boolean;
};

export type Place = { name: string; icon: IconName; lat: number; lng: number; radius: number }; // radius in meters

export type Pin = { name: string; note: string; by: string; rating: number; icon: IconName; lat: number; lng: number };

export type BubbleEvent = { groupId: string; title: string; date: string; time: string; place: string; going: string[] }; // date: YYYY-MM-DD

export type Group = {
  id: string;
  name: string;
  members: Member[];
  places: Place[];
  pins: Pin[];
  unread: number;
  activity?: string; // latest place notification
};

// Where "You" are: Grove City College campus. Prototype "today" is Oct 2, 2026.
export const ME = { lat: 41.1556, lng: -80.0789 };
export const TODAY = '2026-10-02';

const DAVIS_PARK: Place = { name: 'Davis Park', icon: 'football', lat: 41.168, lng: -80.095, radius: 300 };
const TLC: Place = { name: 'TLC', icon: 'school', lat: 41.1549, lng: -80.0773, radius: 60 };
const CAMPUS: Place = { name: 'Grove City College', icon: 'school', lat: 41.1556, lng: -80.0789, radius: 600 };
const WAFFLE_HOUSE: Place = { name: 'Waffle House', icon: 'restaurant', lat: 40.6965, lng: -80.108, radius: 80 };
const FINE_ARTS: Place = { name: 'Fine Arts Center', icon: 'musical-notes', lat: 41.1575, lng: -80.0782, radius: 70 };
const DINING: Place = { name: 'Dining Hall', icon: 'restaurant', lat: 41.1566, lng: -80.081, radius: 60 };
const STUDIO: Place = { name: 'Krav Maga Studio', icon: 'fitness', lat: 41.158, lng: -80.088, radius: 50 };

export const GROUPS: Group[] = [
  {
    id: 'soccer',
    name: 'Home Soccer',
    unread: 2,
    places: [DAVIS_PARK],
    activity: 'Karen Ross arrived at Davis Park',
    members: [
      { name: 'Michaela Ross', place: 'Field 7 · Davis Park', updated: 'Now', battery: 64, lat: 41.1686, lng: -80.0958 },
      { name: 'Karen Ross', place: 'Just arrived · Davis Park', updated: '1m ago', battery: 82, lat: 41.1672, lng: -80.0938 },
      { name: 'Ava Chen', place: 'Field 7 · Davis Park', updated: 'Now', battery: 47, lat: 41.1688, lng: -80.0961 },
      { name: 'Jenna Chen', place: 'Parking lot · Davis Park', updated: '3m ago', battery: 91, lat: 41.1669, lng: -80.0945 },
      { name: 'Coach Miller', place: 'Field 7 · Davis Park', updated: 'Now', battery: 58, lat: 41.1684, lng: -80.0963 },
      { name: 'Liam Patel', place: 'Field 7 · Davis Park', updated: 'Now', battery: 70, lat: 41.1687, lng: -80.0955 },
      { name: 'Rosa Patel', place: 'Bleachers · Davis Park', updated: '2m ago', battery: 36, lat: 41.1682, lng: -80.0952 },
      { name: 'Emma Brooks', place: 'On the way · Route 58', updated: 'Now', battery: 19, lat: 41.162, lng: -80.088, moving: true },
    ],
    pins: [
      { name: 'Field 7', note: 'U12 games are always on this field.', by: 'Coach Miller', rating: 5, icon: 'football', lat: 41.1686, lng: -80.096 },
      { name: 'North Lot', note: 'Closest parking to Field 7.', by: 'Karen Ross', rating: 4, icon: 'car', lat: 41.1692, lng: -80.0945 },
    ],
  },
  {
    id: 'senior',
    name: 'Senior Project',
    unread: 1,
    places: [TLC],
    activity: 'Sydney Goettel arrived at TLC',
    members: [
      { name: 'Sydney Goettel', place: 'TLC · Room 104', updated: 'Now', battery: 88, lat: 41.1549, lng: -80.0774 },
      { name: 'Ina Tang', place: 'Library · 1 min away', updated: 'Now', battery: 52, lat: 41.1562, lng: -80.0798, moving: true },
      { name: 'Tim Shin', place: 'Library · 1 min away', updated: 'Now', battery: 33, lat: 41.1561, lng: -80.0796, moving: true },
      { name: 'Sam Mayfield', place: 'STEM Hall · far side', updated: '2m ago', battery: 71, lat: 41.153, lng: -80.075 },
    ],
    pins: [
      { name: 'TLC Room 104', note: 'Our meeting room. Whiteboard markers in the drawer.', by: 'Sydney Goettel', rating: 4, icon: 'easel', lat: 41.1549, lng: -80.0772 },
      { name: 'Broad Street Coffee', note: 'Best spot for late-night sprints.', by: 'Ina Tang', rating: 5, icon: 'cafe', lat: 41.158, lng: -80.0852 },
    ],
  },
  {
    id: 'fallbreak',
    name: 'Fall Break Crew',
    unread: 0,
    places: [WAFFLE_HOUSE, CAMPUS],
    activity: 'Sam Mayfield arrived at Waffle House',
    members: [
      { name: 'Sam Mayfield', place: 'Waffle House', updated: '5m ago', battery: 71, lat: 40.6966, lng: -80.1082 },
      { name: 'Sydney Goettel', place: 'Waffle House', updated: '5m ago', battery: 88, lat: 40.6964, lng: -80.1078 },
      { name: 'Ina Tang', place: 'Waffle House', updated: '4m ago', battery: 52, lat: 40.6967, lng: -80.1079 },
      { name: 'Tim Shin', place: 'Driving · I-79 S', updated: 'Now', battery: 33, lat: 41.02, lng: -80.07, moving: true },
    ],
    pins: [
      { name: 'Waffle House', note: 'Late-night waffles. Get the hashbrowns.', by: 'Sam Mayfield', rating: 5, icon: 'restaurant', lat: 40.6965, lng: -80.1081 },
      { name: 'Sunken Garden Trail', note: 'Beginner hiking trail with a secret swimming hole.', by: 'Sydney Goettel', rating: 5, icon: 'leaf', lat: 40.95, lng: -80.11 },
    ],
  },
  {
    id: 'theatre',
    name: 'Theatre Crew',
    unread: 3,
    places: [FINE_ARTS, DINING],
    activity: 'Venture Hale left Fine Arts Center',
    members: [
      { name: 'Venture Hale', place: 'Heading to Dining Hall', updated: 'Now', battery: 76, lat: 41.1571, lng: -80.0795, moving: true },
      { name: 'Lena Ortiz', place: 'Fine Arts Center', updated: '1m ago', battery: 44, lat: 41.1575, lng: -80.0783 },
      { name: 'Maya Thompson', place: 'Heading to Dining Hall', updated: 'Now', battery: 61, lat: 41.1569, lng: -80.0801, moving: true },
      { name: 'Owen Brooks', place: 'Dining Hall', updated: '4m ago', battery: 95, lat: 41.1566, lng: -80.0811 },
      { name: 'Priya Nair', place: 'Heading to Dining Hall', updated: 'Now', battery: 23, lat: 41.1573, lng: -80.079, moving: true },
      { name: 'Caleb Wright', place: 'Fine Arts Center', updated: '6m ago', battery: 58, lat: 41.1576, lng: -80.0781 },
    ],
    pins: [
      { name: 'Green Room', note: 'Costumes and snacks live here.', by: 'Lena Ortiz', rating: 4, icon: 'shirt', lat: 41.1576, lng: -80.0784 },
    ],
  },
  {
    id: 'krav',
    name: 'Krav Maga Club',
    unread: 0,
    places: [STUDIO],
    members: [
      { name: 'Marcus Reed', place: 'Krav Maga Studio', updated: '10m ago', battery: 67, lat: 41.158, lng: -80.0881 },
      { name: 'Dana Kim', place: 'Krav Maga Studio', updated: '12m ago', battery: 80, lat: 41.1581, lng: -80.0879 },
      { name: 'Lena Ortiz', place: 'Fine Arts Center', updated: '1m ago', battery: 44, lat: 41.1575, lng: -80.0783 },
    ],
    pins: [
      { name: 'Krav Maga Studio', note: 'Bring your own gloves on Thursdays.', by: 'Marcus Reed', rating: 5, icon: 'fitness', lat: 41.158, lng: -80.088 },
    ],
  },
];

export const EVENTS: BubbleEvent[] = [
  { groupId: 'senior', title: 'Team meeting', date: '2026-10-02', time: '4:00 PM', place: 'TLC Room 104', going: ['Sydney Goettel', 'Ina Tang', 'Tim Shin', 'Sam Mayfield'] },
  { groupId: 'soccer', title: 'Game vs. Mercer', date: '2026-10-03', time: '10:00 AM', place: 'Field 7 · Davis Park', going: ['Michaela Ross', 'Ava Chen', 'Coach Miller', 'Liam Patel'] },
  { groupId: 'theatre', title: 'Rehearsal', date: '2026-10-05', time: '7:00 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Venture Hale', 'Maya Thompson'] },
  { groupId: 'theatre', title: 'Rehearsal', date: '2026-10-07', time: '7:00 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Priya Nair', 'Owen Brooks'] },
  { groupId: 'krav', title: 'Sparring night', date: '2026-10-08', time: '6:30 PM', place: 'Krav Maga Studio', going: ['Marcus Reed', 'Dana Kim'] },
  { groupId: 'senior', title: 'Team meeting', date: '2026-10-09', time: '4:00 PM', place: 'TLC Room 104', going: ['Sydney Goettel', 'Sam Mayfield'] },
  { groupId: 'soccer', title: 'Practice', date: '2026-10-09', time: '5:30 PM', place: 'Davis Park', going: ['Coach Miller', 'Michaela Ross'] },
  { groupId: 'fallbreak', title: 'Waffle House run', date: '2026-10-10', time: '9:00 PM', place: 'Waffle House', going: ['Sam Mayfield', 'Sydney Goettel', 'Ina Tang', 'Tim Shin'] },
  { groupId: 'fallbreak', title: 'Beginner hike', date: '2026-10-17', time: '9:00 AM', place: 'Sunken Garden Trail', going: ['Sydney Goettel', 'Ina Tang'] },
  { groupId: 'theatre', title: 'Opening night', date: '2026-10-23', time: '7:30 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Venture Hale', 'Maya Thompson', 'Owen Brooks', 'Priya Nair', 'Caleb Wright'] },
];

// "Everyone" view: every member, place and pin across all groups, once each.
const unique = <T,>(items: T[], key: (t: T) => string) => [...new Map(items.map((t) => [key(t), t])).values()];
export const EVERYONE: Group = {
  id: 'everyone',
  name: 'Everyone',
  unread: 0,
  members: unique(GROUPS.flatMap((g) => g.members), (m) => m.name),
  places: unique(GROUPS.flatMap((g) => g.places), (p) => p.name),
  pins: unique(GROUPS.flatMap((g) => g.pins), (p) => p.name),
};

export const ALL: Group[] = [EVERYONE, ...GROUPS];

export const eventsFor = (g: Group) => (g.id === 'everyone' ? EVENTS : EVENTS.filter((e) => e.groupId === g.id));

// Stable color per group and per person.
export const groupColor = (id: string) => bubbleColors[Math.max(0, ALL.findIndex((g) => g.id === id)) % bubbleColors.length];
export const memberColor = (name: string) => bubbleColors[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % bubbleColors.length];
export const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2);
