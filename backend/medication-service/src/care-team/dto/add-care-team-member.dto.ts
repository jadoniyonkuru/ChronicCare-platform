import { IsUUID } from 'class-validator';

export class AddCareTeamMemberDto {
  /** The provider's user id (from auth-service). */
  @IsUUID()
  providerId: string;
}
