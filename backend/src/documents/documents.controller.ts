import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayloadUser } from '../common/decorators/current-user.decorator';
import { CreateDocumentDto } from './dto/create-document.dto';
import { ListDocumentsQueryDto } from './dto/list-documents-query.dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayloadUser, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(user.sub, dto);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: ListDocumentsQueryDto,
  ) {
    return this.documentsService.findAll(user.sub, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.documentsService.findOneForUser(id, user.sub);
  }
}
