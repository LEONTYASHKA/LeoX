export class NewMethodGetChatInfo {
    id: number;
    name: string;
    lastMessage: LastMessageDto;
    unreadMessageCount: number;
  }
  
  export class LastMessageDto {
    text: string;
    createdAt: Date;
    sender: {
    id: number;
      firstName: string;
      lastName: string;
    }
  }
  