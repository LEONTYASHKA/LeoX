export class UserDto {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;
}

export class ChatInformationById {
  id: number;
  name: string;
  users: UserDto[];
}
