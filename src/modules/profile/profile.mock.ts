export const mockUsers = [
  {
    id: 'user-1',
    nickname: 'NguyenVanA',
    avatar: 'https://avatar.com/a.png',
    bio: 'I love coding',
    gender: 'male',
    birthday: '2000-01-01',
    gallery: [
      { id: 'g1', image_url: 'https://img.com/1.png', created_at: new Date() },
      { id: 'g2', image_url: 'https://img.com/2.png', created_at: new Date() },
    ],
  },
  {
    id: 'user-2',
    nickname: 'NguyenVanB',
    avatar: 'https://avatar.com/b.png',
    bio: 'Hello world',
    gender: 'female',
    birthday: '2001-01-01',
    gallery: [],
  },
];

export const mockStats = {
  followers: 10,
  following: 5,
  total_views: 50,
};

export const mockWallet = {
  balance: 1000,
  currency: 'gem',
};

export const mockVipStatus = {
  is_vip: true,
  expiry: '2025-12-31',
};

export const mockStore = {
  items: [
    { id: 'item-1', name: 'Sword', price: 100 },
    { id: 'item-2', name: 'Shield', price: 150 },
  ],
};

export const mockTaskSummary = {
  completed: 3,
  pending: 2,
};

export const mockLoveSpace = {
  status: 'connected',
  connections: [
    {
      id: 'c1',
      user_a_id: 'user-1',
      user_b_id: 'user-2',
      created_at: new Date(),
    },
  ],
};

export const mockInventory = {
  items: [
    { id: 'i1', item_name: 'Potion', quantity: 5 },
    { id: 'i2', item_name: 'Elixir', quantity: 2 },
  ],
};

export const mockClans = [
  { id: 'clan-1', name: 'Warriors', rank: 'Leader' },
  { id: 'clan-2', name: 'Mages', rank: 'Member' },
];

export const mockReferrals = {
  total_referrals: 2,
  rewards: 200,
};

export const mockProfileViewsFull = [
  {
    id: 'user-2',
    username: 'NguyenVanB',
    avatar_url: 'https://avatar.com/b.png',
    gender: 'female',
    viewed_at: new Date(),
  },
];

export const mockProfileViewsSummary = {
  total_views: 50,
};

export const mockLastView = {
  last_viewed_at: new Date(),
};

export const mockSupportInfo = {
  email: 'support@mycompany.com',
  phone: '+84 987 654 321',
};

export const mockHelpArticles = [
  { id: 1, title: 'How to use the app', url: '/help/1' },
  { id: 2, title: 'Profile settings', url: '/help/2' },
];

export const mockCompanyInfo = {
  name: 'MyCompany',
  email: 'contact@mycompany.com',
  phone: '+84 123 456 789',
  address: '123 ABC Street, Hanoi',
};

export const mockPosts = {
  'user-1': [
    { id: 'p1', title: 'My first post', content: 'Hello world' },
    { id: 'p2', title: 'Second post', content: 'Learning NestJS' },
  ],
  'user-2': [{ id: 'p3', title: 'User 2 post', content: 'Hi there' }],
};

export const mockStoreByUser = {
  'user-1': [
    { id: 'item-1', name: 'Sword', price: 100 },
    { id: 'item-2', name: 'Shield', price: 150 },
  ],
  'user-2': [{ id: 'item-3', name: 'Potion', price: 50 }],
};

// ---- Additional mocks for new profile components ----

export const mockUserStatus = {
  statusBadge: 'Verified',
  isAccountLocked: false,
  isBlockedByMe: false,
  hasBlockedMe: false,
  relationshipStatus: 'Followed',
};

export const mockUserLevel = 42;

export const mockLocation = { distance_km: 2.5 };

export const mockContribution = { total_diamonds: 1000 };

export const mockInterests = { interests: ['Music', 'Travel', 'Gaming'] };

export const mockGiftsSummary = { total_gifts: 180 };

export const mockTopGifts = {
  top_gifts: [
    { name: 'Rocket', count: 35 },
    { name: 'Flower', count: 20 },
  ],
};

export const mockTopSupporters = {
  supporters: [
    {
      id: 'user-3',
      username: 'Alex',
      avatar: 'https://avatar.com/alex.png',
      diamonds: 500,
    },
  ],
};

export const mockRelationshipSummary = {
  summary_text: 'Best friends (2)',
  link: '/users/user-1/relationships',
};

export const mockRelationships = {
  relationships: [
    {
      type: 'Best Friend',
      level: 5,
      partner: {
        id: 'user-2',
        name: 'Emma',
        avatar: 'https://avatar.com/b.png',
      },
    },
  ],
};

export const mockRoomStatus = {
  room_id: 55,
  room_name: 'Darlene Bears',
  status: 'active',
  category: 'Music',
};

export const mockClanInfo = {
  clan_name: 'Darlene Bears',
  members: 42,
  capacity: 50,
};

export const mockAlbums = [
  {
    id: 'album-1',
    user_id: 'user-1',
    name: 'Summer Memories',
    cover_url: 'https://img.com/cover1.png',
    photos: [
      {
        id: 'photo-1',
        album_id: 'album-1',
        image_url: 'https://img.com/1.png',
      },
      {
        id: 'photo-2',
        album_id: 'album-1',
        image_url: 'https://img.com/2.png',
      },
    ],
  },
  {
    id: 'album-2',
    user_id: 'user-1',
    name: 'Travel Album',
    cover_url: 'https://img.com/cover2.png',
    photos: [
      {
        id: 'photo-3',
        album_id: 'album-2',
        image_url: 'https://img.com/3.png',
      },
    ],
  },
];
