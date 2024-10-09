class UserInChat {
    id: number;
    firstName: string;
    lastName: string;
    userId: number;
}
export class ChatsDto{
    id: number;
    unreadMessageCount:number;
    userInChat: UserInChat[];
}