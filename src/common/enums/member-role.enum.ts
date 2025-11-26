/**
 * Vai trò thành viên trong nhóm
 */
export enum MemberRole {
  OWNER = 'owner', // Chủ sở hữu nhóm (quyền cao nhất)
  ADMIN = 'admin', // Quản trị viên (có quyền quản lý nhóm)
  MEMBER = 'member', // Thành viên thường (chỉ có quyền cơ bản)
}
