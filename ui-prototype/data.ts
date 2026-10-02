// Hardcoded dummy data for the prototype, based on docs/report.md representative tasks.
import { bubbleColors, colors } from './theme';
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

export type BubbleEvent = { groupId: string; title: string; date: string; time: string; place: string; going: string[]; lat: number; lng: number }; // date: YYYY-MM-DD

export type Activity = { icon: IconName; text: string; time: string };

export type Group = {
  id: string;
  name: string;
  members: Member[];
  places: Place[];
  pins: Pin[];
  unread: number;
  activity: Activity[]; // newest first
  color?: string; // chosen in Bubble profile > Edit; defaults to the palette
  about?: string;
  isPublic?: boolean;
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
    about: 'U12 team parents and players. Game days at Davis Park.',
    unread: 2,
    places: [DAVIS_PARK],
    activity: [
      { icon: 'enter-outline', text: 'Karen Ross arrived at Davis Park', time: '1m' },
      { icon: 'location-outline', text: 'Michaela Ross is at Field 7', time: '8m' },
      { icon: 'calendar-outline', text: 'Game vs. Mercer tomorrow at 10:00 AM', time: '1h' },
      { icon: 'pin-outline', text: 'Coach Miller pinned Field 7', time: '2d' },
    ],
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
    activity: [
      { icon: 'chatbubble-outline', text: 'Sam Mayfield: "On my way!"', time: 'Now' },
      { icon: 'chatbubble-outline', text: 'Sydney Goettel sent Sam Mayfield "?"', time: '1m' },
      { icon: 'enter-outline', text: 'Sydney Goettel arrived at TLC', time: '2m' },
      { icon: 'calendar-outline', text: 'Team meeting today at 4:00 PM', time: '3h' },
    ],
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
    about: 'Plans, photos and stories from our fall break trips.',
    unread: 0,
    places: [WAFFLE_HOUSE, CAMPUS],
    activity: [
      { icon: 'enter-outline', text: 'Ina Tang arrived at Waffle House', time: '4m' },
      { icon: 'enter-outline', text: 'Sam Mayfield arrived at Waffle House', time: '5m' },
      { icon: 'pin-outline', text: 'Sydney Goettel pinned Sunken Garden Trail', time: '1d' },
      { icon: 'images-outline', text: 'Sam Mayfield added fall break photos to Highlights', time: '3d' },
    ],
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
    activity: [
      { icon: 'exit-outline', text: 'Venture Hale left Fine Arts Center', time: 'Now' },
      { icon: 'exit-outline', text: 'Maya Thompson left Fine Arts Center', time: '1m' },
      { icon: 'person-add-outline', text: 'Caleb Wright joined Theatre Crew', time: '2h' },
      { icon: 'calendar-outline', text: 'Rehearsal Monday at 7:00 PM', time: '5h' },
    ],
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
    activity: [
      { icon: 'enter-outline', text: 'Marcus Reed arrived at Krav Maga Studio', time: '10m' },
      { icon: 'pin-outline', text: 'Marcus Reed pinned Krav Maga Studio', time: '1w' },
    ],
    members: [
      { name: 'Marcus Reed', place: 'Krav Maga Studio', updated: '10m ago', battery: 67, lat: 41.158, lng: -80.0881 },
      { name: 'Dana Kim', place: 'Krav Maga Studio', updated: '12m ago', battery: 80, lat: 41.1581, lng: -80.0879 },
      { name: 'Lena Ortiz', place: 'Fine Arts Center', updated: '1m ago', battery: 44, lat: 41.1575, lng: -80.0783 },
    ],
    pins: [
      { name: 'Krav Maga Studio', note: 'Bring your own gloves on Thursdays.', by: 'Marcus Reed', rating: 5, icon: 'fitness', lat: 41.158, lng: -80.088 },
    ],
  },
  {
    id: 'family',
    name: 'Shin Family',
    unread: 1,
    places: [
      { name: 'Home', icon: 'home', lat: 41.161, lng: -80.09, radius: 120 },
      { name: 'Grove City', icon: 'business', lat: 41.158, lng: -80.088, radius: 3000 },
    ],
    activity: [
      { icon: 'enter-outline', text: 'Tim Shin entered Grove City', time: '3m' },
      { icon: 'exit-outline', text: 'David Shin left Home', time: '1h' },
      { icon: 'notifications-outline', text: 'Jennifer Shin turned on alerts for Grove City', time: '2h' },
    ],
    members: [
      { name: 'Jennifer Shin', place: 'Home', updated: 'Now', battery: 77, lat: 41.1611, lng: -80.0901 },
      { name: 'David Shin', place: 'Work · Butler', updated: '15m ago', battery: 54, lat: 40.861, lng: -79.895 },
      { name: 'Ellie Shin', place: 'Grove City High School', updated: '4m ago', battery: 66, lat: 41.165, lng: -80.085 },
      { name: 'Tim Shin', place: 'Driving · I-79 S', updated: 'Now', battery: 33, lat: 41.02, lng: -80.07, moving: true },
    ],
    pins: [{ name: "Mom's favorite diner", note: 'Pancakes every Sunday after church.', by: 'Jennifer Shin', rating: 5, icon: 'restaurant', lat: 41.1588, lng: -80.0875 }],
  },
  {
    id: 'hiking',
    name: 'Hiking Club',
    about: 'Weekend hikes around Moraine and beyond. Beginners welcome.',
    unread: 2,
    places: [{ name: 'Moraine State Park', icon: 'leaf', lat: 40.952, lng: -80.095, radius: 1500 }],
    activity: [
      { icon: 'calendar-outline', text: 'Nia Johnson added Beginner hike to the calendar', time: '20m' },
      { icon: 'pin-outline', text: 'You pinned Sunken Garden Trail', time: '1d' },
      { icon: 'person-add-outline', text: 'Rachel Kim joined Hiking Club', time: '2d' },
    ],
    members: [
      { name: 'Nia Johnson', place: 'Moraine State Park', updated: '6m ago', battery: 81, lat: 40.953, lng: -80.097 },
      { name: 'Caleb Moore', place: 'Moraine State Park', updated: '6m ago', battery: 45, lat: 40.951, lng: -80.094 },
      { name: 'Hannah Lee', place: 'Slippery Rock', updated: '30m ago', battery: 62, lat: 41.064, lng: -80.056 },
      { name: 'Isaac Grant', place: 'Library', updated: '12m ago', battery: 90, lat: 41.1562, lng: -80.0799 },
      { name: 'Rachel Kim', place: 'Dining Hall', updated: '2m ago', battery: 38, lat: 41.1567, lng: -80.0809 },
    ],
    pins: [
      { name: 'Sunken Garden Trail', note: 'Beginner hiking trail with a secret swimming hole.', by: 'You', rating: 5, icon: 'leaf', lat: 40.95, lng: -80.11 },
      { name: 'Lake Arthur overlook', note: 'Best sunset spot in the park.', by: 'Nia Johnson', rating: 4, icon: 'sunny', lat: 40.94, lng: -80.07 },
    ],
  },
  {
    id: 'rochester',
    name: 'Rochester Nature Lovers',
    unread: 1,
    places: [{ name: 'Canawaugus Park', icon: 'leaf', lat: 43.0306, lng: -77.7547, radius: 300 }],
    activity: [
      { icon: 'pin-outline', text: 'Megan Ross pinned Canawaugus Park', time: '2h' },
      { icon: 'star-outline', text: 'Kyle Bennett rated Canawaugus Park 5 stars', time: '1d' },
    ],
    members: [
      { name: 'Megan Ross', place: 'Scottsville', updated: '1h ago', battery: 70, lat: 43.0256, lng: -77.7453 },
      { name: 'Kyle Bennett', place: 'Rochester', updated: '3h ago', battery: 51, lat: 43.1566, lng: -77.6088 },
      { name: 'Tara Singh', place: 'Canawaugus Park', updated: '20m ago', battery: 28, lat: 43.0309, lng: -77.7551 },
    ],
    pins: [
      { name: 'Canawaugus Park', note: 'Trails, a bridge over the creek, and a rope swing.', by: 'Megan Ross', rating: 5, icon: 'leaf', lat: 43.0306, lng: -77.7547 },
      { name: 'Genesee Riverway Trail', note: 'Flat and paved. Good for a long run.', by: 'Kyle Bennett', rating: 4, icon: 'walk', lat: 43.13, lng: -77.63 },
    ],
  },
  {
    id: 'discgolf',
    name: 'Disc Golf Club',
    unread: 0,
    places: [{ name: 'Wolf Creek Course', icon: 'disc', lat: 41.17, lng: -80.07, radius: 200 }],
    activity: [
      { icon: 'lock-closed-outline', text: 'Ani Kapoor limited photo and pin sharing', time: '1d' },
      { icon: 'enter-outline', text: 'Ben Ortiz arrived at Wolf Creek Course', time: '2d' },
    ],
    members: [
      { name: 'Ani Kapoor', place: 'Harker Hall', updated: '8m ago', battery: 59, lat: 41.157, lng: -80.0805 },
      { name: 'Ben Ortiz', place: 'Wolf Creek Course', updated: '25m ago', battery: 73, lat: 41.1702, lng: -80.0704 },
      { name: 'Chris Novak', place: 'Wolf Creek Course', updated: '25m ago', battery: 41, lat: 41.1699, lng: -80.0697 },
      { name: 'Dylan Price', place: 'STEM Hall', updated: '1h ago', battery: 86, lat: 41.1531, lng: -80.0752 },
      { name: 'Erin Walsh', place: 'Downtown Grove City', updated: '40m ago', battery: 22, lat: 41.1594, lng: -80.0867 },
    ],
    pins: [{ name: 'Hole 7', note: 'Watch out for the creek.', by: 'Ben Ortiz', rating: 3, icon: 'disc', lat: 41.1705, lng: -80.0708 }],
  },
  {
    id: 'imsports',
    name: 'GCC IM Sports',
    isPublic: true,
    about: 'Public Bubble for Grove City College intramural players. No code needed.',
    unread: 0,
    places: [{ name: 'IM Fields', icon: 'football', lat: 41.153, lng: -80.081, radius: 150 }],
    activity: [
      { icon: 'person-add-outline', text: 'Lena Ortiz joined GCC IM Sports', time: '3d' },
      { icon: 'calendar-outline', text: 'Flag football finals Saturday at 2:00 PM', time: '4d' },
    ],
    members: [
      { name: 'Nate Fisher', place: 'IM Fields', updated: '5m ago', battery: 64, lat: 41.1531, lng: -80.0812 },
      { name: 'Grace Kim', place: 'Rec Center', updated: '9m ago', battery: 48, lat: 41.1545, lng: -80.0822 },
      { name: 'Jordan Lee', place: 'Downtown Grove City', updated: '20m ago', battery: 39, lat: 41.1595, lng: -80.0865 },
      { name: 'Paul Rivera', place: 'IM Fields', updated: '5m ago', battery: 92, lat: 41.1529, lng: -80.0808 },
      { name: 'Abby Chen', place: 'Library', updated: '14m ago', battery: 57, lat: 41.1561, lng: -80.0797 },
      { name: 'Ethan Cole', place: 'IM Fields', updated: '5m ago', battery: 35, lat: 41.1532, lng: -80.0806 },
      { name: 'Sofia Reyes', place: 'Harker Hall', updated: '30m ago', battery: 71, lat: 41.1571, lng: -80.0806 },
    ],
    pins: [{ name: 'IM Field 2', note: 'Flag football home field.', by: 'Nate Fisher', rating: 4, icon: 'football', lat: 41.1528, lng: -80.0815 }],
  },
  {
    id: 'roommates',
    name: 'Roommates',
    unread: 0,
    places: [{ name: 'Harker Hall', icon: 'bed', lat: 41.157, lng: -80.0805, radius: 50 }],
    activity: [{ icon: 'enter-outline', text: 'Kelsey Park arrived at Harker Hall', time: '45m' }],
    members: [
      { name: 'Kelsey Park', place: 'Harker Hall', updated: '45m ago', battery: 80, lat: 41.157, lng: -80.0804 },
      { name: 'Morgan Diaz', place: 'TLC', updated: '10m ago', battery: 26, lat: 41.1548, lng: -80.0771 },
    ],
    pins: [{ name: 'Laundry room', note: 'Machine 3 eats quarters.', by: 'Morgan Diaz', rating: 2, icon: 'shirt', lat: 41.1569, lng: -80.0806 }],
  },
  {
    id: 'biblestudy',
    name: 'Tuesday Bible Study',
    unread: 0,
    places: [{ name: 'Harbison Chapel', icon: 'book', lat: 41.156, lng: -80.0795, radius: 60 }],
    activity: [{ icon: 'calendar-outline', text: 'Study moved to 8:00 PM this week', time: '1d' }],
    members: [
      { name: 'Grace Kim', place: 'Rec Center', updated: '9m ago', battery: 48, lat: 41.1545, lng: -80.0822 },
      { name: 'Paul Rivera', place: 'IM Fields', updated: '5m ago', battery: 92, lat: 41.1529, lng: -80.0808 },
      { name: 'Abby Chen', place: 'Library', updated: '14m ago', battery: 57, lat: 41.1561, lng: -80.0797 },
    ],
    pins: [{ name: 'Harbison Chapel basement', note: 'Side door is unlocked after 7.', by: 'Abby Chen', rating: 4, icon: 'book', lat: 41.156, lng: -80.0794 }],
  },
];

export const EVENTS: BubbleEvent[] = [
  { groupId: 'senior', title: 'Team meeting', date: '2026-10-02', time: '4:00 PM', place: 'TLC Room 104', going: ['Sydney Goettel', 'Ina Tang', 'Tim Shin', 'Sam Mayfield'], lat: 41.1549, lng: -80.0773 },
  { groupId: 'soccer', title: 'Game vs. Mercer', date: '2026-10-03', time: '10:00 AM', place: 'Field 7 · Davis Park', going: ['Michaela Ross', 'Ava Chen', 'Coach Miller', 'Liam Patel'], lat: 41.1686, lng: -80.096 },
  { groupId: 'theatre', title: 'Rehearsal', date: '2026-10-05', time: '7:00 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Venture Hale', 'Maya Thompson'], lat: 41.1575, lng: -80.0782 },
  { groupId: 'theatre', title: 'Rehearsal', date: '2026-10-07', time: '7:00 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Priya Nair', 'Owen Brooks'], lat: 41.1575, lng: -80.0782 },
  { groupId: 'krav', title: 'Sparring night', date: '2026-10-08', time: '6:30 PM', place: 'Krav Maga Studio', going: ['Marcus Reed', 'Dana Kim'], lat: 41.158, lng: -80.088 },
  { groupId: 'senior', title: 'Team meeting', date: '2026-10-09', time: '4:00 PM', place: 'TLC Room 104', going: ['Sydney Goettel', 'Sam Mayfield'], lat: 41.1549, lng: -80.0773 },
  { groupId: 'soccer', title: 'Practice', date: '2026-10-09', time: '5:30 PM', place: 'Davis Park', going: ['Coach Miller', 'Michaela Ross'], lat: 41.168, lng: -80.095 },
  { groupId: 'fallbreak', title: 'Waffle House run', date: '2026-10-10', time: '9:00 PM', place: 'Waffle House', going: ['Sam Mayfield', 'Sydney Goettel', 'Ina Tang', 'Tim Shin'], lat: 40.6965, lng: -80.108 },
  { groupId: 'hiking', title: 'Beginner hike', date: '2026-10-17', time: '9:00 AM', place: 'Sunken Garden Trail', going: ['Nia Johnson', 'Caleb Moore', 'Rachel Kim'], lat: 40.95, lng: -80.11 },
  { groupId: 'theatre', title: 'Opening night', date: '2026-10-23', time: '7:30 PM', place: 'Fine Arts Center', going: ['Lena Ortiz', 'Venture Hale', 'Maya Thompson', 'Owen Brooks', 'Priya Nair', 'Caleb Wright'], lat: 41.1575, lng: -80.0782 },
];

// "Everyone" view: every member, place and pin across all groups, once each, plus each group's latest activity.
const unique = <T,>(items: T[], key: (t: T) => string) => [...new Map(items.map((t) => [key(t), t])).values()];
export const EVERYONE: Group = {
  id: 'everyone',
  name: 'Everyone',
  color: colors.primary, // the app's own teal
  unread: 0,
  members: unique(GROUPS.flatMap((g) => g.members), (m) => m.name),
  places: unique(GROUPS.flatMap((g) => g.places), (p) => p.name),
  pins: unique(GROUPS.flatMap((g) => g.pins), (p) => p.name),
  activity: GROUPS.flatMap((g) => g.activity.slice(0, 1)),
};

export const ALL: Group[] = [EVERYONE, ...GROUPS];

export type InboxItem = {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  time: string;
  read: boolean;
  invite?: 'pending' | 'accepted' | 'declined';
};

// Inbox, newest first (report Tasks 2, 4, 6, 10, 12, 14, 15).
export const INBOX: InboxItem[] = [
  { id: 'acm', icon: 'mail-unread-outline', title: 'Priya Shah invited you to ACM', body: 'Public Bubble · 48 members you may not know', time: '5m', read: false, invite: 'pending' },
  { id: 'onmyway', icon: 'chatbubble-outline', title: 'Sam Mayfield · Senior Project', body: '"On my way!"', time: '8m', read: false },
  { id: 'timhome', icon: 'enter-outline', title: 'Tim Shin entered Grove City', body: 'Shin Family · Place alert', time: '12m', read: false },
  { id: 'hike', icon: 'calendar-outline', title: 'Nia Johnson added an event', body: 'Beginner hike · Sat, Oct 17 at 9:00 AM', time: '20m', read: true },
  { id: 'canawaugus', icon: 'pin-outline', title: 'Megan Ross pinned Canawaugus Park', body: 'Rochester Nature Lovers · 5 stars', time: '2h', read: true },
  { id: 'theatre', icon: 'mail-open-outline', title: 'Venture Hale invited you to Theatre Crew', body: 'Private Bubble · 6 members', time: '2d', read: true, invite: 'accepted' },
  { id: 'krav', icon: 'mail-open-outline', title: 'Marcus Reed invited you to Krav Maga Club', body: 'Private Bubble · 3 members', time: '3d', read: true, invite: 'accepted' },
  { id: 'sos', icon: 'warning-outline', title: 'Ina Tang sent an SOS', body: 'Fall Break Crew · Resolved by Sam Mayfield', time: '1w', read: true },
];

// "You" in the prototype (report Task 9).
export const PROFILE = {
  name: 'Ashlea Morgan',
  handle: '@ashlea.hikes',
  bio: 'New to Grove City from Colorado. Always looking for the next trail.',
  instagram: 'instagram.com/ashlea.hikes',
  hobbies: ['Hiking', 'Running', 'Golf'],
  photos: ['Maroon Bells', 'Hanging Lake', 'Sky Pond', 'Sunken Garden Trail', 'Lake Arthur', 'Garden of the Gods'],
};

// Straight-line distance from you in miles, and a short label like "0.3 mi".
export const distanceFromMe = (lat: number, lng: number) => {
  const r = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat - ME.lat) / 2) ** 2 + Math.cos(r(ME.lat)) * Math.cos(r(lat)) * Math.sin(r(lng - ME.lng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(a));
};
export const formatMiles = (mi: number) => (mi < 0.1 ? 'Nearby' : mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`);

// Average rating from everyone in the Bubble. ponytail: derived from the pin's dummy rating
// so the numbers look real; a backend would store individual ratings.
export const ratingCount = (pin: Pin) => 3 + (pin.name.length % 9);
export const avgRating = (pin: Pin) => Math.max(1, Math.min(5, pin.rating - (pin.name.length % 6) / 10));

// Stable color per group and per person.
export const groupColor = (id: string) => {
  const i = ALL.findIndex((g) => g.id === id);
  return ALL[i]?.color ?? bubbleColors[Math.max(0, i) % bubbleColors.length];
};
export const joinCode = (id: string) => `${id.slice(0, 4).toUpperCase()}-${(id.length * 7919).toString(36).toUpperCase()}`;
export const memberColor = (name: string) => bubbleColors[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % bubbleColors.length];
export const initials = (name: string) => name.split(' ').map((w) => w[0]).join('').slice(0, 2);
