import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentEntity } from './document.entity';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getDocuments(): Promise<DocumentEntity[]> {
    return this.documentsService.findAll();
  }

  @Post()
  async createDocument(@Body() data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    return this.documentsService.create(data);
  }

  @Delete(':id')
  async removeDocument(@Param('id') id: string): Promise<void> {
    return this.documentsService.remove(id);
  }
}
