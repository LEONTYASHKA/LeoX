export class SenderDto {
    firstName: string;
    lastName: string;
    isCurrentUserSent: boolean;
}

export class MessageDto{
    id: number;
    text: string;
    createdAt: Date;
    sender: SenderDto;
}

export class MessagesInfo {
    id: number;
    messages: MessageDto[];
}