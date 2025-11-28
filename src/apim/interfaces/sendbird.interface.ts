export interface SBUser {
  user_id: string;
  nickname: string;
  profile_url: string;
  require_auth_for_profile_image: boolean;
  metadata: any;
  access_token: string;
  session_tokens: Array<string>;
  is_online: boolean;
  last_seen_at: number;
  discovery_keys: Array<any>;
  has_ever_logged_in: boolean;
  is_active: boolean;
  is_created: boolean;
  phone_number: string;
  unread_channel_count: number;
  unread_message_count: number;
}

export interface SBChannel {
  name: string;
  channel_url: string;
  cover_url: string;
  custom_type: string;
  unread_message_count: number;
  data: string;
  is_distinct: boolean;
  is_public: boolean;
  is_super: boolean;
  is_ephemeral: boolean;
  is_access_code_required: boolean;
  member_count: number;
  joined_member_count: number;
  members: SBChannelMember[];
  operators: SBChannelOperator[];
  max_length_message: number;
  last_message: null;
  created_at: number;
  freeze: boolean;
  delivery_receipt: any;
  read_receipt: any;
  channel: any;
}

export interface SBChannelMember {
  user_id: string;
  nickname: string;
  profile_url: string;
  is_active: boolean;
  is_online: boolean;
  last_seen_at: number;
  state: string;
  metadata: any;
  role?: string;
}

export interface SBChannelOperator {
  user_id: string;
  nickname: string;
  profile_url: string;
  is_active: boolean;
  is_online: boolean;
  last_seen_at: number;
  state: string;
  metadata: any;
}

export enum SBCustomTypeMessageEnum {
  MSG_TEXT = 'MSG_TEXT',
  MSG_MEDIA = 'MSG_MEDIA',
  MSG_GIFT = 'MSG_GIFT',
  MSG_LUCKY_BOX = 'MSG_LUCKY_BOX',
  MSG_SHARE_ROOM = 'MSG_SHARE_ROOM',
  MSG_SHARE_GAME = 'MSG_SHARE_GAME',
  MSG_SHARE_CONTACT = 'MSG_SHARE_CONTACT',
  MSG_EVENT_NOTIFICATION = 'MSG_EVENT_NOTIFICATION',
}

export enum DataEventMessageEnum {
  EVENT_CHANNEL_CREATED = 'channel-created',
  EVENT_CHANNEL_MEMBER_JOINED = 'channel-member-joined',
  EVENT_CHANNEL_MEMBER_LEAVED = 'channel-member-leaved',
  EVENT_CHANNEL_CHANGED_COVER_URL = 'channel-changed-cover-url',
  EVENT_CHANNEL_CHANGED_NAME = 'channel-changed-name',
  EVENT_CHANNEL_CHANGED_SUMMARY = 'channel-changed-summary',
  EVENT_CHANNEL_CHANGED_TAXONOMY = 'channel-changed-taxonomy',
  EVENT_CHANNEL_ASSIGNED_ADMIN = 'channel-assigned-admin',
  EVENT_CHANNEL_UNASSIGNED_ADMIN = 'channel-unassigned-admin',
}
