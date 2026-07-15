import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ChatAgentTypeDto {
    CANDIDATE = 'CANDIDATE',
    RECRUITER = 'RECRUITER',
}

export class CreateChatThreadDto {
    @IsEnum(ChatAgentTypeDto)
    agentType: ChatAgentTypeDto;

    @IsOptional()
    @IsString()
    title?: string;
}

export class UpdateChatThreadDto {
    @IsString()
    title: string;
}