export class AuthUserDto {
  id!: string;
  name!: string;
  email!: string;
  roles!: string[];
  permissions!: string[];
}

export class AuthResponseDto {
  user!: AuthUserDto;
}
