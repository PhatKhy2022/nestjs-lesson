// The notice HR pins on the company announcement board when a user is deleted.
// Any department can listen for it with @OnEvent(USER_DELETED) without HR knowing who listens.
export const USER_DELETED = 'user.deleted';

export interface UserDeletedEvent {
  userId: number;
}
