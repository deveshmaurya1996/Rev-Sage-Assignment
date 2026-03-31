import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { DocumentType } from '../../entities/document-type.enum';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsString()
  content: string;

  @IsEnum(DocumentType)
  type: DocumentType;
}
