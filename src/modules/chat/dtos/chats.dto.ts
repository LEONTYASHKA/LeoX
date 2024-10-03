class UserInChat {
    id: number;
    firstName: string;
    lastName: string;
    userId: number;
}
export class ChatsDto{
    id: number;
    name: string;
    unreadMessageCount:number;
    userInChat: UserInChat[];
}