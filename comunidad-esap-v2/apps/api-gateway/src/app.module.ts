import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentEntity } from './document.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin123',
      database: 'melmac_pre',
      entities: [DocumentEntity],
      synchronize: true, // Útil para desarrollo de este piloto (crea la tabla melmac_v2_documents automáticamente)
    }),
    TypeOrmModule.forFeature([DocumentEntity])
  ],
  controllers: [DocumentsController, AppController],
  providers: [AppService, DocumentsService],
})
export class AppModule {}
