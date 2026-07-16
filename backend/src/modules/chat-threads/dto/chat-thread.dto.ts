import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

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

export class GenerateChatThreadTitleDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @MaxLength(4000)
    firstMessage: string;
}
